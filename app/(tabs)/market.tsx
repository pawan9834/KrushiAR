import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  fetchLiveMandiPrices,
  MandiFetchResult,
  MandiPriceItem,
} from '@/services/mandi';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

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

  // Live Mandi State from data.gov.in
  const [mandiItems, setMandiItems] = useState<MandiPriceItem[]>([]);
  const [isLoadingMandi, setIsLoadingMandi] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mandiStatus, setMandiStatus] = useState({
    isLive: false,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'data.gov.in (Agmarknet)',
  });
  const [selectedDistrict, setSelectedDistrict] = useState('Jalgaon');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [mandiSearch, setMandiSearch] = useState('');
  const [selectedMandiDetail, setSelectedMandiDetail] = useState<MandiPriceItem | null>(null);

  const getCommodityPrice = (keywords: string[], fallback: string) => {
    const found = mandiItems.find((item) =>
      keywords.some(
        (kw) =>
          item.commodity.toLowerCase().includes(kw.toLowerCase()) ||
          item.variety.toLowerCase().includes(kw.toLowerCase())
      )
    );
    return found ? `₹ ${found.modalPrice.toLocaleString('en-IN')}` : fallback;
  };

  const popularCrops = [
    {
      id: '1',
      name: t.cropSoybean,
      price: getCommodityPrice(['soybean', 'सोयाबीन'], '₹ 4,800'),
      change: '↑ 2%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300&q=80',
    },
    {
      id: '2',
      name: t.cropCotton,
      price: getCommodityPrice(['cotton', 'कापूस'], '₹ 7,200'),
      change: '↓ 1%',
      isUp: false,
      image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=300&q=80',
    },
    {
      id: '3',
      name: t.cropMaize,
      price: getCommodityPrice(['maize', 'मका', 'corn'], '₹ 2,150'),
      change: '↑ 3%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&q=80',
    },
    {
      id: '4',
      name: t.cropOnion,
      price: getCommodityPrice(['onion', 'कांदा', 'pyaz'], '₹ 1,850'),
      change: '↑ 5%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=300&q=80',
    },
    {
      id: '5',
      name: t.cropWheat,
      price: getCommodityPrice(['wheat', 'गहू', 'gehun'], '₹ 2,300'),
      change: '↑ 1%',
      isUp: true,
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80',
    },
  ];

  const districtsList = [
    'Jalgaon',
    'Nashik',
    'Pune',
    'Ahmednagar',
    'Nagpur',
    'Solapur',
    'Kolhapur',
    'Amravati',
    'Chhatrapati Sambhajinagar',
    'All Districts',
  ];

  const loadMandiData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoadingMandi(true);

    try {
      const result: MandiFetchResult = await fetchLiveMandiPrices({
        state: 'Maharashtra',
        district: selectedDistrict === 'All Districts' ? undefined : selectedDistrict,
      });

      setMandiItems(result.items);
      setMandiStatus({
        isLive: result.isLive,
        lastUpdated: result.lastUpdated,
        source: result.source,
      });
    } catch (err) {
      console.warn('Failed to load mandi data:', err);
    } finally {
      setIsLoadingMandi(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMandiData();
  }, [selectedDistrict]);

  const displayMandiRows = mandiItems.filter((item) => {
    if (!mandiSearch.trim()) return true;
    const q = mandiSearch.toLowerCase();
    return (
      item.commodity.toLowerCase().includes(q) ||
      item.market.toLowerCase().includes(q) ||
      item.variety.toLowerCase().includes(q)
    );
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[styles.content, { paddingTop: 12, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => loadMandiData(true)}
          colors={['#16a34a']}
          tintColor="#16a34a"
        />
      }>
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

      {/* 5. Live Mandi Prices from data.gov.in */}
      <View style={styles.mandiHeaderRow}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.sectionHeading}>{t.mandiPricesTitle}</Text>
            <View style={[styles.liveSyncBadge, mandiStatus.isLive && styles.liveSyncBadgeActive]}>
              <View style={[styles.livePulseDot, mandiStatus.isLive && styles.livePulseDotActive]} />
              <Text style={styles.liveSyncBadgeText}>
                {mandiStatus.isLive ? 'Live API' : 'Agmarknet'}
              </Text>
            </View>
          </View>
          <Text style={styles.districtSub}>
            {selectedDistrict} • {mandiStatus.source} ({mandiStatus.lastUpdated})
          </Text>
        </View>

        <TouchableOpacity
          style={styles.districtDropdown}
          onPress={() => setShowDistrictModal(true)}
          activeOpacity={0.8}>
          <Text style={styles.districtDropdownText}>{selectedDistrict} </Text>
          <Ionicons name="chevron-down" size={11} color="#0f172a" />
        </TouchableOpacity>
      </View>

      {/* Commodity Search & Refresh Bar */}
      <View style={styles.mandiFilterBar}>
        <View style={styles.mandiSearchBox}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.mandiSearchInput}
            placeholder="Search crop / mandi (Onion, Cotton, Soybean...)"
            placeholderTextColor="#94a3b8"
            value={mandiSearch}
            onChangeText={setMandiSearch}
          />
          {mandiSearch.length > 0 && (
            <TouchableOpacity onPress={() => setMandiSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.mandiRefreshBtn}
          onPress={() => loadMandiData(true)}
          disabled={isLoadingMandi || isRefreshing}
          activeOpacity={0.7}>
          {isLoadingMandi ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <Ionicons name="refresh" size={18} color="#16a34a" />
          )}
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
        {isLoadingMandi && displayMandiRows.length === 0 ? (
          <View style={styles.tableLoadingWrap}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.tableLoadingText}>Connecting to data.gov.in Agmarknet API...</Text>
          </View>
        ) : displayMandiRows.length === 0 ? (
          <View style={styles.tableEmptyWrap}>
            <Ionicons name="alert-circle-outline" size={28} color="#94a3b8" />
            <Text style={styles.tableEmptyText}>No mandi rates found for this query</Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setMandiSearch('');
                setSelectedDistrict('All Districts');
              }}>
              <Text style={styles.resetFilterBtnText}>Show All Maharashtra Rates</Text>
            </TouchableOpacity>
          </View>
        ) : (
          displayMandiRows.map((row, idx) => (
            <TouchableOpacity
              key={row.id || idx}
              style={[
                styles.tableRow,
                idx === displayMandiRows.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => setSelectedMandiDetail(row)}
              activeOpacity={0.7}>
              {/* Crop Info */}
              <View style={[styles.tableCropCol, { flex: 1.4 }]}>
                <Image source={{ uri: row.image }} style={styles.tableCropThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.tableCropName} numberOfLines={1}>
                    {row.commodity}
                  </Text>
                  <Text style={styles.tableMarketSub} numberOfLines={1}>
                    {row.market}
                  </Text>
                </View>
              </View>

              {/* Modal Price */}
              <Text style={[styles.tableCellBold, { flex: 1.1 }]}>{row.formattedModal}</Text>

              {/* Min Price */}
              <Text style={[styles.tableCellRegular, { flex: 1 }]}>{row.formattedMin}</Text>

              {/* Max Price */}
              <Text style={[styles.tableCellRegular, { flex: 1 }]}>{row.formattedMax}</Text>

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
                <TouchableOpacity
                  style={styles.detailsBtn}
                  onPress={() => setSelectedMandiDetail(row)}
                  activeOpacity={0.8}>
                  <Text style={styles.detailsBtnText}>{t.details}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
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

      {/* District Picker Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDistrictModal(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowDistrictModal(false)}>
          <View style={styles.districtModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Select Mandi District (जिल्हा)</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {districtsList.map((dist) => {
                const isSelected = selectedDistrict === dist;
                return (
                  <TouchableOpacity
                    key={dist}
                    style={[
                      styles.districtOptionItem,
                      isSelected && styles.districtOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedDistrict(dist);
                      setShowDistrictModal(false);
                    }}>
                    <Text
                      style={[
                        styles.districtOptionText,
                        isSelected && styles.districtOptionTextActive,
                      ]}>
                      {dist}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Detailed Mandi Record Modal */}
      <Modal
        visible={!!selectedMandiDetail}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMandiDetail(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.mandiDetailCard}>
            <View style={styles.detailCardDrag} />
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailSuperTitle}>Govt. of India APMC Mandi Rate</Text>
                <Text style={styles.detailCropName}>{selectedMandiDetail?.commodity}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeRoundBtn}
                onPress={() => setSelectedMandiDetail(null)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedMandiDetail && (
              <View style={styles.receiptBody}>
                {/* Hero Price Badge */}
                <View style={styles.receiptPriceHero}>
                  <Text style={styles.receiptPriceLabel}>Modal Price (सर्वसाधारण बाजार भाव)</Text>
                  <Text style={styles.receiptPriceValue}>{selectedMandiDetail.formattedModal} / quintal</Text>
                  <Text style={styles.receiptPriceSub}>
                    Arrival Date: {selectedMandiDetail.arrivalDate}
                  </Text>
                </View>

                {/* Details Grid */}
                <View style={styles.receiptGrid}>
                  <View style={styles.receiptGridItem}>
                    <Text style={styles.gridKey}>Mandi (बाजार समिती):</Text>
                    <Text style={styles.gridVal}>{selectedMandiDetail.market} APMC</Text>
                  </View>
                  <View style={styles.receiptGridItem}>
                    <Text style={styles.gridKey}>District (जिल्हा):</Text>
                    <Text style={styles.gridVal}>{selectedMandiDetail.district}, {selectedMandiDetail.state}</Text>
                  </View>
                  <View style={styles.receiptGridItem}>
                    <Text style={styles.gridKey}>Variety (प्रकार/जात):</Text>
                    <Text style={styles.gridVal}>{selectedMandiDetail.variety}</Text>
                  </View>
                  <View style={styles.receiptGridItem}>
                    <Text style={styles.gridKey}>Grade (प्रत):</Text>
                    <Text style={styles.gridVal}>{selectedMandiDetail.grade}</Text>
                  </View>
                  <View style={styles.receiptGridItem}>
                    <Text style={styles.gridKey}>Minimum Price (किमान):</Text>
                    <Text style={[styles.gridVal, { color: '#0f172a' }]}>{selectedMandiDetail.formattedMin}</Text>
                  </View>
                  <View style={styles.receiptGridItem}>
                    <Text style={styles.gridKey}>Maximum Price (कमाल):</Text>
                    <Text style={[styles.gridVal, { color: '#16a34a' }]}>{selectedMandiDetail.formattedMax}</Text>
                  </View>
                </View>

                {/* Official GoI Badge */}
                <View style={styles.govVerifiedBox}>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#16a34a" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.govVerifiedTitle}>Verified via Open Government Data (data.gov.in)</Text>
                    <Text style={styles.govVerifiedDesc}>
                      Ministry of Agriculture & Farmers Welfare, Directorate of Marketing & Inspection (DMI)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeSheetBtn}
                  onPress={() => setSelectedMandiDetail(null)}
                  activeOpacity={0.8}>
                  <Text style={styles.closeSheetBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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

  /* Live Mandi Sync Badge */
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  liveSyncBadgeActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#bbf7d0',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  livePulseDotActive: {
    backgroundColor: '#16a34a',
  },
  liveSyncBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* Mandi Filter Bar */
  mandiFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  mandiSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  mandiSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#0f172a',
    padding: 0,
  },
  mandiRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Table States */
  tableMarketSub: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500',
  },
  tableLoadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  tableLoadingText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  tableEmptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  tableEmptyText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  resetFilterBtn: {
    marginTop: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resetFilterBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  districtModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: '65%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  districtOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 4,
  },
  districtOptionItemActive: {
    backgroundColor: '#f0fdf4',
  },
  districtOptionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  districtOptionTextActive: {
    color: '#16a34a',
    fontWeight: '800',
  },

  /* Mandi Detail Receipt */
  mandiDetailCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  detailCardDrag: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  detailSuperTitle: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailCropName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  closeRoundBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptBody: {
    marginTop: 4,
  },
  receiptPriceHero: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptPriceLabel: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },
  receiptPriceValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#16a34a',
    marginVertical: 4,
  },
  receiptPriceSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  receiptGrid: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  receiptGridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridKey: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '800',
  },
  govVerifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  govVerifiedTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
  },
  govVerifiedDesc: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 13,
  },
  closeSheetBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeSheetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

