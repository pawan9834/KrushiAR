import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  DimensionValue,
  Image,
  ImageBackground,
  Modal,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Camera,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
  MapPin,
  Navigation,
  Building,
  Save,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import { getFarmerProfile, updateFarmerProfile } from '@/services/diaryStorage';
import { lookupPincode } from '@/services/pincodeService';

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [pulseAnim] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#e2e8f0',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

export default function PersonalInformationScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { location, requestLocation, reloadFromProfile } = useUserLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Initial Form Data (all clean, no hardcoded static mock values)
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    emailAddress: '',
    dob: '',
    gender: '',
    state: '',
    district: '',
    taluka: '',
    villageCity: '',
    pincode: '',
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const profile = await getFarmerProfile();
        if (profile && isMounted) {
          setForm({
            fullName: profile.name || '',
            phoneNumber: profile.phone ? (profile.phone.startsWith('+91') ? profile.phone : `+91 ${profile.phone}`) : '',
            emailAddress: profile.email || '',
            dob: profile.dob || '',
            gender: profile.gender || '',
            state: profile.state || '',
            district: profile.district || '',
            taluka: profile.taluka || '',
            villageCity: profile.village || '',
            pincode: profile.pincode || '',
          });
          if (profile.avatarUri) {
            setAvatarUri(profile.avatarUri);
          }
        }
      } catch (err) {
        console.warn('Failed to load profile in personal-info:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Modal selector states
  const [modalType, setModalType] = useState<'gender' | 'state' | 'district' | 'taluka' | null>(null);

  const genderOptions = ['Male', 'Female', 'Other'];
  const stateOptions = ['Maharashtra', 'Gujarat', 'Madhya Pradesh', 'Karnataka'];
  const districtOptions = ['Jalgaon', 'Dhule', 'Nashik', 'Pune', 'Aurangabad'];
  const talukaOptions = ['Chopda', 'Yawal', 'Raver', 'Bhusawal', 'Amalner'];

  const handleAutoDetectLocation = async () => {
    const success = await requestLocation(true);
    if (success && location) {
      setForm((prev) => ({
        ...prev,
        state: location.state || prev.state,
        district: location.district || prev.district,
        taluka: location.city || prev.taluka,
        villageCity: location.city || prev.villageCity,
        pincode: location.postalCode || prev.pincode,
      }));
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert(
        language === 'mr' ? 'नाव आवश्यक' : language === 'hi' ? 'नाम आवश्यक' : 'Required',
        language === 'mr' ? 'कृपया तुमचे पूर्ण नाव टाका.' : language === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your Full Name.'
      );
      return;
    }
    if (!form.phoneNumber.trim()) {
      Alert.alert(
        language === 'mr' ? 'मोबाईल नंबर आवश्यक' : language === 'hi' ? 'मोबाइल नंबर आवश्यक' : 'Required',
        language === 'mr' ? 'कृपया तुमचा मोबाईल नंबर टाका.' : language === 'hi' ? 'कृपया अपना मोबाइल नंबर दर्ज करें।' : 'Please enter your Phone Number.'
      );
      return;
    }

    try {
      await updateFarmerProfile({
        name: form.fullName.trim(),
        phone: form.phoneNumber.trim().replace('+91', '').trim(),
        email: form.emailAddress.trim(),
        dob: form.dob.trim(),
        gender: form.gender.trim(),
        state: form.state.trim(),
        district: form.district.trim(),
        taluka: form.taluka.trim(),
        village: form.villageCity.trim(),
        pincode: form.pincode.trim(),
        avatarUri: avatarUri || undefined,
      });
      await reloadFromProfile();
      Alert.alert(
        language === 'mr' ? '✅ माहिती जतन झाली!' : language === 'hi' ? '✅ जानकारी सुरक्षित हुई!' : 'Success',
        language === 'mr'
          ? 'तुमची वैयक्तिक माहिती सुरक्षित अपडेट झाली आहे.'
          : language === 'hi'
            ? 'आपकी व्यक्तिगत जानकारी सफलतापूर्वक अपडेट हो गई।'
            : (t.saveSuccess || 'Personal information updated successfully!'),
        [{ text: language === 'mr' ? 'ठीक आहे' : 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      t.reset || 'Reset',
      'Are you sure you want to reset all fields?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.reset || 'Reset',
          style: 'destructive',
          onPress: async () => {
            const profile = await getFarmerProfile();
            setForm({
              fullName: profile?.name || '',
              phoneNumber: profile?.phone ? (profile.phone.startsWith('+91') ? profile.phone : `+91 ${profile.phone}`) : '',
              emailAddress: profile?.email || '',
              dob: profile?.dob || '',
              gender: profile?.gender || '',
              state: profile?.state || '',
              district: profile?.district || '',
              taluka: profile?.taluka || '',
              villageCity: profile?.village || '',
              pincode: profile?.pincode || '',
            });
            setAvatarUri(profile?.avatarUri || null);
            Alert.alert('Reset', t.resetSuccess || 'Form reset.');
          },
        },
      ]
    );
  };

  const handlePhotoSelected = async (uri: string) => {
    setAvatarUri(uri);
    setIsUploadingPhoto(true);
    try {
      const updated = await updateFarmerProfile({ avatarUri: uri });
      if (updated.avatarUri && updated.avatarUri.startsWith('http')) {
        setAvatarUri(updated.avatarUri);
        Alert.alert(
          'यशस्वी / Success',
          'प्रोफाइल फोटो Firebase Storage वर यशस्वीरीत्या अपलोड झाला!\nProfile photo uploaded to Firebase Storage online successfully!'
        );
      }
    } catch (err: any) {
      console.error('Photo upload failed:', err);
      Alert.alert(
        'Firebase Storage Notice',
        `फोटो Firebase Storage वर अपलोड होऊ शकला नाही.\n\nकृपया Firebase Console मध्ये Storage -> Rules तपासा (allow read, write: if true;).\n\nत्रुटी: ${err?.message || 'Permission denied'}`
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      t.changePhoto || 'Change Photo',
      'Choose an option to update your profile photo:',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera permission is required.');
                return;
              }
              const res = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!res.canceled && res.assets?.[0]?.uri) {
                await handlePhotoSelected(res.assets[0].uri);
              }
            } catch (err) {
              console.warn('Camera photo picker error:', err);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Media library permission is required.');
                return;
              }
              const res = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!res.canceled && res.assets?.[0]?.uri) {
                await handlePhotoSelected(res.assets[0].uri);
              }
            } catch (err) {
              console.warn('Gallery picker error:', err);
            }
          },
        },
        { text: t.cancel || 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* 1. Header with Scenic Agriculture Backdrop */}
      <View style={styles.headerContainer}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
          style={styles.headerBg}
          resizeMode="cover">
          <View style={[styles.headerOverlay, { paddingTop: 11 }]}>
            {/* Top Row: Back button & Header texts */}
            <View style={styles.headerContentRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <ArrowLeft size={24} color="#0f172a" />
              </TouchableOpacity>

              <View style={styles.headerTitlesCol}>
                <Text style={styles.screenTitle}>{t.personalInfo || 'Personal Information'}</Text>
                <Text style={styles.screenSub}>{t.personalInfoSub || 'Manage your personal details'}</Text>
              </View>

              {/* Farmer Mascot on Top Right */}
              <View style={styles.mascotWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.mascotImg} />
                ) : (
                  <View style={[styles.mascotImg, styles.avatarPlaceholderSmall]}>
                    <User size={20} color="#16a34a" />
                  </View>
                )}
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            {/* Profile Photo Card Skeleton */}
            <View style={styles.profileCard}>
              <SkeletonBox width={80} height={80} borderRadius={40} style={{ marginRight: 16 }} />
              <View style={{ flex: 1, gap: 8 }}>
                <SkeletonBox width="60%" height={18} borderRadius={4} />
                <SkeletonBox width="80%" height={12} borderRadius={4} />
                <SkeletonBox width={110} height={32} borderRadius={16} style={{ marginTop: 4 }} />
              </View>
            </View>

            {/* Basic Info Card Skeleton */}
            <View style={styles.formCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <SkeletonBox width={26} height={26} borderRadius={13} />
                <SkeletonBox width={140} height={16} borderRadius={4} />
              </View>
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                </View>
                <SkeletonBox width="48%" height={56} borderRadius={10} />
              </View>
            </View>

            {/* Location Info Card Skeleton */}
            <View style={styles.formCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <SkeletonBox width={26} height={26} borderRadius={13} />
                <SkeletonBox width={160} height={16} borderRadius={4} />
              </View>
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                  <SkeletonBox width="48%" height={56} borderRadius={10} />
                </View>
                <SkeletonBox width="48%" height={56} borderRadius={10} />
              </View>
            </View>
          </View>
        ) : (
          <>
            {/* 2. Profile Photo Card */}
            <View style={styles.profileCard}>
              <View style={styles.avatarWrap}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                    {form.fullName?.trim() ? (
                      <Text style={styles.avatarInitial}>{form.fullName.trim().charAt(0).toUpperCase()}</Text>
                    ) : (
                      <User size={36} color="#16a34a" />
                    )}
                  </View>
                )}
                {isUploadingPhoto ? (
                  <View style={[styles.avatarImg, { position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }]}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                ) : null}
                <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto} activeOpacity={0.8} disabled={isUploadingPhoto}>
                  <Camera size={13} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileDetailsCol}>
                <Text style={styles.farmerName}>{form.fullName?.trim() || t.na}</Text>
                <Text style={styles.updatePhotoHint}>{t.updateProfilePhoto || 'Update your profile photo'}</Text>

                <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangePhoto} activeOpacity={0.8}>
                  <Camera size={16} color="#16a34a" />
                  <Text style={styles.changePhotoText}>{t.changePhoto || 'Change Photo'}</Text>
                </TouchableOpacity>

                <Text style={styles.photoLimitNote}>{t.photoLimit || 'JPG, PNG up to 5MB'}</Text>
              </View>
            </View>

        {/* 3. Card 1: Basic Information */}
        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.greenIconCircle}>
              <User size={15} color="#ffffff" />
            </View>
            <Text style={styles.cardTitle}>{t.basicInfo || 'Basic Information'}</Text>
          </View>

          {/* Row 1: Full Name & Phone Number */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.fullName || 'Full Name'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <User size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.fullName}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, fullName: val }))}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.phoneNumber || 'Phone Number'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Phone size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.phoneNumber}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, phoneNumber: val }))}
                  placeholder="+91 Phone"
                  keyboardType="phone-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* Row 2: Email Address & Date of Birth */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {language === 'mr' ? 'ईमेल (ऐच्छिक)' : language === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
              </Text>
              <View style={styles.inputBox}>
                <Mail size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.emailAddress}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, emailAddress: val }))}
                  placeholder={language === 'mr' ? 'उदा. farmer@gmail.com' : 'Email (Optional)'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {language === 'mr' ? 'जन्मतारीख (ऐच्छिक)' : language === 'hi' ? 'जन्म तारीख (वैकल्पिक)' : (t.dateOfBirth || 'Date of Birth')}
              </Text>
              <View style={styles.inputBox}>
                <Calendar size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.dob}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, dob: val }))}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* Row 3: Gender */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>{t.gender || 'Gender'}</Text>
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.7}
                onPress={() => setModalType('gender')}>
                <User size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={[styles.selectText, !form.gender && { color: '#94a3b8' }]}>
                  {form.gender || t.selectGender || t.na}
                </Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.fieldCol} />
          </View>
        </View>

        {/* 4. Card 2: Location Information */}
        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.greenIconCircle}>
                <MapPin size={15} color="#ffffff" />
              </View>
              <Text style={styles.cardTitle}>{t.locationInfo || 'Location Information'}</Text>
            </View>
            <TouchableOpacity
              style={styles.gpsAutoBtn}
              onPress={handleAutoDetectLocation}
              activeOpacity={0.8}>
              <Navigation size={12} color="#16a34a" />
              <Text style={styles.gpsAutoText}>GPS Auto-fill</Text>
            </TouchableOpacity>
          </View>

          {/* Row 1: State & District */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.state || 'State'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.7}
                onPress={() => setModalType('state')}>
                <MapPin size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={[styles.selectText, !form.state && { color: '#94a3b8' }]} numberOfLines={1}>
                  {form.state || t.selectState || t.na}
                </Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.district || 'District'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.7}
                onPress={() => setModalType('district')}>
                <MapPin size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={[styles.selectText, !form.district && { color: '#94a3b8' }]} numberOfLines={1}>
                  {form.district || t.selectDistrict || t.na}
                </Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: Taluka & Village / City */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.taluka || 'Taluka'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputBox}
                activeOpacity={0.7}
                onPress={() => setModalType('taluka')}>
                <MapPin size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={[styles.selectText, !form.taluka && { color: '#94a3b8' }]} numberOfLines={1}>
                  {form.taluka || t.selectTaluka || t.na}
                </Text>
                <ChevronDown size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.villageCity || 'Village / City'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Building size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.villageCity}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, villageCity: val }))}
                  placeholder={t.villageCity || 'Village / City'}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
          </View>

          {/* Row 3: Pincode */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.pincode || 'Pincode'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <MapPin size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.pincode}
                  onChangeText={async (val) => {
                    const clean = val.replace(/\D/g, '').slice(0, 6);
                    setForm((prev) => ({ ...prev, pincode: clean }));
                    if (clean.length === 6) {
                      const info = await lookupPincode(clean);
                      if (info) {
                        setForm((prev) => ({
                          ...prev,
                          district: info.district || prev.district,
                          state: info.state || prev.state,
                          taluka: info.city || prev.taluka,
                          villageCity: info.city || prev.villageCity,
                        }));
                      }
                    }
                  }}
                  placeholder={t.pincode || 'Pincode'}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <View style={styles.fieldCol} />
          </View>
        </View>
      </>
    )}
  </ScrollView>

      {/* 5. Sticky Bottom Action Buttons */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
          <Save size={18} color="#ffffff" />
          <Text style={styles.saveBtnText}>{t.saveChanges || 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} activeOpacity={0.85} onPress={handleReset}>
          <RotateCcw size={18} color="#16a34a" />
          <Text style={styles.resetBtnText}>{t.reset || 'Reset'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selector Modal for Gender, State, District, Taluka */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalType(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === 'gender'
                ? t.gender || 'Select Gender'
                : modalType === 'state'
                ? t.state || 'Select State'
                : modalType === 'district'
                ? t.district || 'Select District'
                : t.taluka || 'Select Taluka'}
            </Text>

            {(modalType === 'gender'
              ? genderOptions
              : modalType === 'state'
              ? stateOptions
              : modalType === 'district'
              ? districtOptions
              : talukaOptions
            ).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalOption}
                onPress={() => {
                  if (modalType === 'gender') setForm((p) => ({ ...p, gender: opt }));
                  if (modalType === 'state') setForm((p) => ({ ...p, state: opt }));
                  if (modalType === 'district') setForm((p) => ({ ...p, district: opt }));
                  if (modalType === 'taluka') setForm((p) => ({ ...p, taluka: opt }));
                  setModalType(null);
                }}>
                <Text style={styles.modalOptionText}>{opt}</Text>
                {(modalType === 'gender' && form.gender === opt) ||
                (modalType === 'state' && form.state === opt) ||
                (modalType === 'district' && form.district === opt) ||
                (modalType === 'taluka' && form.taluka === opt) ? (
                  <CheckCircle2 size={18} color="#16a34a" />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    overflow: 'hidden',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerBg: {
    width: '100%',
  },
  headerOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    paddingBottom: 14,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitlesCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  mascotWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#ffffff',
    marginLeft: 6,
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  scrollWrap: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  /* 2. Profile Photo Card */
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  avatarPlaceholder: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderSmall: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#16a34a',
  },
  skeletonWrap: {
    marginBottom: 4,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16a34a',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDetailsCol: {
    flex: 1,
  },
  farmerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  updatePhotoHint: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 8,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#ffffff',
  },
  changePhotoText: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '700',
  },
  photoLimitNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 5,
  },

  /* Form Cards */
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gpsAutoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  greenIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fieldCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
  },
  reqAsterisk: {
    color: '#ef4444',
  },
  inputBox: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  fieldIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
    fontWeight: '500',
  },
  selectText: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '500',
  },

  /* Bottom Action Buttons (Sticky Footer) */
  stickyFooter: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  saveBtn: {
    height: 46,
    backgroundColor: '#16a34a',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontWeight: '700',
  },
  resetBtn: {
    height: 46,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  resetBtnText: {
    color: '#16a34a',
    fontSize: 14.5,
    fontWeight: '700',
  },

  /* Modal Selector */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalOptionText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
});
