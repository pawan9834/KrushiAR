import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Toggle States
  const [autoIrrigation, setAutoIrrigation] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [satelliteSync, setSatelliteSync] = useState(false);
  const [offlineSync, setOfflineSync] = useState(true);

  // Unit State
  const [unit, setUnit] = useState<'Acres' | 'Hectares'>('Acres');
  const [language, setLanguage] = useState<'English' | 'मराठी' | 'हिंदी'>('English');

  const handleSupportCall = () => {
    Alert.alert(
      'Krushi Kisan Helpline',
      'Calling 1800-180-1551 (Toll Free Farmer Advisory Desk)',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Call Now' }]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Farmer Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarWrap, { backgroundColor: theme.tintLight }]}>
            <Ionicons name="person" size={32} color={theme.tint} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.text }]}>Ramesh Patil</Text>
              <View style={[styles.verifiedBadge, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={[styles.userContact, { color: theme.subtext }]}>+91 98220 12345</Text>
            <Text style={[styles.userFarmId, { color: theme.subtext }]}>Krushi ID: #KAR-7729</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.editProfileBtn, { borderColor: theme.border }]}>
          <Feather name="edit-2" size={14} color={theme.text} />
          <Text style={[styles.editProfileText, { color: theme.text }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Unit & Localization Preferences */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Farm Units & Language</Text>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Land Unit Selector */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#e0f2fe' }]}>
              <MaterialCommunityIcons name="ruler-square" size={20} color="#0284c7" />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Area Measurement</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>Primary land unit</Text>
            </View>
          </View>
          <View style={[styles.unitToggleGroup, { backgroundColor: theme.background }]}>
            <TouchableOpacity
              onPress={() => setUnit('Acres')}
              style={[
                styles.unitBtn,
                unit === 'Acres' && { backgroundColor: theme.tint },
              ]}>
              <Text
                style={[
                  styles.unitBtnText,
                  { color: unit === 'Acres' ? '#fff' : theme.text },
                ]}>
                Acres
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUnit('Hectares')}
              style={[
                styles.unitBtn,
                unit === 'Hectares' && { backgroundColor: theme.tint },
              ]}>
              <Text
                style={[
                  styles.unitBtnText,
                  { color: unit === 'Hectares' ? '#fff' : theme.text },
                ]}>
                Ha
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Language Selection */}
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="language" size={20} color="#d97706" />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>App Language</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>{language}</Text>
            </View>
          </View>
          <View style={[styles.unitToggleGroup, { backgroundColor: theme.background }]}>
            {(['English', 'मराठी', 'हिंदी'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[
                  styles.unitBtn,
                  language === lang && { backgroundColor: theme.tint },
                ]}>
                <Text
                  style={[
                    styles.unitBtnText,
                    { color: language === lang ? '#fff' : theme.text },
                  ]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* IoT & Automation Controls */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>IoT & Sensor Controls</Text>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="water" size={20} color="#16a34a" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Auto-Irrigation Trigger</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>
                Turn on pump when soil moisture drops below 40%
              </Text>
            </View>
          </View>
          <Switch
            value={autoIrrigation}
            onValueChange={setAutoIrrigation}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={autoIrrigation ? theme.tint : '#f1f5f9'}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="warning-outline" size={20} color="#dc2626" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Extreme Weather Alert</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>
                SMS & push notifications for unseasonal rain & frost
              </Text>
            </View>
          </View>
          <Switch
            value={weatherAlerts}
            onValueChange={setWeatherAlerts}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={weatherAlerts ? theme.tint : '#f1f5f9'}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#fae8ff' }]}>
              <Ionicons name="globe-outline" size={20} color="#9333ea" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Satellite NDVI Sync</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>
                Fetch weekly Sentinel-2 vegetation health scans
              </Text>
            </View>
          </View>
          <Switch
            value={satelliteSync}
            onValueChange={setSatelliteSync}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={satelliteSync ? theme.tint : '#f1f5f9'}
          />
        </View>
      </View>

      {/* Data & Support */}
      <Text style={[styles.sectionHeading, { color: theme.text }]}>Helpdesk & Support</Text>
      <View style={[styles.settingsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity style={styles.settingItem} onPress={handleSupportCall}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="call" size={20} color="#16a34a" />
            </View>
            <View>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Kisan Agronomist Helpline</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>
                Direct consultation with agricultural experts
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIcon, { backgroundColor: '#f1f5f9' }]}>
              <MaterialCommunityIcons name="cloud-sync-outline" size={20} color="#475569" />
            </View>
            <View style={styles.settingTextWrap}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>Offline Data Caching</Text>
              <Text style={[styles.settingSub, { color: theme.subtext }]}>
                Cache farm maps and advisory for low network zones
              </Text>
            </View>
          </View>
          <Switch
            value={offlineSync}
            onValueChange={setOfflineSync}
            trackColor={{ false: '#cbd5e1', true: '#86efac' }}
            thumbColor={offlineSync ? theme.tint : '#f1f5f9'}
          />
        </View>
      </View>

      {/* App Version Info */}
      <View style={styles.versionWrap}>
        <Text style={[styles.versionText, { color: theme.subtext }]}>
          KrushiAR v1.0.0 • Connected to Sensor Hub #104
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  profileCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  userContact: {
    fontSize: 13,
    marginTop: 2,
  },
  userFarmId: {
    fontSize: 11,
    marginTop: 2,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  versionWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  versionText: {
    fontSize: 12,
  },
});
