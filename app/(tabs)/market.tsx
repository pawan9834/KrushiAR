import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  ActivityRecord,
  Crop,
  deleteActivity,
  getActivities,
  getCrops,
  syncActivitiesWithCloud,
} from '@/services/diaryStorage';
import {
  fetchLiveMandiPrices,
  MandiFetchResult,
  MandiPriceItem,
} from '@/services/mandi';
import {
  Clock,
  MapPin,
  ChevronDown,
  Bell,
  Volume2,
  Square,
  Sparkles,
  Search,
  XCircle,
  X,
  BookOpen,
  PlusCircle,
  Trash2,
  MessageSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

export default function HistoryMarketScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // Mode: 'history' (Farming History / नोंदी) | 'mandi' (Live Mandi Prices)
  const [activeMode, setActiveMode] = useState<'history' | 'mandi'>('history');

  // --- Dynamic Activities State ---
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search for History
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [speakingActivityId, setSpeakingActivityId] = useState<string | null>(null);

  // --- Live Mandi State ---
  const [mandiItems, setMandiItems] = useState<MandiPriceItem[]>([]);
  const [isLoadingMandi, setIsLoadingMandi] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('Jalgaon');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [mandiSearch, setMandiSearch] = useState('');
  const [selectedMandiDetail, setSelectedMandiDetail] = useState<MandiPriceItem | null>(null);
  const [mandiStatus, setMandiStatus] = useState({
    isLive: false,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'data.gov.in (Agmarknet)',
  });

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

  // Load Farming Activities & Crops
  const loadHistoryData = useCallback(async () => {
    try {
      setIsLoadingActivities(true);
      const [acts, cropList] = await Promise.all([
        getActivities(),
        getCrops(),
      ]);
      setActivities(acts);
      setCrops(cropList);
    } catch (err) {
      console.warn('Error loading activities:', err);
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistoryData();
      // Background sync with Cloud
      syncActivitiesWithCloud()
        .then((latest) => {
          if (latest && latest.length > 0) setActivities(latest);
        })
        .catch(() => {});
    }, [loadHistoryData])
  );

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      try {
        if (Speech) Speech.stop();
      } catch {}
    };
  }, []);

  // Load Mandi Data
  const loadMandiData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
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
  }, [selectedDistrict]);

  useEffect(() => {
    if (activeMode === 'mandi') {
      loadMandiData();
    }
  }, [activeMode, loadMandiData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    if (activeMode === 'history') {
      await loadHistoryData();
    } else {
      await loadMandiData(true);
    }
    setIsRefreshing(false);
  };

  // Delete Activity Handler
  const handleDeleteActivity = (id: string, title: string) => {
    Alert.alert(
      language === 'mr' ? 'नोंद हटवा' : language === 'hi' ? 'रिकॉर्ड हटाएं' : 'Delete Record',
      language === 'mr'
        ? `तुम्हाला खात्री आहे की "${title}" ही नोंद हटवायची आहे?`
        : language === 'hi'
          ? `क्या आप वाकई "${title}" को हटाना चाहते हैं?`
          : `Are you sure you want to delete "${title}"?`,
      [
        { text: language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: language === 'mr' ? 'हटवा' : language === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteActivity(id);
              await loadHistoryData();
            } catch (err) {
              console.error('Failed to delete activity:', err);
            }
          },
        },
      ]
    );
  };

  // Speech TTS for Activity
  const handleToggleSpeakActivity = (id: string, textToSpeak: string) => {
    if (!Speech) return;
    try {
      if (speakingActivityId === id) {
        Speech.stop();
        setSpeakingActivityId(null);
      } else {
        Speech.stop();
        setSpeakingActivityId(id);
        const speechLang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        Speech.speak(textToSpeak, {
          language: speechLang,
          rate: 0.88,
          pitch: 1.0,
          onDone: () => setSpeakingActivityId(null),
          onStopped: () => setSpeakingActivityId(null),
          onError: () => setSpeakingActivityId(null),
        });
      }
    } catch {
      setSpeakingActivityId(null);
    }
  };

  // Filtered Activities
  const filteredActivities = activities.filter((act) => {
    // Crop filter
    if (selectedCropFilter !== 'all' && act.cropName !== selectedCropFilter && act.cropId !== selectedCropFilter) {
      return false;
    }
    // Activity type filter
    if (selectedTypeFilter !== 'all' && act.activityType !== selectedTypeFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (act.activityTitle || '').toLowerCase().includes(q);
      const matchCrop = (act.cropName || '').toLowerCase().includes(q);
      const matchPlot = (act.plotName || '').toLowerCase().includes(q);
      const matchNotes = (act.notes || '').toLowerCase().includes(q);
      const matchTranscript = (act.voiceTranscript || '').toLowerCase().includes(q);
      if (!matchTitle && !matchCrop && !matchPlot && !matchNotes && !matchTranscript) {
        return false;
      }
    }
    return true;
  });

  // Calculate totals
  const totalExpense = activities.reduce((acc, a) => acc + (a.totalExpense || 0), 0);
  const totalRevenue = activities.reduce((acc, a) => acc + (a.revenue || 0), 0);

  // Helper for activity type labels and badges
  const getActivityTypeInfo = (type: string) => {
    switch (type) {
      case 'planting':
        return { label: language === 'mr' ? '🌱 लागवड' : language === 'hi' ? '🌱 बुवाई' : '🌱 Planting', color: '#15803d', bg: '#dcfce7' };
      case 'fertilizer':
        return { label: language === 'mr' ? '🧪 खत देणे' : language === 'hi' ? '🧪 खाद देना' : '🧪 Fertilizer', color: '#b45309', bg: '#fef3c7' };
      case 'pesticide':
        return { label: language === 'mr' ? '🚿 फवारणी' : language === 'hi' ? '🚿 छिड़काव' : '🚿 Spraying', color: '#b91c1c', bg: '#fee2e2' };
      case 'irrigation':
        return { label: language === 'mr' ? '💧 सिंचन' : language === 'hi' ? '💧 सिंचाई' : '💧 Irrigation', color: '#0369a1', bg: '#e0f2fe' };
      case 'harvesting':
        return { label: language === 'mr' ? '🌾 काढणी' : language === 'hi' ? '🌾 कटाई' : '🌾 Harvest', color: '#ca8a04', bg: '#fef9c3' };
      case 'sales':
        return { label: language === 'mr' ? '💰 विक्री' : language === 'hi' ? '💰 बिक्री' : '💰 Sales', color: '#15803d', bg: '#dcfce7' };
      case 'weeding':
        return { label: language === 'mr' ? '🌿 खुरपणी' : language === 'hi' ? '🌿 निराई' : '🌿 Weeding', color: '#475569', bg: '#f1f5f9' };
      case 'tillage':
        return { label: language === 'mr' ? '🚜 नांगरणी' : language === 'hi' ? '🚜 जुताई' : '🚜 Tillage', color: '#7c3aed', bg: '#ede9fe' };
      default:
        return { label: language === 'mr' ? '📦 इतर' : language === 'hi' ? '📦 अन्य' : '📦 Other', color: '#475569', bg: '#f1f5f9' };
    }
  };

  // Filtered Mandi Rows
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
    <View style={[styles.container, { backgroundColor: '#f1f5f9' }]}>
      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top > 0 ? insets.top + 6 : 14, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#15803d']}
            tintColor="#15803d"
          />
        }>
        {/* 1. Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <View style={styles.headerIconCircle}>
              <Clock size={24} color="#ffffff" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {language === 'mr' ? 'शेती इतिहास' : language === 'hi' ? 'खेती इतिहास' : 'Farm History'}
              </Text>
              <Text style={styles.headerSub}>
                {language === 'mr'
                  ? `${activities.length} नोंदी • कामांचा इतिहास`
                  : language === 'hi'
                    ? `${activities.length} रिकॉर्ड • कार्य इतिहास`
                    : `${activities.length} Records • Activity Timeline`}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.locationChip}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}>
              <MapPin size={14} color="#15803d" />
              <Text style={styles.locationText}>{location.displayCity}</Text>
              <ChevronDown size={11} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push('/notifications')}
              activeOpacity={0.8}>
              <Bell size={20} color="#0f172a" strokeWidth={2} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activities.length}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Mode Selector Segment: [ 📖 शेती इतिहास | 📊 बाजार भाव ] */}
        <View style={styles.modeSegmentWrap}>
          <TouchableOpacity
            style={[styles.modeSegmentBtn, activeMode === 'history' && styles.modeSegmentBtnActive]}
            onPress={() => setActiveMode('history')}
            activeOpacity={0.8}>
            <BookOpen
              size={18}
              color={activeMode === 'history' ? '#ffffff' : '#475569'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.modeSegmentText,
                activeMode === 'history' && styles.modeSegmentTextActive,
              ]}>
              {language === 'mr' ? 'शेती नोंदी (इतिहास)' : language === 'hi' ? 'खेत रिकॉर्ड (इतिहास)' : 'Farm Records'}
            </Text>
            <View
              style={[
                styles.countBadge,
                activeMode === 'history' ? styles.countBadgeActive : styles.countBadgeInactive,
              ]}>
              <Text
                style={[
                  styles.countBadgeText,
                  activeMode === 'history' ? styles.countBadgeTextActive : styles.countBadgeTextInactive,
                ]}>
                {activities.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeSegmentBtn, activeMode === 'mandi' && styles.modeSegmentBtnActive]}
            onPress={() => setActiveMode('mandi')}
            activeOpacity={0.8}>
            <BarChart3
              size={18}
              color={activeMode === 'mandi' ? '#ffffff' : '#475569'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.modeSegmentText,
                activeMode === 'mandi' && styles.modeSegmentTextActive,
              ]}>
              {language === 'mr' ? 'बाजार भाव (Mandi)' : language === 'hi' ? 'मंडी भाव' : 'Live Mandi'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================== */}
        {/* MODE 1: FARMING HISTORY / शेती नोंदी                         */}
        {/* ========================================================== */}
        {activeMode === 'history' && (
          <View>
            {/* Quick Metrics Banner */}
            <View style={styles.metricsSummaryCard}>
              <View style={styles.metricSumItem}>
                <Text style={styles.metricSumVal}>{activities.length}</Text>
                <Text style={styles.metricSumLbl}>
                  {language === 'mr' ? 'एकूण नोंदी' : language === 'hi' ? 'कुल रिकॉर्ड' : 'Total Records'}
                </Text>
              </View>
              <View style={styles.metricSumDivider} />
              <View style={styles.metricSumItem}>
                <Text style={[styles.metricSumVal, { color: '#dc2626' }]}>
                  ₹ {totalExpense.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.metricSumLbl}>
                  {language === 'mr' ? 'नोंदवलेला खर्च' : language === 'hi' ? 'दर्ज खर्च' : 'Total Expense'}
                </Text>
              </View>
              {totalRevenue > 0 && (
                <>
                  <View style={styles.metricSumDivider} />
                  <View style={styles.metricSumItem}>
                    <Text style={[styles.metricSumVal, { color: '#15803d' }]}>
                      ₹ {totalRevenue.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.metricSumLbl}>
                      {language === 'mr' ? 'उत्पन्न (विक्री)' : language === 'hi' ? 'आय (बिक्री)' : 'Revenue'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Search Input */}
            <View style={styles.searchBarWrap}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder={
                  language === 'mr'
                    ? 'नोंदी शोधा (उदा. टोमॅटो, खत, फवारणी...)'
                    : language === 'hi'
                      ? 'रिकॉर्ड खोजें (उदा. टमाटर, खाद...)'
                      : 'Search activities, crops, notes...'
                }
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <XCircle size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Crop Filter Chips (Dynamic from Crops) */}
            {crops.length > 0 && (
              <View style={styles.chipsRowWrap}>
                <Text style={styles.chipsRowLabel}>
                  {language === 'mr' ? 'पीक निवडा:' : language === 'hi' ? 'फसल:' : 'Crop:'}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      selectedCropFilter === 'all' && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCropFilter('all')}
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCropFilter === 'all' && styles.filterChipTextActive,
                      ]}>
                      {language === 'mr' ? 'सर्व पिके' : language === 'hi' ? 'सभी फसलें' : 'All Crops'}
                    </Text>
                  </TouchableOpacity>
                  {crops.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[
                        styles.filterChip,
                        selectedCropFilter === c.name && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setSelectedCropFilter(selectedCropFilter === c.name ? 'all' : c.name)
                      }
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          styles.filterChipText,
                          selectedCropFilter === c.name && styles.filterChipTextActive,
                        ]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Activity Type Filter Chips */}
            <View style={styles.chipsRowWrap}>
              <Text style={styles.chipsRowLabel}>
                {language === 'mr' ? 'प्रकार:' : language === 'hi' ? 'प्रकार:' : 'Type:'}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}>
                {[
                  { key: 'all', label: language === 'mr' ? 'सर्व' : 'All' },
                  { key: 'planting', label: language === 'mr' ? '🌱 लागवड' : 'Planting' },
                  { key: 'fertilizer', label: language === 'mr' ? '🧪 खत' : 'Fertilizer' },
                  { key: 'pesticide', label: language === 'mr' ? '🚿 फवारणी' : 'Spraying' },
                  { key: 'irrigation', label: language === 'mr' ? '💧 सिंचन' : 'Irrigation' },
                  { key: 'harvesting', label: language === 'mr' ? '🌾 काढणी' : 'Harvest' },
                  { key: 'sales', label: language === 'mr' ? '💰 विक्री' : 'Sales' },
                  { key: 'other', label: language === 'mr' ? '📦 इतर' : 'Other' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      selectedTypeFilter === item.key && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setSelectedTypeFilter(selectedTypeFilter === item.key ? 'all' : item.key)
                    }
                    activeOpacity={0.8}>
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedTypeFilter === item.key && styles.filterChipTextActive,
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Activities List or Empty State */}
            {isLoadingActivities ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#15803d" />
                <Text style={styles.loadingText}>
                  {language === 'mr' ? 'नोंदी लोड होत आहेत...' : 'Loading records...'}
                </Text>
              </View>
            ) : filteredActivities.length === 0 ? (
              <View style={styles.emptyCardContainer}>
                <View style={styles.emptyIconCircle}>
                  <BookOpen size={44} color="#15803d" strokeWidth={1.8} />
                </View>
                <Text style={styles.emptyCardTitle}>
                  {searchQuery || selectedCropFilter !== 'all' || selectedTypeFilter !== 'all'
                    ? language === 'mr'
                      ? 'कोणतीही जुळणारी नोंद सापडली नाही'
                      : 'No matching records found'
                    : language === 'mr'
                      ? 'अद्याप कोणतीही नोंद नाही'
                      : language === 'hi'
                        ? 'अभी कोई रिकॉर्ड दर्ज नहीं है'
                        : 'No Activities Recorded Yet'}
                </Text>
                <Text style={styles.emptyCardSub}>
                  {language === 'mr'
                    ? 'शेतातील खत, पाणी, फवारणी किंवा काढणीची पहिली नोंद करा आणि खर्चाचा हिशोब ठेवा.'
                    : language === 'hi'
                      ? 'खेत के खाद, पानी, छिड़काव या कटाई का पहला रिकॉर्ड दर्ज करें।'
                      : 'Add your first farming activity record to track timelines and costs.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyCardBtn}
                  onPress={() => router.push('/add-activity')}
                  activeOpacity={0.85}>
                  <PlusCircle size={20} color="#ffffff" strokeWidth={2.2} />
                  <Text style={styles.emptyCardBtnText}>
                    {language === 'mr' ? '+ पहिली नोंद करा' : language === 'hi' ? '+ नया रिकॉर्ड जोड़ें' : '+ Add First Record'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.activitiesStack}>
                {filteredActivities.map((item) => {
                  const typeInfo = getActivityTypeInfo(item.activityType);
                  const isSpeakingThis = speakingActivityId === item.id;
                  const spokenText = `${item.cropName}: ${item.activityTitle}. ${item.notes || item.voiceTranscript || ''}`;

                  return (
                    <View key={item.id} style={styles.activityCard}>
                      <View style={styles.activityCardTopRow}>
                        {/* Thumbnail */}
                        <Image
                          source={{
                            uri:
                              item.photoUri ||
                              'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=200&q=80',
                          }}
                          style={styles.activityThumb}
                        />

                        {/* Content */}
                        <View style={styles.activityContentCol}>
                          <View style={styles.activityHeaderPillsRow}>
                            <View style={styles.cropBadge}>
                              <Text style={styles.cropBadgeText}>{item.cropName}</Text>
                            </View>
                            <View style={[styles.typePill, { backgroundColor: typeInfo.bg }]}>
                              <Text style={[styles.typePillText, { color: typeInfo.color }]}>
                                {typeInfo.label}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleDeleteActivity(item.id, item.activityTitle)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.deleteActivityBtn}>
                              <Trash2 size={16} color="#ef4444" />
                            </TouchableOpacity>
                          </View>

                          <Text style={styles.activityCardTitle} numberOfLines={1}>
                            {item.activityTitle}
                          </Text>

                          <Text style={styles.activityDateText}>
                            📅 {item.date ? item.date.split('T')[0] : item.createdAt.split('T')[0]}
                            {item.plotName ? ` • 📍 ${item.plotName}` : ''}
                          </Text>
                        </View>
                      </View>

                      {/* Notes / Voice Transcript */}
                      {(item.notes || item.voiceTranscript) && (
                        <View style={styles.notesBox}>
                          <MessageSquare size={14} color="#64748b" />
                          <Text style={styles.notesText} numberOfLines={2}>
                            {item.notes || item.voiceTranscript}
                          </Text>
                        </View>
                      )}

                      {/* Bottom Row: Expense & Actions */}
                      <View style={styles.activityCardBottomRow}>
                        <View style={styles.costCol}>
                          {item.totalExpense > 0 ? (
                            <View style={styles.expensePill}>
                              <Text style={styles.expensePillText}>
                                खर्च: ₹ {item.totalExpense.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          ) : item.revenue && item.revenue > 0 ? (
                            <View style={[styles.expensePill, { backgroundColor: '#dcfce7' }]}>
                              <Text style={[styles.expensePillText, { color: '#15803d' }]}>
                                विक्री: ₹ {item.revenue.toLocaleString('en-IN')}
                              </Text>
                            </View>
                          ) : (
                            <View style={[styles.expensePill, { backgroundColor: '#f1f5f9' }]}>
                              <Text style={[styles.expensePillText, { color: '#64748b' }]}>
                                खर्च नोंद नाही
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.cardActionsRow}>
                          {/* 🔊 Audio Speak */}
                          <TouchableOpacity
                            style={[
                              styles.actAudioBtn,
                              isSpeakingThis && styles.actAudioBtnActive,
                            ]}
                            onPress={() => handleToggleSpeakActivity(item.id, spokenText)}
                            activeOpacity={0.7}>
                            {isSpeakingThis ? (
                              <Square size={14} color="#ffffff" fill="#ffffff" />
                            ) : (
                              <Volume2 size={16} color="#15803d" />
                            )}
                          </TouchableOpacity>

                          {/* ℹ️ View Detail */}
                          <TouchableOpacity
                            style={styles.actDetailBtn}
                            onPress={() =>
                              router.push({
                                pathname: '/activity-detail',
                                params: { id: item.id },
                              })
                            }
                            activeOpacity={0.7}>
                            <Text style={styles.actDetailBtnText}>
                              {language === 'mr' ? 'तपशील →' : 'Details →'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Bottom Big Button: "+ नवीन नोंद करा" */}
            <TouchableOpacity
              style={styles.addRecordBottomBtn}
              onPress={() => router.push('/add-activity')}
              activeOpacity={0.85}>
              <PlusCircle size={22} color="#ffffff" strokeWidth={2.2} />
              <Text style={styles.addRecordBottomBtnText}>
                {language === 'mr'
                  ? '+ नवीन नोंद करा (फोटो / आवाज)'
                  : language === 'hi'
                    ? '+ नया रिकॉर्ड दर्ज करें'
                    : '+ Record New Farm Activity'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================== */}
        {/* MODE 2: LIVE MANDI PRICES (बाजार भाव)                        */}
        {/* ========================================================== */}
        {activeMode === 'mandi' && (
          <View>
            {/* Live API Mandi Header */}
            <View style={styles.mandiHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.sectionHeading}>
                    {language === 'mr' ? 'थेट बाजार भाव' : language === 'hi' ? 'लाइव मंडी भाव' : 'Live Mandi Prices'}
                  </Text>
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
                <ChevronDown size={11} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {/* Commodity Search & Refresh Bar */}
            <View style={styles.mandiFilterBar}>
              <View style={styles.mandiSearchBox}>
                <Search size={16} color="#94a3b8" />
                <TextInput
                  style={styles.mandiSearchInput}
                  placeholder={language === 'mr' ? 'पीक / बाजार शोधा...' : 'Search commodity / mandi...'}
                  placeholderTextColor="#94a3b8"
                  value={mandiSearch}
                  onChangeText={setMandiSearch}
                />
                {mandiSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setMandiSearch('')} activeOpacity={0.7}>
                    <XCircle size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.mandiRefreshBtn}
                onPress={() => loadMandiData(true)}
                disabled={isLoadingMandi || isRefreshing}
                activeOpacity={0.7}>
                {isLoadingMandi ? (
                  <ActivityIndicator size="small" color="#15803d" />
                ) : (
                  <RefreshCw size={18} color="#15803d" />
                )}
              </TouchableOpacity>
            </View>

            {/* Mandi Table */}
            <View style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableColHead, { flex: 1.4 }]}>
                  {language === 'mr' ? 'पीक / बाजार' : 'Crop'}
                </Text>
                <Text style={[styles.tableColHead, { flex: 1.1, textAlign: 'center' }]}>
                  {language === 'mr' ? 'सरासरी दर\n(₹/क्विंटल)' : 'Modal Price'}
                </Text>
                <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>
                  {language === 'mr' ? 'किमान' : 'Min'}
                </Text>
                <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>
                  {language === 'mr' ? 'कमाल' : 'Max'}
                </Text>
                <Text style={[styles.tableColHead, { flex: 1, textAlign: 'center' }]}>
                  {language === 'mr' ? 'तपशील' : 'Details'}
                </Text>
              </View>

              {isLoadingMandi && displayMandiRows.length === 0 ? (
                <View style={styles.tableLoadingWrap}>
                  <ActivityIndicator size="large" color="#15803d" />
                  <Text style={styles.tableLoadingText}>
                    {language === 'mr' ? 'Agmarknet API वरून दर आणत आहे...' : 'Connecting to Agmarknet API...'}
                  </Text>
                </View>
              ) : displayMandiRows.length === 0 ? (
                <View style={styles.tableEmptyWrap}>
                  <AlertCircle size={28} color="#94a3b8" />
                  <Text style={styles.tableEmptyText}>
                    {language === 'mr' ? 'या शोधासाठी कोणतेही दर सापडले नाहीत' : 'No mandi rates found for this query'}
                  </Text>
                  <TouchableOpacity
                    style={styles.resetFilterBtn}
                    onPress={() => {
                      setMandiSearch('');
                      setSelectedDistrict('All Districts');
                    }}>
                    <Text style={styles.resetFilterBtnText}>
                      {language === 'mr' ? 'सर्व महाराष्ट्राचे दर पहा' : 'Show All Maharashtra Rates'}
                    </Text>
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

                    <Text style={[styles.tableCellBold, { flex: 1.1 }]}>{row.formattedModal}</Text>
                    <Text style={[styles.tableCellRegular, { flex: 1 }]}>{row.formattedMin}</Text>
                    <Text style={[styles.tableCellRegular, { flex: 1 }]}>{row.formattedMax}</Text>

                    <View style={[styles.tableBtnCol, { flex: 1 }]}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => setSelectedMandiDetail(row)}
                        activeOpacity={0.8}>
                        <Text style={styles.detailsBtnText}>
                          {language === 'mr' ? 'पहा' : 'View'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.modalTitle}>
                {language === 'mr' ? 'जिल्हा निवडा (District)' : 'Select Mandi District'}
              </Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <X size={20} color="#475569" />
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
                    {isSelected && <CheckCircle2 size={18} color="#15803d" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Mandi Detail Modal */}
      {selectedMandiDetail && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedMandiDetail(null)}>
          <View style={styles.detailModalBackdrop}>
            <View style={styles.detailModalCard}>
              <View style={styles.detailModalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailModalTitle}>{selectedMandiDetail.commodity}</Text>
                  <Text style={styles.detailModalSub}>
                    {selectedMandiDetail.market} • {selectedMandiDetail.district}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedMandiDetail(null)}>
                  <XCircle size={26} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailGridRow}>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLbl}>
                    {language === 'mr' ? 'सरासरी दर' : 'Modal Price'}
                  </Text>
                  <Text style={[styles.detailGridVal, { color: '#15803d' }]}>
                    {selectedMandiDetail.formattedModal}
                  </Text>
                </View>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLbl}>
                    {language === 'mr' ? 'किमान दर' : 'Min Price'}
                  </Text>
                  <Text style={styles.detailGridVal}>{selectedMandiDetail.formattedMin}</Text>
                </View>
                <View style={styles.detailGridItem}>
                  <Text style={styles.detailGridLbl}>
                    {language === 'mr' ? 'कमाल दर' : 'Max Price'}
                  </Text>
                  <Text style={styles.detailGridVal}>{selectedMandiDetail.formattedMax}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.detailCloseBtn}
                onPress={() => setSelectedMandiDetail(null)}
                activeOpacity={0.8}>
                <Text style={styles.detailCloseBtnText}>
                  {language === 'mr' ? 'बंद करा' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollWrap: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
  },

  /* 1. Top Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
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
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 38,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#15803d',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  /* 2. Mode Selector Segment */
  modeSegmentWrap: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 6,
  },
  modeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeSegmentBtnActive: {
    backgroundColor: '#15803d',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  modeSegmentText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  modeSegmentTextActive: {
    color: '#ffffff',
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeInactive: {
    backgroundColor: '#e2e8f0',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countBadgeTextActive: {
    color: '#ffffff',
  },
  countBadgeTextInactive: {
    color: '#475569',
  },

  /* Metrics Summary Banner */
  metricsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 12,
  },
  metricSumItem: {
    alignItems: 'center',
  },
  metricSumVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricSumLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  metricSumDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },

  /* Search Bar */
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },

  /* Chips Rows */
  chipsRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  chipsRowLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    width: 60,
  },
  chipsScroll: {
    gap: 6,
    paddingRight: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  /* Loading & Empty States */
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyCardSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  emptyCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 20,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyCardBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Activity Cards Stack */
  activitiesStack: {
    gap: 12,
    marginTop: 6,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityCardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityThumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  activityContentCol: {
    flex: 1,
  },
  activityHeaderPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cropBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cropBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  typePill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteActivityBtn: {
    marginLeft: 'auto',
    padding: 4,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
  },
  activityCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  activityDateText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
  },

  /* Notes */
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 17,
  },

  /* Card Bottom */
  activityCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  costCol: {
    flex: 1,
  },
  expensePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  expensePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#dc2626',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actAudioBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actAudioBtnActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  actDetailBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actDetailBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Bottom Big Button */
  addRecordBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingVertical: 14,
    minHeight: 52,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addRecordBottomBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Mandi Styles */
  mandiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveSyncBadgeActive: {
    backgroundColor: '#dcfce7',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  livePulseDotActive: {
    backgroundColor: '#15803d',
  },
  liveSyncBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  districtSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  districtDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  districtDropdownText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  mandiFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  mandiSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 42,
    gap: 6,
  },
  mandiSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  mandiRefreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Mandi Table */
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    marginBottom: 14,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableColHead: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCropCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tableCropThumb: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  tableCropName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  tableMarketSub: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  tableCellBold: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#15803d',
    textAlign: 'center',
  },
  tableCellRegular: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  tableBtnCol: {
    alignItems: 'center',
  },
  detailsBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  detailsBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  tableLoadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
    gap: 8,
  },
  tableLoadingText: {
    fontSize: 12.5,
    color: '#64748b',
  },
  tableEmptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  tableEmptyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  resetFilterBtn: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  resetFilterBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  districtModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  districtOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  districtOptionItemActive: {
    backgroundColor: '#f0fdf4',
  },
  districtOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  districtOptionTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },

  /* Detail Modal */
  detailModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  detailModalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
  },
  detailModalSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  detailGridItem: {
    alignItems: 'center',
  },
  detailGridLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  detailGridVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  detailCloseBtn: {
    backgroundColor: '#15803d',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailCloseBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
