import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';

export default function CropDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'expenses' | 'yield' | 'photos' | 'advisory'>('overview');

  // Language Modal state
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const subTabs = [
    { key: 'overview', label: t.tabOverview, icon: 'file-document-outline' as const },
    { key: 'activities', label: t.tabActivities, icon: 'checkbox-marked-outline' as const },
    { key: 'expenses', label: t.tabExpenses, icon: 'currency-inr' as const },
    { key: 'yield', label: t.tabYield, icon: 'chart-bar' as const },
    { key: 'photos', label: t.tabPhotos, icon: 'image-outline' as const },
    { key: 'advisory', label: t.tabAdvisory, icon: 'lightbulb-outline' as const },
  ];

  // Irrigation schedule data
  const irrigationList = [
    { date: '15 Jun 2026', amount: '40 mm', done: true },
    { date: '22 Jun 2026', amount: '40 mm', done: true },
    { date: '29 Jun 2026', amount: '40 mm', done: false },
    { date: '06 Jul 2026', amount: '40 mm', done: false },
  ];

  // Recent crop photos
  const recentPhotos = [
    {
      id: '1',
      date: '10 Jun 2026',
      caption: t.photoHealthyGrowth,
      uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
    },
    {
      id: '2',
      date: '20 Jun 2026',
      caption: t.photoGoodDev,
      uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=400&q=80',
    },
    {
      id: '3',
      date: '05 Jul 2026',
      caption: t.photoVegStage,
      uri: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
    },
    {
      id: '4',
      date: '12 Jul 2026',
      caption: t.photoUniformGrowth,
      uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80',
    },
  ];

  const languageOptions: { key: Language; label: string; sub: string }[] = [
    { key: 'en', label: 'English', sub: 'Default' },
    { key: 'mr', label: 'मराठी', sub: 'प्रादेशिक' },
    { key: 'hi', label: 'हिंदी', sub: 'राष्ट्रभाषा' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* 1. Header with Scenic Field & Soybean Backdrop */}
      <View style={styles.headerContainer}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
          style={styles.headerBg}
          resizeMode="cover">
          <View style={styles.headerOverlay}>
            <View style={[styles.headerContentRow, { paddingTop: insets.top > 0 ? insets.top + 6 : 26 }]}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>

              {/* Title & Subtitle */}
              <View style={styles.headerTitlesCol}>
                <Text style={styles.screenTitle}>{t.cropDetailsTitle}</Text>
                <Text style={styles.screenSub} numberOfLines={1}>{t.cropDetailsSub}</Text>
              </View>

              {/* Quick Language Switcher Button */}
              <TouchableOpacity
                style={styles.langPillBtn}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}>
                <Ionicons name="globe-outline" size={15} color="#16a34a" />
                <Text style={styles.langPillText}>
                  {language === 'en' ? 'EN' : language === 'mr' ? 'मराठी' : 'हिंदी'}
                </Text>
              </TouchableOpacity>

              {/* 3-Dots Menu Button */}
              <TouchableOpacity
                style={styles.menuCircleBtn}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}>
                <Ionicons name="ellipsis-vertical" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Crop Summary Card */}
        <View style={styles.cropSummaryCard}>
          {/* Crop Thumbnail */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&q=80' }}
            style={styles.cropThumb}
          />

          {/* Middle Info */}
          <View style={styles.cropInfoCol}>
            <Text style={styles.cropName}>{t.cropSoybean}</Text>
            <Text style={styles.cropVariety}>{t.varietyLabel}: {t.varietyJs335}</Text>

            {/* Stage Badge */}
            <View style={styles.stageBadge}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#16a34a" />
              <Text style={styles.stageBadgeText}>{t.stageVegetative}</Text>
            </View>
          </View>

          {/* Edit Crop Button */}
          <TouchableOpacity style={styles.editCropBtn} activeOpacity={0.8}>
            <Feather name="edit-2" size={13} color="#16a34a" />
            <Text style={styles.editCropText}>{t.editCrop}</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Four Metric Stats Chips (Row of 4) */}
        <View style={styles.metricsRow}>
          {/* Plot Area */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
              <MaterialCommunityIcons name="vector-square" size={16} color="#16a34a" />
            </View>
            <Text style={styles.metricLabel}>{t.plotArea}</Text>
            <Text style={styles.metricVal}>{t.plotAreaVal}</Text>
          </View>

          {/* Sowing Date */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#ede9fe' }]}>
              <Ionicons name="calendar-outline" size={16} color="#7c3aed" />
            </View>
            <Text style={styles.metricLabel}>{t.sowingDateLabel}</Text>
            <Text style={styles.metricVal}>{t.sowingDateVal}</Text>
          </View>

          {/* Expected Harvest */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
              <MaterialCommunityIcons name="sprout" size={16} color="#16a34a" />
            </View>
            <Text style={styles.metricLabel}>{t.expectedHarvest}</Text>
            <Text style={styles.metricVal}>{t.expectedHarvestVal}</Text>
          </View>

          {/* Days Left */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#d1fae5' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={16} color="#059669" />
            </View>
            <Text style={styles.metricLabel}>{t.daysLeft}</Text>
            <Text style={[styles.metricVal, { color: '#059669' }]}>{t.daysLeftVal}</Text>
          </View>
        </View>

        {/* 4. Growth Progress Card */}
        <View style={styles.growthCard}>
          <Text style={styles.growthTitle}>{t.growthProgress}</Text>

          <View style={styles.growthBodyRow}>
            {/* Left: Horizontal Stepper Timeline */}
            <View style={styles.horizontalStepper}>
              {/* Connecting line behind circles */}
              <View style={styles.stepperTrackLine} />

              <View style={styles.stepperNodesRow}>
                {/* Milestone 1: Vegetative (Active) */}
                <View style={styles.stepperNode}>
                  <View style={[styles.nodeIconCircle, styles.nodeCircleActive]}>
                    <MaterialCommunityIcons name="sprout" size={15} color="#ffffff" />
                  </View>
                  <Text style={[styles.nodeTitle, styles.nodeTitleActive]}>{t.stageVegetativeShort}</Text>
                  <Text style={styles.nodeDates}>1 Jun - 30 Jun</Text>
                </View>

                {/* Milestone 2: Flowering */}
                <View style={styles.stepperNode}>
                  <View style={[styles.nodeIconCircle, styles.nodeCircleInactive]}>
                    <MaterialCommunityIcons name="flower" size={15} color="#64748b" />
                  </View>
                  <Text style={styles.nodeTitle}>{t.stageFloweringShort}</Text>
                  <Text style={styles.nodeDates}>1 Jul - 15 Aug</Text>
                </View>

                {/* Milestone 3: Pod Formation */}
                <View style={styles.stepperNode}>
                  <View style={[styles.nodeIconCircle, styles.nodeCircleInactive]}>
                    <MaterialCommunityIcons name="seed" size={14} color="#64748b" />
                  </View>
                  <Text style={styles.nodeTitle}>{t.stagePodFormation}</Text>
                  <Text style={styles.nodeDates}>16 Aug - 10 Sep</Text>
                </View>

                {/* Milestone 4: Maturity */}
                <View style={styles.stepperNode}>
                  <View style={[styles.nodeIconCircle, styles.nodeCircleInactive]}>
                    <MaterialCommunityIcons name="barley" size={15} color="#64748b" />
                  </View>
                  <Text style={styles.nodeTitle}>{t.stageMaturity}</Text>
                  <Text style={styles.nodeDates}>11 Sep - 25 Sep</Text>
                </View>
              </View>
            </View>

            {/* Right: Progress Circular Gauge Box */}
            <View style={styles.gaugeBox}>
              <Text style={styles.gaugeTitle}>{t.progress}</Text>
              <View style={styles.gaugeSvgWrap}>
                <Svg width={64} height={64} viewBox="0 0 64 64">
                  {/* Background Track Circle */}
                  <Circle
                    cx={32}
                    cy={32}
                    r={25}
                    stroke="#e2e8f0"
                    strokeWidth={5.5}
                    fill="none"
                  />
                  {/* Progress Arc (40%) */}
                  <Circle
                    cx={32}
                    cy={32}
                    r={25}
                    stroke="#16a34a"
                    strokeWidth={5.5}
                    fill="none"
                    strokeDasharray={157.08}
                    strokeDashoffset={157.08 * (1 - 0.40)}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                  />
                </Svg>
                <View style={styles.gaugeTextOverlay}>
                  <Text style={styles.gaugePercent}>40%</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Horizontal Nav Sub-Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabsScroll}>
          {subTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[
                  styles.subTabPill,
                  isActive ? styles.subTabPillActive : styles.subTabPillInactive,
                ]}>
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={16}
                  color={isActive ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.subTabPillText,
                    isActive ? styles.subTabPillTextActive : styles.subTabPillTextInactive,
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 6. Two-Column Dashboard Widgets (Row 1) */}
        <View style={styles.twoWidgetsRow}>
          {/* Left Widget: Crop Health */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetHeaderLeft}>
                <MaterialCommunityIcons name="sprout" size={16} color="#16a34a" />
                <Text style={styles.widgetTitle}>{t.cropHealth}</Text>
              </View>
              <Ionicons name="help-circle-outline" size={16} color="#94a3b8" />
            </View>

            <Text style={styles.healthValue}>{t.healthGood}</Text>

            {/* Segmented Progress Bar (5 segments) */}
            <View style={styles.segmentedBar}>
              <View style={[styles.segment, styles.segmentFilled]} />
              <View style={[styles.segment, styles.segmentFilled]} />
              <View style={[styles.segment, styles.segmentFilled]} />
              <View style={[styles.segment, styles.segmentEmpty]} />
              <View style={[styles.segment, styles.segmentEmpty]} />
            </View>
          </View>

          {/* Right Widget: Weather */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <TouchableOpacity
                style={styles.widgetHeaderLeft}
                onPress={() => setShowLocationModal(true)}
                activeOpacity={0.8}>
                <Ionicons name="sunny" size={17} color="#f59e0b" />
                <Text style={styles.widgetTitle} numberOfLines={1}>{t.weatherLabel} <Text style={styles.locSub}>({location.displayLocation})</Text></Text>
              </TouchableOpacity>
            </View>

            <View style={styles.weatherBodyRow}>
              <View>
                <Text style={styles.weatherTemp}>32°C</Text>
                <Text style={styles.weatherCondition}>{t.clearSky}</Text>
              </View>

              <View style={styles.weatherMiniStatsCol}>
                <View style={styles.miniStatItem}>
                  <Ionicons name="water" size={11} color="#0284c7" />
                  <Text style={styles.miniStatVal}>0 mm</Text>
                </View>
                <View style={styles.miniStatItem}>
                  <Ionicons name="water-outline" size={11} color="#0284c7" />
                  <Text style={styles.miniStatVal}>45%</Text>
                </View>
                <View style={styles.miniStatItem}>
                  <MaterialCommunityIcons name="weather-windy" size={11} color="#64748b" />
                  <Text style={styles.miniStatVal}>12 km/h</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 7. Two-Column Dashboard Widgets (Row 2) */}
        <View style={styles.twoWidgetsRow}>
          {/* Left Widget: Soil Information */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetHeaderLeft}>
                <MaterialCommunityIcons name="image-filter-hdr" size={16} color="#854d0e" />
                <Text style={styles.widgetTitle}>{t.soilInformation}</Text>
              </View>
            </View>

            <View style={styles.soilGrid}>
              <View style={styles.soilTile}>
                <Text style={styles.soilLabel}>{t.soilPh}</Text>
                <Text style={[styles.soilVal, { color: '#16a34a' }]}>6.8</Text>
              </View>
              <View style={styles.soilTile}>
                <Text style={styles.soilLabel}>{t.nitrogen}</Text>
                <Text style={[styles.soilVal, { color: '#16a34a' }]}>{t.levelMedium}</Text>
              </View>
              <View style={styles.soilTile}>
                <Text style={styles.soilLabel}>{t.phosphorus}</Text>
                <Text style={[styles.soilVal, { color: '#16a34a' }]}>{t.levelHigh}</Text>
              </View>
              <View style={styles.soilTile}>
                <Text style={styles.soilLabel}>{t.potassium}</Text>
                <Text style={[styles.soilVal, { color: '#d97706' }]}>{t.levelMedium}</Text>
              </View>
            </View>
          </View>

          {/* Right Widget: Irrigation Schedule */}
          <View style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <View style={styles.widgetHeaderLeft}>
                <Ionicons name="water" size={16} color="#0284c7" />
                <Text style={styles.widgetTitle}>{t.irrigationSchedule}</Text>
              </View>
              <TouchableOpacity>
                <Text style={styles.viewAllLink}>{t.viewAll}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.irrigationListCol}>
              {irrigationList.map((item, idx) => (
                <View key={idx} style={styles.irrigationRow}>
                  <Ionicons name="calendar-outline" size={13} color="#64748b" />
                  <Text style={styles.irrigationDate}>{item.date}</Text>
                  <Text style={styles.irrigationAmount}>{item.amount}</Text>
                  {item.done ? (
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  ) : (
                    <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* 8. Recent Photos Section */}
        <View style={styles.photosSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.widgetHeaderLeft}>
              <Ionicons name="camera" size={16} color="#16a34a" />
              <Text style={styles.sectionTitle}>{t.recentPhotos}</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>{t.viewAll}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosScroll}>
            {recentPhotos.map((item) => (
              <View key={item.id} style={styles.photoCard}>
                <Image source={{ uri: item.uri }} style={styles.photoImg} />
                <Text style={styles.photoDate}>{item.date}</Text>
                <Text style={styles.photoCaption}>{item.caption}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* 9. Bottom 2 Action Cards */}
        <View style={styles.twoWidgetsRow}>
          {/* Card 1: Pest & Disease Status */}
          <TouchableOpacity style={styles.bottomCard} activeOpacity={0.8}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.widgetHeaderLeft}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#16a34a" />
                <Text style={styles.bottomCardTitle}>{t.pestDiseaseStatus}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#94a3b8" />
            </View>

            <View style={styles.statusBadgeRow}>
              <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
              <Text style={styles.statusBadgeText}>{t.noMajorIssues}</Text>
            </View>

            <Text style={styles.bottomCardDesc}>
              {t.pestDesc}
            </Text>
          </TouchableOpacity>

          {/* Card 2: Expert Advisory */}
          <TouchableOpacity style={styles.bottomCard} activeOpacity={0.8}>
            <View style={styles.bottomCardHeader}>
              <View style={styles.widgetHeaderLeft}>
                <View style={styles.bulbIconWrap}>
                  <Ionicons name="bulb" size={14} color="#f59e0b" />
                </View>
                <Text style={styles.bottomCardTitle}>{t.expertAdvisory}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#94a3b8" />
            </View>

            <Text style={styles.bottomCardDescAdvisory}>
              {t.advisoryDesc}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Ionicons name="globe-outline" size={20} color="#16a34a" />
                <Text style={styles.modalTitle}>{t.selectLanguageModalTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.radioGroup}>
              {languageOptions.map((item) => {
                const isSelected = language === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLanguage(item.key);
                      setShowLanguageModal(false);
                    }}
                    style={[
                      styles.langRadioCard,
                      isSelected && styles.langRadioCardActive,
                    ]}>
                    <View style={styles.langRadioLeft}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View>
                        <Text style={[styles.langRadioLabel, isSelected && styles.langRadioLabelActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.langRadioSub}>{item.sub}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
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
  },
  headerBg: {
    width: '100%',
  },
  headerOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.76)',
    paddingBottom: 14,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  backBtn: {
    padding: 6,
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
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  menuCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrollWrap: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  /* 2. Crop Summary Card */
  cropSummaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  cropThumb: {
    width: 68,
    height: 68,
    borderRadius: 12,
    marginRight: 12,
  },
  cropInfoCol: {
    flex: 1,
  },
  cropName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  cropVariety: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 6,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  stageBadgeText: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  editCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
    backgroundColor: '#ffffff',
  },
  editCropText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '700',
  },

  /* 3. Metrics Row */
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  /* 4. Growth Progress Card */
  growthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  growthTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 14,
  },
  growthBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  horizontalStepper: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  stepperTrackLine: {
    position: 'absolute',
    top: 17,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#e2e8f0',
    zIndex: 1,
  },
  stepperNodesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  stepperNode: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  nodeIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  nodeCircleActive: {
    backgroundColor: '#16a34a',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  nodeCircleInactive: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nodeTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 1,
  },
  nodeTitleActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  nodeDates: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  gaugeBox: {
    width: 82,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gaugeTitle: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 3,
  },
  gaugeSvgWrap: {
    position: 'relative',
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeTextOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugePercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* 5. Sub-Tabs */
  subTabsScroll: {
    gap: 8,
    marginBottom: 14,
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },
  subTabPillActive: {
    backgroundColor: '#16a34a',
  },
  subTabPillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subTabPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  subTabPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  subTabPillTextInactive: {
    color: '#64748b',
  },

  /* 6 & 7. Two-Column Dashboard Widgets */
  twoWidgetsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  widgetCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  widgetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  widgetTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  locSub: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: 'normal',
  },
  viewAllLink: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
  },
  healthValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#16a34a',
    marginBottom: 8,
  },
  segmentedBar: {
    flexDirection: 'row',
    gap: 4,
    height: 7,
    marginTop: 2,
  },
  segment: {
    flex: 1,
    borderRadius: 4,
  },
  segmentFilled: {
    backgroundColor: '#16a34a',
  },
  segmentEmpty: {
    backgroundColor: '#e2e8f0',
  },

  /* Weather Body */
  weatherBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherTemp: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
  },
  weatherCondition: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  weatherMiniStatsCol: {
    gap: 3,
  },
  miniStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniStatVal: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },

  /* Soil Grid */
  soilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  soilTile: {
    width: '47%',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 6,
  },
  soilLabel: {
    fontSize: 9.5,
    color: '#64748b',
  },
  soilVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },

  /* Irrigation List */
  irrigationListCol: {
    gap: 6,
  },
  irrigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  irrigationDate: {
    flex: 1,
    fontSize: 10.5,
    color: '#334155',
  },
  irrigationAmount: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },

  /* 8. Recent Photos */
  photosSection: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  photosScroll: {
    gap: 8,
  },
  photoCard: {
    width: 88,
  },
  photoImg: {
    width: 88,
    height: 70,
    borderRadius: 8,
    marginBottom: 4,
  },
  photoDate: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  photoCaption: {
    fontSize: 9,
    color: '#64748b',
  },

  /* 9. Bottom Cards */
  bottomCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bottomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bottomCardTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  bottomCardDesc: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
  bulbIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomCardDescAdvisory: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 14,
    marginTop: 2,
  },

  /* Language Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  radioGroup: {
    gap: 10,
  },
  langRadioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  langRadioCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  langRadioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#16a34a',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  langRadioLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  langRadioLabelActive: {
    color: '#16a34a',
  },
  langRadioSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
});
