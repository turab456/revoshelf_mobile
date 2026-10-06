import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { LocationSearchInput } from '../../components/common/LocationSearchInput';
import { LocationPickerMap } from '../../components/common/LocationPickerMap';
import { reverseGeocodeNominatim, PhotonSuggestion } from '../../services/osmService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const EDUCATION_LEVELS = [
  'School',
  'PUC',
  'Diploma',
  'Undergraduate (UG)',
  'Postgraduate (PG)',
];

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [institutionName, setInstitutionName] = useState(user?.institutionName || user?.college || '');
  const [educationLevel, setEducationLevel] = useState(user?.educationLevel || 'Undergraduate (UG)');
  const [academicDetails, setAcademicDetails] = useState<Record<string, any>>(
    user?.academicDetails || {
      degree: user?.department || '',
      branch: user?.department || '',
      semester: user?.semester ? String(user.semester) : '',
    }
  );

  // Avatar state
  const [avatarUri, setAvatarUri] = useState<string>(
    user?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
  );
  const [newAvatarAsset, setNewAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // Address state
  const [addressLine, setAddressLine] = useState(user?.addressLine || '');
  const [city, setCity] = useState(user?.city || 'Bangalore');
  const [state, setState] = useState(user?.state || 'Karnataka');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [country, setCountry] = useState(user?.country || 'India');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(
    user?.coordinates || { lat: 12.9716, lng: 77.5946 }
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      (navigation as any).navigate('Login', { returnTo: 'Settings' });
      return;
    }
    setName(user.name || '');
    setInstitutionName(user.institutionName || user.college || '');
    setEducationLevel(user.educationLevel || 'Undergraduate (UG)');
    setAcademicDetails(user.academicDetails || {});
    setAvatarUri(user.avatar || avatarUri);
    setAddressLine(user.addressLine || '');
    setCity(user.city || 'Bangalore');
    setState(user.state || 'Karnataka');
    setPincode(user.pincode || '');
    setCountry(user.country || 'India');
    if (user.coordinates) {
      setCoordinates(user.coordinates);
    }
  }, [user, navigation]);

  const updateAcademicField = (key: string, value: string) => {
    setAcademicDetails((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickAvatar = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast('Permission to access photos is required.', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAvatarUri(asset.uri);
        setNewAvatarAsset(asset);
        showToast('Photo selected! Tap "Save Settings" to apply.', 'success');
      }
    } catch (err) {
      console.error('[Settings] pick avatar error:', err);
      showToast('Could not open image picker.', 'danger');
    }
  };

  const handleLocationSelect = (sugg: PhotonSuggestion) => {
    setCoordinates(sugg.coordinates);

    if (sugg.city) setCity(sugg.city);
    if (sugg.state) setState(sugg.state);
    if (sugg.postcode) setPincode(sugg.postcode);
    if (sugg.country) setCountry(sugg.country);

    const streetPart = [sugg.name, sugg.street].filter(Boolean).join(', ');
    if (streetPart && !addressLine) {
      setAddressLine(streetPart);
    }
  };

  const handleMapPinSelect = async (lat: number, lng: number) => {
    setCoordinates({ lat, lng });
    try {
      const details = await reverseGeocodeNominatim(lat, lng);
      if (details) {
        if (details.city) setCity(details.city);
        if (details.state) setState(details.state);
        if (details.pincode) setPincode(details.pincode);
        if (details.country) setCountry(details.country);
        if (details.addressLine && !addressLine) {
          setAddressLine(details.addressLine);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showToast('Name is required.', 'warning');
      return;
    }

    setSaving(true);
    try {
      if (newAvatarAsset) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('institutionName', institutionName.trim());
        formData.append('educationLevel', educationLevel);
        formData.append('academicDetails', JSON.stringify(academicDetails));
        formData.append('addressLine', addressLine.trim());
        formData.append('city', city.trim());
        formData.append('state', state.trim());
        formData.append('pincode', pincode.trim());
        formData.append('country', country.trim());
        if (coordinates) {
          formData.append('coordinates', JSON.stringify(coordinates));
        }

        const filename = newAvatarAsset.uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('avatar', {
          uri: newAvatarAsset.uri,
          name: filename,
          type,
        } as any);

        await updateProfile(formData);
      } else {
        await updateProfile({
          name: name.trim(),
          institutionName: institutionName.trim(),
          educationLevel,
          academicDetails,
          addressLine: addressLine.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim(),
          ...(coordinates ? { coordinates } : {}),
        });
      }

      setNewAvatarAsset(null);
      showToast('Settings saved successfully!', 'success');
      navigation.goBack();
    } catch (err: any) {
      console.error('[Settings] save error:', err);
      showToast(err?.message || 'Failed to save settings.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          showToast('Logged out successfully', 'success');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Account Settings" showBack />

      <KeyboardAwareContainer contentContainerStyle={styles.scrollBody}>
        {/* Student Credentials Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Credentials</Text>

          {/* Avatar Edit Row */}
          <View style={styles.avatarEditRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
              <TouchableOpacity
                style={styles.pencilCircle}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                <Feather name="camera" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarDetails}>
              <Text style={styles.avatarPromptTitle}>Profile Picture</Text>
              <Text style={styles.avatarPromptSub}>PNG, JPG or WEBP up to 5MB</Text>
              <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Input
            label="Full Name *"
            placeholder="e.g. John Doe"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="College Email"
            value={user?.email || ''}
            editable={false}
            helperText="Email cannot be modified"
          />

          <Input
            label="Institution / Campus Name"
            placeholder="e.g. RV College of Engineering"
            value={institutionName}
            onChangeText={setInstitutionName}
          />

          {/* Education Level Chips */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EDUCATION LEVEL</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
              {EDUCATION_LEVELS.map((level) => {
                const isSelected = educationLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    style={[styles.levelChip, isSelected && styles.levelChipSelected]}
                    onPress={() => setEducationLevel(level)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.levelChipText, isSelected && styles.levelChipTextSelected]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Dynamic Academic Details */}
          {educationLevel === 'School' && (
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Class"
                  placeholder="e.g. 10th"
                  value={academicDetails.class || ''}
                  onChangeText={(val) => updateAcademicField('class', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Board"
                  placeholder="e.g. CBSE"
                  value={academicDetails.board || ''}
                  onChangeText={(val) => updateAcademicField('board', val)}
                />
              </View>
            </View>
          )}

          {educationLevel === 'PUC' && (
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Stream"
                  placeholder="e.g. PCMB"
                  value={academicDetails.stream || ''}
                  onChangeText={(val) => updateAcademicField('stream', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Year"
                  placeholder="e.g. 2nd Year"
                  value={academicDetails.year || ''}
                  onChangeText={(val) => updateAcademicField('year', val)}
                />
              </View>
            </View>
          )}

          {educationLevel === 'Diploma' && (
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Course"
                  placeholder="e.g. Mechanical"
                  value={academicDetails.course || ''}
                  onChangeText={(val) => updateAcademicField('course', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Year / Sem"
                  placeholder="e.g. 3rd Sem"
                  value={academicDetails.yearOrSem || ''}
                  onChangeText={(val) => updateAcademicField('yearOrSem', val)}
                />
              </View>
            </View>
          )}

          {educationLevel === 'Undergraduate (UG)' && (
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Degree"
                  placeholder="e.g. B.Tech"
                  value={academicDetails.degree || ''}
                  onChangeText={(val) => updateAcademicField('degree', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Branch"
                  placeholder="e.g. CSE"
                  value={academicDetails.branch || ''}
                  onChangeText={(val) => updateAcademicField('branch', val)}
                />
              </View>
              <View style={{ width: 75 }}>
                <Input
                  label="Sem"
                  placeholder="e.g. 5"
                  keyboardType="numeric"
                  value={academicDetails.semester || ''}
                  onChangeText={(val) => updateAcademicField('semester', val)}
                />
              </View>
            </View>
          )}

          {educationLevel === 'Postgraduate (PG)' && (
            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Degree"
                  placeholder="e.g. M.Tech"
                  value={academicDetails.degree || ''}
                  onChangeText={(val) => updateAcademicField('degree', val)}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Specialization"
                  placeholder="e.g. AI / ML"
                  value={academicDetails.specialization || ''}
                  onChangeText={(val) => updateAcademicField('specialization', val)}
                />
              </View>
              <View style={{ width: 75 }}>
                <Input
                  label="Sem"
                  placeholder="e.g. 2"
                  keyboardType="numeric"
                  value={academicDetails.semester || ''}
                  onChangeText={(val) => updateAcademicField('semester', val)}
                />
              </View>
            </View>
          )}
        </View>

        {/* Address Details Card */}
        <View style={styles.card}>
          <View style={styles.addressHeaderRow}>
            <Text style={styles.cardTitle}>📍 Campus & Pickup Address</Text>
          </View>

          <LocationSearchInput
            label="Search Campus / Street"
            value=""
            onChange={() => {}}
            onSelectLocation={handleLocationSelect}
            placeholder="Search address or tap GPS..."
          />

          <Input
            label="Hostel / Room / Street Address"
            placeholder="e.g. Kaveri Hostel Room 204 or Dept of ME"
            value={addressLine}
            onChangeText={setAddressLine}
          />

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Input label="City" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="State" value={state} onChangeText={setState} />
            </View>
          </View>

          <View style={styles.twoColRow}>
            <View style={{ flex: 1 }}>
              <Input
                label="Pincode"
                keyboardType="numeric"
                placeholder="e.g. 560059"
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Country" value={country} onChangeText={setCountry} />
            </View>
          </View>

          {/* Interactive OSM Leaflet Map */}
          <View style={styles.mapSection}>
            <Text style={styles.mapHelperText}>
              Tap on map or drag to set accurate exchange meetup spot:
            </Text>
            <View style={styles.mapWrapper}>
              <LocationPickerMap
                center={coordinates || { lat: 12.9716, lng: 77.5946 }}
                zoom={14}
                height={180}
                draggable
                onLocationSelect={handleMapPinSelect}
              />
            </View>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionButtonsCol}>
          <Button
            title="Save Settings"
            onPress={handleSave}
            variant="primary"
            size="lg"
            loading={saving}
            fullWidth
          />

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </KeyboardAwareContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    gap: 12,
    ...SHADOWS.subtle,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  avatarEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.borderCustom,
  },
  pencilCircle: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarDetails: {
    flex: 1,
    gap: 2,
  },
  avatarPromptTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  avatarPromptSub: {
    fontSize: 11,
    color: COLORS.muted,
  },
  changePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  levelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
    backgroundColor: '#F8FAFC',
    marginRight: 8,
  },
  levelChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(3, 143, 120, 0.1)',
  },
  levelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  levelChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapSection: {
    gap: 6,
    marginTop: 4,
  },
  mapHelperText: {
    fontSize: 11,
    color: COLORS.muted,
  },
  mapWrapper: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderCustom,
  },
  actionButtonsCol: {
    gap: 12,
    marginTop: 4,
  },
  logoutBtn: {
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
