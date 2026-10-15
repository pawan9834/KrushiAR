// app/(tabs)/index.tsx
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  ActivityRecord,
  Crop,
  getActivities,
  getCrops,
  getExpenseSummary,
  getFarmerProfile,
  syncActivitiesWithCloud,
} from '@/services/diaryStorage';
import {
  fetchIMDWeather,
  getCoordinatesForLocation,
  IMDWeatherData,
} from '@/services/imdWeather';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Volume2,
  Square,
  Camera,
  Sparkles,
  ArrowRight,
  CircleArrowRight,
  Sprout,
  Coins,
  BookOpen,
  CloudSun,
  CloudRain,
  Cloud,
  CloudLightning,
  Sun,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Speech from 'expo-speech';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  const [farmerName, setFarmerName] = useState('');
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [localWeather, setLocalWeather] = useState<IMDWeatherData | null>(null);
  const [registeredLocName, setRegisteredLocName] = useState<string>('');

  const loadDiaryData = useCallback(async () => {
    try {
      const [profile, acts, cropList, expenseData] = await Promise.all([
        getFarmerProfile(),
        getActivities(),
        getCrops(),
        getExpenseSummary(),
      ]);

      setFarmerName(profile?.name || '');
      setActivities(acts);
      setCrops(cropList);
      setTotalExpense(expenseData.totalExpense);

      // Load weather as per location entered in application registration
      const district = profile?.district || location.district || 'Jalgaon';
      const city = profile?.village
        ? profile.village.split(',')[0].trim()
        : (profile?.taluka || location.city || district);
      const locDisplay = `${city}, ${district}`;
      setRegisteredLocName(locDisplay);

      const coords = await getCoordinatesForLocation(city, district, profile?.state || location.state);
      const wx = await fetchIMDWeather(coords.lat, coords.lon, district, language);
      setLocalWeather(wx);
    } catch (err) {
      console.warn('Error loading diary data:', err);
    }
  }, [location.district, location.city, location.state, language]);

  useFocusEffect(
    useCallback(() => {
      loadDiaryData();
    }, [loadDiaryData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await syncActivitiesWithCloud().catch(() => { });
    await loadDiaryData();
    setIsRefreshing(false);
  };

  const handleToggleSpeak = () => {
    if (!Speech) return;
    try {
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
      } else {
        setIsSpeaking(true);
        const speechLang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        const displayName = farmerName?.trim()
          ? farmerName.trim()
          : language === 'mr'
            ? 'शेतकरी मित्र'
            : language === 'hi'
              ? 'किसान मित्र'
              : 'Farmer Friend';

        const weatherSentence = localWeather
          ? language === 'mr'
            ? `तुमच्या ${registeredLocName || 'परिसरात'} आजचे तापमान ${localWeather.temperature} अंश सेल्सिअस असून हवामान ${localWeather.condition} आहे. ${localWeather.nowcastText}. `
            : language === 'hi'
              ? `आपके ${registeredLocName || 'क्षेत्र'} में आज तापमान ${localWeather.temperature} डिग्री सेल्सियस और मौसम ${localWeather.condition} है। ${localWeather.nowcastText}। `
              : `Weather in ${registeredLocName || 'your area'} is ${localWeather.temperature}°C, ${localWeather.condition}. ${localWeather.nowcastText}. `
          : '';

        const textToSpeak =
          language === 'mr'
            ? `राम राम ${displayName}! ${weatherSentence}सध्या तुमच्याकडे ${crops.length} पिके असून, एकूण ${activities.length} शेती नोंदी आणि ${totalExpense} रुपये खर्च नोंदवला आहे. नवीन कामाचा फोटो काढून लगेच नोंद करा.`
            : language === 'hi'
              ? `नमस्ते ${displayName}! ${weatherSentence}आपके पास ${crops.length} फसलें और कुल ${activities.length} रिकॉर्ड हैं। नई गतिविधि की फोटो लेकर तुरंत दर्ज करें।`
              : `Welcome ${displayName}! ${weatherSentence}You have ${crops.length} active crops and ${activities.length} farming records. Tap the camera button to photograph and record an activity.`;

        Speech.speak(textToSpeak, {
          language: speechLang,
          rate: 0.88,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch {
      setIsSpeaking(false);
    }
  };

  // Formatted date string in farmer's preferred language
  const getFormattedDate = () => {
    const today = new Date();
    const daysMr = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const daysHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsMr = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

    const dayName = language === 'mr' ? daysMr[today.getDay()] : language === 'hi' ? daysHi[today.getDay()] : daysEn[today.getDay()];
    const dateNum = today.getDate();
    const monthName = monthsMr[today.getMonth()];
    const yearNum = today.getFullYear();

    if (language === 'mr' || language === 'hi') {
      return `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
    }
    return `${dayName}, ${dateNum} ${today.toLocaleString('en', { month: 'short' })} ${yearNum}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top > 0 ? insets.top : 16, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      {/* 0. 1-Tap Quick Language Bar */}
      <View style={styles.topLangRow}>
        {(['mr', 'hi', 'en'] as const).map((lng) => {
          const isSel = language === lng;
          const label = lng === 'mr' ? 'मराठी' : lng === 'hi' ? 'हिंदी' : 'English';
          return (
            <TouchableOpacity
              key={lng}
              style={[styles.langChipBtn, isSel && styles.langChipBtnActive]}
              onPress={() => setLanguage(lng)}
              activeOpacity={0.8}>
              <Text style={[styles.langChipBtnText, isSel && styles.langChipBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1. Farmer Welcome Header */}
      <View style={styles.headerRow}>
        <View style={styles.farmerGreetCol}>
          <Text style={styles.greetSubText}>
            {language === 'mr' ? '🌾 शेतकरी रोजनिशी' : language === 'hi' ? '🌾 किसान डायरी' : '🌾 AI Farming Diary'}
          </Text>
          <Text style={styles.farmerNameTitle}>
            {farmerName?.trim()
              ? language === 'mr'
                ? `राम राम, ${farmerName.trim().split(' ')[0]}जी!`
                : language === 'hi'
                  ? `नमस्ते, ${farmerName.trim().split(' ')[0]}जी!`
                  : `Hello, ${farmerName.trim().split(' ')[0]}!`
              : language === 'mr'
                ? 'राम राम, शेतकरी मित्र!'
                : language === 'hi'
                  ? 'नमस्ते, किसान मित्र!'
                  : 'Hello, Farmer Friend!'}
          </Text>
          <Text style={styles.todayDateText}>📅 {getFormattedDate()}</Text>
        </View>

        <TouchableOpacity
          style={styles.locationChip}
          onPress={() => setShowLocationModal(true)}
          activeOpacity={0.7}>
          <MapPin size={15} color="#15803d" />
          <Text style={styles.locationChipText}>
            {registeredLocName ? registeredLocName.split(',')[0].trim() : location.displayCity}
          </Text>
          <ChevronDown size={14} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* 🔊 2. BIG VOICE READOUT BANNER (१-टॅप शेतकरी अहवाल ऐका) */}
      <TouchableOpacity
        style={[styles.voiceHeroBar, isSpeaking && styles.voiceHeroBarActive]}
        onPress={handleToggleSpeak}
        activeOpacity={0.85}>
        <View style={[styles.voiceHeroIconWrap, isSpeaking && styles.voiceHeroIconWrapActive]}>
          {isSpeaking ? (
            <Square size={20} color="#ffffff" fill="#ffffff" />
          ) : (
            <Volume2 size={24} color="#ffffff" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.voiceHeroTitle}>
            {isSpeaking
              ? language === 'mr' ? '⏹️ बोलणे थांबवा' : language === 'hi' ? '⏹️ आवाज रोकें' : '⏹️ Stop Audio'
              : language === 'mr' ? '🔊 आजचा शेत अहवाल ऐका' : language === 'hi' ? '🔊 आज का खेत रिपोर्ट सुनें' : '🔊 Listen Farm Summary'}
          </Text>
          <Text style={styles.voiceHeroSub}>
            {language === 'mr'
              ? 'पिके, खर्च व चालू नोंदी आवाजात ऐका'
              : language === 'hi'
                ? 'फसल, खर्च और कार्य स्थिति आवाज़ में सुनें'
                : 'Listen to crops, expenses and status aloud'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* 3. ⭐ PRIMARY HERO ACTION: "फोटो काढा आणि नोंद करा" */}
      <TouchableOpacity
        style={styles.primaryPhotoHeroBtn}
        onPress={() => router.push('/add-activity')}
        activeOpacity={0.88}>
        <View style={styles.primaryPhotoContent}>
          <View style={styles.cameraIconBigCircle}>
            <Camera size={34} color="#15803d" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Sparkles size={13} color="#ffffff" />
                <Text style={styles.heroBadgeText}>
                  {language === 'mr' ? '१-टॅप सोपी नोंद' : language === 'hi' ? '१-टैप आसान रिकॉर्ड' : '1-Tap Easy Record'}
                </Text>
              </View>
            </View>
            <Text style={styles.primaryHeroTitle}>
              {language === 'mr'
                ? 'फोटो काढा व नोंद करा'
                : language === 'hi'
                  ? 'फोटो लें और दर्ज करें'
                  : 'Take Photo & Record'}
            </Text>
            <Text style={styles.primaryHeroSub}>
              {language === 'mr'
                ? 'शेतातील कामाचा फोटो काढून आवाजात सांगा'
                : language === 'hi'
                  ? 'खेत के काम का फोटो लेकर आवाज़ में बताएं'
                  : 'Capture field work and speak in your voice'}
            </Text>
          </View>
          <CircleArrowRight size={34} color="#ffffff" strokeWidth={2} />
        </View>
      </TouchableOpacity>



      {/* 5. 4 CORE DIARY SHORTCUT TILES (माझी पिके, खर्च, इतिहास, हवामान) */}
      <View style={styles.shortcutTilesGrid}>
        {/* 1. My Crops */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/(tabs)/farm')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#dcfce7' }]}>
            <Sprout size={26} color="#15803d" strokeWidth={2.2} />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops'}
          </Text>
          <Text style={styles.tileSub}>
            {crops.length} {language === 'mr' ? 'पिके शेतात' : language === 'hi' ? 'फसलें' : 'Crops'}
          </Text>
        </TouchableOpacity>

        {/* 2. Farm Expenses */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/(tabs)/farm')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#fef9c3' }]}>
            <Coins size={26} color="#ca8a04" strokeWidth={2.2} />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'शेती खर्च' : language === 'hi' ? 'खेती खर्च' : 'Expenses'}
          </Text>
          <Text style={styles.tileSub}>₹ {totalExpense.toLocaleString('en-IN')}</Text>
        </TouchableOpacity>

        {/* 3. Farming History */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/(tabs)/market')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <BookOpen size={24} color="#0284c7" strokeWidth={2.2} />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'शेती इतिहास' : language === 'hi' ? 'खेती इतिहास' : 'Farm History'}
          </Text>
          <Text style={styles.tileSub}>
            {activities.length} {language === 'mr' ? 'नोंदी' : language === 'hi' ? 'रिकॉर्ड' : 'Records'}
          </Text>
        </TouchableOpacity>

        {/* 4. Weather & Advisory */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/weather')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#f3e8ff' }]}>
            <CloudSun size={26} color="#9333ea" strokeWidth={2.2} />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'हवामान सल्ला' : language === 'hi' ? 'मौसम सलाह' : 'Weather'}
          </Text>
          <Text style={styles.tileSub}>
            {language === 'mr' ? 'स्थानिक अंदाज' : language === 'hi' ? 'स्थानीय अलर्ट' : 'Forecast'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. TODAY'S WEATHER & LIVE TEMPERATURE (AS PER REGISTERED LOCATION) */}
      <TouchableOpacity
        style={styles.askBannerCard}
        onPress={() => router.push('/weather')}
        activeOpacity={0.85}>
        <View style={styles.askBannerLeft}>
          {/* Location & Status Badge */}
          <View style={styles.askBadge}>
            <MapPin size={12} color="#ffffff" />
            <Text style={styles.askBadgeText}>
              {registeredLocName || location.displayLocation}
            </Text>
          </View>

          {/* Big Live Temperature Display */}
          <View style={styles.dashboardTempRow}>
            <Text style={styles.dashboardBigTemp}>
              {localWeather ? `${localWeather.temperature}°C` : '32°C'}
            </Text>
            <View style={styles.dashboardTempMeta}>
              <View style={styles.dashboardConditionRow}>
                {localWeather?.conditionIcon === 'rainy' ? (
                  <CloudRain size={18} color="#15803d" />
                ) : localWeather?.conditionIcon === 'cloudy' ? (
                  <Cloud size={18} color="#15803d" />
                ) : localWeather?.conditionIcon === 'thunderstorm' ? (
                  <CloudLightning size={18} color="#15803d" />
                ) : (
                  <CloudSun size={18} color="#15803d" />
                )}
                <Text style={styles.dashboardConditionText}>
                  {localWeather?.condition || (language === 'mr' ? 'अंशतः ढगाळ' : language === 'hi' ? 'धूप छांव' : 'Partly Cloudy')}
                </Text>
              </View>
              <Text style={styles.dashboardMinMaxText}>
                {localWeather
                  ? (language === 'mr'
                    ? `किमान ${localWeather.minTemp}°C • कमाल ${localWeather.maxTemp}°C`
                    : language === 'hi'
                      ? `न्यूनतम ${localWeather.minTemp}°C • अधिकतम ${localWeather.maxTemp}°C`
                      : `Min ${localWeather.minTemp}°C • Max ${localWeather.maxTemp}°C`)
                  : 'Min 24°C • Max 35°C'}
              </Text>
            </View>
          </View>

          {/* Dynamic Advisory / Nowcast */}
          <Text style={styles.dashboardAdvisoryText} numberOfLines={2}>
            {localWeather?.nowcastText
              ? `📢 ${localWeather.nowcastText}`
              : language === 'mr'
                ? '📢 आज हवामान कोरडे असून पिकांना पाणी व खत देण्यासाठी अनुकूल आहे.'
                : language === 'hi'
                  ? '📢 मौसम साफ है, फसलों में सिंचाई व खाद देने के लिए उपयुक्त समय है।'
                  : '📢 Weather is clear and favorable for irrigation and farm tasks.'}
          </Text>
        </View>

        <View style={styles.weatherChevronCircle}>
          <ArrowRight size={20} color="#15803d" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

      {/* 6. RECENT FARMING ACTIVITIES (नुकत्याच केलेल्या नोंदी) */}
      <View style={styles.recentSectionWrap}>
        <View style={styles.recentHeaderRow}>
          <View>
            <Text style={styles.recentTitle}>
              {language === 'mr'
                ? 'नुकत्याच केलेल्या नोंदी'
                : language === 'hi'
                  ? 'हाल की गतिविधियां'
                  : 'Recent Activities'}
            </Text>
            <Text style={styles.recentSub}>
              {language === 'mr'
                ? 'तुमच्या शेतातील चालू कामांचा इतिहास'
                : language === 'hi'
                  ? 'आपके खेत का कार्य इतिहास'
                  : 'Timeline of your farm activities'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(tabs)/market')}
            activeOpacity={0.7}>
            <Text style={styles.seeAllBtnText}>
              {language === 'mr' ? 'सर्व नोंदी →' : language === 'hi' ? 'सभी देखें →' : 'See All →'}
            </Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyCard}>
            <BookOpen size={42} color="#94a3b8" strokeWidth={1.75} />
            <Text style={styles.emptyTitle}>
              {language === 'mr' ? 'अजून कोणतीही नोंद नाही' : language === 'hi' ? 'अभी कोई रिकॉर्ड नहीं' : 'No activities yet'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'mr'
                ? 'वर दिलेल्या "फोटो काढा आणि नोंद करा" बटनावर टॅप करून पहिली नोंद करा.'
                : language === 'hi'
                  ? 'ऊपर दिए बटन से पहली गतिविधि दर्ज करें।'
                  : 'Tap "Take Photo & Record" to add your first activity.'}
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesStack}>
            {activities.slice(0, 5).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.activityFeedCard}
                onPress={() => router.push({ pathname: '/activity-detail', params: { id: item.id } })}
                activeOpacity={0.8}>
                {/* Photo Thumbnail */}
                <Image
                  source={{
                    uri:
                      item.photoUri ||
                      'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&q=80',
                  }}
                  style={styles.activityThumb}
                />

                {/* Details */}
                <View style={styles.activityFeedContent}>
                  <View style={styles.activityTopMetaRow}>
                    <View style={styles.cropTagBadge}>
                      <Text style={styles.cropTagBadgeText}>{item.cropName}</Text>
                    </View>
                    <Text style={styles.activityDateLabel}>
                      {item.date ? item.date.split('T')[0] : ''}
                    </Text>
                  </View>

                  <Text style={styles.activityCardTitle} numberOfLines={1}>
                    {item.activityTitle}
                  </Text>

                  <Text style={styles.activityNotesText} numberOfLines={2}>
                    {item.notes || item.voiceTranscript || 'तपशील नोंदवला आहे.'}
                  </Text>

                  {/* Expense Badge & Location Tag */}
                  <View style={styles.activityBottomRow}>
                    {item.totalExpense > 0 ? (
                      <View style={styles.expenseTag}>
                        <Text style={styles.expenseTagText}>
                          खर्च: ₹ {item.totalExpense.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    ) : (
                      <View style={[styles.expenseTag, { backgroundColor: '#f1f5f9' }]}>
                        <Text style={[styles.expenseTagText, { color: '#64748b' }]}>
                          खर्च नोंद नाही
                        </Text>
                      </View>
                    )}

                    {item.location?.placeName && (
                      <View style={styles.locTag}>
                        <MapPin size={12} color="#64748b" />
                        <Text style={styles.locTagText}>{item.location.placeName}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <ChevronRight size={18} color="#94a3b8" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
  },

  /* 0. Top Language Switch Bar */
  topLangRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  langChipBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langChipBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  langChipBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
  },
  langChipBtnTextActive: {
    color: '#ffffff',
  },

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  farmerGreetCol: {
    flex: 1,
  },
  greetSubText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  farmerNameTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  todayDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* 🔊 Voice Hero Bar */
  voiceHeroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceHeroBarActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  voiceHeroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceHeroIconWrapActive: {
    backgroundColor: '#dc2626',
  },
  voiceHeroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  voiceHeroSub: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
    marginTop: 2,
  },

  /* 2. Primary Photo Hero Button */
  primaryPhotoHeroBtn: {
    backgroundColor: '#15803d',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#166534',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 5,
  },
  primaryPhotoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cameraIconBigCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  heroBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  primaryHeroTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  primaryHeroSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dcfce7',
    marginTop: 2,
  },

  /* 3. Secondary Voice Button */
  secondaryVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#86efac',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  micIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryVoiceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  secondaryVoiceSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },

  /* 4. 4 Shortcut Tiles */
  shortcutTilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  shortcutTile: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 105,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tileIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  tileSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 2,
    textAlign: 'center',
  },

  /* 5. Ask My Farm Prompt Banner */
  askBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  askBannerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  askBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  askBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  askBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  askBannerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  dashboardTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  dashboardBigTemp: {
    fontSize: 32,
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: -0.5,
  },
  dashboardTempMeta: {
    marginLeft: 10,
    justifyContent: 'center',
  },
  dashboardConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dashboardConditionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  dashboardMinMaxText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  dashboardAdvisoryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#166534',
    marginTop: 4,
    lineHeight: 17,
  },
  weatherChevronCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  /* 6. Recent Activities */
  recentSectionWrap: {
    marginBottom: 10,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  recentSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  seeAllBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seeAllBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  activitiesStack: {
    gap: 10,
  },
  activityFeedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activityThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  activityFeedContent: {
    flex: 1,
  },
  activityTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cropTagBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cropTagBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  activityDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  activityCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  activityNotesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  activityBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  expenseTag: {
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expenseTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  locTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
});
