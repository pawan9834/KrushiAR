import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ImageBackground,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';

export default function PersonalInformationScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { location, requestLocation } = useUserLocation();

  // Initial Form Data
  const initialData = {
    fullName: 'Pawankumar Patil',
    phoneNumber: '+91 98765 43210',
    emailAddress: 'pawankpatil@gmail.com',
    dob: '12 Jan 1997',
    gender: 'Male',
    state: 'Maharashtra',
    district: 'Jalgaon',
    taluka: 'Chopda',
    villageCity: 'Chopda',
    pincode: '425107',
  };

  const [form, setForm] = useState(initialData);

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

  const handleSave = () => {
    if (!form.fullName.trim()) {
      Alert.alert('Required', 'Please enter your Full Name');
      return;
    }
    if (!form.phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter your Phone Number');
      return;
    }
    Alert.alert('Success', t.saveSuccess || 'Personal information updated successfully!');
  };

  const handleReset = () => {
    Alert.alert(
      t.reset || 'Reset',
      'Are you sure you want to reset all fields to default values?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        {
          text: t.reset || 'Reset',
          style: 'destructive',
          onPress: () => {
            setForm(initialData);
            Alert.alert('Reset', t.resetSuccess || 'Form reset to default values.');
          },
        },
      ]
    );
  };

  const handleChangePhoto = () => {
    Alert.alert(
      t.changePhoto || 'Change Photo',
      'Choose an option to update your profile photo:',
      [
        { text: 'Take Photo', onPress: () => console.log('Take Photo') },
        { text: 'Choose from Gallery', onPress: () => console.log('Choose from Gallery') },
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
          <View style={styles.headerOverlay}>
            {/* Top Row: Back button & Header texts */}
            <View style={[styles.headerContentRow, { paddingTop: insets.top > 0 ? insets.top + 8 : 28 }]}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>

              <View style={styles.headerTitlesCol}>
                <Text style={styles.screenTitle}>{t.personalInfo || 'Personal Information'}</Text>
                <Text style={styles.screenSub}>{t.personalInfoSub || 'Manage your personal details'}</Text>
              </View>

              {/* Farmer Mascot on Top Right */}
              <View style={styles.mascotWrap}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&q=80' }}
                  style={styles.mascotImg}
                />
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 24 }]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Profile Photo Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&q=80' }}
              style={styles.avatarImg}
            />
            <TouchableOpacity style={styles.cameraBadge} onPress={handleChangePhoto} activeOpacity={0.8}>
              <Ionicons name="camera" size={13} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileDetailsCol}>
            <Text style={styles.farmerName}>{form.fullName}</Text>
            <Text style={styles.updatePhotoHint}>{t.updateProfilePhoto || 'Update your profile photo'}</Text>

            <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangePhoto} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={16} color="#16a34a" />
              <Text style={styles.changePhotoText}>{t.changePhoto || 'Change Photo'}</Text>
            </TouchableOpacity>

            <Text style={styles.photoLimitNote}>{t.photoLimit || 'JPG, PNG up to 5MB'}</Text>
          </View>
        </View>

        {/* 3. Card 1: Basic Information */}
        <View style={styles.formCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.greenIconCircle}>
              <Ionicons name="person" size={15} color="#ffffff" />
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
                <Ionicons name="person-outline" size={16} color="#64748b" style={styles.fieldIcon} />
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
                <Ionicons name="call-outline" size={16} color="#64748b" style={styles.fieldIcon} />
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
                {t.emailAddress || 'Email Address'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Ionicons name="mail-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.emailAddress}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, emailAddress: val }))}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>{t.dateOfBirth || 'Date of Birth'}</Text>
              <View style={styles.inputBox}>
                <Ionicons name="calendar-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.dob}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, dob: val }))}
                  placeholder="DD Mon YYYY"
                  placeholderTextColor="#94a3b8"
                />
                <Ionicons name="calendar-outline" size={15} color="#64748b" />
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
                <Ionicons name="person-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={styles.selectText}>{form.gender}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748b" />
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
                <Ionicons name="location-sharp" size={15} color="#ffffff" />
              </View>
              <Text style={styles.cardTitle}>{t.locationInfo || 'Location Information'}</Text>
            </View>
            <TouchableOpacity
              style={styles.gpsAutoBtn}
              onPress={handleAutoDetectLocation}
              activeOpacity={0.8}>
              <Ionicons name="navigate" size={12} color="#16a34a" />
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
                <Ionicons name="location-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={styles.selectText} numberOfLines={1}>{form.state}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748b" />
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
                <Ionicons name="location-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={styles.selectText} numberOfLines={1}>{form.district}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748b" />
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
                <Ionicons name="location-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <Text style={styles.selectText} numberOfLines={1}>{form.taluka}</Text>
                <Ionicons name="chevron-down" size={14} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>
                {t.villageCity || 'Village / City'} <Text style={styles.reqAsterisk}>*</Text>
              </Text>
              <View style={styles.inputBox}>
                <Ionicons name="business-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.villageCity}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, villageCity: val }))}
                  placeholder="Village / City"
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
                <Ionicons name="mail-outline" size={16} color="#64748b" style={styles.fieldIcon} />
                <TextInput
                  style={styles.textInput}
                  value={form.pincode}
                  onChangeText={(val) => setForm((prev) => ({ ...prev, pincode: val }))}
                  placeholder="Pincode"
                  keyboardType="numeric"
                  maxLength={6}
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>
            <View style={styles.fieldCol} />
          </View>
        </View>
      </ScrollView>

      {/* 5. Sticky Bottom Action Buttons */}
      <View
        style={[
          styles.stickyFooter,
          { paddingBottom: Math.max(insets.bottom, 12) },
        ]}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave}>
          <MaterialCommunityIcons name="content-save-outline" size={18} color="#ffffff" />
          <Text style={styles.saveBtnText}>{t.saveChanges || 'Save Changes'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} activeOpacity={0.85} onPress={handleReset}>
          <Ionicons name="refresh" size={18} color="#16a34a" />
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
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
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
