import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Header } from '../../components/common/Header';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { LocationSearchInput } from '../../components/common/LocationSearchInput';
import { LocationPickerMap } from '../../components/common/LocationPickerMap';
import { PhotonSuggestion, reverseGeocodeNominatim } from '../../services/osmService';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import { CATEGORIES, CONDITIONS, DEPARTMENTS, SEMESTERS } from '../../constants';
import type { Book, BookCondition, RootStackParamList } from '../../types';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

const EDUCATION_LEVELS = ['School', 'PUC', 'Diploma', 'Undergraduate (UG)', 'Postgraduate (PG)'];

interface CustomField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

const CATEGORY_FIELDS_CONFIG: Record<string, CustomField[]> = {
  books: [
    { key: 'author', label: 'Author *', type: 'text', placeholder: 'e.g. Adel Sedra, Kenneth C. Smith', required: true },
    { key: 'edition', label: 'Edition', type: 'text', placeholder: 'e.g. 7th Edition' },
  ],
  notes: [
    { key: 'author', label: 'Created By / Teacher *', type: 'text', placeholder: 'e.g. Dr. H.S. Sharma', required: true },
    { key: 'department', label: 'Course Department *', type: 'select', options: DEPARTMENTS, required: true },
    { key: 'semester', label: 'Semester *', type: 'select', options: SEMESTERS.map((s) => `Semester ${s}`), required: true },
  ],
  calculators: [
    { key: 'brand', label: 'Brand *', type: 'text', placeholder: 'e.g. Casio, Texas Instruments', required: true },
    { key: 'model', label: 'Model *', type: 'text', placeholder: 'e.g. fx-991ES Plus, TI-84', required: true },
    { key: 'examApproved', label: 'Approved for University Exams *', type: 'select', options: ['Yes', 'No', 'Check with Invigilator'], required: true },
  ],
  cycles: [
    { key: 'brand', label: 'Brand / Manufacturer *', type: 'text', placeholder: 'e.g. Decathlon, Firefox, Hero', required: true },
    { key: 'color', label: 'Color *', type: 'text', placeholder: 'e.g. Matte Black, Red & White', required: true },
    { key: 'age', label: 'Usage Duration / Age *', type: 'select', options: ['Less than 6 months', '6 - 12 months', '1 - 2 years', 'More than 2 years'], required: true },
    { key: 'accessories', label: 'Accessories Included', type: 'checkbox', options: ['Lock', 'Bell', 'Carrier', 'Front/Rear Lights', 'Mudguards', 'Bottle Holder'] },
  ],
  electronics: [
    { key: 'brand', label: 'Brand *', type: 'text', placeholder: 'e.g. Lenovo, HP, Apple, JBL', required: true },
    { key: 'specs', label: 'Key Specifications *', type: 'text', placeholder: 'e.g. Core i5, 8GB RAM, 256GB SSD', required: true },
    { key: 'age', label: 'Usage Duration / Age *', type: 'select', options: ['Less than 6 months', '6 - 12 months', '1 - 2 years', 'More than 2 years'], required: true },
  ],
  'lab-equipment': [
    { key: 'equipmentType', label: 'Equipment Type *', type: 'text', placeholder: 'e.g. Engineering Drafter, Lab Coat, Chemistry Kit', required: true },
    { key: 'size', label: 'Size (if applicable)', type: 'select', options: ['Not Applicable', 'S', 'M', 'L', 'XL', 'XXL'] },
  ],
  'project-components': [
    { key: 'componentType', label: 'Component Type *', type: 'text', placeholder: 'e.g. Arduino Uno R3, Raspberry Pi 4, Ultrasonic Sensor', required: true },
    { key: 'specs', label: 'Technical Specifications (Optional)', type: 'text', placeholder: 'e.g. 5V Operating Voltage, 2cm-400cm Range' },
  ],
  'hostel-essentials': [
    { key: 'itemType', label: 'Item Type *', type: 'text', placeholder: 'e.g. Single Bed Mattress, Study Table, Study Chair', required: true },
    { key: 'age', label: 'Usage Duration / Age *', type: 'select', options: ['Less than 6 months', '6 - 12 months', 'More than 1 year'], required: true },
    { key: 'dimensions', label: 'Dimensions (Optional)', type: 'text', placeholder: 'e.g. 3x6 feet for mattress' },
  ],
  stationery: [
    { key: 'stationeryType', label: 'Stationery Item Type *', type: 'text', placeholder: 'e.g. A1 Drawing Board, T-Square, Geometry Box', required: true },
  ],
};

export const EditListingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditListing'>>();
  const { id } = route.params;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [book, setBook] = useState<Book | null>(null);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('books');
  const [condition, setCondition] = useState<BookCondition>('Good');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoordinates, setPickupCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [description, setDescription] = useState('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const item = await backendApi.getBookById(id);
        if (item) {
          setBook(item);
          setTitle(item.title || '');
          setAuthor(item.author || '');
          setCategory(item.category || 'books');
          setCondition(item.condition || 'Good');
          setPrice(String(item.price || ''));
          setOriginalPrice(String(item.originalPrice || ''));
          setPickupLocation(item.pickupLocation || '');
          setPickupCoordinates(item.pickupCoordinates || (item as any).coordinates || null);
          setDescription(item.description || '');
          setMetadata(item.metadata || {});
        }
      } catch (err) {
        showToast('Could not load listing details.', 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id, showToast]);

  const handleSelectLocation = (location: PhotonSuggestion) => {
    setPickupLocation(location.fullAddress || location.name);
    setPickupCoordinates(location.coordinates);
  };

  const handleMapPinSelect = async (lat: number, lng: number) => {
    const geocoded = await reverseGeocodeNominatim(lat, lng);
    setPickupLocation(geocoded?.fullAddress || geocoded?.addressLine || pickupLocation);
    setPickupCoordinates({ lat, lng });
  };

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCheckboxToggle = (key: string, option: string) => {
    setMetadata((prev) => {
      const currentVal = Array.isArray(prev[key]) ? prev[key] : [];
      const updatedVal = currentVal.includes(option)
        ? currentVal.filter((x: string) => x !== option)
        : [...currentVal, option];
      return {
        ...prev,
        [key]: updatedVal,
      };
    });
  };

  const handleUpdate = async () => {
    if (!title.trim()) {
      showToast('Please enter a title.', 'warning');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      showToast('Please enter a valid price.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const isBookOrNote = category === 'books' || category === 'notes';
      const authorVal = isBookOrNote ? (author || metadata.author || '') : '';

      await backendApi.updateListing(id, {
        title: title.trim(),
        author: authorVal.trim(),
        category,
        condition,
        price: numPrice,
        originalPrice: parseFloat(originalPrice) || numPrice,
        pickupLocation: pickupLocation.trim(),
        pickupCoordinates: pickupCoordinates || undefined,
        description: description.trim(),
        metadata,
      });
      showToast('Listing updated successfully!', 'success');
      navigation.goBack();
    } catch {
      showToast('Could not update listing.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Are you sure you want to permanently delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await backendApi.deleteListing(id);
            showToast('Listing deleted.', 'info');
            navigation.popToTop();
          } catch {
            showToast('Failed to delete listing.', 'danger');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Edit Listing"
        showBack
        rightAction={
          <TouchableOpacity onPress={handleDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        }
      />

      <KeyboardAwareContainer contentContainerStyle={styles.scrollBody}>
        <View style={styles.sectionCard}>
          <Input label="Title *" value={title} onChangeText={setTitle} />

          {/* Category Chips */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.chipsRow}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextSelected]}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Condition Selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Condition</Text>
            <View style={styles.chipsRow}>
              {CONDITIONS.map((cond) => {
                const isSelected = condition === cond.value;
                return (
                  <TouchableOpacity
                    key={cond.value}
                    style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                    onPress={() => setCondition(cond.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextSelected]}>
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Dynamic Configuration Fields */}
          {(CATEGORY_FIELDS_CONFIG[category] || []).map((field) => {
            const val = metadata[field.key] || (field.key === 'author' ? author : '');

            if (field.type === 'text') {
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  placeholder={field.placeholder}
                  value={val}
                  onChangeText={(t) => {
                    handleMetadataChange(field.key, t);
                    if (field.key === 'author') setAuthor(t);
                  }}
                />
              );
            }

            if (field.type === 'select') {
              return (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={styles.chipsRow}>
                    {field.options?.map((opt) => {
                      const isSelected = val === opt;
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.choiceChip, isSelected && styles.choiceChipSelected]}
                          onPress={() => handleMetadataChange(field.key, opt)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.choiceChipText, isSelected && styles.choiceChipTextSelected]}>
                            {opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            }

            if (field.type === 'checkbox') {
              return (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <View style={styles.chipsRow}>
                    {field.options?.map((opt) => {
                      const isChecked = Array.isArray(val) && val.includes(opt);
                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.choiceChip, isChecked && styles.choiceChipSelected]}
                          onPress={() => handleCheckboxToggle(field.key, opt)}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.choiceChipText, isChecked && styles.choiceChipTextSelected]}>
                            {isChecked ? '✓ ' : ''}{opt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            }

            return null;
          })}

          {/* Pricing */}
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Input
                label="Price (₹) *"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Original MRP (₹)"
                keyboardType="numeric"
                value={originalPrice}
                onChangeText={setOriginalPrice}
              />
            </View>
          </View>

          <LocationSearchInput
            label="Pickup Location"
            placeholder="Search campus, landmark, cafe, or station..."
            value={pickupLocation}
            onChange={setPickupLocation}
            onSelectLocation={handleSelectLocation}
          />

          {pickupCoordinates && (
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.mapLabel}>
                Confirm / Adjust Pickup Pin on OpenStreetMap:
              </Text>
              <LocationPickerMap
                center={pickupCoordinates}
                draggable={true}
                onLocationSelect={handleMapPinSelect}
                height={180}
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide a detailed description of the item."
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleUpdate}
          variant="primary"
          size="lg"
          loading={submitting}
          fullWidth
        />

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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.subtle,
    gap: 12,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  choiceChipSelected: {
    backgroundColor: '#F0FDFA',
    borderColor: COLORS.primary,
  },
  choiceChipText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  choiceChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: 12,
    fontSize: 13,
    color: COLORS.textDark,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  mapLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
});
