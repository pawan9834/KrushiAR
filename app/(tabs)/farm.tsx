import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  getCrops,
  getPlots,
  getFarmerProfile,
  getExpenseSummary,
  addCrop,
  Crop,
  FarmPlot,
  FarmerProfile,
} from '@/services/diaryStorage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export default function MyFarmScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // 🔊 Audio Speech State
  const [activeSpeakingKey, setActiveSpeakingKey] = useState<string | null>(null);

  // Sub-tabs: 'crops' | 'plots' | 'expenses' | 'advisory'
  const [activeTab, setActiveTab] = useState<'crops' | 'plots' | 'expenses' | 'advisory'>('crops');

  // Selected plot
  const [selectedPlotId, setSelectedPlotId] = useState<string>('1');

  // Dynamic Farm Data from Storage
  const [crops, setCrops] = useState<Crop[]>([]);
  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<{
    totalExpense: number;
    totalRevenue: number;
    netProfit: number;
    byCategory: Record<string, number>;
  }>({ totalExpense: 0, totalRevenue: 0, netProfit: 0, byCategory: {} });

  // Add Crop Modal
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropVariety, setNewCropVariety] = useState('');
  const [newCropArea, setNewCropArea] = useState('१.०');

  const loadFarmData = useCallback(async () => {
    try {
      const [cropList, plotList, profile, expenses] = await Promise.all([
        getCrops(),
        getPlots(),
        getFarmerProfile(),
        getExpenseSummary(),
      ]);
      setCrops(cropList);
      setPlots(plotList);
      setFarmerProfile(profile);
      setExpenseSummary(expenses);
      if (cropList.length > 0 && !cropList.some((c) => c.id === selectedPlotId)) {
        setSelectedPlotId(cropList[0].id);
      }
    } catch (err) {
      console.warn('Error loading farm data:', err);
    }
  }, [selectedPlotId]);

  useFocusEffect(
    useCallback(() => {
      loadFarmData();
    }, [loadFarmData])
  );

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      try {
        if (Speech) Speech.stop();
      } catch { }
    };
  }, []);

  const handleToggleSpeak = (key: string, textToSpeak: string) => {
    if (!Speech) return;
    try {
      if (activeSpeakingKey === key) {
        Speech.stop();
        setActiveSpeakingKey(null);
      } else {
        Speech.stop();
        setActiveSpeakingKey(key);
        const speechLang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        Speech.speak(textToSpeak, {
          language: speechLang,
          rate: 0.88,
          pitch: 1.0,
          onDone: () => setActiveSpeakingKey(null),
          onStopped: () => setActiveSpeakingKey(null),
          onError: () => setActiveSpeakingKey(null),
        });
      }
    } catch {
      setActiveSpeakingKey(null);
    }
  };

  const handleSaveCrop = async () => {
    if (!newCropName.trim()) {
      Alert.alert(language === 'mr' ? 'कृपया पिकाचे नाव टाका' : 'Please enter crop name');
      return;
    }
    try {
      await addCrop({
        name: newCropName.trim(),
        variety: newCropVariety.trim() || (language === 'mr' ? 'सुधारित जात' : 'Standard'),
        area: newCropArea.trim() || '१.०',
        areaUnit: farmerProfile?.areaUnit || 'एकर',
        sowingDate: new Date().toISOString().split('T')[0],
        status: 'active',
        plotName: plots[0]?.name || (language === 'mr' ? 'शेताचा तुकडा १' : 'Plot 1'),
        imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
      });
      setNewCropName('');
      setNewCropVariety('');
      setShowAddCropModal(false);
      await loadFarmData();
    } catch (err) {
      console.error('Failed to add crop:', err);
    }
  };

  const totalAreaText = farmerProfile?.totalArea || (plots.reduce((acc, p) => acc + (parseFloat(p.area) || 0), 0) || 5.5).toString();
  const areaUnitText = farmerProfile?.areaUnit || (language === 'en' ? 'Acres' : 'एकर');

  const farmSpokenSummary =
    crops.length > 0
      ? language === 'mr'
        ? `माझे शेत अहवाल: तुमचे एकूण शेत ${totalAreaText} ${areaUnitText} असून सध्या शेतात ${crops.length} पिके आहेत: ${crops.map((c) => c.name).join(', ')}. सर्व पिकांची स्थिती समाधानकारक आहे.`
        : language === 'hi'
          ? `मेरा खेत रिपोर्ट: आपका कुल खेत ${totalAreaText} ${areaUnitText} है और वर्तमान में ${crops.length} फसलें हैं: ${crops.map((c) => c.name).join(', ')}।`
          : `My Farm Report: Total land is ${totalAreaText} ${areaUnitText} with ${crops.length} active crops: ${crops.map((c) => c.name).join(', ')}.`
      : language === 'mr'
        ? 'माझे शेत: सध्या कोणतेही पीक नोंदवलेले नाही. नवीन पीक जोडण्यासाठी वरील बटणावर दाबा.'
        : language === 'hi'
          ? 'मेरा खेत: अभी कोई फसल दर्ज नहीं है। नई फसल जोड़ने के लिए बटन दबाएं।'
          : 'My Farm: No crops added yet. Tap Add Crop to record your first crop.';

  // Dynamically formatted Crops list derived from storage
  const cropsList = crops.map((c) => ({
    id: c.id,
    name: c.name,
    variety: c.variety || (language === 'mr' ? 'सुधारित' : 'Standard'),
    area: `${c.area} ${c.areaUnit || areaUnitText}`,
    plotName: c.plotName || (language === 'mr' ? 'शेताचा तुकडा' : 'Farm Plot'),
    stage: language === 'mr' ? 'वाढीची अवस्था' : language === 'hi' ? 'वृद्धि अवस्था' : 'Vegetative Stage',
    stageColor: '#15803d',
    stageBg: '#dcfce7',
    progress: '55%',
    progressColor: '#15803d',
    daysLeft: language === 'mr' ? 'काढणी लवकरच' : language === 'hi' ? 'कटाई जल्द' : 'Harvest soon',
    sowingDate: c.sowingDate || '२०२६-०६-०१',
    advice:
      language === 'mr'
        ? 'मातीत ओलावा तपासा, आवश्यकतेनुसार पाणी व खत द्या.'
        : language === 'hi'
          ? 'मिट्टी में नमी जांचें, आवश्यक अनुसार सिंचाई करें।'
          : 'Check soil moisture, irrigate as required.',
    spokenText: `${c.name}: ${c.area} ${c.areaUnit || areaUnitText}. जात ${c.variety}.`,
    image: c.imageUrl || 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
    totalExpenses: c.totalExpenses || 0,
  }));

  const handleCallKisanHelpline = () => {
    Linking.openURL('tel:18001801551').catch(() => { });
  };

  const selectedPlotCrop = cropsList.find((c) => c.id === selectedPlotId) || cropsList[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f1f5f9' }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top > 0 ? insets.top + 6 : 14, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* 1. Header with Location & Farmer Details */}
      <View style={styles.headerRow}>
        <View style={styles.brandCol}>
          <View style={styles.titleRow}>
            <View style={styles.headerIconCircle}>
              <MaterialCommunityIcons name="image-filter-hdr" size={24} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {language === 'mr' ? 'माझे शेत' : language === 'hi' ? 'मेरा खेत' : 'My Farm'}
              </Text>
              <Text style={styles.headerSub}>
                {language === 'mr'
                  ? `${totalAreaText} ${areaUnitText} जमीन • ${crops.length} पिके`
                  : language === 'hi'
                    ? `${totalAreaText} ${areaUnitText} जमीन • ${crops.length} फसलें`
                    : `${totalAreaText} ${areaUnitText} Land • ${crops.length} Active Crops`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}>
            <Ionicons name="location-sharp" size={15} color="#15803d" />
            <Text style={styles.locationText}>{location.displayCity}</Text>
            <Ionicons name="chevron-down" size={12} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}>
            <Ionicons name="notifications" size={20} color="#0f172a" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{crops.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 🔊 TOP FARM AUDIO HERO BANNER (१-टॅप शेताचा अहवाल ऐका) */}
      <TouchableOpacity
        style={[
          styles.audioHeroBanner,
          activeSpeakingKey === 'farmSummary' && styles.audioHeroBannerActive,
        ]}
        onPress={() => handleToggleSpeak('farmSummary', farmSpokenSummary)}
        activeOpacity={0.85}>
        <View style={styles.audioHeroLeft}>
          <View style={styles.audioHeroBadge}>
            <Ionicons
              name={activeSpeakingKey === 'farmSummary' ? 'volume-high' : 'sparkles'}
              size={14}
              color="#ffffff"
            />
            <Text style={styles.audioHeroBadgeText}>
              {language === 'mr' ? 'व्हॉइस अहवाल' : language === 'hi' ? 'वॉइस रिपोर्ट' : 'Voice Report'}
            </Text>
          </View>
          <Text style={styles.audioHeroTitle}>
            {activeSpeakingKey === 'farmSummary'
              ? language === 'mr' ? '⏹️ आवाज थांबवा' : language === 'hi' ? '⏹️ आवाज रोकें' : '⏹️ Stop Audio'
              : language === 'mr' ? '🔊 शेताचा अहवाल ऐका' : language === 'hi' ? '🔊 खेत रिपोर्ट सुनें' : '🔊 Listen Farm Report'}
          </Text>
          <Text style={styles.audioHeroSub}>
            {language === 'mr'
              ? 'सर्व पिके, काढणीचे दिवस व शेताची स्थिती एका टॅपने ऐका'
              : language === 'hi'
                ? 'सभी फसलें, कटाई दिन और खेत स्थिति आवाज़ में सुनें'
                : 'Listen to crops status, harvest timeline and farm health'}
          </Text>
        </View>

        <View style={styles.audioPlayCircle}>
          <Ionicons
            name={activeSpeakingKey === 'farmSummary' ? 'stop' : 'volume-high'}
            size={28}
            color={activeSpeakingKey === 'farmSummary' ? '#dc2626' : '#15803d'}
          />
        </View>
      </TouchableOpacity>

      {/* 3. 4 BIG CATEGORY TABS (मोठे पर्याय टॅब्स) */}
      <View style={styles.categoryTabsGrid}>
        {[
          {
            key: 'crops' as const,
            label: language === 'mr' ? '🌾 माझी पिके' : language === 'hi' ? '🌾 फसलें' : '🌾 My Crops',
            sub: `${crops.length} ${language === 'mr' ? 'पिके' : language === 'hi' ? 'फसलें' : 'Crops'}`,
          },
          {
            key: 'plots' as const,
            label: language === 'mr' ? '🗺️ शेताचे तुकडे' : language === 'hi' ? '🗺️ खेत टुकड़े' : '🗺️ Farm Plots',
            sub: `${totalAreaText} ${areaUnitText}`,
          },
          {
            key: 'expenses' as const,
            label: language === 'mr' ? '💰 खर्च व नफा' : language === 'hi' ? '💰 खर्च व लाभ' : '💰 Expenses',
            sub: `₹ ${expenseSummary.totalExpense.toLocaleString('en-IN')}`,
          },
          {
            key: 'advisory' as const,
            label: language === 'mr' ? '🧪 शेती सल्ला' : language === 'hi' ? '🧪 कृषि सलाह' : '🧪 Advisory',
            sub: language === 'mr' ? 'माती व पाणी' : 'Soil & Water',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.categoryTabBtn,
                isActive ? styles.categoryTabBtnActive : styles.categoryTabBtnInactive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.categoryTabLabel,
                  isActive ? styles.categoryTabLabelActive : styles.categoryTabLabelInactive,
                ]}>
                {tab.label}
              </Text>
              <Text
                style={[
                  styles.categoryTabSub,
                  isActive ? styles.categoryTabSubActive : styles.categoryTabSubInactive,
                ]}>
                {tab.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. TOTAL LAND & SOIL HEALTH SUMMARY CARD */}
      <View style={styles.totalLandCard}>
        <View style={styles.totalLandTopRow}>
          <View>
            <Text style={styles.totalLandLabel}>
              {language === 'mr' ? 'एकूण शेत जमीन (Total Area)' : language === 'hi' ? 'कुल खेत क्षेत्र' : 'Total Farm Area'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
              <Text style={styles.totalLandFigure}>{totalAreaText} {areaUnitText}</Text>
              <Text style={styles.totalLandSubUnit}> ({plots.length} {language === 'mr' ? 'तुकडे' : 'Plots'})</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addCropQuickBtn}
            onPress={() => setShowAddCropModal(true)}
            activeOpacity={0.8}>
            <Ionicons name="add-circle" size={18} color="#ffffff" />
            <Text style={styles.addCropQuickText}>
              {language === 'mr' ? '+ नवीन पीक' : language === 'hi' ? '+ नई फसल' : '+ Add Crop'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Quick Farm Health Metrics */}
        <View style={styles.farmMetricsRow}>
          <View style={styles.farmMetricBox}>
            <Ionicons name="shield-checkmark" size={18} color="#15803d" />
            <Text style={styles.farmMetricVal}>
              {language === 'mr' ? 'उत्कृष्ट' : language === 'hi' ? 'उत्कृष्ट' : 'Good'}
            </Text>
            <Text style={styles.farmMetricLbl}>
              {language === 'mr' ? 'आरोग्य' : language === 'hi' ? 'स्वास्थ्य' : 'Health'}
            </Text>
          </View>
          <View style={styles.farmMetricDivider} />
          <View style={styles.farmMetricBox}>
            <Ionicons name="water" size={18} color="#0284c7" />
            <Text style={styles.farmMetricVal}>६२%</Text>
            <Text style={styles.farmMetricLbl}>
              {language === 'mr' ? 'ओलावा' : language === 'hi' ? 'नमी' : 'Moisture'}
            </Text>
          </View>
          <View style={styles.farmMetricDivider} />
          <View style={styles.farmMetricBox}>
            <MaterialCommunityIcons name="sprout" size={18} color="#15803d" />
            <Text style={styles.farmMetricVal}>{crops.length} {language === 'mr' ? 'पिके' : language === 'hi' ? 'फसलें' : 'Crops'}</Text>
            <Text style={styles.farmMetricLbl}>
              {language === 'mr' ? 'लागवड' : language === 'hi' ? 'फसलें' : 'Active'}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. TAB 1: CROPS LIST (माझी पिके) */}
      {activeTab === 'crops' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? `माझी सक्रिय पिके (${crops.length})` : language === 'hi' ? `मेरी सक्रिय फसलें (${crops.length})` : `Active Crops (${crops.length})`}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'पिकांची माहिती व काढणीचे दिवस' : language === 'hi' ? 'फसल विवरण और कटाई दिन' : 'Crop details & harvest schedule'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.tasksBtnTop}
              onPress={() => router.push('/tasks')}
              activeOpacity={0.7}>
              <Ionicons name="checkbox-outline" size={16} color="#15803d" />
              <Text style={styles.tasksBtnTopText}>
                {language === 'mr' ? 'कामे तपासा' : language === 'hi' ? 'कार्य देखें' : 'Tasks'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Full-width High-Contrast Crop Cards */}
          <View style={styles.cropsCardsStack}>
            {cropsList.map((crop) => {
              const isSpeakingThisCrop = activeSpeakingKey === `crop_${crop.id}`;
              return (
                <View key={crop.id} style={styles.farmerCropCard}>
                  {/* Top Row: Photo + Name + Acre + Audio Button */}
                  <View style={styles.cropCardTopRow}>
                    <Image source={{ uri: crop.image }} style={styles.cropBigPhoto} />

                    <View style={styles.cropDetailsCenter}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.cropBigName}>{crop.name}</Text>
                        <Text style={styles.cropAreaBadgeText}>{crop.area}</Text>
                      </View>
                      <Text style={styles.cropVarietyLabel}>जात: {crop.variety}</Text>
                      <Text style={styles.cropPlotLabel}>📍 {crop.plotName}</Text>
                    </View>
                  </View>

                  {/* Stage & Harvest Countdown Row */}
                  <View style={styles.cropBadgesRow}>
                    <View style={[styles.stagePill, { backgroundColor: crop.stageBg }]}>
                      <Text style={[styles.stagePillText, { color: crop.stageColor }]}>
                        ● {crop.stage}
                      </Text>
                    </View>

                    <View style={styles.harvestPill}>
                      <Text style={styles.harvestPillText}>⏳ {crop.daysLeft}</Text>
                    </View>
                  </View>

                  {/* Visual Growth Progress Bar */}
                  <View style={styles.growthProgressContainer}>
                    <View style={styles.growthLabelsRow}>
                      <Text style={styles.growthLabelLeft}>
                        {language === 'mr' ? 'पिकाची वाढ (Growth):' : language === 'hi' ? 'फसल वृद्धि:' : 'Crop Growth:'}
                      </Text>
                      <Text style={[styles.growthLabelRight, { color: crop.progressColor }]}>
                        {crop.progress}
                      </Text>
                    </View>
                    <View style={styles.growthTrack}>
                      <View
                        style={[
                          styles.growthFill,
                          { width: crop.progress as any, backgroundColor: crop.progressColor },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Farmer Action Advice Box */}
                  <View style={styles.cropAdviceBox}>
                    <MaterialCommunityIcons name="lightbulb-on" size={16} color="#15803d" />
                    <Text style={styles.cropAdviceText}>
                      <Text style={{ fontWeight: '800' }}>
                        {language === 'mr' ? 'सल्ला: ' : language === 'hi' ? 'सलाह: ' : 'Advice: '}
                      </Text>
                      {crop.advice}
                    </Text>
                  </View>

                  {/* Bottom Action Buttons: 🔊 Listen, 📸 Scan, ℹ️ Details */}
                  <View style={styles.cropActionButtonsRow}>
                    {/* 1-Tap Audio Button */}
                    <TouchableOpacity
                      style={[
                        styles.cropAudioBtn,
                        isSpeakingThisCrop && styles.cropAudioBtnActive,
                      ]}
                      onPress={() => handleToggleSpeak(`crop_${crop.id}`, crop.spokenText)}
                      activeOpacity={0.7}>
                      <Ionicons
                        name={isSpeakingThisCrop ? 'stop-circle' : 'volume-high'}
                        size={18}
                        color={isSpeakingThisCrop ? '#ffffff' : '#15803d'}
                      />
                      <Text
                        style={[
                          styles.cropAudioBtnText,
                          isSpeakingThisCrop && styles.cropAudioBtnTextActive,
                        ]}>
                        {isSpeakingThisCrop
                          ? language === 'mr' ? 'थांबवा' : language === 'hi' ? 'रोकें' : 'Stop'
                          : language === 'mr' ? '🔊 ऐका' : language === 'hi' ? '🔊 सुनें' : '🔊 Listen'}
                      </Text>
                    </TouchableOpacity>

                    {/* Scan Disease Button */}
                    <TouchableOpacity
                      style={styles.cropScanBtn}
                      onPress={() => router.push('/(tabs)/scan')}
                      activeOpacity={0.7}>
                      <Ionicons name="camera" size={16} color="#15803d" />
                      <Text style={styles.cropScanBtnText}>
                        {language === 'mr' ? 'रोग निदान' : language === 'hi' ? 'रोग जांच' : 'Scan'}
                      </Text>
                    </TouchableOpacity>

                    {/* View Details Button */}
                    <TouchableOpacity
                      style={styles.cropDetailsBtn}
                      onPress={() => router.push('/crop-details')}
                      activeOpacity={0.7}>
                      <Text style={styles.cropDetailsBtnText}>
                        {language === 'mr' ? 'माहिती →' : language === 'hi' ? 'विवरण →' : 'Details →'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 6. TAB 2: PLOTS & LAND (शेताचे तुकडे) */}
      {activeTab === 'plots' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? `शेताचे तुकडे (${plots.length || cropsList.length})` : `Farm Plots (${plots.length || cropsList.length})`}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'तुकड्यावर टॅप करून सविस्तर माहिती पहा' : language === 'hi' ? 'टुकड़े पर टैप करके विवरण देखें' : 'Tap a plot to view details'}
              </Text>
            </View>
          </View>

          {/* Interactive Visual Plot Tiles */}
          <View style={styles.plotsGridContainer}>
            {cropsList.map((crop) => {
              const isSelected = selectedPlotId === crop.id;
              return (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.plotTileCard,
                    isSelected && styles.plotTileCardSelected,
                  ]}
                  onPress={() => setSelectedPlotId(crop.id)}
                  activeOpacity={0.8}>
                  <View style={[styles.plotCropIconCircle, { backgroundColor: crop.stageBg }]}>
                    <MaterialCommunityIcons
                      name="sprout"
                      size={24}
                      color={crop.stageColor}
                    />
                  </View>

                  <Text style={styles.plotTileName}>{crop.name}</Text>
                  <Text style={styles.plotTileArea}>{crop.area}</Text>
                  <View style={styles.plotTileBadge}>
                    <Text style={styles.plotTileBadgeText}>{crop.plotName}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Plot Detail Card */}
          {selectedPlotCrop && (
            <View style={styles.selectedPlotCard}>
              <View style={styles.selectedPlotHeaderRow}>
                <View>
                  <Text style={styles.selectedPlotTitle}>
                    📍 {selectedPlotCrop.plotName}: {selectedPlotCrop.name}
                  </Text>
                  <Text style={styles.selectedPlotArea}>
                    क्षेत्र: {selectedPlotCrop.area} • जात: {selectedPlotCrop.variety}
                  </Text>
                </View>
                <View style={[styles.stagePill, { backgroundColor: selectedPlotCrop.stageBg }]}>
                  <Text style={[styles.stagePillText, { color: selectedPlotCrop.stageColor }]}>
                    {selectedPlotCrop.stage}
                  </Text>
                </View>
              </View>

              <View style={styles.selectedPlotMetricsGrid}>
                <View style={styles.plotMetricItem}>
                  <Text style={styles.plotMetricVal}>{selectedPlotCrop.sowingDate}</Text>
                  <Text style={styles.plotMetricLbl}>पेरणी तारीख</Text>
                </View>
                <View style={styles.plotMetricItem}>
                  <Text style={[styles.plotMetricVal, { color: '#b45309' }]}>
                    {selectedPlotCrop.daysLeft}
                  </Text>
                  <Text style={styles.plotMetricLbl}>काढणी वेळ</Text>
                </View>
                <View style={styles.plotMetricItem}>
                  <Text style={[styles.plotMetricVal, { color: '#15803d' }]}>६२%</Text>
                  <Text style={styles.plotMetricLbl}>माती ओलावा</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.plotActionBtn}
                onPress={() => router.push('/crop-details')}
                activeOpacity={0.8}>
                <Text style={styles.plotActionBtnText}>
                  {language === 'mr' ? 'या तुकड्याचे व्यवस्थापन करा →' : language === 'hi' ? 'इस टुकड़े का प्रबंधन करें →' : 'Manage this plot →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* 7. TAB 3: EXPENSES & PROFIT (खर्च व नफा हिशोब) */}
      {activeTab === 'expenses' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? 'शेती खर्च व नफा हिशोब' : language === 'hi' ? 'खर्च व लाभ हिसाब' : 'Farm Cost & Profit'}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'चालू हंगाम (खरीप २०२६)' : language === 'hi' ? 'वर्तमान सत्र (खरीफ २०२६)' : 'Current Season (Kharif 2026)'}
              </Text>
            </View>
          </View>

          {/* Income vs Expense Cards */}
          <View style={styles.financialSummaryGrid}>
            <View style={[styles.financeCard, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
              <Text style={styles.financeLabel}>
                {language === 'mr' ? 'एकूण खर्च' : language === 'hi' ? 'कुल खर्च' : 'Total Cost'}
              </Text>
              <Text style={[styles.financeFigure, { color: '#dc2626' }]}>
                ₹ {expenseSummary.totalExpense.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>नोंदणीकृत खर्च</Text>
            </View>

            <View style={[styles.financeCard, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
              <Text style={styles.financeLabel}>
                {language === 'mr' ? 'उत्पन्न (विक्री)' : language === 'hi' ? 'अनुमानित आय' : 'Expected Return'}
              </Text>
              <Text style={[styles.financeFigure, { color: '#15803d' }]}>
                ₹ {expenseSummary.totalRevenue > 0 ? expenseSummary.totalRevenue.toLocaleString('en-IN') : (expenseSummary.totalExpense > 0 ? (expenseSummary.totalExpense * 2.5).toLocaleString('en-IN') : '०')}
              </Text>
              <Text style={styles.financeSub}>शेती उत्पन्न</Text>
            </View>
          </View>

          {/* Net Profit Banner */}
          <View style={styles.netProfitBanner}>
            <View>
              <Text style={styles.netProfitLabel}>
                {language === 'mr' ? '💰 अपेक्षित नफा (Net Profit):' : language === 'hi' ? '💰 अनुमानित लाभ:' : '💰 Net Profit:'}
              </Text>
              <Text style={styles.netProfitFigure}>
                {expenseSummary.netProfit >= 0 ? `+ ₹ ${expenseSummary.netProfit.toLocaleString('en-IN')}` : `- ₹ ${Math.abs(expenseSummary.netProfit).toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>

          {/* Detailed Breakdown List */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>
              {language === 'mr' ? 'खर्चाचा तपशील:' : language === 'hi' ? 'खर्च का विवरण:' : 'Expense Breakdown:'}
            </Text>
            {[
              { item: '🌱 बियाणे (Seeds)', cost: expenseSummary.byCategory['seeds'] || 0 },
              { item: '🧪 खते व औषधे (Fertilizers & Pesticides)', cost: (expenseSummary.byCategory['fertilizer'] || 0) + (expenseSummary.byCategory['pesticide'] || 0) },
              { item: '🚜 नांगरणी व मजुरी (Tractor & Labor)', cost: (expenseSummary.byCategory['machinery'] || 0) + (expenseSummary.byCategory['labour'] || 0) },
              { item: '💧 सिंचन (Irrigation)', cost: expenseSummary.byCategory['irrigation'] || 0 },
              { item: '📦 इतर (Other)', cost: expenseSummary.byCategory['other'] || 0 },
            ].map((entry, idx) => (
              <View key={idx} style={styles.breakdownRow}>
                <Text style={styles.breakdownItemText}>{entry.item}</Text>
                <Text style={styles.breakdownCostText}>₹ {entry.cost.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 8. TAB 4: ADVISORY (शेती सल्ला) */}
      {activeTab === 'advisory' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? 'कृषी सल्ला व सेवा' : language === 'hi' ? 'कृषि सलाह व सेवाएं' : 'Farm Services & Advisory'}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'माती, पाणी आणि खत नियोजन' : language === 'hi' ? 'मिट्टी, पानी व खाद योजना' : 'Soil, water and fertilizer management'}
              </Text>
            </View>
          </View>

          <View style={styles.advisoryServicesCol}>
            {/* 1. Soil Testing */}
            <TouchableOpacity style={styles.advisoryServiceCard} activeOpacity={0.8}>
              <View style={[styles.advisoryIconBox, { backgroundColor: '#e8f5e9' }]}>
                <MaterialCommunityIcons name="sprout" size={26} color="#15803d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryServiceTitle}>
                  {language === 'mr' ? 'माती परीक्षण (Soil Health)' : language === 'hi' ? 'मिट्टी परीक्षण' : 'Soil Health Testing'}
                </Text>
                <Text style={styles.advisoryServiceDesc}>
                  {language === 'mr'
                    ? 'मातीतील नत्र, स्फुरद, पालाश (NPK) व सामू (pH) ७.२ (चांगला)'
                    : language === 'hi'
                      ? 'मिट्टी में NPK और pH ७.२ (अच्छा)'
                      : 'NPK nutrients and soil pH 7.2'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 2. Irrigation */}
            <TouchableOpacity style={styles.advisoryServiceCard} activeOpacity={0.8}>
              <View style={[styles.advisoryIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="water" size={26} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryServiceTitle}>
                  {language === 'mr' ? 'पाणी व्यवस्थापन (Irrigation)' : language === 'hi' ? 'सिंचाई प्रबंधन' : 'Water Management'}
                </Text>
                <Text style={styles.advisoryServiceDesc}>
                  {language === 'mr'
                    ? 'ठिबक सिंचनाची वेळ: मक्यासाठी सकाळी ७ ते ९ वाजता'
                    : language === 'hi'
                      ? 'ड्रिप सिंचाई समय: सुबह ७ से ९ बजे'
                      : 'Drip schedule: Morning 7 to 9 AM'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 3. Fertilizer Schedule */}
            <TouchableOpacity style={styles.advisoryServiceCard} activeOpacity={0.8}>
              <View style={[styles.advisoryIconBox, { backgroundColor: '#fef3c7' }]}>
                <MaterialCommunityIcons name="sack" size={26} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryServiceTitle}>
                  {language === 'mr' ? 'खत नियोजन (Fertilizer Plan)' : language === 'hi' ? 'खाद योजना' : 'Fertilizer Schedule'}
                </Text>
                <Text style={styles.advisoryServiceDesc}>
                  {language === 'mr'
                    ? 'कापसासाठी युरिया आणि १९:१९:१९ चा दुसरा हप्ता'
                    : language === 'hi'
                      ? 'कपास के लिए यूरिया व १९:१९:१९ की दूसरी खुराक'
                      : 'Second dose of Urea & 19:19:19 for Cotton'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 9. BIG BUTTON: "+ नवीन पीक जोडा" (Add New Crop) */}
      <TouchableOpacity
        style={styles.addNewCropButton}
        onPress={() => router.push('/crop-details')}
        activeOpacity={0.85}>
        <Ionicons name="add-circle" size={24} color="#ffffff" />
        <Text style={styles.addNewCropButtonText}>
          {language === 'mr' ? '+ नवीन पीक जोडा (Add New Crop)' : language === 'hi' ? '+ नई फसल जोड़ें' : '+ Add New Crop'}
        </Text>
      </TouchableOpacity>

      {/* 10. KISAN CALL CENTER HELPLINE CARD */}
      <View style={styles.helplineCard}>
        <View style={styles.helplineLeftCol}>
          <View style={styles.helplineHeadRow}>
            <Ionicons name="call" size={18} color="#15803d" />
            <Text style={styles.helplineTitle}>
              {language === 'mr' ? 'किसान कॉल सेंटर (टोल-फ्री)' : language === 'hi' ? 'किसान कॉल सेंटर (टोल-फ्री)' : 'Kisan Call Center (Toll-Free)'}
            </Text>
          </View>
          <Text style={styles.helplineNumber}>📞 १८००-१८०-१५५१</Text>
          <Text style={styles.helplineDesc}>
            {language === 'mr'
              ? 'शेताविषयी शासकीय कृषी तज्ञांशी थेट फोनवर मोफत बोला'
              : language === 'hi'
                ? 'खेत समस्याओं पर सरकारी कृषि विशेषज्ञों से सीधे फोन पर बात करें'
                : 'Free direct phone advice from agricultural scientists'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.callNowBtn}
          onPress={handleCallKisanHelpline}
          activeOpacity={0.8}>
          <Ionicons name="call" size={16} color="#ffffff" />
          <Text style={styles.callNowBtnText}>
            {language === 'mr' ? 'कॉल करा' : language === 'hi' ? 'कॉल करें' : 'Call'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Crop Modal */}
      <Modal
        visible={showAddCropModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddCropModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1e293b' }}>
                {language === 'mr' ? 'नवीन पीक जोडा' : 'Add New Crop'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddCropModal(false)}>
                <Ionicons name="close-circle" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 }}>
              {language === 'mr' ? 'पिकाचे नाव (उदा. कांदा, कापूस, सोयाबीन)' : 'Crop Name'}
            </Text>
            <TextInput
              style={{ backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 }}
              placeholder={language === 'mr' ? 'उदा. टोमॅटो' : 'e.g. Tomato'}
              value={newCropName}
              onChangeText={setNewCropName}
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 }}>
              {language === 'mr' ? 'पिकाची जात / व्हरायटी' : 'Variety'}
            </Text>
            <TextInput
              style={{ backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 }}
              placeholder={language === 'mr' ? 'उदा. अभिनव' : 'e.g. Hybrid'}
              value={newCropVariety}
              onChangeText={setNewCropVariety}
            />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 }}>
              {language === 'mr' ? 'क्षेत्र (एकर)' : 'Area (Acres)'}
            </Text>
            <TextInput
              style={{ backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 }}
              placeholder="1.0"
              keyboardType="numeric"
              value={newCropArea}
              onChangeText={setNewCropArea}
            />

            <TouchableOpacity
              style={{ backgroundColor: '#15803d', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={handleSaveCrop}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                {language === 'mr' ? 'पीक जतन करा' : 'Save Crop'}
              </Text>
            </TouchableOpacity>
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
  contentContainer: {
    paddingHorizontal: 14,
  },

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    shadowOpacity: 0.2,
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
  headerRightRow: {
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
    minHeight: 40,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
    fontWeight: '800',
  },

  /* 2. Top Audio Hero Banner */
  audioHeroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15803d',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#166534',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  audioHeroBannerActive: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  audioHeroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  audioHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  audioHeroBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  audioHeroTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  audioHeroSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#dcfce7',
    lineHeight: 17,
  },
  audioPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  /* 3. Category Tabs */
  categoryTabsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  categoryTabBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  categoryTabBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryTabBtnInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  categoryTabLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  categoryTabLabelActive: {
    color: '#ffffff',
  },
  categoryTabLabelInactive: {
    color: '#0f172a',
  },
  categoryTabSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  categoryTabSubActive: {
    color: '#dcfce7',
  },
  categoryTabSubInactive: {
    color: '#64748b',
  },

  /* 4. Total Land Card */
  totalLandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLandTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLandLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  totalLandFigure: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalLandSubUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  addCropQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
  },
  addCropQuickText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  farmMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  farmMetricBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  farmMetricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  farmMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },

  /* Common Section Header */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  tasksBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tasksBtnTopText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },

  /* 5. Crops Cards Stack */
  cropsCardsStack: {
    gap: 12,
  },
  farmerCropCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cropCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cropBigPhoto: {
    width: 68,
    height: 68,
    borderRadius: 14,
    marginRight: 12,
  },
  cropDetailsCenter: {
    flex: 1,
  },
  cropBigName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  cropAreaBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  cropVarietyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  cropPlotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  cropBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  harvestPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  harvestPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  growthProgressContainer: {
    marginBottom: 10,
  },
  growthLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  growthLabelLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  growthLabelRight: {
    fontSize: 12,
    fontWeight: '900',
  },
  growthTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  growthFill: {
    height: '100%',
    borderRadius: 4,
  },
  cropAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  cropAdviceText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
  },
  cropActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 38,
  },
  cropAudioBtnActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  cropAudioBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  cropAudioBtnTextActive: {
    color: '#ffffff',
  },
  cropScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 38,
  },
  cropScanBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  cropDetailsBtn: {
    marginLeft: 'auto',
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  cropDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* 6. Plots Grid */
  plotsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  plotTileCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  plotTileCardSelected: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  plotCropIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  plotTileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  plotTileArea: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 2,
  },
  plotTileBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  plotTileBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  selectedPlotCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 14,
  },
  selectedPlotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedPlotTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  selectedPlotArea: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  selectedPlotMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  plotMetricItem: {
    alignItems: 'center',
  },
  plotMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  plotMetricLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  plotActionBtn: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  plotActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  /* 7. Financial Expenses Tab */
  financialSummaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  financeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  financeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  financeFigure: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  financeSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  netProfitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86efac',
    marginBottom: 12,
  },
  netProfitLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  netProfitFigure: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  profitBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profitBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#15803d',
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  breakdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  breakdownCostText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* 8. Advisory Services Tab */
  advisoryServicesCol: {
    gap: 10,
  },
  advisoryServiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  advisoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisoryServiceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  advisoryServiceDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },

  /* 9. Big Add Crop Button */
  addNewCropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingVertical: 14,
    minHeight: 52,
    marginBottom: 14,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewCropButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },

  /* 10. Helpline Card */
  helplineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helplineLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  helplineHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  helplineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  helplineNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  helplineDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    lineHeight: 16,
  },
  callNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 46,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  callNowBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
