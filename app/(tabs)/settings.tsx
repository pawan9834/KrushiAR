import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  FarmerProfile,
  Crop,
  ActivityRecord,
  getFarmerProfile,
  getCrops,
  getActivities,
  setOnboardingComplete,
  clearLocalDiarySession,
} from '@/services/diaryStorage';
import { getAuth } from '@react-native-firebase/auth';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Bell,
  User,
  Camera,
  Phone,
  CheckCircle2,
  Mail,
  Pencil,
  Sprout,
  Mountain,
  ClipboardCheck,
  TrendingUp,
  Globe,
  Settings,
  Info,
  LogOut,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  DimensionValue,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

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

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Global Language Context: 'en' | 'mr' | 'hi'
  const { language, setLanguage, t } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      setIsLoading(true);
      Promise.all([getFarmerProfile(), getCrops(), getActivities()])
        .then(([profile, cropList, actList]) => {
          if (!isMounted) return;
          setFarmerProfile(profile);
          setCrops(cropList);
          setActivities(actList);
        })
        .catch((err) => console.warn('Failed to load profile settings:', err))
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleLogout = () => {
    Alert.alert(
      t.logoutAlertTitle,
      t.logoutAlertMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.logout,
          style: 'destructive',
          onPress: async () => {
            try {
              const auth = getAuth();
              await auth.signOut();
            } catch (err) {
              console.warn('Firebase signout warning:', err);
            }
            await clearLocalDiarySession();
            await setOnboardingComplete(false);
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      language === 'mr' ? 'शेतकरी हेल्पलाइन' : language === 'hi' ? 'किसान हेल्पलाइन' : 'Kisan Farmer Helpline',
      language === 'mr'
        ? 'किसान कॉल सेंटर (टोल फ्री: १८००-१८०-१५५१)\nशेतीविषयक सल्ला आणि मार्गदर्शनासाठी कृषी तज्ञांशी थेट संपर्क करा.'
        : language === 'hi'
        ? 'किसान कॉल सेंटर (टोल फ्री: 1800-180-1551)\nकृषि विशेषज्ञों से कृषि सलाह व सहायता के लिए संपर्क करें।'
        : 'Kisan Call Center (Toll Free: 1800-180-1551)\nDirectly connect with agricultural experts for advice and support.',
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: language === 'mr' ? 'कॉल करा' : language === 'hi' ? 'कॉल करें' : 'Call Now',
          onPress: () => {
            Linking.openURL('tel:18001801551').catch(() => {
              Alert.alert('1800-180-1551');
            });
          },
        },
      ]
    );
  };

  const handleAboutApp = () => {
    Alert.alert(
      'KrushiAR',
      language === 'mr'
        ? 'स्मार्ट शेती आणि डिजिटल कृषी डायरी\nआवृत्ती: 1.0.0\nशेतकऱ्यांसाठी आधुनिक AR आणि AI तंत्रज्ञान.'
        : language === 'hi'
        ? 'स्मार्ट कृषि और डिजिटल फार्मिंग डायरी\nसंस्करण: 1.0.0\nकिसानों के लिए आधुनिक AR और AI तकनीक।'
        : 'Smart Farming & Digital Farm Diary\nVersion: 1.0.0\nEmpowering farmers with modern AR and AI technology.',
      [{ text: 'OK' }]
    );
  };

  const getFormattedLocation = () => {
    if (farmerProfile?.village?.trim() && farmerProfile?.district?.trim()) {
      return `${farmerProfile.village.trim()}, ${farmerProfile.district.trim()}`;
    }
    if (farmerProfile?.village?.trim()) return farmerProfile.village.trim();
    if (farmerProfile?.district?.trim()) return farmerProfile.district.trim();
    if (farmerProfile?.state?.trim()) return farmerProfile.state.trim();
    if (location.displayLocation && location.displayLocation !== 'जळगाव, महाराष्ट्र') {
      return location.displayLocation;
    }
    return t.na;
  };

  // Dynamic calculation for farm land area
  const totalCropArea = crops.reduce((sum, c) => {
    const val = parseFloat(c.area);
    return !isNaN(val) ? sum + val : sum;
  }, 0);

  const displayAcres = farmerProfile?.totalArea?.trim()
    ? farmerProfile.totalArea.trim()
    : totalCropArea > 0
    ? `${totalCropArea.toFixed(1)} ${t.acres}`
    : `0 ${t.acres}`;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[styles.content, { paddingTop: 14, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* 1. Top Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>{t.screenTitle}</Text>
          <Text style={styles.screenSub}>{t.screenSub}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.8}>
            <MapPin size={13} color="#16a34a" />
            <Text style={styles.locationText}>{location.displayLocation} </Text>
            <ChevronDown size={11} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}>
            <Bell size={20} color="#1e293b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Body: Skeleton while loading, Profile data when loaded */}
      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {/* Profile Card Skeleton */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <SkeletonBox width={64} height={64} borderRadius={32} style={{ marginRight: 12 }} />
              <View style={{ flex: 1, gap: 7, justifyContent: 'center' }}>
                <SkeletonBox width="60%" height={16} borderRadius={4} />
                <SkeletonBox width="50%" height={12} borderRadius={4} />
                <SkeletonBox width="65%" height={12} borderRadius={4} />
              </View>
              <SkeletonBox width={76} height={28} borderRadius={14} />
            </View>
          </View>

          {/* 4 Metric Quick Summary Skeleton */}
          <View style={styles.metricCardsRow}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.metricCard, { alignItems: 'center', gap: 6, paddingVertical: 12 }]}>
                <SkeletonBox width={32} height={32} borderRadius={16} />
                <SkeletonBox width={28} height={18} borderRadius={4} />
                <SkeletonBox width={40} height={11} borderRadius={4} />
              </View>
            ))}
          </View>

          {/* Section Header Skeleton */}
          <SkeletonBox width={140} height={16} borderRadius={4} style={{ marginBottom: 10, marginTop: 4 }} />
          <View style={styles.groupedCard}>
            {[1, 2].map((i) => (
              <View key={i} style={[styles.groupItemRow, { gap: 12, paddingVertical: 12 }]}>
                <SkeletonBox width={38} height={38} borderRadius={10} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonBox width="50%" height={14} borderRadius={4} />
                  <SkeletonBox width="75%" height={11} borderRadius={4} />
                </View>
                <SkeletonBox width={16} height={16} borderRadius={8} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <>
          {/* 2. Farmer Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              {/* Avatar with Camera Badge */}
              <View style={styles.avatarContainer}>
                {farmerProfile?.avatarUri ? (
                  <Image
                    source={{ uri: farmerProfile.avatarUri }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarPlaceholder]}>
                    {farmerProfile?.name?.trim() ? (
                      <Text style={styles.avatarInitial}>
                        {farmerProfile.name.trim().charAt(0).toUpperCase()}
                      </Text>
                    ) : (
                      <User size={32} color="#16a34a" />
                    )}
                  </View>
                )}
                <TouchableOpacity
                  style={styles.cameraBadge}
                  onPress={() => router.push('/personal-info')}
                  activeOpacity={0.8}>
                  <Camera size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Profile Details */}
              <View style={styles.profileTextCol}>
                <Text style={styles.farmerName}>
                  {farmerProfile?.name?.trim() || t.na}
                </Text>

                <View style={styles.detailRow}>
                  <Phone size={12} color="#64748b" />
                  <Text style={styles.detailText}>
                    {farmerProfile?.phone?.trim()
                      ? (farmerProfile.phone.startsWith('+91')
                          ? farmerProfile.phone
                          : `+91 ${farmerProfile.phone}`)
                      : t.na}
                  </Text>
                  {farmerProfile?.phone?.trim() ? (
                    <CheckCircle2 size={13} color="#16a34a" style={{ marginLeft: 2 }} />
                  ) : null}
                </View>

                {/* Only display email if available to avoid unnecessary N/A clutter */}
                {farmerProfile?.email?.trim() ? (
                  <View style={styles.detailRow}>
                    <Mail size={12} color="#64748b" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {farmerProfile.email.trim()}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <MapPin size={12} color="#64748b" />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {getFormattedLocation()}
                  </Text>
                </View>
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => router.push('/personal-info')}
                activeOpacity={0.8}>
                <Pencil size={12} color="#16a34a" />
                <Text style={styles.editProfileText}>{t.editProfile}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. 4 Metric Quick Summary Cards */}
          <View style={styles.metricCardsRow}>
            {/* Crops */}
            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => router.push('/(tabs)/farm')}
              activeOpacity={0.8}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Sprout size={18} color="#16a34a" />
              </View>
              <Text style={styles.metricNum}>{crops.length}</Text>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel}>{t.crops}</Text>
                <ChevronRight size={11} color="#16a34a" />
              </View>
            </TouchableOpacity>

            {/* Acres */}
            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => router.push('/(tabs)/farm')}
              activeOpacity={0.8}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Mountain size={18} color="#16a34a" />
              </View>
              <Text style={styles.metricNum} numberOfLines={1}>
                {displayAcres}
              </Text>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel}>{t.acres}</Text>
                <ChevronRight size={11} color="#16a34a" />
              </View>
            </TouchableOpacity>

            {/* Total Records / Activities */}
            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => router.push('/(tabs)/market')}
              activeOpacity={0.8}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
                <ClipboardCheck size={18} color="#16a34a" />
              </View>
              <Text style={styles.metricNum}>{activities.length}</Text>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel} numberOfLines={1}>
                  {language === 'mr' ? 'नोंदी' : language === 'hi' ? 'रिकॉर्ड' : 'Records'}
                </Text>
                <ChevronRight size={11} color="#16a34a" />
              </View>
            </TouchableOpacity>

            {/* Farm Health */}
            <TouchableOpacity
              style={styles.metricCard}
              onPress={() => router.push('/(tabs)/farm')}
              activeOpacity={0.8}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
                <TrendingUp size={18} color="#16a34a" />
              </View>
              <Text style={styles.metricNum}>{crops.length > 0 ? t.farmHealthVal : '—'}</Text>
              <View style={styles.metricLabelRow}>
                <Text style={styles.metricLabel} numberOfLines={1}>{t.farmHealth}</Text>
                <ChevronRight size={11} color="#16a34a" />
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* 4. Section: Account Settings */}
      <Text style={styles.sectionTitle}>{t.accountSettings}</Text>
      <View style={styles.groupedCard}>
        {/* Personal Information */}
        <TouchableOpacity
          style={styles.groupItemRow}
          onPress={() => router.push('/personal-info')}
          activeOpacity={0.7}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#f3e8ff' }]}>
            <User size={18} color="#9333ea" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.personalInfo}</Text>
            <Text style={styles.groupItemSub}>{t.personalInfoSub}</Text>
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* Notifications */}
        <TouchableOpacity
          style={styles.groupItemRow}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#ffe4e6' }]}>
            <Bell size={18} color="#e11d48" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.notifications}</Text>
            <Text style={styles.groupItemSub}>{t.notificationsSub}</Text>
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* Language Row with 3 Side-by-Side Radio Buttons */}
        <View style={styles.languageContainer}>
          <View style={styles.languageHeaderRow}>
            <View style={[styles.groupIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Globe size={20} color="#0284c7" />
            </View>
            <View style={styles.groupTextCol}>
              <Text style={styles.groupItemTitle}>{t.language}</Text>
              <Text style={styles.groupItemSub}>{t.languageSub}</Text>
            </View>
          </View>

          {/* Three Radio Buttons Side-by-Side */}
          <View style={styles.radioGroupRow}>
            {([
              { key: 'en', label: 'English' },
              { key: 'mr', label: 'मराठी' },
              { key: 'hi', label: 'हिंदी' },
            ] as const).map((item) => {
              const isSelected = language === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.8}
                  onPress={() => setLanguage(item.key)}
                  style={[
                    styles.radioBtn,
                    isSelected ? styles.radioBtnSelected : styles.radioBtnUnselected,
                  ]}>
                  {/* Circular Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioCircleSelected : styles.radioCircleUnselected,
                    ]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      isSelected ? styles.radioLabelSelected : styles.radioLabelUnselected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* 5. Section: Support & Information */}
      <Text style={styles.sectionTitle}>{t.appSupport}</Text>
      <View style={styles.groupedCard}>
        {/* App Settings */}
        <TouchableOpacity
          style={styles.groupItemRow}
          onPress={() => router.push('/app-settings')}
          activeOpacity={0.7}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#f0fdf4' }]}>
            <Settings size={18} color="#16a34a" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.appSettings}</Text>
            <Text style={styles.groupItemSub}>{t.appSettingsSub}</Text>
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* Help & Support (Kisan Helpline) */}
        <TouchableOpacity
          style={styles.groupItemRow}
          onPress={handleHelpSupport}
          activeOpacity={0.7}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#fef3c7' }]}>
            <Phone size={18} color="#d97706" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>
              {language === 'mr' ? 'शेतकरी हेल्पलाइन' : language === 'hi' ? 'किसान हेल्पलाइन' : 'Kisan Farmer Helpline'}
            </Text>
            <Text style={styles.groupItemSub}>
              {language === 'mr' ? 'टोल फ्री: १८००-१८०-१५५१ (कृषी सल्ला)' : language === 'hi' ? 'टोल फ्री: 1800-180-1551 (कृषि सलाह)' : 'Toll Free: 1800-180-1551'}
            </Text>
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* About KrushiAR */}
        <TouchableOpacity
          style={styles.groupItemRow}
          onPress={handleAboutApp}
          activeOpacity={0.7}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#dcfce7' }]}>
            <Info size={20} color="#16a34a" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.aboutApp}</Text>
            <Text style={styles.groupItemSub}>{t.version} • KrushiAR</Text>
          </View>
          <ChevronRight size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* 6. Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutBtnText}>{t.logout}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },
  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  bellBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  avatarPlaceholder: {
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#16a34a',
  },
  skeletonContainer: {
    marginBottom: 4,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16a34a',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  profileTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailText: {
    fontSize: 11,
    color: '#475569',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 3,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* 4 Metrics */
  metricCardsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricNum: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 1,
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },

  /* Section Headings */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 4,
  },

  /* Grouped Card */
  groupedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  groupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  groupIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groupTextCol: {
    flex: 1,
  },
  groupItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  groupItemSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  groupDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 58,
  },

  /* Language Container & Radio Buttons */
  languageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  languageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginLeft: 46,
  },
  radioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    justifyContent: 'center',
  },
  radioBtnSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  radioBtnUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#16a34a',
  },
  radioCircleUnselected: {
    borderColor: '#94a3b8',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  radioLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  radioLabelSelected: {
    color: '#16a34a',
  },
  radioLabelUnselected: {
    color: '#475569',
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 6,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
});
