import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Logo } from '../../components/common/Logo';
import { KeyboardAwareContainer } from '../../components/common/KeyboardAwareContainer';
import { LocationSearchInput } from '../../components/common/LocationSearchInput';
import { LocationPickerMap } from '../../components/common/LocationPickerMap';
import { PhotonSuggestion, reverseGeocodeNominatim } from '../../services/osmService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { backendApi } from '../../services/backendApi';
import { CATEGORIES, CONDITIONS, DEPARTMENTS, SEMESTERS } from '../../constants';
import type { BookCondition, RootStackParamList } from '../../types';
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

const STEP_TITLES = [
  'Choose Category',
  'Fill Book Details',
  'Choose Photos',
  'Pricing & Location',
  'Review & Publish',
];

export const CreateListingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, unreadChatCount } = useAuth();
  const { showToast } = useToast();

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    condition: 'Good' as BookCondition,
    description: '',
    images: [] as string[],
    price: '',
    originalPrice: '',
    pickupLocation: user?.addressLine || '',
    pickupCoordinates: user?.coordinates || (null as { lat: number; lng: number } | null),
    metadata: {} as Record<string, any>,
  });

  // Modal Picker State
  const [pickerModal, setPickerModal] = useState<{
    visible: boolean;
    title: string;
    options: string[];
    selected: string;
    onSelect: (val: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    selected: '',
    onSelect: () => {},
  });

  const openPicker = (
    title: string,
    options: string[],
    selected: string,
    onSelect: (val: string) => void
  ) => {
    setPickerModal({
      visible: true,
      title,
      options,
      selected,
      onSelect,
    });
  };

  const closePicker = () => {
    setPickerModal((prev) => ({ ...prev, visible: false }));
  };

  // Pre-fill education level from user profile when category is books
  useEffect(() => {
    if (formData.category === 'books' && user && formData.metadata.educationLevel === undefined) {
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          educationLevel: user.educationLevel || 'Undergraduate (UG)',
          ...user.academicDetails,
        },
      }));
    }
  }, [formData.category, user]);

  const handleSelectLocation = (location: PhotonSuggestion) => {
    setFormData((prev) => ({
      ...prev,
      pickupLocation: location.fullAddress || location.name,
      pickupCoordinates: location.coordinates,
    }));
  };

  const handleMapPinSelect = async (lat: number, lng: number) => {
    const geocoded = await reverseGeocodeNominatim(lat, lng);
    setFormData((prev) => ({
      ...prev,
      pickupLocation: geocoded?.fullAddress || geocoded?.addressLine || prev.pickupLocation,
      pickupCoordinates: { lat, lng },
    }));
  };

  const handleMetadataChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value,
      },
    }));
  };

  const handleCheckboxToggle = (key: string, option: string) => {
    setFormData((prev) => {
      const currentVal = Array.isArray(prev.metadata[key]) ? prev.metadata[key] : [];
      const updatedVal = currentVal.includes(option)
        ? currentVal.filter((x: string) => x !== option)
        : [...currentVal, option];
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          [key]: updatedVal,
        },
      };
    });
  };

  const pickImages = async () => {
    const remainingSlots = 3 - formData.images.length;
    if (remainingSlots <= 0) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable photo library access to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: remainingSlots,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map((asset) => asset.uri);
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uris].slice(0, 3),
        }));
        setErrors((prev) => ({ ...prev, images: '' }));
      }
    } catch (err) {
      console.error('[ImagePicker] error:', err);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.category) {
        errs.category = 'Please select a category to continue';
      }
    }

    if (currentStep === 2) {
      if (!formData.title.trim()) errs.title = 'Item title is required';
      if (!formData.condition) errs.condition = 'Please select the condition';

      const configFields = CATEGORY_FIELDS_CONFIG[formData.category] || [];
      configFields.forEach((field) => {
        if (field.required) {
          const val = formData.metadata[field.key];
          if (val === undefined || val === null || (typeof val === 'string' && !val.trim())) {
            errs[field.key] = `${field.label.replace(' *', '')} is required`;
          }
        }
      });

      if (formData.category === 'books') {
        if (!formData.metadata.educationLevel) {
          errs.educationLevel = 'Education level is required';
        }
      }
    }

    if (currentStep === 3) {
      if (formData.images.length === 0) {
        errs.images = 'Please select or upload at least 1 image.';
      }
    }

    if (currentStep === 4) {
      const priceVal = Number(formData.price);
      const origVal = Number(formData.originalPrice);

      if (!formData.price || isNaN(priceVal) || priceVal <= 0) {
        errs.price = 'Please enter a valid listing price';
      }
      if (!formData.originalPrice || isNaN(origVal) || origVal <= 0) {
        errs.originalPrice = 'Please enter original price';
      } else if (origVal < priceVal) {
        errs.price = 'Listing price cannot exceed original price';
      }
      if (!formData.pickupLocation.trim()) {
        errs.pickupLocation = 'Specify the campus meeting or exchange location';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    if (!user) {
      navigation.navigate('Login', { returnTo: 'CreateListing' });
      return;
    }

    setIsPublishing(true);
    try {
      const isBookOrNote = formData.category === 'books' || formData.category === 'notes';
      const authorVal = isBookOrNote ? formData.metadata.author || '' : '';
      const deptVal = isBookOrNote ? formData.metadata.department || '' : '';
      const semVal = isBookOrNote
        ? Number(String(formData.metadata.semester || '').replace('Semester ', '') || 1)
        : undefined;

      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('author', authorVal);
      payload.append('category', formData.category);
      payload.append('condition', formData.condition);
      payload.append('price', String(Number(formData.price)));
      payload.append('originalPrice', String(Number(formData.originalPrice)));
      payload.append('description', formData.description.trim() || `Listing for ${formData.title} in ${formData.category}.`);
      payload.append('department', deptVal);
      if (semVal) payload.append('semester', String(semVal));
      payload.append('pickupLocation', formData.pickupLocation.trim());
      if (formData.pickupCoordinates) {
        payload.append('pickupCoordinates', JSON.stringify(formData.pickupCoordinates));
      }
      payload.append('college', user.institutionName || user.college || '');
      payload.append('metadata', JSON.stringify(formData.metadata));

      formData.images.forEach((uri, idx) => {
        const filename = uri.split('/').pop() || `listing_image_${idx}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        payload.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      });

      const newListing = await backendApi.createListing(payload);
      showToast('Successfully published listing!', 'success');
      navigation.replace('ListingDetail', { id: newListing.id });
    } catch (err: any) {
      console.error('[CreateListing] error:', err);
      showToast(err.message || 'Failed to post listing. Please try again.', 'danger');
    } finally {
      setIsPublishing(false);
    }
  };

  const discountPercent =
    Number(formData.originalPrice) > Number(formData.price) && Number(formData.originalPrice) > 0
      ? Math.round(
          ((Number(formData.originalPrice) - Number(formData.price)) /
            Number(formData.originalPrice)) *
            100
        )
      : null;

  const avatarUrl =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=038F78&color=fff`;

  const userInstitution =
    user?.institutionName?.split(',')[0] || user?.college?.split(',')[0] || 'GCE';

  return (
    <View style={styles.screen}>
      {/* Top Navbar: RevoShelf Logo (Left) | User Avatar, Bell, Chat (Right) */}
      <View style={[styles.topNavbar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('MainTabs', { screen: 'HomeTab' })}
          activeOpacity={0.8}
        >
          <Logo height={27} />
        </TouchableOpacity>

        <View style={styles.navbarRight}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => navigation.navigate('HelpCenter')}
            activeOpacity={0.8}
          >
            <Feather name="bell" size={20} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAwareContainer
        style={styles.keyboardContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Card Container */}
        <View style={styles.card}>
          {/* Card Header */}
          <Text style={styles.cardTitle}>Create a Listing</Text>
          <Text style={styles.cardSubtitle}>
            Step {step} of 5: {STEP_TITLES[step - 1]}
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
          </View>

          {/* ================= STEP 1: CHOOSE CATEGORY ================= */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>What kind of item are you listing?</Text>
              {errors.category ? <Text style={styles.fieldError}>{errors.category}</Text> : null}

              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryBtn, isSelected && styles.categoryBtnSelected]}
                      onPress={() => {
                        setFormData((prev) => ({ ...prev, category: cat.id }));
                        setErrors((prev) => ({ ...prev, category: '' }));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          isSelected && styles.categoryBtnTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ================= STEP 2: FILL DETAILS ================= */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>Provide catalog information</Text>

              {/* ITEM NAME / TITLE */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>ITEM NAME / TITLE *</Text>
                <TextInput
                  style={[styles.inputField, errors.title ? styles.inputFieldError : null]}
                  placeholder={
                    formData.category === 'books'
                      ? 'e.g. Microelectronic Circuits'
                      : 'e.g. Hero Sprint Cycle, Casio fx-991ES Plus'
                  }
                  placeholderTextColor="#94A3B8"
                  value={formData.title}
                  onChangeText={(t) => {
                    setFormData((prev) => ({ ...prev, title: t }));
                    setErrors((prev) => ({ ...prev, title: '' }));
                  }}
                />
                {errors.title ? <Text style={styles.fieldError}>{errors.title}</Text> : null}
              </View>

              {/* CONDITION */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>CONDITION *</Text>
                <TouchableOpacity
                  style={[styles.selectBox, errors.condition ? styles.inputFieldError : null]}
                  onPress={() =>
                    openPicker(
                      'Select Condition',
                      CONDITIONS.map((c) => c.value),
                      formData.condition,
                      (val) => {
                        setFormData((prev) => ({ ...prev, condition: val as BookCondition }));
                        setErrors((prev) => ({ ...prev, condition: '' }));
                      }
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={
                      formData.condition ? styles.selectTextVal : styles.selectTextPlaceholder
                    }
                  >
                    {formData.condition || 'Select Condition'}
                  </Text>
                  <Feather name="chevron-down" size={16} color="#00244B" />
                </TouchableOpacity>
                {errors.condition ? <Text style={styles.fieldError}>{errors.condition}</Text> : null}
              </View>

              {/* Dynamic Category Config Fields */}
              {(CATEGORY_FIELDS_CONFIG[formData.category] || []).map((field) => {
                const val = formData.metadata[field.key] || '';
                const fieldError = errors[field.key];

                if (field.type === 'text') {
                  return (
                    <View key={field.key} style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{field.label.toUpperCase()}</Text>
                      <TextInput
                        style={[styles.inputField, fieldError ? styles.inputFieldError : null]}
                        placeholder={field.placeholder}
                        placeholderTextColor="#94A3B8"
                        value={val}
                        onChangeText={(t) => {
                          handleMetadataChange(field.key, t);
                          setErrors((prev) => ({ ...prev, [field.key]: '' }));
                        }}
                      />
                      {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}
                    </View>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <View key={field.key} style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{field.label.toUpperCase()}</Text>
                      <TouchableOpacity
                        style={[styles.selectBox, fieldError ? styles.inputFieldError : null]}
                        onPress={() =>
                          openPicker(
                            `Select ${field.label.replace(' *', '')}`,
                            field.options || [],
                            val,
                            (optVal) => {
                              handleMetadataChange(field.key, optVal);
                              setErrors((prev) => ({ ...prev, [field.key]: '' }));
                            }
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Text style={val ? styles.selectTextVal : styles.selectTextPlaceholder}>
                          {val || 'Select Option'}
                        </Text>
                        <Feather name="chevron-down" size={16} color="#00244B" />
                      </TouchableOpacity>
                      {fieldError ? <Text style={styles.fieldError}>{fieldError}</Text> : null}
                    </View>
                  );
                }

                if (field.type === 'checkbox') {
                  return (
                    <View key={field.key} style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>{field.label.toUpperCase()}</Text>
                      <View style={styles.checkboxGrid}>
                        {field.options?.map((opt) => {
                          const isChecked = Array.isArray(val) && val.includes(opt);
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={styles.checkboxRow}
                              onPress={() => handleCheckboxToggle(field.key, opt)}
                              activeOpacity={0.7}
                            >
                              <View
                                style={[
                                  styles.checkboxBox,
                                  isChecked && styles.checkboxBoxChecked,
                                ]}
                              >
                                {isChecked && <Feather name="check" size={12} color="#FFFFFF" />}
                              </View>
                              <Text style={styles.checkboxLabel}>{opt}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                }

                return null;
              })}

              {/* Books Specific Education Level Fields */}
              {formData.category === 'books' && (
                <>
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>EDUCATION LEVEL *</Text>
                    <TouchableOpacity
                      style={[
                        styles.selectBox,
                        errors.educationLevel ? styles.inputFieldError : null,
                      ]}
                      onPress={() =>
                        openPicker(
                          'Select Education Level',
                          EDUCATION_LEVELS,
                          formData.metadata.educationLevel || '',
                          (opt) => {
                            handleMetadataChange('educationLevel', opt);
                            setErrors((prev) => ({ ...prev, educationLevel: '' }));
                          }
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={
                          formData.metadata.educationLevel
                            ? styles.selectTextVal
                            : styles.selectTextPlaceholder
                        }
                      >
                        {formData.metadata.educationLevel || 'Select Level'}
                      </Text>
                      <Feather name="chevron-down" size={16} color="#00244B" />
                    </TouchableOpacity>
                    {errors.educationLevel ? (
                      <Text style={styles.fieldError}>{errors.educationLevel}</Text>
                    ) : null}
                  </View>

                  {formData.metadata.educationLevel === 'School' && (
                    <View style={styles.twoColumnRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>CLASS</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. 10th"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.class || ''}
                          onChangeText={(t) => handleMetadataChange('class', t)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>BOARD</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. CBSE"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.board || ''}
                          onChangeText={(t) => handleMetadataChange('board', t)}
                        />
                      </View>
                    </View>
                  )}

                  {formData.metadata.educationLevel === 'PUC' && (
                    <View style={styles.twoColumnRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>STREAM</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. PCMB"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.stream || ''}
                          onChangeText={(t) => handleMetadataChange('stream', t)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>YEAR</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. 2nd Year"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.year || ''}
                          onChangeText={(t) => handleMetadataChange('year', t)}
                        />
                      </View>
                    </View>
                  )}

                  {formData.metadata.educationLevel === 'Diploma' && (
                    <View style={styles.twoColumnRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>COURSE</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. Mechanical"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.course || ''}
                          onChangeText={(t) => handleMetadataChange('course', t)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>YEAR/SEM</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. 3rd Sem"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.yearOrSem || ''}
                          onChangeText={(t) => handleMetadataChange('yearOrSem', t)}
                        />
                      </View>
                    </View>
                  )}

                  {formData.metadata.educationLevel === 'Undergraduate (UG)' && (
                    <View style={styles.threeColumnRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>DEGREE</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. B.Tech"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.degree || ''}
                          onChangeText={(t) => handleMetadataChange('degree', t)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>BRANCH</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. CSE"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.branch || ''}
                          onChangeText={(t) => handleMetadataChange('branch', t)}
                        />
                      </View>
                      <View style={{ flex: 0.8 }}>
                        <Text style={styles.fieldLabel}>SEM</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. 5"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={String(formData.metadata.semester || '')}
                          onChangeText={(t) => handleMetadataChange('semester', t)}
                        />
                      </View>
                    </View>
                  )}

                  {formData.metadata.educationLevel === 'Postgraduate (PG)' && (
                    <View style={styles.threeColumnRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>DEGREE</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. M.Tech"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.degree || ''}
                          onChangeText={(t) => handleMetadataChange('degree', t)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fieldLabel}>SPECIALIZATION</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. AI"
                          placeholderTextColor="#94A3B8"
                          value={formData.metadata.specialization || ''}
                          onChangeText={(t) => handleMetadataChange('specialization', t)}
                        />
                      </View>
                      <View style={{ flex: 0.8 }}>
                        <Text style={styles.fieldLabel}>SEM</Text>
                        <TextInput
                          style={styles.inputField}
                          placeholder="e.g. 2"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={String(formData.metadata.semester || '')}
                          onChangeText={(t) => handleMetadataChange('semester', t)}
                        />
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* DESCRIPTION (OPTIONAL) */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>DESCRIPTION (OPTIONAL)</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Provide a detailed description of the item. State if there are highlights, loose pages, or physical damage."
                  placeholderTextColor="#94A3B8"
                  value={formData.description}
                  onChangeText={(t) => setFormData((prev) => ({ ...prev, description: t }))}
                />
              </View>
            </View>
          )}

          {/* ================= STEP 3: CHOOSE PHOTOS ================= */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>Add Photo References</Text>
              <Text style={styles.sectionDesc}>
                Select up to 3 photos of your textbook or essential. Real pictures increase sales.
              </Text>
              {errors.images ? <Text style={styles.fieldError}>{errors.images}</Text> : null}

              {formData.images.length === 0 ? (
                <TouchableOpacity
                  style={styles.dashedUploadBox}
                  onPress={pickImages}
                  activeOpacity={0.75}
                >
                  <View style={styles.uploadPlusCircle}>
                    <Feather name="plus" size={24} color="#038F78" />
                  </View>
                  <Text style={styles.uploadTitle}>Upload Photo</Text>
                  <Text style={styles.uploadSubtitle}>Auto AI Validation</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.photoGrid}>
                  {formData.images.map((uri, idx) => (
                    <View key={idx} style={styles.photoItem}>
                      <Image source={{ uri }} style={styles.photoImage} contentFit="cover" />
                      <TouchableOpacity
                        style={styles.photoDeleteBtn}
                        onPress={() => removeImage(idx)}
                        activeOpacity={0.8}
                      >
                        <Feather name="trash-2" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View style={styles.aiValidatedBadge}>
                        <Feather name="check" size={10} color="#038F78" />
                        <Text style={styles.aiValidatedText}>Auto AI Validated</Text>
                      </View>
                    </View>
                  ))}

                  {formData.images.length < 3 && (
                    <TouchableOpacity
                      style={styles.addMorePhotoSlot}
                      onPress={pickImages}
                      activeOpacity={0.75}
                    >
                      <View style={styles.smallPlusCircle}>
                        <Feather name="plus" size={20} color="#038F78" />
                      </View>
                      <Text style={styles.addMoreText}>Upload Photo</Text>
                      <Text style={styles.addMoreSub}>Auto AI</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {formData.images.length > 0 && (
                <Text style={styles.photoCountText}>
                  Selected {formData.images.length} of 3 photos.
                </Text>
              )}
            </View>
          )}

          {/* ================= STEP 4: PRICING & LOCATION ================= */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>Set Pricing and Exchange Details</Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>YOUR PRICE (₹) *</Text>
                <TextInput
                  style={[styles.inputField, errors.price ? styles.inputFieldError : null]}
                  placeholder="e.g. 450"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formData.price}
                  onChangeText={(t) => {
                    setFormData((prev) => ({ ...prev, price: t }));
                    setErrors((prev) => ({ ...prev, price: '' }));
                  }}
                />
                {errors.price ? <Text style={styles.fieldError}>{errors.price}</Text> : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>ORIGINAL RETAIL PRICE (₹) *</Text>
                <TextInput
                  style={[styles.inputField, errors.originalPrice ? styles.inputFieldError : null]}
                  placeholder="e.g. 1000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={formData.originalPrice}
                  onChangeText={(t) => {
                    setFormData((prev) => ({ ...prev, originalPrice: t }));
                    setErrors((prev) => ({ ...prev, originalPrice: '' }));
                  }}
                />
                {errors.originalPrice ? (
                  <Text style={styles.fieldError}>{errors.originalPrice}</Text>
                ) : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>PICKUP / MEETING LOCATION *</Text>
                <LocationSearchInput
                  value={formData.pickupLocation}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, pickupLocation: val }));
                    setErrors((prev) => ({ ...prev, pickupLocation: '' }));
                  }}
                  onSelectLocation={handleSelectLocation}
                  placeholder="Search campus, landmark, cafe, or station..."
                  error={errors.pickupLocation}
                />
              </View>

              {formData.pickupCoordinates && (
                <View style={styles.mapPinSection}>
                  <Text style={styles.mapPinTitle}>
                    Confirm / Adjust Pickup Pin on OpenStreetMap:
                  </Text>
                  <LocationPickerMap
                    center={formData.pickupCoordinates}
                    draggable={true}
                    onLocationSelect={handleMapPinSelect}
                    height={180}
                  />
                </View>
              )}

              <View style={styles.institutionNotice}>
                <Feather name="info" size={18} color="#038F78" style={{ marginTop: 2 }} />
                <Text style={styles.institutionNoticeText}>
                  Your institution (<Text style={styles.boldInstitution}>{userInstitution}</Text>)
                  will be displayed on the listing. Other students can search or coordinate trades
                  from anywhere.
                </Text>
              </View>
            </View>
          )}

          {/* ================= STEP 5: REVIEW & PUBLISH ================= */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>Verify Listing Draft</Text>

              <View style={styles.previewBox}>
                <View style={styles.previewTopRow}>
                  {formData.images.length > 0 ? (
                    <Image
                      source={{ uri: formData.images[0] }}
                      style={styles.previewThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.previewThumb, styles.previewThumbEmpty]}>
                      <Feather name="image" size={28} color="#94A3B8" />
                    </View>
                  )}
                  <View style={styles.previewDetails}>
                    <Text style={styles.previewCategory}>
                      {(
                        CATEGORIES.find((c) => c.id === formData.category)?.name ||
                        formData.category
                      ).toUpperCase()}
                    </Text>
                    <Text style={styles.previewTitle} numberOfLines={2}>
                      {formData.title}
                    </Text>
                    <View style={styles.previewPriceRow}>
                      <Text style={styles.previewPrice}>₹{formData.price}</Text>
                      {formData.originalPrice ? (
                        <Text style={styles.previewOrigPrice}>₹{formData.originalPrice}</Text>
                      ) : null}
                      {discountPercent !== null && (
                        <View style={styles.previewDiscountBadge}>
                          <Text style={styles.previewDiscountText}>
                            {discountPercent}% discount
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.previewSeparator} />

                <View style={styles.previewMetaGrid}>
                  <View style={styles.previewMetaCol}>
                    <Text style={styles.metaLabel}>Condition</Text>
                    <Text style={styles.metaValue}>{formData.condition}</Text>
                  </View>

                  <View style={styles.previewMetaCol}>
                    <Text style={styles.metaLabel}>Specifications</Text>
                    {formData.category === 'notes' ? (
                      <Text style={styles.metaValue}>
                        {formData.metadata.semester || 'N/A'} • {formData.metadata.department || 'N/A'}
                      </Text>
                    ) : formData.category === 'books' ? (
                      <Text style={styles.metaValue}>
                        {formData.metadata.educationLevel || 'N/A'}
                      </Text>
                    ) : (
                      <View style={{ gap: 2 }}>
                        {Object.entries(formData.metadata).map(([k, v]) => {
                          const label =
                            (CATEGORY_FIELDS_CONFIG[formData.category] || []).find(
                              (f) => f.key === k
                            )?.label.replace(' *', '') || k;
                          const valStr = Array.isArray(v) ? v.join(', ') : String(v);
                          return (
                            <Text key={k} style={styles.metaSubValue}>
                              <Text style={{ fontWeight: '600', color: '#00244B' }}>{label}:</Text>{' '}
                              {valStr}
                            </Text>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  <View style={styles.previewFullCol}>
                    <Text style={styles.metaLabel}>Pickup / Exchange Spot</Text>
                    <Text style={styles.metaAddress}>{formData.pickupLocation}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================= CARD FOOTER ACTIONS ================= */}
          <View style={styles.cardFooter}>
            {step > 1 ? (
              <TouchableOpacity
                style={styles.prevBtn}
                onPress={handlePrev}
                activeOpacity={0.7}
              >
                <Feather name="chevron-left" size={15} color="#64748B" />
                <Text style={styles.prevBtnText}>Previous</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            {step < 5 ? (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
                <Feather name="chevron-right" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.publishBtn, isPublishing && { opacity: 0.75 }]}
                onPress={handlePublish}
                disabled={isPublishing}
                activeOpacity={0.85}
              >
                {isPublishing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check-circle" size={15} color="#FFFFFF" />
                    <Text style={styles.publishBtnText}>Publish Listing</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAwareContainer>

      {/* Option Picker Modal Sheet */}
      <Modal
        visible={pickerModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerModal.title}</Text>
              <TouchableOpacity
                onPress={closePicker}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {pickerModal.options.map((opt) => {
                const isSelected = pickerModal.selected === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                    onPress={() => {
                      pickerModal.onSelect(opt);
                      closePicker();
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isSelected && styles.modalOptionTextSelected,
                      ]}
                    >
                      {opt}
                    </Text>
                    {isSelected && <Feather name="check" size={18} color="#038F78" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  navbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#E2E8F0',
  },
  navIconBtn: {
    position: 'relative',
    padding: 4,
  },
  unreadDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#00244B',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 18,
    marginBottom: 22,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#038F78',
    borderRadius: 999,
  },
  stepContent: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00244B',
    marginBottom: 2,
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -8,
    marginBottom: 4,
    lineHeight: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  categoryBtn: {
    width: '48.2%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  categoryBtnSelected: {
    borderColor: '#038F78',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  categoryBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#00244B',
    textAlign: 'center',
  },
  categoryBtnTextSelected: {
    color: '#038F78',
    fontWeight: '700',
  },
  fieldBlock: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00244B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputField: {
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#00244B',
  },
  inputFieldError: {
    borderColor: '#EF4444',
  },
  selectBox: {
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectTextVal: {
    fontSize: 13,
    color: '#00244B',
    fontWeight: '500',
  },
  selectTextPlaceholder: {
    fontSize: 13,
    color: '#94A3B8',
  },
  textArea: {
    backgroundColor: '#F5F3EF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#00244B',
    minHeight: 88,
    textAlignVertical: 'top',
  },
  fieldError: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 1,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  threeColumnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkboxGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#038F78',
    borderColor: '#038F78',
  },
  checkboxLabel: {
    fontSize: 12,
    color: '#00244B',
  },
  dashedUploadBox: {
    minHeight: 250,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 18,
    backgroundColor: 'rgba(245, 243, 239, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadPlusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00244B',
  },
  uploadSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#038F78',
    marginTop: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoItem: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiValidatedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  aiValidatedText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#038F78',
  },
  addMorePhotoSlot: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: 'rgba(245, 243, 239, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  smallPlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addMoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00244B',
  },
  addMoreSub: {
    fontSize: 8.5,
    color: '#038F78',
    fontWeight: '600',
  },
  photoCountText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  mapPinSection: {
    gap: 6,
    marginTop: 2,
  },
  mapPinTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00244B',
  },
  institutionNotice: {
    backgroundColor: '#F5F3EF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  institutionNoticeText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16.5,
  },
  boldInstitution: {
    fontWeight: '700',
    color: '#00244B',
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  previewTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  previewThumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDetails: {
    flex: 1,
  },
  previewCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: '#038F78',
    letterSpacing: 0.5,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00244B',
    marginTop: 2,
    lineHeight: 20,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  previewPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00244B',
  },
  previewOrigPrice: {
    fontSize: 12,
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  previewDiscountBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  previewDiscountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  previewSeparator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  previewMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  previewMetaCol: {
    width: '47%',
  },
  previewFullCol: {
    width: '100%',
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00244B',
  },
  metaValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  metaSubValue: {
    fontSize: 11,
    color: '#64748B',
  },
  metaAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  continueBtn: {
    backgroundColor: '#038F78',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#038F78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  publishBtn: {
    backgroundColor: '#038F78',
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#038F78',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  publishBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00244B',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(3, 143, 120, 0.04)',
  },
  modalOptionText: {
    fontSize: 13.5,
    color: '#00244B',
  },
  modalOptionTextSelected: {
    fontWeight: '700',
    color: '#038F78',
  },
});
