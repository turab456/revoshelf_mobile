import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  searchPhoton,
  PhotonSuggestion,
  getCurrentCoordinates,
  reverseGeocodeNominatim,
} from '../../services/osmService';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (location: PhotonSuggestion) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  showCurrentLocationBtn?: boolean;
}

export const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  value,
  onChange,
  onSelectLocation,
  placeholder = 'Search campus, landmark, street, or city...',
  label,
  error,
  showCurrentLocationBtn = true,
}) => {
  const [suggestions, setSuggestions] = useState<PhotonSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchPhoton(value, 5);
      setSuggestions(results);
      setLoading(false);
      setIsOpen(true);
    }, 350);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [value]);

  const handleSelect = (item: PhotonSuggestion) => {
    onChange(item.fullAddress);
    onSelectLocation(item);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleFetchCurrentGps = async () => {
    setIsFetchingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      const geocoded = await reverseGeocodeNominatim(coords.lat, coords.lng);
      const fullAddr =
        geocoded?.fullAddress || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

      const suggestion: PhotonSuggestion = {
        id: `current-gps-${coords.lat}-${coords.lng}`,
        name: geocoded?.addressLine || 'Current Location',
        fullAddress: fullAddr,
        city: geocoded?.city,
        state: geocoded?.state,
        country: geocoded?.country,
        postcode: geocoded?.pincode,
        coordinates: coords,
      };

      onChange(fullAddr);
      onSelectLocation(suggestion);
      setIsOpen(false);
    } catch (err: any) {
      console.error('[GPS Error]', err);
    } finally {
      setIsFetchingGps(false);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <Feather name="map-pin" size={16} color="#94A3B8" style={styles.leftIcon} />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={placeholder}
          placeholderTextColor="#94A3B8"
          onFocus={() => setIsOpen(true)}
        />

        <View style={styles.rightActions}>
          {loading || isFetchingGps ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
          ) : (
            <>
              {value.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    onChange('');
                    setSuggestions([]);
                    setIsOpen(false);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginRight: 6 }}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
              {showCurrentLocationBtn && (
                <TouchableOpacity
                  style={styles.gpsBtn}
                  onPress={handleFetchCurrentGps}
                  activeOpacity={0.8}
                >
                  <Feather name="navigation" size={13} color="#038F78" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <View style={styles.dropdown}>
          {/* Top Option: Use Current GPS */}
          <TouchableOpacity
            style={styles.gpsOption}
            onPress={handleFetchCurrentGps}
            activeOpacity={0.7}
          >
            <View style={styles.gpsOptionIconWrap}>
              <Ionicons name="navigate" size={15} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsOptionTitle}>
                {isFetchingGps ? 'Detecting current GPS position...' : 'Use Current GPS Location'}
              </Text>
              <Text style={styles.gpsOptionSub}>Auto-detect campus address & coordinates</Text>
            </View>
          </TouchableOpacity>

          {suggestions.length > 0 && (
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsHeaderText}>Location Suggestions</Text>
              <Text style={styles.suggestionsHeaderSub}>OpenStreetMap</Text>
            </View>
          )}

          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="location-sharp"
                size={16}
                color={COLORS.primary}
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.suggestionAddress} numberOfLines={1}>
                  {item.fullAddress}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3EF',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    paddingHorizontal: 12,
    height: 44,
  },
  inputRowError: {
    borderColor: COLORS.danger,
  },
  leftIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    paddingVertical: 0,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4F1',
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.danger,
    marginTop: 4,
    fontWeight: '500',
  },
  dropdown: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 6,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  gpsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
  },
  gpsOptionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  gpsOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  gpsOptionSub: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 1,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  suggestionsHeaderText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: COLORS.muted,
    textTransform: 'uppercase',
  },
  suggestionsHeaderSub: {
    fontSize: 9.5,
    color: COLORS.primary,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  suggestionAddress: {
    fontSize: 10.5,
    color: COLORS.muted,
    marginTop: 1,
  },
});
