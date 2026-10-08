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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/context/LanguageContext';

export default function MyFarmScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();

  // Sub-tabs / Filters
  const [activeTab, setActiveTab] = useState<'crops' | 'land' | 'tasks' | 'expenses' | 'analytics'>('crops');
  // Selected plot on map
  const [selectedPlot, setSelectedPlot] = useState<string | null>(null);

  const filterTabs = [
    { key: 'crops', label: t.filterCrops, icon: 'sprout' as const, isMCI: true },
    { key: 'land', label: t.filterLand, icon: 'map-outline' as const, isMCI: false },
    { key: 'tasks', label: t.filterTasks, icon: 'checkbox-outline' as const, isMCI: false },
    { key: 'expenses', label: t.filterExpenses, icon: 'cash-outline' as const, isMCI: false },
    { key: 'analytics', label: t.filterAnalytics, icon: 'bar-chart-outline' as const, isMCI: false },
  ];

  const cropsList = [
    {
      id: '1',
      name: t.cropSoybean,
      variety: 'Var: JS 335',
      area: `1.5 ${t.acre}`,
      stage: t.stageVegetative,
      stageColor: '#16a34a',
      progress: '45%',
      progressColor: '#16a34a',
      daysLeft: `25 ${t.daysLeftText}`,
      sowingDate: '01 Jun 2026',
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
    },
    {
      id: '2',
      name: t.cropMaize,
      variety: 'Var: Pioneer 3401',
      area: `2 ${t.acre}`,
      stage: t.stageGrowing,
      stageColor: '#eab308',
      progress: '50%',
      progressColor: '#eab308',
      daysLeft: `30 ${t.daysLeftText}`,
      sowingDate: '15 Jun 2026',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80',
    },
    {
      id: '3',
      name: t.cropOnion,
      variety: 'Var: N-53',
      area: `1 ${t.acre}`,
      stage: t.stageLandPrep,
      stageColor: '#0284c7',
      progress: '20%',
      progressColor: '#0284c7',
      daysLeft: `60 ${t.daysLeftText}`,
      sowingDate: '20 Oct 2026',
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
    },
    {
      id: '4',
      name: t.cropCotton,
      variety: 'Var: RCH 659',
      area: `1 ${t.acre}`,
      stage: t.stageFlowering,
      stageColor: '#f59e0b',
      progress: '60%',
      progressColor: '#f59e0b',
      daysLeft: `45 ${t.daysLeftText}`,
      sowingDate: '10 Jun 2026',
      image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&q=80',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[styles.content, { paddingTop: 12, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>{t.screenTitleFarm}</Text>
          <Text style={styles.screenSub}>{t.screenSubFarm}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.locationChip}>
            <Ionicons name="location-sharp" size={13} color="#16a34a" />
            <Text style={styles.locationText}>{t.chopda}, {t.jalgaon} </Text>
            <Ionicons name="chevron-down" size={11} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={22} color="#1e293b" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Horizontal Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsScroll}>
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={[
                styles.filterPill,
                isActive ? styles.filterPillActive : styles.filterPillInactive,
              ]}>
              {tab.isMCI ? (
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? '#ffffff' : '#475569'}
                />
              ) : (
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? '#ffffff' : '#475569'}
                />
              )}
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

      {/* 3. Total Farm Area Card */}
      <View style={styles.areaCard}>
        <View style={styles.areaLeft}>
          <View style={styles.farmFieldThumb}>
            <MaterialCommunityIcons name="image-filter-hdr" size={24} color="#16a34a" />
          </View>
          <View style={styles.areaTextCol}>
            <Text style={styles.areaLabel}>{t.totalFarmArea}</Text>
            <View style={styles.areaValRow}>
              <Text style={styles.areaValue}>5.5 {t.acres} </Text>
              <Text style={styles.areaUnitHectare}>(2.23 Hectares)</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.editBtn}>
          <MaterialCommunityIcons name="pencil-outline" size={14} color="#16a34a" />
          <Text style={styles.editBtnText}>{t.edit}</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Satellite Map Plot Card */}
      <View style={styles.mapContainer}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
          style={styles.satelliteBg}
          imageStyle={{ borderRadius: 16 }}>
          {/* Overlay Grid Plots */}
          <View style={styles.plotsGrid}>
            {/* Top Left: Soybean */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedPlot('soybean')}
              style={[
                styles.plotPolygon,
                {
                  backgroundColor: 'rgba(22, 163, 74, 0.45)',
                  borderColor: '#22c55e',
                  borderWidth: selectedPlot === 'soybean' ? 3 : 1.5,
                },
              ]}>
              <MaterialCommunityIcons name="sprout" size={20} color="#ffffff" />
              <Text style={styles.plotCropName}>{t.cropSoybean}</Text>
              <Text style={styles.plotAreaSub}>1.5 {t.acre}</Text>
            </TouchableOpacity>

            {/* Top Right: Maize */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedPlot('maize')}
              style={[
                styles.plotPolygon,
                {
                  backgroundColor: 'rgba(234, 179, 8, 0.45)',
                  borderColor: '#facc15',
                  borderWidth: selectedPlot === 'maize' ? 3 : 1.5,
                },
              ]}>
              <MaterialCommunityIcons name="corn" size={20} color="#ffffff" />
              <Text style={styles.plotCropName}>{t.cropMaize}</Text>
              <Text style={styles.plotAreaSub}>2 {t.acre}</Text>
            </TouchableOpacity>

            {/* Bottom Left: Onion */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedPlot('onion')}
              style={[
                styles.plotPolygon,
                {
                  backgroundColor: 'rgba(59, 130, 246, 0.45)',
                  borderColor: '#60a5fa',
                  borderWidth: selectedPlot === 'onion' ? 3 : 1.5,
                },
              ]}>
              <MaterialCommunityIcons name="circle" size={18} color="#ffffff" />
              <Text style={styles.plotCropName}>{t.cropOnion}</Text>
              <Text style={styles.plotAreaSub}>1 {t.acre}</Text>
            </TouchableOpacity>

            {/* Bottom Right: Cotton */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedPlot('cotton')}
              style={[
                styles.plotPolygon,
                {
                  backgroundColor: 'rgba(239, 68, 68, 0.45)',
                  borderColor: '#f87171',
                  borderWidth: selectedPlot === 'cotton' ? 3 : 1.5,
                },
              ]}>
              <MaterialCommunityIcons name="cloud" size={18} color="#ffffff" />
              <Text style={styles.plotCropName}>{t.cropCotton}</Text>
              <Text style={styles.plotAreaSub}>1 {t.acre}</Text>
            </TouchableOpacity>
          </View>

          {/* Map Controls */}
          <TouchableOpacity style={styles.mapAddPlotBtn}>
            <Ionicons name="add" size={16} color="#16a34a" />
            <Text style={styles.mapAddPlotText}>{t.addCrop}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mapCompassBtn}>
            <Ionicons name="locate" size={18} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.mapZoomGroup}>
            <TouchableOpacity style={styles.zoomBtn}>
              <Ionicons name="add" size={16} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity style={styles.zoomBtn}>
              <Ionicons name="remove" size={16} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* 5. "My Crops (4)" Section Header */}
      <View style={styles.cropsHeaderRow}>
        <Text style={styles.cropsSectionTitle}>{t.cropsCount}</Text>
        <TouchableOpacity style={styles.addCropBtn}>
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.addCropBtnText}>{t.addCrop}</Text>
        </TouchableOpacity>
      </View>

      {/* 6. Crop Cards List */}
      <View style={styles.cropsListCol}>
        {cropsList.map((crop) => (
          <TouchableOpacity
            key={crop.id}
            activeOpacity={0.8}
            style={styles.cropDetailCard}>
            {/* Left Crop Photo */}
            <Image source={{ uri: crop.image }} style={styles.cropPhoto} />

            {/* Center Info */}
            <View style={styles.cropCenterInfo}>
              <Text style={styles.cropCardName}>{crop.name}</Text>
              <Text style={styles.cropCardVar}>
                {crop.area} • {crop.variety}
              </Text>
              <Text style={[styles.cropCardStage, { color: crop.stageColor }]}>
                {crop.stage}
              </Text>
              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: crop.progress as any, backgroundColor: crop.progressColor },
                    ]}
                  />
                </View>
                <Text style={styles.daysLeftText}>{crop.daysLeft}</Text>
              </View>
            </View>

            {/* Right Sowing Date */}
            <View style={styles.cropRightCol}>
              <View style={styles.sowingDateRow}>
                <Ionicons name="calendar-outline" size={14} color="#64748b" />
                <View style={{ marginLeft: 4 }}>
                  <Text style={styles.sowingLabel}>{t.sowingDate}</Text>
                  <Text style={styles.sowingDateVal}>{crop.sowingDate}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* 7. Three Bottom Service Cards */}
      <View style={styles.servicesRow}>
        {/* Soil Health */}
        <TouchableOpacity style={styles.serviceItemCard}>
          <View style={[styles.serviceIconTile, { backgroundColor: '#e8f5e9' }]}>
            <MaterialCommunityIcons name="sprout" size={20} color="#16a34a" />
          </View>
          <View style={styles.serviceItemTextCol}>
            <Text style={styles.serviceItemTitle}>{t.soilHealth}</Text>
            <Text style={styles.serviceItemSub}>{t.soilHealthSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        {/* Irrigation */}
        <TouchableOpacity style={styles.serviceItemCard}>
          <View style={[styles.serviceIconTile, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="water" size={20} color="#0284c7" />
          </View>
          <View style={styles.serviceItemTextCol}>
            <Text style={styles.serviceItemTitle}>{t.irrigation}</Text>
            <Text style={styles.serviceItemSub}>{t.irrigationSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        {/* Fertilizer Plan */}
        <TouchableOpacity style={styles.serviceItemCard}>
          <View style={[styles.serviceIconTile, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="sack" size={20} color="#d97706" />
          </View>
          <View style={styles.serviceItemTextCol}>
            <Text style={styles.serviceItemTitle}>{t.fertilizerPlan}</Text>
            <Text style={styles.serviceItemSub}>{t.fertilizerPlanSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>
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

  /* Filter Pills */
  filterPillsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#16a34a',
  },
  filterPillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  filterPillTextInactive: {
    color: '#475569',
  },

  /* Total Farm Area Card */
  areaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  areaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  farmFieldThumb: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaTextCol: {},
  areaLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  areaValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  areaValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  areaUnitHectare: {
    fontSize: 11.5,
    color: '#64748b',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* Satellite Map */
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    height: 220,
  },
  satelliteBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plotsGrid: {
    width: '88%',
    height: '75%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plotPolygon: {
    width: '48%',
    height: '47%',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  plotCropName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  plotAreaSub: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.9,
  },
  mapAddPlotBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
    elevation: 3,
  },
  mapAddPlotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  mapCompassBtn: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  mapZoomGroup: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
  },
  zoomBtn: {
    width: 32,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },

  /* My Crops Section Header */
  cropsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropsSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  cropsCount: {
    color: '#64748b',
    fontWeight: '600',
  },
  addCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addCropBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Crop Cards List */
  cropsListCol: {
    gap: 10,
    marginBottom: 16,
  },
  cropDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  cropPhoto: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 10,
  },
  cropCenterInfo: {
    flex: 1,
    paddingRight: 6,
  },
  cropCardName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  cropCardVar: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  cropCardStage: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  daysLeftText: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },
  cropRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 54,
  },
  sowingDateRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sowingLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  sowingDateVal: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 1,
  },

  /* Services Row */
  servicesRow: {
    gap: 8,
    marginBottom: 10,
  },
  serviceItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceItemTextCol: {
    flex: 1,
  },
  serviceItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  serviceItemSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
});
