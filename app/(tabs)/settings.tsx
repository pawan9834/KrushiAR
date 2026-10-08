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
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Global Language Context: 'en' | 'mr' | 'hi'
  const { language, setLanguage, t } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  const handleLogout = () => {
    Alert.alert(
      t.logoutAlertTitle,
      t.logoutAlertMsg,
      [
        { text: t.cancel, style: 'cancel' },
        { text: t.logout, style: 'destructive', onPress: () => console.log('Logged out') },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f8fafc' }]}
      contentContainerStyle={[styles.content, { paddingTop: 12, paddingBottom: 40 }]}
      showsVerticalScrollIndicator={false}>
      {/* 1. Top Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.screenTitle}>{t.screenTitle}</Text>
          <Text style={styles.screenSub}>{t.screenSub}</Text>
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

      {/* 2. Scenic Farm Landscape Backdrop */}
      <View style={styles.backdropWrap}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
          style={styles.backdropImg}
          imageStyle={{ borderRadius: 16 }}>
          <View style={styles.backdropOverlay}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&q=80' }}
              style={styles.backdropFarmerThumb}
            />
          </View>
        </ImageBackground>
      </View>

      {/* 3. Farmer Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileTopRow}>
          {/* Avatar with Camera Badge */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=300&q=80' }}
              style={styles.avatarImg}
            />
            <TouchableOpacity style={styles.cameraBadge}>
              <Ionicons name="camera" size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Profile Details */}
          <View style={styles.profileTextCol}>
            <Text style={styles.farmerName}>Pawankumar Patil</Text>

            <View style={styles.detailRow}>
              <Ionicons name="call" size={12} color="#64748b" />
              <Text style={styles.detailText}>+91 98765 43210</Text>
              <Ionicons name="checkmark-circle" size={13} color="#16a34a" style={{ marginLeft: 2 }} />
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="mail" size={12} color="#64748b" />
              <Text style={styles.detailText} numberOfLines={1}>pawanpatil@gmail.com</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="location-sharp" size={12} color="#64748b" />
              <Text style={styles.detailText} numberOfLines={1}>{location.displayLocation}, {location.state}</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => router.push('/personal-info')}>
            <Feather name="edit-2" size={12} color="#16a34a" />
            <Text style={styles.editProfileText}>{t.editProfile}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 4. 4 Metric Quick Summary Cards */}
      <View style={styles.metricCardsRow}>
        {/* Crops */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => router.push('/(tabs)/farm')}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="sprout" size={18} color="#16a34a" />
          </View>
          <Text style={styles.metricNum}>4</Text>
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricLabel}>{t.crops}</Text>
            <Ionicons name="chevron-forward" size={11} color="#16a34a" />
          </View>
        </TouchableOpacity>

        {/* Acres */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => router.push('/(tabs)/farm')}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="image-filter-hdr" size={18} color="#16a34a" />
          </View>
          <Text style={styles.metricNum}>5.5</Text>
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricLabel}>{t.acres}</Text>
            <Ionicons name="chevron-forward" size={11} color="#16a34a" />
          </View>
        </TouchableOpacity>

        {/* Pending Tasks */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => router.push('/tasks')}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={18} color="#16a34a" />
          </View>
          <Text style={styles.metricNum}>8</Text>
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricLabel} numberOfLines={1}>{t.pendingTasks}</Text>
            <Ionicons name="chevron-forward" size={11} color="#16a34a" />
          </View>
        </TouchableOpacity>

        {/* Farm Health */}
        <TouchableOpacity
          style={styles.metricCard}
          onPress={() => router.push('/(tabs)/farm')}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="trending-up" size={18} color="#16a34a" />
          </View>
          <Text style={styles.metricNum}>{t.farmHealthVal}</Text>
          <View style={styles.metricLabelRow}>
            <Text style={styles.metricLabel} numberOfLines={1}>{t.farmHealth}</Text>
            <Ionicons name="chevron-forward" size={11} color="#16a34a" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 5. Section: Farm Management */}
      <Text style={styles.sectionTitle}>{t.farmMgmt}</Text>
      <View style={styles.groupedCard}>
        {/* My Farm */}
        <TouchableOpacity
          style={styles.groupItemRow}
          onPress={() => router.push('/(tabs)/farm')}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#e8f5e9' }]}>
            <MaterialCommunityIcons name="sprout" size={20} color="#16a34a" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.myFarm}</Text>
            <Text style={styles.groupItemSub}>{t.myFarmSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* My Farm Records */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={20} color="#d97706" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.myFarmRecords}</Text>
            <Text style={styles.groupItemSub}>{t.myFarmRecordsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* My Locations */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="location-sharp" size={20} color="#0284c7" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.myLocations}</Text>
            <Text style={styles.groupItemSub}>{t.myLocationsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* 6. Section: Account Settings */}
      <Text style={styles.sectionTitle}>{t.accountSettings}</Text>
      <View style={styles.groupedCard}>
        {/* Personal Information */}
        <TouchableOpacity 
          style={styles.groupItemRow}
          onPress={() => router.push('/personal-info')}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="person" size={18} color="#9333ea" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.personalInfo}</Text>
            <Text style={styles.groupItemSub}>{t.personalInfoSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* Privacy & Security */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.privacySecurity}</Text>
            <Text style={styles.groupItemSub}>{t.privacySecuritySub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* Notifications */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#ffe4e6' }]}>
            <Ionicons name="notifications" size={18} color="#e11d48" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.notifications}</Text>
            <Text style={styles.groupItemSub}>{t.notificationsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* 7. Section: App & Support */}
      <Text style={styles.sectionTitle}>{t.appSupport}</Text>
      <View style={styles.groupedCard}>
        {/* Language Row with 3 Side-by-Side Radio Buttons */}
        <View style={styles.languageContainer}>
          <View style={styles.languageHeaderRow}>
            <View style={[styles.groupIconWrap, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="globe-outline" size={20} color="#0284c7" />
            </View>
            <View style={styles.groupTextCol}>
              <Text style={styles.groupItemTitle}>{t.language}</Text>
              <Text style={styles.groupItemSub}>{t.languageSub}</Text>
            </View>
          </View>

          {/* Three Radio Buttons Side-by-Side */}
          <View style={styles.radioGroupRow}>
            {([
              { key: 'en', label: 'English' },
              { key: 'mr', label: 'मराठी' },
              { key: 'hi', label: 'हिंदी' },
            ] as const).map((item) => {
              const isSelected = language === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.8}
                  onPress={() => setLanguage(item.key)}
                  style={[
                    styles.radioBtn,
                    isSelected ? styles.radioBtnSelected : styles.radioBtnUnselected,
                  ]}>
                  {/* Circular Radio Indicator */}
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected ? styles.radioCircleSelected : styles.radioCircleUnselected,
                    ]}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>
                  <Text
                    style={[
                      styles.radioLabel,
                      isSelected ? styles.radioLabelSelected : styles.radioLabelUnselected,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.groupDivider} />

        {/* App Settings */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="settings" size={18} color="#d97706" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.appSettings}</Text>
            <Text style={styles.groupItemSub}>{t.appSettingsSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* Help & Support */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="help-circle" size={20} color="#0284c7" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.helpSupport}</Text>
            <Text style={styles.groupItemSub}>{t.helpSupportSub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.groupDivider} />

        {/* About KrushiAR */}
        <TouchableOpacity style={styles.groupItemRow}>
          <View style={[styles.groupIconWrap, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="information-circle" size={20} color="#16a34a" />
          </View>
          <View style={styles.groupTextCol}>
            <Text style={styles.groupItemTitle}>{t.aboutApp}</Text>
            <Text style={styles.groupItemSub}>{t.version}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* 8. Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <MaterialCommunityIcons name="logout" size={18} color="#ef4444" />
        <Text style={styles.logoutBtnText}>{t.logout}</Text>
      </TouchableOpacity>
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
    marginBottom: 10,
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

  /* Backdrop */
  backdropWrap: {
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: -42,
  },
  backdropImg: {
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 163, 74, 0.25)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingRight: 14,
    paddingTop: 8,
  },
  backdropFarmerThumb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#ffffff',
    opacity: 0.9,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16a34a',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  profileTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  farmerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  detailText: {
    fontSize: 11,
    color: '#475569',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 3,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#16a34a',
  },

  /* 4 Metrics */
  metricCardsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 1,
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
  },

  /* Section Headings */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 4,
  },

  /* Grouped Card */
  groupedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
    overflow: 'hidden',
  },
  groupItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  groupIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groupTextCol: {
    flex: 1,
  },
  groupItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  groupItemSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 2,
  },
  groupDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginLeft: 58,
  },

  /* Language Container & Radio Buttons */
  languageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  languageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioGroupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginLeft: 46, // Align nicely below text column
  },
  radioBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    justifyContent: 'center',
  },
  radioBtnSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  radioBtnUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#16a34a',
  },
  radioCircleUnselected: {
    borderColor: '#94a3b8',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  radioLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  radioLabelSelected: {
    color: '#16a34a',
  },
  radioLabelUnselected: {
    color: '#475569',
  },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
    borderRadius: 16,
    paddingVertical: 12,
    gap: 6,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
});
