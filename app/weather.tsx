import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  ChevronDown,
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  Thermometer,
  RefreshCw,
  Droplets,
  Wind,
  Compass,
  ShieldCheck,
  Sprout,
  ChevronRight,
  FlaskConical,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import { Crop, getCrops, getFarmerProfile } from '@/services/diaryStorage';
import {
  fetchExtendedWeatherForecast,
  getCoordinatesForLocation,
  ExtendedWeatherForecast,
  HourlyWeatherItem,
  DailyWeatherItem,
} from '@/services/imdWeather';

function renderWeatherConditionIcon(iconName: string, color: string, size = 22) {
  switch (iconName) {
    case 'rainy':
      return <CloudRain size={size} color={color} strokeWidth={2} />;
    case 'cloud':
    case 'cloudy':
      return <Cloud size={size} color={color} strokeWidth={2} />;
    case 'partly-sunny':
      return <CloudSun size={size} color={color} strokeWidth={2} />;
    case 'thunderstorm':
      return <CloudLightning size={size} color={color} strokeWidth={2} />;
    case 'sunny':
    default:
      return <Sun size={size} color={color} strokeWidth={2} />;
  }
}

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // Active Filter Pill
  const [activeFilter, setActiveFilter] = useState<'hourly' | '7days' | 'rainfall' | 'wind' | 'uv'>('hourly');

  // Selected hour index
  const [selectedHour, setSelectedHour] = useState(0);

  // Selected day index
  const [selectedDay, setSelectedDay] = useState(0);

  // Live Weather Forecast State
  const [forecast, setForecast] = useState<ExtendedWeatherForecast | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [registeredPlace, setRegisteredPlace] = useState<{ village: string; district: string } | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);

  const loadWeather = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);

    try {
      const [profile, cropList] = await Promise.all([
        getFarmerProfile(),
        getCrops(),
      ]);
      setCrops(cropList);

      const district = profile?.district || location.district || 'Jalgaon';
      const village = profile?.village
        ? profile.village.split(',')[0].trim()
        : (profile?.taluka || location.city || district);
      setRegisteredPlace({ village, district });

      // Prioritize coordinates for location entered in application registration
      const coords = await getCoordinatesForLocation(village, district, profile?.state || location.state);
      const data = await fetchExtendedWeatherForecast(coords.lat, coords.lon, district, language);
      setForecast(data);
    } catch (err) {
      console.warn('Failed to load weather:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [location.district, location.city, location.state, language]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (isMounted) {
        await loadWeather();
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadWeather]);

  const hourlyData: HourlyWeatherItem[] = forecast?.hourly || [];
  const sevenDayData: DailyWeatherItem[] = forecast?.sevenDay || [];
  const current = forecast?.current;

  const getDynamicDateStr = () => {
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
  };

  const filterTabs = [
    { key: 'hourly' as const, label: t.hourlyForecast },
    { key: '7days' as const, label: t.sevenDaysForecast },
    { key: 'rainfall' as const, label: t.rainfall },
    { key: 'wind' as const, label: t.wind },
    { key: 'uv' as const, label: t.uvIndex },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* 1. Header Row */}
      <View style={[styles.headerOverlay, { paddingTop: 11 }]}>
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}>
              <ArrowLeft size={24} color="#0f172a" />
            </TouchableOpacity>

            {/* Title & Subtitle */}
            <View style={styles.titleCol}>
              <Text style={styles.screenTitle}>{t.weatherTitle}</Text>
              <Text style={styles.screenSub}>{t.weatherScreenSub}</Text>
            </View>

            {/* Location Chip Button */}
            <TouchableOpacity
              style={styles.locationChip}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}>
              <MapPin size={13} color="#16a34a" />
              <Text style={styles.locationText} numberOfLines={1}>
                {registeredPlace ? `${registeredPlace.village}, ${registeredPlace.district}` : location.displayLocation}
              </Text>
              <ChevronDown size={11} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadWeather(true)}
            colors={['#16a34a']}
          />
        }>
        {/* 2. Main Weather Hero Card */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
            style={styles.heroBg}
            resizeMode="cover">
            <View style={styles.heroOverlay}>
              {/* Left Column: Temp & Conditions */}
              <View style={styles.heroLeftCol}>
                <Text style={styles.heroDateText}>{getDynamicDateStr()}</Text>

                <View style={styles.heroTempRow}>
                  <Text style={styles.heroTempText}>{current ? `${current.temperature}°C` : '32°C'}</Text>
                  <View style={{ marginLeft: 6 }}>
                    {renderWeatherConditionIcon(current?.conditionIcon || 'sunny', '#facc15', 38)}
                  </View>
                </View>

                <Text style={styles.heroConditionText}>{current?.condition || 'Clear Sky'}</Text>

                <View style={styles.heroMetaRow}>
                  <Thermometer size={13} color="#ffffff" />
                  <Text style={styles.heroMetaText}>Feels like {current ? `${current.temperature + 2}°C` : '34°C'}</Text>
                </View>

                <View style={styles.heroMetaRow}>
                  <RefreshCw size={13} color="#ffffff" />
                  <Text style={styles.heroMetaText}>Updated {current?.lastUpdated || 'just now'}</Text>
                </View>
              </View>

              {/* Right Column: Frosted Glass Stats Card */}
              <View style={styles.frostedStatsCard}>
                <View style={styles.statLine}>
                  <Droplets size={15} color="#0284c7" />
                  <Text style={styles.statLabel}>Humidity</Text>
                  <Text style={styles.statVal}>{current ? `${current.humidity}%` : '42%'}</Text>
                </View>

                <View style={styles.statLine}>
                  <CloudRain size={15} color="#0284c7" />
                  <Text style={styles.statLabel}>Rainfall</Text>
                  <Text style={styles.statVal}>{current ? `${current.rainfallMm} mm` : '0 mm'}</Text>
                </View>

                <View style={styles.statLine}>
                  <Wind size={15} color="#475569" />
                  <Text style={styles.statLabel}>Wind Speed</Text>
                  <Text style={styles.statVal}>{current ? `${current.windSpeed} km/h` : '10 km/h'}</Text>
                </View>

                <View style={styles.statLine}>
                  <Compass size={15} color="#475569" />
                  <Text style={styles.statLabel}>Pressure</Text>
                  <Text style={styles.statVal}>{forecast?.pressureHpa ? `${forecast.pressureHpa} hPa` : '1012 hPa'}</Text>
                </View>

                <View style={styles.statLine}>
                  <Sun size={15} color="#f59e0b" />
                  <Text style={styles.statLabel}>UV Index</Text>
                  <Text style={[styles.statVal, { color: (forecast?.uvIndex || 6) > 7 ? '#dc2626' : '#16a34a', fontWeight: '800' }]}>
                    {forecast?.uvIndex || 6} ({(forecast?.uvIndex || 6) > 7 ? 'High' : 'Moderate'})
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* 2.5 Registered Farm Location Weather Advisory Banner */}
        <View style={styles.registeredAdvisoryBox}>
          <View style={styles.advisoryBadgeHead}>
            <View style={styles.registeredLocationBadge}>
              <ShieldCheck size={14} color="#15803d" />
              <Text style={styles.registeredLocationBadgeText}>
                {language === 'mr'
                  ? `📍 नोंदणीकृत शेत: ${registeredPlace?.village || registeredPlace?.district || 'चोपडा'}`
                  : language === 'hi'
                    ? `📍 पंजीकृत खेत: ${registeredPlace?.village || registeredPlace?.district || 'चोपड़ा'}`
                    : `📍 Registered Farm: ${registeredPlace?.village || registeredPlace?.district || 'Farm'}`}
              </Text>
            </View>
            <View style={styles.imdLiveTag}>
              <Text style={styles.imdLiveTagText}>IMD Live</Text>
            </View>
          </View>
          <Text style={styles.advisoryMainText}>
            {current?.nowcastText || current?.warningText || 'स्थानिक हवामान पिकांसाठी अनुकूल आहे.'}
          </Text>
          {crops.length > 0 && (
            <View style={styles.cropAdvisoryPillRow}>
              <Sprout size={13} color="#15803d" />
              <Text style={styles.cropAdvisoryPillText}>
                {language === 'mr' ? 'नोंदणीकृत पिके:' : language === 'hi' ? 'पंजीकृत फसलें:' : 'Registered Crops:'}{' '}
                {crops.map((c) => c.name).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* 3. Filter Mode Tabs Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Hourly Forecast Horizontal Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlyScroll}>
          {hourlyData.map((item, idx) => {
            const isSelected = selectedHour === idx;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedHour(idx)}
                style={[
                  styles.hourlyCard,
                  isSelected ? styles.hourlyCardActive : styles.hourlyCardInactive,
                ]}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.hourlyTimeText,
                    isSelected && { color: '#16a34a', fontWeight: '800' },
                  ]}>
                  {item.time}
                </Text>

                <View style={{ marginVertical: 6 }}>
                  {renderWeatherConditionIcon(item.icon, item.color, 22)}
                </View>

                <Text style={styles.hourlyTempText}>{item.temp}</Text>

                <View style={styles.rainChanceRow}>
                  <Droplets size={10} color="#0284c7" />
                  <Text style={styles.rainChanceText}>{item.rain}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 5. Key Weather Details */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t.keyWeatherDetails}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewMoreLink}>{t.viewMore} &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.keyDetailsGrid}>
            {/* Card 1: Temperature */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#fee2e2' }]}>
                <Thermometer size={18} color="#ef4444" />
              </View>
              <Text style={styles.detailCardLabel}>Temperature</Text>
              <Text style={styles.detailCardVal}>
                {current ? `${current.minTemp}° - ${current.maxTemp}°` : '24° - 35°'}
              </Text>
              <Text style={styles.detailCardSub}>Min / Max</Text>
            </View>

            {/* Card 2: Humidity */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Droplets size={18} color="#0284c7" />
              </View>
              <Text style={styles.detailCardLabel}>Humidity</Text>
              <Text style={styles.detailCardVal}>{current ? `${current.humidity}%` : '42%'}</Text>
              <Text style={styles.detailCardSub}>{(current?.humidity || 42) > 60 ? 'High' : (current?.humidity || 42) > 30 ? 'Moderate' : 'Low'}</Text>
            </View>

            {/* Card 3: Rainfall */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#dcfce7' }]}>
                <CloudRain size={18} color="#16a34a" />
              </View>
              <Text style={styles.detailCardLabel}>Rainfall</Text>
              <Text style={styles.detailCardVal}>{current ? `${current.rainfallMm} mm` : '0 mm'}</Text>
              <Text style={styles.detailCardSub}>Today</Text>
            </View>

            {/* Card 4: Wind Speed */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#f3e8ff' }]}>
                <Wind size={18} color="#9333ea" />
              </View>
              <Text style={styles.detailCardLabel}>Wind Speed</Text>
              <Text style={styles.detailCardVal}>{current ? `${current.windSpeed} km/h` : '10 km/h'}</Text>
              <Text style={styles.detailCardSub}>{(current?.windSpeed || 10) > 15 ? 'Breezy' : 'Calm'}</Text>
            </View>
          </View>
        </View>

        {/* 6. 7 Day Forecast */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t.sevenDayForecastTitle}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewMoreLink}>{t.viewDetails} &gt;</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sevenDayScroll}>
            {sevenDayData.map((item, idx) => {
              const isSelected = selectedDay === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDay(idx)}
                  style={[
                    styles.dailyCard,
                    isSelected ? styles.dailyCardActive : styles.dailyCardInactive,
                  ]}
                  activeOpacity={0.8}>
                  <Text
                    style={[
                      styles.dailyDayText,
                      isSelected && { color: '#16a34a', fontWeight: '800' },
                    ]}>
                    {item.day}
                  </Text>
                  <Text style={styles.dailyDateSub}>{item.date}</Text>

                  <View style={{ marginVertical: 6 }}>
                    {renderWeatherConditionIcon(item.icon, item.color, 22)}
                  </View>

                  <Text style={styles.dailyTempText}>{item.temp}</Text>

                  <View style={styles.rainChanceRow}>
                    <Droplets size={10} color="#0284c7" />
                    <Text style={styles.rainChanceText}>{item.rain}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 7. Farming Recommendations */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t.farmingRecommendations}</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.viewMoreLink}>{t.viewAll} &gt;</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recommendationsCol}>
            {/* Recommendation 1: Irrigation Advice */}
            <TouchableOpacity style={styles.recommendCard} activeOpacity={0.8}>
              <View style={[styles.recommendIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Sprout size={20} color="#16a34a" />
              </View>
              <View style={styles.recommendTextCol}>
                <Text style={[styles.recommendTitle, { color: '#15803d' }]}>
                  {current && (current.rainChance > 40 || current.rainfallMm > 2)
                    ? (language === 'mr' ? '💧 पाणी देणे थांबवा (पावसाची शक्यता)' : language === 'hi' ? '💧 सिंचाई रोकें (बारिश संभावना)' : 'Hold Irrigation (Rain Likely)')
                    : (language === 'mr' ? '💧 सिंचन सल्ला (योग्य वेळ)' : language === 'hi' ? '💧 सिंचाई सलाह' : (t.goodForIrrigation || 'Irrigation Advisory'))}
                </Text>
                <Text style={styles.recommendDesc}>
                  {current && (current.rainChance > 40 || current.rainfallMm > 2)
                    ? (language === 'mr'
                      ? `${registeredPlace?.village || registeredPlace?.district || 'तुमच्या भागात'} पुढील २४ तासांत पावसाचा अंदाज आहे. पिकांना अतिरिक्त पाणी देणे टाळा.`
                      : `${registeredPlace?.village || registeredPlace?.district || 'आपके क्षेत्र'} में बारिश की संभावना है। सिंचाई टालें।`)
                    : (language === 'mr'
                      ? `${registeredPlace?.village || registeredPlace?.district || 'परिसरात'} तापमान ${current?.temperature || 32}°C आहे. दुपारनंतर किंवा संध्याकाळी पाणी दिल्यास ओलावा टिकेल.`
                      : `${registeredPlace?.village || registeredPlace?.district || 'क्षेत्र'} में शाम के समय सिंचाई करें।`)}
                </Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Recommendation 2: Spraying / फवारणी सल्ला */}
            <TouchableOpacity style={styles.recommendCard} activeOpacity={0.8}>
              <View style={[styles.recommendIconWrap, { backgroundColor: '#fef3c7' }]}>
                <FlaskConical size={20} color="#d97706" />
              </View>
              <View style={styles.recommendTextCol}>
                <Text style={[styles.recommendTitle, { color: '#b45309' }]}>
                  {current && current.windSpeed > 15
                    ? (language === 'mr' ? '🧪 फवारणी टाळा (वाऱ्याचा वेग जास्त)' : language === 'hi' ? '🧪 छिड़काव टालें (तेज हवा)' : 'Delay Spraying (High Wind)')
                    : current && (current.rainChance > 40)
                      ? (language === 'mr' ? '🧪 फवारणी पुढे ढकला (पाऊस अंदाज)' : language === 'hi' ? '🧪 छिड़काव रोकें (बारिश)' : 'Postpone Spraying')
                      : (language === 'mr' ? '🧪 कीटकनाशक फवारणीसाठी योग्य वेळ' : language === 'hi' ? '🧪 छिड़काव के लिए अनुकूल समय' : 'Good for Spraying')}
                </Text>
                <Text style={styles.recommendDesc}>
                  {current && current.windSpeed > 15
                    ? (language === 'mr'
                      ? `${registeredPlace?.village || registeredPlace?.district || 'भागात'} वाऱ्याचा वेग ${current.windSpeed} km/h आहे. औषध हवेत उडून वाया जाऊ नये म्हणून फवारणी थांबवा.`
                      : `तेज हवा (${current.windSpeed} km/h) के कारण छिड़काव टालें।`)
                    : (language === 'mr'
                      ? `सकाळी ९ वाजेपूर्वी किंवा संध्याकाळी शांत हवेत फवारणी करावी. चिकटद्रव्य (स्टीकर) अवश्य वापरावे.`
                      : `शांत हवा में सुबह या शाम के समय छिड़काव करें।`)}
                </Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Recommendation 3: Crop Care / पिकांची काळजी */}
            <TouchableOpacity style={styles.recommendCard} activeOpacity={0.8}>
              <View style={[styles.recommendIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Wind size={20} color="#0284c7" />
              </View>
              <View style={styles.recommendTextCol}>
                <Text style={[styles.recommendTitle, { color: '#0369a1' }]}>
                  {language === 'mr'
                    ? `🌾 ${crops.length > 0 ? crops[0].name : 'शेती'} पीक संरक्षण`
                    : language === 'hi'
                      ? `🌾 ${crops.length > 0 ? crops[0].name : 'फसल'} सुरक्षा`
                      : 'Crop Protection'}
                </Text>
                <Text style={styles.recommendDesc}>
                  {language === 'mr'
                    ? `${registeredPlace?.village || registeredPlace?.district || 'स्थानिक'} हवामानानुसार आर्द्रता ${current?.humidity || 42}% आहे. बुरशीजन्य रोगांचे नियमित निरीक्षण करा.`
                    : `${registeredPlace?.village || registeredPlace?.district || 'मौसम'} अनुसार नियमित फसल निरीक्षण करें।`}
                </Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  titleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    maxWidth: 160,
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
  },
  scrollWrap: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },

  /* 2. Hero Card */
  heroCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  heroBg: {
    width: '100%',
  },
  heroOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  heroLeftCol: {
    flex: 1,
  },
  heroDateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  heroTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  heroTempText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  heroConditionText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  heroMetaText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.92)',
    fontWeight: '500',
  },
  frostedStatsCard: {
    width: 154,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  statLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    flex: 1,
    marginLeft: 6,
  },
  statVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },

  /* 3. Filter Pills */
  filterPillsScroll: {
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#15803d',
  },
  filterPillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#475569',
  },

  /* 4. Hourly Forecast */
  hourlyScroll: {
    gap: 8,
    marginBottom: 18,
  },
  hourlyCard: {
    width: 66,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  hourlyCardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#16a34a',
  },
  hourlyCardInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  hourlyTimeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  hourlyTempText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  rainChanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  rainChanceText: {
    fontSize: 9.5,
    color: '#0284c7',
    fontWeight: '600',
  },

  /* 5. Key Details Section */
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  viewMoreLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  keyDetailsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailCardLabel: {
    fontSize: 9.5,
    color: '#64748b',
    textAlign: 'center',
  },
  detailCardVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0f172a',
    marginVertical: 2,
    textAlign: 'center',
  },
  detailCardSub: {
    fontSize: 9,
    color: '#94a3b8',
    textAlign: 'center',
  },

  /* 6. 7 Day Forecast */
  sevenDayScroll: {
    gap: 8,
  },
  dailyCard: {
    width: 78,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  dailyCardActive: {
    backgroundColor: '#ffffff',
    borderColor: '#16a34a',
  },
  dailyCardInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  dailyDayText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  dailyDateSub: {
    fontSize: 9,
    color: '#64748b',
  },
  dailyTempText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },

  /* 7. Recommendations */
  recommendationsCol: {
    gap: 10,
  },
  recommendCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.2,
      },
    }),
  },
  recommendIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendTextCol: {
    flex: 1,
  },
  recommendTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 3,
  },
  recommendDesc: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  registeredAdvisoryBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 14,
    marginVertical: 12,
  },
  advisoryBadgeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  registeredLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  registeredLocationBadgeText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803d',
  },
  imdLiveTag: {
    backgroundColor: '#15803d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  imdLiveTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  advisoryMainText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 19,
    marginTop: 4,
  },
  cropAdvisoryPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  cropAdvisoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
});
