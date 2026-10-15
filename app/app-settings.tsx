import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Mountain,
  Scale,
  Volume2,
  Sun,
  Check,
  ShieldCheck,
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SETTINGS_STORAGE_PATH = `${FileSystem.documentDirectory}app_user_settings.json`;

interface UserAppSettings {
  areaUnit: 'acre' | 'guntha' | 'hectare' | 'bigha';
  weightUnit: 'quintal' | 'kg' | 'ton';
  voiceGuidance: boolean;
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: UserAppSettings = {
  areaUnit: 'acre',
  weightUnit: 'quintal',
  voiceGuidance: true,
  theme: 'light',
};

export default function AppSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();

  const [settings, setSettings] = useState<UserAppSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(SETTINGS_STORAGE_PATH);
        if (fileInfo.exists) {
          const raw = await FileSystem.readAsStringAsync(SETTINGS_STORAGE_PATH);
          const parsed = JSON.parse(raw);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (err) {
        console.warn('Could not read user settings:', err);
      }
    })();
  }, []);

  const handleSave = async (updated: UserAppSettings) => {
    setSettings(updated);
    try {
      await FileSystem.writeAsStringAsync(
        SETTINGS_STORAGE_PATH,
        JSON.stringify(updated, null, 2)
      );
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.warn('Could not save user settings:', err);
    }
  };

  const areaUnitOptions = [
    { key: 'acre' as const, labelMr: 'एकर (Acre)', labelHi: 'एकड़ (Acre)', labelEn: 'Acre' },
    { key: 'guntha' as const, labelMr: 'गुंठा (Guntha)', labelHi: 'गुंठा (Guntha)', labelEn: 'Guntha' },
    { key: 'hectare' as const, labelMr: 'हेक्टर (Hectare)', labelHi: 'हेक्टेयर (Hectare)', labelEn: 'Hectare' },
    { key: 'bigha' as const, labelMr: 'विघा (Bigha)', labelHi: 'बीघा (Bigha)', labelEn: 'Bigha' },
  ];

  const weightUnitOptions = [
    { key: 'quintal' as const, labelMr: 'क्विंटल (Qtl)', labelHi: 'क्विंटल (Qtl)', labelEn: 'Quintal (Qtl)' },
    { key: 'kg' as const, labelMr: 'किलोग्राम (kg)', labelHi: 'किलोग्राम (kg)', labelEn: 'Kilogram (kg)' },
    { key: 'ton' as const, labelMr: 'टन (Ton)', labelHi: 'टन (Ton)', labelEn: 'Ton' },
  ];

  const getLabel = (opt: { labelMr: string; labelHi: string; labelEn: string }) => {
    if (language === 'mr') return opt.labelMr;
    if (language === 'hi') return opt.labelHi;
    return opt.labelEn;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* 1. Header with Back Button */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back">
            <ArrowLeft size={22} color="#0f172a" />
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{t.appSettings}</Text>
            <Text style={styles.headerSub}>
              {language === 'mr'
                ? 'युनिट्स, आवाज व ऑनलाइन क्लाउड स्टोरेज'
                : language === 'hi'
                  ? 'इकाइयां, ध्वनि एवं ऑनलाइन क्लाउड स्टोरेज'
                  : 'Units, voice & online cloud storage'}
            </Text>
          </View>

          {isSaved ? (
            <View style={styles.savedChip}>
              <CheckCircle2 size={14} color="#16a34a" />
              <Text style={styles.savedText}>
                {language === 'mr' ? 'सेव्ह केले' : language === 'hi' ? 'सहेजा गया' : 'Saved'}
              </Text>
            </View>
          ) : <View style={{ width: 40 }} />}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}>




        {/* Section 2: Farming Measurement Units */}
        <Text style={styles.sectionHeader}>
          {language === 'mr'
            ? 'शेती व मोजमाप युनिट्स'
            : language === 'hi'
              ? 'कृषि एवं माप इकाइयां'
              : 'Farming & Measurement Units'}
        </Text>

        <View style={styles.card}>
          {/* Land Area Unit */}
          <View style={styles.settingBlock}>
            <View style={styles.settingTitleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
                <Mountain size={18} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>
                  {language === 'mr' ? 'जमीन क्षेत्रफळ युनिट' : language === 'hi' ? 'भूमि क्षेत्रफल इकाई' : 'Land Area Unit'}
                </Text>
                <Text style={styles.settingSub}>
                  {language === 'mr'
                    ? 'पिकांच्या नोंदी आणि शेतासाठी प्राथमिक युनिट'
                    : language === 'hi'
                      ? 'फ़सल व खेत के लिए प्राथमिक इकाई'
                      : 'Primary unit used for plots and crops'}
                </Text>
              </View>
            </View>

            <View style={styles.pillsGrid}>
              {areaUnitOptions.map((opt) => {
                const isSelected = settings.areaUnit === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => handleSave({ ...settings, areaUnit: opt.key })}
                    style={[styles.pill, isSelected ? styles.pillSelected : styles.pillUnselected]}
                    activeOpacity={0.8}>
                    {isSelected ? (
                      <CheckCircle2 size={15} color="#16a34a" />
                    ) : (
                      <Circle size={15} color="#94a3b8" />
                    )}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {getLabel(opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Crop Weight Unit */}
          <View style={styles.settingBlock}>
            <View style={styles.settingTitleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
                <Scale size={18} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>
                  {language === 'mr' ? 'उत्पादन वजन युनिट' : language === 'hi' ? 'उत्पादन वज़न इकाई' : 'Harvest Weight Unit'}
                </Text>
                <Text style={styles.settingSub}>
                  {language === 'mr'
                    ? 'कापणी, उत्पादन आणि बाजार भावासाठी'
                    : language === 'hi'
                      ? 'कटाई, उपज और बाज़ार भाव के लिए'
                      : 'Used for harvest quantity & market prices'}
                </Text>
              </View>
            </View>

            <View style={styles.pillsGrid}>
              {weightUnitOptions.map((opt) => {
                const isSelected = settings.weightUnit === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => handleSave({ ...settings, weightUnit: opt.key })}
                    style={[styles.pill, isSelected ? styles.pillSelected : styles.pillUnselected]}
                    activeOpacity={0.8}>
                    {isSelected ? (
                      <CheckCircle2 size={15} color="#16a34a" />
                    ) : (
                      <Circle size={15} color="#94a3b8" />
                    )}
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                      {getLabel(opt)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Section 3: AI & Voice Guidance */}
        <Text style={styles.sectionHeader}>
          {language === 'mr'
            ? 'आवाज आणि AI सहाय्यक'
            : language === 'hi'
              ? 'ध्वनि एवं AI सहायक'
              : 'Voice & AI Assistant'}
        </Text>

        <View style={styles.card}>
          <View style={styles.rowSetting}>
            <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Volume2 size={18} color="#0284c7" />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.settingTitle}>
                {language === 'mr' ? 'AI आवाज मार्गदर्शन' : language === 'hi' ? 'AI आवाज़ मार्गदर्शन' : 'AI Voice Guidance'}
              </Text>
              <Text style={styles.settingSub}>
                {language === 'mr'
                  ? 'हवामान, पीक सल्ला आणि सूचना ऐकण्यासाठी'
                  : language === 'hi'
                    ? 'मौसम, फ़सल सलाह और सूचनाएं सुनने के लिए'
                    : 'Listen to weather & advisory readouts'}
              </Text>
            </View>
            <Switch
              value={settings.voiceGuidance}
              onValueChange={(val) => handleSave({ ...settings, voiceGuidance: val })}
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor={settings.voiceGuidance ? '#16a34a' : '#f8fafc'}
            />
          </View>
        </View>

        {/* Section 4: Display & Appearance */}
        <Text style={styles.sectionHeader}>
          {language === 'mr' ? 'थीम आणि डिस्प्ले' : language === 'hi' ? 'थीम और डिस्प्ले' : 'Theme & Display'}
        </Text>

        <View style={styles.card}>
          <View style={styles.rowSetting}>
            <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
              <Sun size={18} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>
                {language === 'mr' ? 'लाइट थीम (Daylight Mode)' : language === 'hi' ? 'लाइट थीम' : 'Light Mode'}
              </Text>
              <Text style={styles.settingSub}>
                {language === 'mr' ? 'दिवसा शेतात काम करताना स्पष्ट वाचनासाठी' : language === 'hi' ? 'दिन में खेत में स्पष्ट पढ़ने के लिए' : 'Clear readability in daylight'}
              </Text>
            </View>
            <View style={styles.activeThemeBadge}>
              <Check size={13} color="#16a34a" />
              <Text style={styles.activeThemeText}>
                {language === 'mr' ? 'सक्रिय' : language === 'hi' ? 'सक्रिय' : 'Active'}
              </Text>
            </View>
          </View>
        </View>

        {/* System Diagnostics Info */}
        <View style={styles.infoBox}>
          <ShieldCheck size={16} color="#16a34a" />
          <Text style={styles.infoBoxText}>
            KrushiAR v1.0.0 • Cloud Firestore Online Sync Active
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitleCol: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  savedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  savedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  settingBlock: {
    paddingVertical: 4,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  settingSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  pillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 44,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  pillSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  pillUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextSelected: {
    color: '#16a34a',
    fontWeight: '700',
  },
  rowSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16a34a',
  },
  onlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  activeThemeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
  },
  activeThemeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginTop: 4,
  },
  infoBoxText: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
});
