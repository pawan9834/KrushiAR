import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';

export default function WeatherScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // Active Filter Pill
  const [activeFilter, setActiveFilter] = useState<'hourly' | '7days' | 'rainfall' | 'wind' | 'uv'>('hourly');

  // Selected hour index
  const [selectedHour, setSelectedHour] = useState(0);

  // Selected day index
  const [selectedDay, setSelectedDay] = useState(0);

  // Hourly forecast data
  const hourlyData = [
    { time: 'Now', temp: '32°', rain: '0%', icon: 'sunny', color: '#f59e0b' },
    { time: '10 AM', temp: '33°', rain: '0%', icon: 'sunny', color: '#f59e0b' },
    { time: '11 AM', temp: '34°', rain: '0%', icon: 'partly-sunny', color: '#f59e0b' },
    { time: '12 PM', temp: '35°', rain: '0%', icon: 'sunny', color: '#f59e0b' },
    { time: '1 PM', temp: '35°', rain: '0%', icon: 'partly-sunny', color: '#f59e0b' },
    { time: '2 PM', temp: '34°', rain: '10%', icon: 'cloud', color: '#94a3b8' },
    { time: '3 PM', temp: '33°', rain: '20%', icon: 'cloud', color: '#94a3b8' },
    { time: '4 PM', temp: '32°', rain: '30%', icon: 'cloud', color: '#94a3b8' },
  ];

  // 7-day forecast data
  const sevenDayData = [
    { day: 'Tue', date: '7 Oct', temp: '24° / 35°', rain: '0%', icon: 'sunny', color: '#f59e0b' },
    { day: 'Wed', date: '8 Oct', temp: '25° / 34°', rain: '10%', icon: 'sunny', color: '#f59e0b' },
    { day: 'Thu', date: '9 Oct', temp: '25° / 33°', rain: '20%', icon: 'partly-sunny', color: '#f59e0b' },
    { day: 'Fri', date: '10 Oct', temp: '24° / 31°', rain: '60%', icon: 'rainy', color: '#0284c7' },
    { day: 'Sat', date: '11 Oct', temp: '23° / 30°', rain: '70%', icon: 'rainy', color: '#0284c7' },
    { day: 'Sun', date: '12 Oct', temp: '23° / 31°', rain: '30%', icon: 'partly-sunny', color: '#f59e0b' },
    { day: 'Mon', date: '13 Oct', temp: '24° / 33°', rain: '10%', icon: 'sunny', color: '#f59e0b' },
  ];

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
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 6 : 24 }]}>
        <View style={styles.headerRow}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
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
            <Ionicons name="location-sharp" size={13} color="#16a34a" />
            <Text style={styles.locationText} numberOfLines={1}>
              {location.displayLocation}
            </Text>
            <Ionicons name="chevron-down" size={11} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Main Weather Hero Card */}
        <View style={styles.heroCardContainer}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
            style={styles.heroBg}
            resizeMode="cover">
            <View style={styles.heroOverlay}>
              {/* Left Column: Temp & Conditions */}
              <View style={styles.heroLeftCol}>
                <Text style={styles.heroDateText}>Today, 7 Oct 2026</Text>

                <View style={styles.heroTempRow}>
                  <Text style={styles.heroTempText}>32°C</Text>
                  <Ionicons name="sunny" size={38} color="#facc15" style={{ marginLeft: 6 }} />
                </View>

                <Text style={styles.heroConditionText}>Clear Sky</Text>

                <View style={styles.heroMetaRow}>
                  <Ionicons name="thermometer-outline" size={13} color="#ffffff" />
                  <Text style={styles.heroMetaText}>Feels like 34°C</Text>
                </View>

                <View style={styles.heroMetaRow}>
                  <Ionicons name="refresh-outline" size={13} color="#ffffff" />
                  <Text style={styles.heroMetaText}>Updated 15 minutes ago</Text>
                </View>
              </View>

              {/* Right Column: Frosted Glass Stats Card */}
              <View style={styles.frostedStatsCard}>
                <View style={styles.statLine}>
                  <Ionicons name="water-outline" size={15} color="#0284c7" />
                  <Text style={styles.statLabel}>Humidity</Text>
                  <Text style={styles.statVal}>45%</Text>
                </View>

                <View style={styles.statLine}>
                  <Ionicons name="rainy-outline" size={15} color="#0284c7" />
                  <Text style={styles.statLabel}>Rainfall</Text>
                  <Text style={styles.statVal}>0 mm</Text>
                </View>

                <View style={styles.statLine}>
                  <MaterialCommunityIcons name="weather-windy" size={15} color="#475569" />
                  <Text style={styles.statLabel}>Wind Speed</Text>
                  <Text style={styles.statVal}>12 km/h</Text>
                </View>

                <View style={styles.statLine}>
                  <Ionicons name="compass-outline" size={15} color="#475569" />
                  <Text style={styles.statLabel}>Wind Direction</Text>
                  <Text style={styles.statVal}>NE</Text>
                </View>

                <View style={styles.statLine}>
                  <Ionicons name="sunny-outline" size={15} color="#f59e0b" />
                  <Text style={styles.statLabel}>UV Index</Text>
                  <Text style={[styles.statVal, { color: '#dc2626', fontWeight: '800' }]}>7 (High)</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
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

                <Ionicons name={item.icon as any} size={22} color={item.color} style={{ marginVertical: 6 }} />

                <Text style={styles.hourlyTempText}>{item.temp}</Text>

                <View style={styles.rainChanceRow}>
                  <Ionicons name="water" size={10} color="#0284c7" />
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
                <Ionicons name="thermometer" size={18} color="#ef4444" />
              </View>
              <Text style={styles.detailCardLabel}>Temperature</Text>
              <Text style={styles.detailCardVal}>24° - 35°</Text>
              <Text style={styles.detailCardSub}>Min / Max</Text>
            </View>

            {/* Card 2: Humidity */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="water" size={18} color="#0284c7" />
              </View>
              <Text style={styles.detailCardLabel}>Humidity</Text>
              <Text style={styles.detailCardVal}>45%</Text>
              <Text style={styles.detailCardSub}>Moderate</Text>
            </View>

            {/* Card 3: Rainfall */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="rainy" size={18} color="#16a34a" />
              </View>
              <Text style={styles.detailCardLabel}>Rainfall</Text>
              <Text style={styles.detailCardVal}>0 mm</Text>
              <Text style={styles.detailCardSub}>Today</Text>
            </View>

            {/* Card 4: Wind Speed */}
            <View style={styles.detailCard}>
              <View style={[styles.detailIconWrap, { backgroundColor: '#f3e8ff' }]}>
                <MaterialCommunityIcons name="weather-windy" size={18} color="#9333ea" />
              </View>
              <Text style={styles.detailCardLabel}>Wind Speed</Text>
              <Text style={styles.detailCardVal}>12 km/h</Text>
              <Text style={styles.detailCardSub}>NE Direction</Text>
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

                  <Ionicons name={item.icon as any} size={22} color={item.color} style={{ marginVertical: 6 }} />

                  <Text style={styles.dailyTempText}>{item.temp}</Text>

                  <View style={styles.rainChanceRow}>
                    <Ionicons name="water" size={10} color="#0284c7" />
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
            {/* Recommendation 1 */}
            <TouchableOpacity style={styles.recommendCard} activeOpacity={0.8}>
              <View style={[styles.recommendIconWrap, { backgroundColor: '#dcfce7' }]}>
                <MaterialCommunityIcons name="sprout" size={20} color="#16a34a" />
              </View>
              <View style={styles.recommendTextCol}>
                <Text style={[styles.recommendTitle, { color: '#15803d' }]}>
                  {t.goodForIrrigation}
                </Text>
                <Text style={styles.recommendDesc}>{t.irrigationDesc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Recommendation 2 */}
            <TouchableOpacity style={styles.recommendCard} activeOpacity={0.8}>
              <View style={[styles.recommendIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="sunny" size={20} color="#d97706" />
              </View>
              <View style={styles.recommendTextCol}>
                <Text style={[styles.recommendTitle, { color: '#b45309' }]}>
                  {t.highTempAlert}
                </Text>
                <Text style={styles.recommendDesc}>{t.highTempDesc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Recommendation 3 */}
            <TouchableOpacity style={styles.recommendCard} activeOpacity={0.8}>
              <View style={[styles.recommendIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <MaterialCommunityIcons name="weather-windy" size={20} color="#0284c7" />
              </View>
              <View style={styles.recommendTextCol}>
                <Text style={[styles.recommendTitle, { color: '#0369a1' }]}>
                  {t.moderateWind}
                </Text>
                <Text style={styles.recommendDesc}>{t.moderateWindDesc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
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
});
