import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();

  // Interactive Farm Tasks State (persists completion state while translating title)
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(['1']);

  const farmTasks = [
    { id: '1', title: t.task1 },
    { id: '2', title: t.task2 },
    { id: '3', title: t.task3 },
    { id: '4', title: t.task4 },
  ];

  const toggleTask = (id: string) => {
    setCompletedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: 12, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* 1. App Header */}
      <View style={styles.headerRow}>
        <View style={styles.brandCol}>
          <View style={styles.logoRow}>
            <MaterialCommunityIcons name="sprout" size={28} color="#16a34a" />
            <Text style={styles.brandTitle}>KrushiAR</Text>
          </View>
          <Text style={styles.brandTagline}>{t.tagline}</Text>
        </View>

        <View style={styles.headerRightRow}>
          {/* Location Chip */}
          <TouchableOpacity style={styles.locationChip}>
            <Ionicons name="location-sharp" size={14} color="#16a34a" />
            <View style={{ marginLeft: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.locationCity}>{t.chopda},</Text>
                <Ionicons name="chevron-down" size={11} color="#0f172a" style={{ marginLeft: 2 }} />
              </View>
              <Text style={styles.locationDistrict}>{t.jalgaon}</Text>
            </View>
          </TouchableOpacity>

          {/* Notification Bell */}
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1e293b" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=200&q=80' }}
              style={styles.avatarImg}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTextCol}>
          <Text style={styles.heroTitle}>{t.heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{t.heroSub}</Text>
        </View>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&q=80' }}
          style={styles.heroFarmerImg}
        />
      </View>

      {/* 3. Weather Card */}
      <View style={styles.weatherCard}>
        <View style={styles.weatherLeft}>
          <View style={styles.weatherIconTemp}>
            <Ionicons name="sunny" size={28} color="#f59e0b" />
            <Text style={styles.weatherTemp}>32°C</Text>
          </View>
          <Text style={styles.weatherCondition}>{t.partlyCloudy}</Text>
        </View>

        <View style={styles.weatherMetricsRow}>
          <View style={styles.weatherMetric}>
            <View style={styles.metricValRow}>
              <Ionicons name="water" size={12} color="#0284c7" />
              <Text style={styles.metricValText}> 10%</Text>
            </View>
            <Text style={styles.metricLabel}>{t.rainChance}</Text>
          </View>

          <View style={styles.weatherMetric}>
            <View style={styles.metricValRow}>
              <Ionicons name="water-outline" size={12} color="#0284c7" />
              <Text style={styles.metricValText}> 58%</Text>
            </View>
            <Text style={styles.metricLabel}>{t.humidity}</Text>
          </View>

          <View style={styles.weatherMetric}>
            <View style={styles.metricValRow}>
              <MaterialCommunityIcons name="weather-windy" size={12} color="#0284c7" />
              <Text style={styles.metricValText}> 12 km/h</Text>
            </View>
            <Text style={styles.metricLabel}>{t.windSpeed}</Text>
          </View>

          <View style={styles.weatherLocation}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="location-sharp" size={11} color="#0f172a" />
              <Text style={styles.weatherLocName}> {t.chopda}</Text>
            </View>
            <Text style={styles.weatherLocSub}>{t.jalgaon}, MH</Text>
            <Text style={styles.weatherDate}>Tue, 7 Oct 2026</Text>
          </View>
        </View>
      </View>

      {/* 4. Quick Action Buttons Grid (4 items) */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#e8f5e9' }]}
          onPress={() => router.push('/(tabs)/scan')}>
          <View style={[styles.quickIconWrap, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="camera" size={22} color="#16a34a" />
          </View>
          <Text style={styles.quickLabel}>{t.arScanCrops}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#e0f2fe' }]}>
          <View style={[styles.quickIconWrap, { backgroundColor: '#bae6fd' }]}>
            <Ionicons name="water" size={22} color="#0284c7" />
          </View>
          <Text style={styles.quickLabel}>{t.irrigationGuide}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.quickCard, { backgroundColor: '#f0fdf4' }]}>
          <View style={[styles.quickIconWrap, { backgroundColor: '#bbf7d0' }]}>
            <MaterialCommunityIcons name="sprout" size={22} color="#16a34a" />
          </View>
          <Text style={styles.quickLabel}>{t.fertilizerRecommend}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickCard, { backgroundColor: '#fff8e1' }]}
          onPress={() => router.push('/(tabs)/market')}>
          <View style={[styles.quickIconWrap, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={22} color="#d97706" />
          </View>
          <Text style={styles.quickLabel}>{t.marketPrices}</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Side-by-Side: Today's Farm Tasks & Market Prices */}
      <View style={styles.splitRow}>
        {/* Left Card: Tasks */}
        <View style={styles.splitCard}>
          <View style={styles.splitHeader}>
            <Text style={styles.splitTitle}>{t.todaysTasks}</Text>
            <TouchableOpacity>
              <Text style={styles.splitSeeAll}>{t.seeAll}</Text>
            </TouchableOpacity>
          </View>

          {farmTasks.map((task) => {
            const isDone = completedTaskIds.includes(task.id);
            return (
              <TouchableOpacity
                key={task.id}
                style={styles.taskCheckRow}
                onPress={() => toggleTask(task.id)}>
                <Ionicons
                  name={isDone ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={isDone ? '#16a34a' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.taskItemText,
                    isDone && { textDecorationLine: 'line-through', color: '#94a3b8' },
                  ]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Right Card: Market Prices */}
        <View style={styles.splitCard}>
          <View style={styles.splitHeader}>
            <Text style={styles.splitTitle}>{t.marketPrices.replace('\n', ' ')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/market')}>
              <Text style={styles.splitSeeAll}>{t.seeAll}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.mandiSub}>{t.mandiDistrictSub}</Text>

          {/* Soybean */}
          <View style={styles.mandiItemRow}>
            <View style={styles.mandiLeftCol}>
              <View style={[styles.mandiIconDot, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="seed" size={13} color="#d97706" />
              </View>
              <Text style={styles.mandiCropText}>{t.cropSoybean}</Text>
            </View>
            <View style={styles.mandiRightCol}>
              <Text style={styles.mandiPriceText}>₹ 4,800</Text>
              <Text style={styles.mandiRateGreen}>↑ 2%</Text>
            </View>
          </View>

          {/* Cotton */}
          <View style={styles.mandiItemRow}>
            <View style={styles.mandiLeftCol}>
              <View style={[styles.mandiIconDot, { backgroundColor: '#f1f5f9' }]}>
                <MaterialCommunityIcons name="cloud" size={13} color="#64748b" />
              </View>
              <Text style={styles.mandiCropText}>{t.cropCotton}</Text>
            </View>
            <View style={styles.mandiRightCol}>
              <Text style={styles.mandiPriceText}>₹ 7,200</Text>
              <Text style={styles.mandiRateRed}>↓ 1%</Text>
            </View>
          </View>

          {/* Maize */}
          <View style={styles.mandiItemRow}>
            <View style={styles.mandiLeftCol}>
              <View style={[styles.mandiIconDot, { backgroundColor: '#fef9c3' }]}>
                <MaterialCommunityIcons name="corn" size={13} color="#ca8a04" />
              </View>
              <Text style={styles.mandiCropText}>{t.cropMaize}</Text>
            </View>
            <View style={styles.mandiRightCol}>
              <Text style={styles.mandiPriceText}>₹ 2,150</Text>
              <Text style={styles.mandiRateGreen}>↑ 3%</Text>
            </View>
          </View>

          {/* Onion */}
          <View style={styles.mandiItemRow}>
            <View style={styles.mandiLeftCol}>
              <View style={[styles.mandiIconDot, { backgroundColor: '#fee2e2' }]}>
                <MaterialCommunityIcons name="circle" size={13} color="#dc2626" />
              </View>
              <Text style={styles.mandiCropText}>{t.cropOnion}</Text>
            </View>
            <View style={styles.mandiRightCol}>
              <Text style={styles.mandiPriceText}>₹ 1,850</Text>
              <Text style={styles.mandiRateGreen}>↑ 5%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 6. "My Crops" Section */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionHeading}>{t.myCrops}</Text>
        <TouchableOpacity
          style={styles.seeAllBtn}
          onPress={() => router.push('/(tabs)/farm')}>
          <Text style={styles.seeAllText}>{t.seeAll}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cropsScroll}>
        {/* Crop 1: Soybean */}
        <View style={styles.cropCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80' }}
            style={styles.cropImg}
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropTitle}>{t.cropSoybean}</Text>
            <Text style={styles.cropStage}>{t.stageVegetative}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '40%', backgroundColor: '#16a34a' }]} />
            </View>
            <Text style={styles.cropDays}>25 {t.daysLeftText}</Text>
          </View>
        </View>

        {/* Crop 2: Cotton */}
        <View style={styles.cropCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&q=80' }}
            style={styles.cropImg}
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropTitle}>{t.cropCotton}</Text>
            <Text style={styles.cropStage}>{t.stageFlowering}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '65%', backgroundColor: '#f59e0b' }]} />
            </View>
            <Text style={styles.cropDays}>45 {t.daysLeftText}</Text>
          </View>
        </View>

        {/* Crop 3: Maize */}
        <View style={styles.cropCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80' }}
            style={styles.cropImg}
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropTitle}>{t.cropMaize}</Text>
            <Text style={styles.cropStage}>{t.stageGrowing}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '50%', backgroundColor: '#16a34a' }]} />
            </View>
            <Text style={styles.cropDays}>30 {t.daysLeftText}</Text>
          </View>
        </View>

        {/* Crop 4: Onion */}
        <View style={styles.cropCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80' }}
            style={styles.cropImg}
          />
          <View style={styles.cropInfo}>
            <Text style={styles.cropTitle}>{t.cropOnion}</Text>
            <Text style={styles.cropStage}>{t.stageLandPrep}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '20%', backgroundColor: '#16a34a' }]} />
            </View>
            <Text style={styles.cropDays}>60 {t.daysLeftText}</Text>
          </View>
        </View>

        {/* Add Crop Card */}
        <TouchableOpacity
          style={styles.addCropCard}
          onPress={() => router.push('/(tabs)/farm')}>
          <View style={styles.addCircle}>
            <Ionicons name="add" size={26} color="#ffffff" />
          </View>
          <Text style={styles.addCropLabel}>{t.addCrop}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 7. Featured "AR Farm Scan" Card */}
      <View style={styles.arBannerCard}>
        <View style={styles.arLeftContent}>
          <View style={styles.arBadge}>
            <MaterialCommunityIcons name="line-scan" size={18} color="#ffffff" />
            <Text style={styles.arBadgeText}>AR</Text>
          </View>
          <Text style={styles.arHeading}>{t.arFarmScan}</Text>
          <Text style={styles.arDesc}>{t.arFarmScanDesc}</Text>
          <TouchableOpacity
            style={styles.arStartBtn}
            onPress={() => router.push('/(tabs)/scan')}>
            <Text style={styles.arStartBtnText}>{t.startScanning}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.arScanGraphicWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&q=80' }}
            style={styles.arPreviewImg}
          />
          <View style={styles.arViewBox}>
            <Text style={styles.arTag}>AR</Text>
          </View>
        </View>
      </View>

      {/* 8. Government Schemes & Agri Products Cards */}
      <View style={styles.twoCardsRow}>
        <TouchableOpacity style={[styles.bannerCardItem, { backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }]}>
          <View style={[styles.bannerCardIconWrap, { backgroundColor: '#ffe4e6' }]}>
            <Ionicons name="business" size={20} color="#e11d48" />
          </View>
          <View style={styles.bannerCardTextWrap}>
            <Text style={styles.bannerCardTitle}>{t.govtSchemes}</Text>
            <Text style={styles.bannerCardDesc}>{t.govtSchemesSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#e11d48" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bannerCardItem, { backgroundColor: '#fffbeb', borderColor: '#fef3c7' }]}>
          <View style={[styles.bannerCardIconWrap, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="cart" size={20} color="#f59e0b" />
          </View>
          <View style={styles.bannerCardTextWrap}>
            <Text style={styles.bannerCardTitle}>{t.agriProducts}</Text>
            <Text style={styles.bannerCardDesc}>{t.agriProductsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
        </TouchableOpacity>
      </View>

      {/* 9. Quick Services Row */}
      <View style={styles.tripleServicesRow}>
        <TouchableOpacity style={[styles.servicePillCard, { backgroundColor: '#eff6ff', borderColor: '#dbeafe' }]}>
          <View style={[styles.serviceIconWrap, { backgroundColor: '#bfdbfe' }]}>
            <Ionicons name="bar-chart" size={18} color="#2563eb" />
          </View>
          <Text style={styles.servicePillTitle}>{t.farmAnalytics}</Text>
          <Text style={styles.servicePillDesc}>{t.farmAnalyticsSub}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.servicePillCard, { backgroundColor: '#f0f9ff', borderColor: '#e0f2fe' }]}>
          <View style={[styles.serviceIconWrap, { backgroundColor: '#bae6fd' }]}>
            <Ionicons name="rainy" size={18} color="#0284c7" />
          </View>
          <Text style={styles.servicePillTitle}>{t.weatherAdvisory}</Text>
          <Text style={styles.servicePillDesc}>{t.weatherAdvisorySub}</Text>
        </TouchableOpacity>
      </View>

      {/* 10. Bottom Promo Banner */}
      <View style={styles.bottomPromoCard}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&q=80' }}
          style={styles.promoFarmerThumb}
        />
        <View style={styles.promoTextWrap}>
          <View style={styles.promoHeadRow}>
            <Ionicons name="bulb" size={16} color="#f59e0b" />
            <Text style={styles.promoTitle}> {t.promoTitle}</Text>
          </View>
          <Text style={styles.promoDesc}>{t.promoDesc}</Text>
        </View>
        <TouchableOpacity
          style={styles.promoBtn}
          onPress={() => router.push('/(tabs)/scan')}>
          <Text style={styles.promoBtnText}>{t.tryNow}</Text>
        </TouchableOpacity>
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
  /* Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandCol: {
    justifyContent: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 1,
  },
  headerRightRow: {
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
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationCity: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  locationDistrict: {
    fontSize: 9,
    color: '#64748b',
  },
  bellBtn: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },

  /* Hero Banner */
  heroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 27,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 17,
    marginTop: 6,
  },
  heroFarmerImg: {
    width: 100,
    height: 90,
    borderRadius: 12,
  },

  /* Weather Card */
  weatherCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  weatherLeft: {
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  weatherIconTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weatherTemp: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  weatherCondition: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  weatherMetricsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 6,
  },
  weatherMetric: {
    alignItems: 'center',
  },
  metricValRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },
  weatherLocation: {
    alignItems: 'flex-end',
  },
  weatherLocName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  weatherLocSub: {
    fontSize: 9,
    color: '#64748b',
  },
  weatherDate: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },

  /* Quick Actions (6 items) */
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 6,
  },
  quickCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 13,
  },

  /* Section Title */
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* Crops Horizontal */
  cropsScroll: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 16,
  },
  cropCard: {
    width: 120,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cropImg: {
    width: '100%',
    height: 70,
  },
  cropInfo: {
    padding: 8,
  },
  cropTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  cropStage: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 1,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  cropDays: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
  },
  addCropCard: {
    width: 100,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  addCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addCropLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* AR Featured Banner */
  arBannerCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    overflow: 'hidden',
  },
  arLeftContent: {
    flex: 1,
    paddingRight: 10,
  },
  arBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  arBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  arHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  arDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 16,
    marginBottom: 12,
  },
  arStartBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  arStartBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  arScanGraphicWrap: {
    width: 85,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  arPreviewImg: {
    width: '100%',
    height: '100%',
  },
  arViewBox: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  arTag: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  /* Split Tasks & Mandi Row */
  splitRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  splitCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  splitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  splitTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  splitSeeAll: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  mandiSub: {
    fontSize: 9.5,
    color: '#64748b',
    marginBottom: 8,
  },
  taskCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
  },
  taskItemText: {
    fontSize: 11,
    color: '#1e293b',
    flex: 1,
    lineHeight: 15,
  },
  mandiItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4.5,
  },
  mandiLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mandiIconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandiCropText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1e293b',
  },
  mandiRightCol: {
    alignItems: 'flex-end',
  },
  mandiPriceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  mandiRateGreen: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#16a34a',
  },
  mandiRateRed: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#dc2626',
  },

  /* Two Feature Banner Cards */
  twoCardsRow: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 14,
  },
  bannerCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerCardTextWrap: {
    flex: 1,
  },
  bannerCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  bannerCardDesc: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },

  /* Triple Service Pills */
  tripleServicesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  servicePillCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  serviceIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  servicePillTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 2,
  },
  servicePillDesc: {
    fontSize: 8.5,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 11,
  },

  /* Bottom Promo */
  bottomPromoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  promoFarmerThumb: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  promoTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  promoHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  promoDesc: {
    fontSize: 9.5,
    color: '#64748b',
    lineHeight: 13,
    marginTop: 2,
  },
  promoBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  promoBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
