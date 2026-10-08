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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { router } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';

export default function MarketScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { t } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // Active filter pill
  const [activePill, setActivePill] = useState<'prices' | 'mandis' | 'trends' | 'trade'>('prices');
  // Selected crop for trend chart
  const [selectedTrendCrop, setSelectedTrendCrop] = useState('Soybean');
  const [timeRange, setTimeRange] = useState('Last 3 Months');

  const filterTabs = [
    { key: 'prices', label: t.filterCropPrices, icon: 'bar-chart' as const, isMCI: false },
    { key: 'mandis', label: t.filterNearbyMandis, icon: 'location-outline' as const, isMCI: false },
    { key: 'trends', label: t.filterPriceTrends, icon: 'trending-up' as const, isMCI: false },
    { key: 'trade', label: t.filterTrade, icon: 'cart-outline' as const, isMCI: false },
  ];

  const popularCrops = [
    {
      id: '1',
      name: t.cropSoybean,
      price: '₹ 4,800',
      change: '↑ 2%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&q=80',
    },
    {
      id: '2',
      name: t.cropCotton,
      price: '₹ 7,200',
      change: '↓ 1%',
      isUp: false,
      image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=300&q=80',
    },
    {
      id: '3',
      name: t.cropMaize,
      price: '₹ 2,150',
      change: '↑ 3%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=80',
    },
    {
      id: '4',
      name: t.cropOnion,
      price: '₹ 1,850',
      change: '↑ 5%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&q=80',
    },
    {
      id: '5',
      name: t.cropWheat,
      price: '₹ 2,300',
      change: '↑ 1%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80',
    },
  ];

  const mandiRows = [
    {
      crop: t.cropSoybean,
      modal: '4,800',
      min: '4,500',
      max: '5,050',
      change: '↑ 2%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=200&q=80',
    },
    {
      crop: t.cropCotton,
      modal: '7,200',
      min: '6,800',
      max: '7,650',
      change: '↓ 1%',
      isUp: false,
      image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=200&q=80',
    },
    {
      crop: t.cropMaize,
      modal: '2,150',
      min: '1,950',
      max: '2,350',
      change: '↑ 3%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=200&q=80',
    },
    {
      crop: t.cropOnion,
      modal: '1,850',
      min: '1,600',
      max: '2,100',
      change: '↑ 5%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=200&q=80',
    },
    {
      crop: t.cropWheat,
      modal: '2,300',
      min: '2,100',
      max: '2,550',
      change: '↑ 1%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=200&q=80',
    },
    {
      crop: t.cropChana,
      modal: '5,200',
      min: '4,800',
      max: '5,700',
      change: '↑ 4%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=200&q=80',
    },
    {
      crop: t.cropTur,
      modal: '7,100',
      min: '6,500',
      max: '7,800',
      change: '↑ 3%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[styles.content, { paddingTop: 12, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>{t.screenTitleMarket}</Text>
          <Text style={styles.screenSub}>{t.screenSubMarket}</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.8}>
            <Ionicons name="location-sharp" size={13} color="#16a34a" />
            <Text style={styles.locationText}>{location.displayLocation} </Text>
            <Ionicons name="chevron-down" size={11} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={22} color="#1e293b" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Hero Banner: Get Live Market Prices */}
      <View style={styles.heroBanner}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80' }}
          style={styles.heroBannerBg}
          imageStyle={{ borderRadius: 16 }}>
          <View style={styles.heroOverlay}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>{t.getLivePrices}</Text>
              <Text style={styles.heroSub}>{t.getLivePricesSub}</Text>
            </View>
            <TouchableOpacity style={styles.nearbyMandisBtn}>
              <Text style={styles.nearbyMandisText}>{t.nearbyMandisBtn}</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      {/* 3. Horizontal Filter Navigation Pills */}
      <View style={styles.filterPillsRow}>
        {filterTabs.map((tab) => {
          const isActive = activePill === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActivePill(tab.key as any)}
              style={[
                styles.filterPill,
                isActive ? styles.filterPillActive : styles.filterPillInactive,
              ]}>
              <Ionicons
                name={tab.icon}
                size={15}
                color={isActive ? '#ffffff' : '#475569'}
              />
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
      </View>

      {/* 4. Popular Crops Horizontal Section */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionHeading}>{t.popularCrops}</Text>
        <TouchableOpacity style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>{t.seeAll}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularCropsScroll}>
        {popularCrops.map((crop) => (
          <TouchableOpacity key={crop.id} style={styles.popularCropCard}>
            <Image source={{ uri: crop.image }} style={styles.popularCropImg} />
            <View style={styles.popularCropInfo}>
              <Text style={styles.popularCropName}>{crop.name}</Text>
              <View style={styles.popularPriceRow}>
                <Text style={styles.popularCropPrice}>{crop.price}</Text>
                <Text style={[styles.popularCropChange, { color: crop.isUp ? '#16a34a' : '#dc2626' }]}>
                  {crop.change}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 5. Mandi Prices Table */}
      <View style={styles.mandiHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={styles.sectionHeading}>{t.mandiPricesTitle}</Text>
          <Text style={styles.districtSub}>({t.jalgaon} District)</Text>
        </View>

        <TouchableOpacity style={styles.districtDropdown}>
          <Text style={styles.districtDropdownText}>{t.jalgaon} District </Text>
          <Ionicons name="chevron-down" size={11} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Table Container */}
      <View style={styles.tableCard}>
        {/* Table Columns Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableColHead, { flex: 1.4 }]}>{t.tableCrop}</Text>
          <Text style={[styles.tableColHead, { flex: 1.1, textAlign: 'center' }]}>
            {t.tableModal}
          </Text>
          <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>
            {t.tableMin}
          </Text>
          <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>
            {t.tableMax}
          </Text>
          <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>
            {t.tableChange}
          </Text>
          <Text style={[styles.tableColHead, { flex: 1.1, textAlign: 'center' }]}>{t.tableAction}</Text>
        </View>

        {/* Table Rows */}
        {mandiRows.map((row, idx) => (
          <View
            key={idx}
            style={[
              styles.tableRow,
              idx === mandiRows.length - 1 && { borderBottomWidth: 0 },
            ]}>
            {/* Crop Info */}
            <View style={[styles.tableCropCol, { flex: 1.4 }]}>
              <Image source={{ uri: row.image }} style={styles.tableCropThumb} />
              <Text style={styles.tableCropName} numberOfLines={1}>
                {row.crop}
              </Text>
            </View>

            {/* Modal Price */}
            <Text style={[styles.tableCellBold, { flex: 1.1 }]}>{row.modal}</Text>

            {/* Min Price */}
            <Text style={[styles.tableCellRegular, { flex: 1 }]}>{row.min}</Text>

            {/* Max Price */}
            <Text style={[styles.tableCellRegular, { flex: 1 }]}>{row.max}</Text>

            {/* Change */}
            <Text
              style={[
                styles.tableCellChange,
                { flex: 1, color: row.isUp ? '#16a34a' : '#dc2626' },
              ]}>
              {row.change}
            </Text>

            {/* Details Button */}
            <View style={[styles.tableBtnCol, { flex: 1.1 }]}>
              <TouchableOpacity style={styles.detailsBtn}>
                <Text style={styles.detailsBtnText}>{t.details}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* 6. Price Trend Section */}
      <View style={styles.trendHeaderRow}>
        <Text style={styles.sectionHeading}>{t.priceTrendTitle}</Text>
        <View style={styles.trendDropdownsRow}>
          <TouchableOpacity style={styles.smallDropdown}>
            <Text style={styles.smallDropdownText}>{selectedTrendCrop} </Text>
            <Ionicons name="chevron-down" size={10} color="#0f172a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallDropdown}>
            <Text style={styles.smallDropdownText}>{timeRange} </Text>
            <Ionicons name="chevron-down" size={10} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Trend Chart Card */}
      <View style={styles.trendCard}>
        {/* Left: SVG Chart */}
        <View style={styles.chartCol}>
          <View style={styles.chartSvgWrap}>
            <Svg width="100%" height={120} viewBox="0 0 200 120">
              <Defs>
                <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                  <Stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                </LinearGradient>
              </Defs>

              {/* Horizontal Gridlines */}
              <Line x1="0" y1="20" x2="200" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <Line x1="0" y1="50" x2="200" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <Line x1="0" y1="80" x2="200" y2="80" stroke="#f1f5f9" strokeWidth="1" />
              <Line x1="0" y1="110" x2="200" y2="110" stroke="#f1f5f9" strokeWidth="1" />

              {/* Gradient Area Fill */}
              <Path
                d="M 10,85 C 30,90 40,75 60,65 C 80,60 90,72 110,55 C 130,68 140,68 160,45 C 180,35 190,25 195,20 L 195,110 L 10,110 Z"
                fill="url(#chartGradient)"
              />

              {/* Green Trend Line */}
              <Path
                d="M 10,85 C 30,90 40,75 60,65 C 80,60 90,72 110,55 C 130,68 140,68 160,45 C 180,35 190,25 195,20"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              <Circle cx="10" cy="85" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="35" cy="88" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="60" cy="65" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="85" cy="70" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="110" cy="55" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="135" cy="67" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="155" cy="67" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="180" cy="45" r="3.5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
              <Circle cx="195" cy="20" r="4" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
            </Svg>
          </View>

          {/* X Axis Labels */}
          <View style={styles.xAxisRow}>
            <Text style={styles.axisLabel}>Jul 2026</Text>
            <Text style={styles.axisLabel}>Aug 2026</Text>
            <Text style={styles.axisLabel}>Sep 2026</Text>
            <Text style={styles.axisLabel}>Oct 2026</Text>
          </View>
        </View>

        {/* Right: Current Price KPI Card */}
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>{t.currentPrice}</Text>
          <Text style={styles.kpiValue}>₹ 4,800</Text>
          <View style={styles.kpiBadge}>
            <Text style={styles.kpiBadgeText}>↑ 2%</Text>
          </View>
          <Text style={styles.kpiSub}>{t.vsLastWeek}</Text>
        </View>
      </View>

      {/* 7. 4 Service / Market Cards (2x2 Grid) */}
      <View style={styles.gridCardsRow}>
        {/* Card 1: Market News */}
        <TouchableOpacity style={styles.gridCardItem}>
          <View style={[styles.gridIconWrap, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={20} color="#d97706" />
          </View>
          <View style={styles.gridTextWrap}>
            <Text style={styles.gridTitle}>{t.marketNews}</Text>
            <Text style={styles.gridDesc}>{t.marketNewsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#d97706" />
        </TouchableOpacity>

        {/* Card 2: Sell to Buyers */}
        <TouchableOpacity style={styles.gridCardItem}>
          <View style={[styles.gridIconWrap, { backgroundColor: '#e0f2fe' }]}>
            <MaterialCommunityIcons name="handshake-outline" size={20} color="#0284c7" />
          </View>
          <View style={styles.gridTextWrap}>
            <Text style={styles.gridTitle}>{t.sellToBuyers}</Text>
            <Text style={styles.gridDesc}>{t.sellToBuyersSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#0284c7" />
        </TouchableOpacity>
      </View>

      <View style={styles.gridCardsRow}>
        {/* Card 3: Price Alerts */}
        <TouchableOpacity style={styles.gridCardItem}>
          <View style={[styles.gridIconWrap, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="notifications-outline" size={20} color="#9333ea" />
          </View>
          <View style={styles.gridTextWrap}>
            <Text style={styles.gridTitle}>{t.priceAlerts}</Text>
            <Text style={styles.gridDesc}>{t.priceAlertsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9333ea" />
        </TouchableOpacity>

        {/* Card 4: Export Opportunities */}
        <TouchableOpacity style={styles.gridCardItem}>
          <View style={[styles.gridIconWrap, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="globe-outline" size={20} color="#0284c7" />
          </View>
          <View style={styles.gridTextWrap}>
            <Text style={styles.gridTitle}>{t.exportOpps}</Text>
            <Text style={styles.gridDesc}>{t.exportOppsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#0284c7" />
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

  /* Hero Banner */
  heroBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroBannerBg: {
    width: '100%',
  },
  heroOverlay: {
    backgroundColor: 'rgba(6, 78, 59, 0.88)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 22,
  },
  heroSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 15,
    marginTop: 4,
  },
  nearbyMandisBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  nearbyMandisText: {
    color: '#16a34a',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Filter Navigation Pills */
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 20,
    gap: 4,
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
    fontSize: 10.5,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  filterPillTextInactive: {
    color: '#475569',
  },

  /* Popular Crops */
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
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
  popularCropsScroll: {
    gap: 8,
    paddingBottom: 4,
    marginBottom: 16,
  },
  popularCropCard: {
    width: 100,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  popularCropImg: {
    width: '100%',
    height: 60,
  },
  popularCropInfo: {
    padding: 6,
  },
  popularCropName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  popularPriceRow: {
    marginTop: 2,
  },
  popularCropPrice: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  popularCropChange: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 1,
  },

  /* Mandi Prices Header */
  mandiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  districtSub: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  districtDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  districtDropdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },

  /* Table Card */
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableColHead: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    lineHeight: 11,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCropCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableCropThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  tableCropName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  tableCellBold: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  tableCellRegular: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  tableCellChange: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  tableBtnCol: {
    alignItems: 'center',
  },
  detailsBtn: {
    borderWidth: 1,
    borderColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  detailsBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* Price Trend Header */
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendDropdownsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  smallDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallDropdownText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0f172a',
  },

  /* Trend Chart Card */
  trendCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  chartCol: {
    flex: 1,
    paddingRight: 8,
  },
  chartSvgWrap: {
    width: '100%',
    height: 120,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 6,
  },
  axisLabel: {
    fontSize: 8.5,
    color: '#94a3b8',
    fontWeight: '600',
  },
  kpiCard: {
    width: 105,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  kpiBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  kpiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  kpiSub: {
    fontSize: 8.5,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 4,
  },

  /* 2x2 Service Cards */
  gridCardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  gridCardItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  gridTextWrap: {
    flex: 1,
    paddingRight: 4,
  },
  gridTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  gridDesc: {
    fontSize: 8.5,
    color: '#64748b',
    marginTop: 1,
    lineHeight: 11,
  },
});
