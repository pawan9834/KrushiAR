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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

// Safe dynamic Speech module
let Speech: typeof import('expo-speech') | null = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  // Graceful fallback
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  const [farmerName, setFarmerName] = useState('पवन पाटील');
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const loadDiaryData = useCallback(async () => {
    try {
      const [profile, acts, cropList, expenseData] = await Promise.all([
        getFarmerProfile(),
        getActivities(),
        getCrops(),
        getExpenseSummary(),
      ]);

      if (profile?.name) setFarmerName(profile.name);
      setActivities(acts);
      setCrops(cropList);
      setTotalExpense(expenseData.totalExpense);
    } catch (err) {
      console.warn('Error loading diary data:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDiaryData();
    }, [loadDiaryData])
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await syncActivitiesWithCloud().catch(() => {});
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
        const textToSpeak =
          language === 'mr'
            ? `राम राम ${farmerName}! आजच्या शेतकरी रोजनिशीमध्ये तुमचे स्वागत आहे. सध्या तुमच्याकडे ${crops.length} पिके असून, एकूण ${activities.length} शेती नोंदी आणि ${totalExpense} रुपये खर्च नोंदवला आहे. नवीन कामाचा फोटो काढून लगेच नोंद करा.`
            : language === 'hi'
              ? `नमस्ते ${farmerName}! किसान डायरी में आपका स्वागत है। आपके पास ${crops.length} फसलें और कुल ${activities.length} रिकॉर्ड हैं। नई गतिविधि की फोटो लेकर तुरंत दर्ज करें।`
              : `Welcome ${farmerName} to AI Farming Diary. You have ${crops.length} active crops and ${activities.length} farming records. Tap the camera button to photograph and record an activity.`;

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

  const cycleLanguage = () => {
    const nextLang = language === 'mr' ? 'hi' : language === 'hi' ? 'en' : 'mr';
    setLanguage(nextLang);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top > 0 ? insets.top + 8 : 16, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}>
      {/* 1. Farmer Welcome Header */}
      <View style={styles.headerRow}>
        <View style={styles.farmerGreetCol}>
          <Text style={styles.greetSubText}>
            {language === 'mr' ? '🌾 शेतकरी रोजनिशी' : language === 'hi' ? '🌾 किसान डायरी' : '🌾 AI Farming Diary'}
          </Text>
          <Text style={styles.farmerNameTitle}>
            {language === 'mr'
              ? `राम राम, ${farmerName.split(' ')[0]}जी!`
              : language === 'hi'
                ? `नमस्ते, ${farmerName.split(' ')[0]}जी!`
                : `Hello, ${farmerName.split(' ')[0]}!`}
          </Text>
          <Text style={styles.todayDateText}>📅 {getFormattedDate()}</Text>
        </View>

        <View style={styles.headerControlsRight}>
          {/* Audio Speaker */}
          <TouchableOpacity
            style={[styles.audioIconBtn, isSpeaking && styles.audioIconBtnActive]}
            onPress={handleToggleSpeak}
            activeOpacity={0.7}>
            <Ionicons
              name={isSpeaking ? 'stop-circle' : 'volume-high'}
              size={20}
              color={isSpeaking ? '#ffffff' : '#15803d'}
            />
          </TouchableOpacity>

          {/* Location Chip */}
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}>
            <Ionicons name="location-sharp" size={14} color="#15803d" />
            <Text style={styles.locationChipText}>{location.displayCity}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. ⭐ PRIMARY HERO ACTION: "फोटो काढा आणि नोंद करा" (Most Prominent Button on Screen) */}
      <TouchableOpacity
        style={styles.primaryPhotoHeroBtn}
        onPress={() => router.push('/add-activity')}
        activeOpacity={0.88}>
        <View style={styles.primaryPhotoContent}>
          <View style={styles.cameraIconBigCircle}>
            <Ionicons name="camera" size={36} color="#15803d" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={13} color="#ffffff" />
                <Text style={styles.heroBadgeText}>
                  {language === 'mr' ? '१-टॅप AI नोंद' : language === 'hi' ? '१-टैप AI रिकॉर्ड' : '1-Tap AI Record'}
                </Text>
              </View>
            </View>
            <Text style={styles.primaryHeroTitle}>
              {language === 'mr'
                ? 'फोटो काढा आणि नोंद करा'
                : language === 'hi'
                  ? 'फोटो लें और दर्ज करें'
                  : 'Take Photo & Record'}
            </Text>
            <Text style={styles.primaryHeroSub}>
              {language === 'mr'
                ? 'शेतातील कामाचा फोटो काढून आवाजात सांगा'
                : language === 'hi'
                  ? 'खेत के काम का फोटो लेकर आवाज़ में बताएं'
                  : 'Capture field work and speak in your language'}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={32} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* 3. ⭐ SECONDARY ACTION: "बोलून नोंद करा" (Voice Only Record) */}
      <TouchableOpacity
        style={styles.secondaryVoiceBtn}
        onPress={() => router.push('/add-activity')}
        activeOpacity={0.8}>
        <View style={styles.micIconCircle}>
          <Ionicons name="mic" size={24} color="#ffffff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.secondaryVoiceTitle}>
            {language === 'mr'
              ? '🎙️ बोलून नोंद करा'
              : language === 'hi'
                ? '🎙️ बोलकर दर्ज करें'
                : '🎙️ Voice Record'}
          </Text>
          <Text style={styles.secondaryVoiceSub}>
            {language === 'mr'
              ? 'उदा. "आज मी टोमॅटोची लागवड केली"'
              : language === 'hi'
                ? 'उदा. "आज मैंने टमाटर की बुवाई की"'
                : 'e.g. "Today I planted tomatoes"'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748b" />
      </TouchableOpacity>

      {/* 4. 4 CORE DIARY SHORTCUT TILES (माझी पिके, इतिहास, खर्च, शेतीला विचारा) */}
      <View style={styles.shortcutTilesGrid}>
        {/* 1. My Crops */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/(tabs)/farm')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="sprout" size={26} color="#15803d" />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops'}
          </Text>
          <Text style={styles.tileSub}>
            {crops.length} {language === 'mr' ? 'पिके शेतात' : language === 'hi' ? 'फसलें' : 'Crops'}
          </Text>
        </TouchableOpacity>

        {/* 2. Farming History */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/(tabs)/market')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="book" size={24} color="#0284c7" />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'शेती इतिहास' : language === 'hi' ? 'खेती इतिहास' : 'Farm History'}
          </Text>
          <Text style={styles.tileSub}>
            {activities.length} {language === 'mr' ? 'नोंदी' : language === 'hi' ? 'रिकॉर्ड' : 'Records'}
          </Text>
        </TouchableOpacity>

        {/* 3. Farm Expenses */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/(tabs)/farm')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#fef9c3' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={26} color="#ca8a04" />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'शेतीचा खर्च' : language === 'hi' ? 'खेती खर्च' : 'Expenses'}
          </Text>
          <Text style={styles.tileSub}>₹ {totalExpense.toLocaleString('en-IN')}</Text>
        </TouchableOpacity>

        {/* 4. Ask My Farm (AI Memory) */}
        <TouchableOpacity
          style={styles.shortcutTile}
          onPress={() => router.push('/add-activity')}
          activeOpacity={0.75}>
          <View style={[styles.tileIconCircle, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="chatbubbles" size={24} color="#9333ea" />
          </View>
          <Text style={styles.tileTitle}>
            {language === 'mr' ? 'शेतीला विचारा' : language === 'hi' ? 'खेत से पूछें' : 'Ask My Farm'}
          </Text>
          <Text style={styles.tileSub}>
            {language === 'mr' ? 'AI आठवण' : language === 'hi' ? 'AI स्मरण' : 'AI Memory'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 5. ASK MY FARM QUICK PROMPT BANNER */}
      <TouchableOpacity
        style={styles.askBannerCard}
        onPress={() => router.push('/add-activity')}
        activeOpacity={0.8}>
        <View style={styles.askBannerLeft}>
          <View style={styles.askBadge}>
            <Ionicons name="bulb" size={13} color="#ffffff" />
            <Text style={styles.askBadgeText}>
              {language === 'mr' ? 'माझ्या शेतीची आठवण' : language === 'hi' ? 'खेत की याददाश्त' : 'Farm Memory'}
            </Text>
          </View>
          <Text style={styles.askBannerTitle}>
            {language === 'mr'
              ? '💬 "मी टोमॅटोची लागवड कधी केली?"'
              : language === 'hi'
                ? '💬 "मैंने टमाटर की बुवाई कब की थी?"'
                : '💬 "When did I plant tomatoes?"'}
          </Text>
          <Text style={styles.askBannerSub}>
            {language === 'mr'
              ? 'खताचा खर्च किंवा मागची फवारणी AI ला बोलून विचारा'
              : language === 'hi'
                ? 'पिछला खर्च या छिड़काव AI से बोलकर पूछें'
                : 'Ask AI about your past sprays, fertilizers, and costs'}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={22} color="#15803d" />
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
            <MaterialCommunityIcons name="book-open-page-variant" size={42} color="#94a3b8" />
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
                        <Ionicons name="location-outline" size={12} color="#64748b" />
                        <Text style={styles.locTagText}>{item.location.placeName}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
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

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  farmerGreetCol: {
    flex: 1,
  },
  greetSubText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  farmerNameTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  todayDateText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  headerControlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minHeight: 36,
  },
  langPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  audioIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioIconBtnActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 5,
    minHeight: 36,
  },
  locationChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
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
