import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, X, Home, Navigation } from 'lucide-react-native';
import { useUserLocation } from '@/context/LocationContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LocationModal() {
  const {
    location,
    isLoading,
    permissionStatus,
    requestLocation,
    reloadFromProfile,
    showLocationModal,
    setShowLocationModal,
  } = useUserLocation();
  const { t, language } = useLanguage();

  return (
    <Modal
      visible={showLocationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowLocationModal(false)}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={() => setShowLocationModal(false)}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <View style={styles.iconCircle}>
                <MapPin size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {language === 'mr' ? 'शेताचे स्थान' : language === 'hi' ? 'खेत का स्थान' : 'Farm Location'}
                </Text>
                <Text style={styles.modalSub}>
                  {language === 'mr' ? 'हवामान व सल्ला क्षेत्र' : 'Weather & Advisory Region'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowLocationModal(false)}
              style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              location.isRegisteredLocation || location.isLive ? styles.statusBadgeLive : styles.statusBadgeDefault,
            ]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: location.isRegisteredLocation || location.isLive ? '#16a34a' : '#f59e0b' },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: location.isRegisteredLocation || location.isLive ? '#16a34a' : '#d97706' },
              ]}>
              {location.isRegisteredLocation
                ? (language === 'mr' ? 'नोंदणीकृत शेत स्थान ✓' : language === 'hi' ? 'पंजीकृत खेत स्थान ✓' : 'Registered Farm Location ✓')
                : location.isLive
                  ? 'Live GPS Location'
                  : 'Default Location'}
            </Text>
          </View>

          {/* Location Info Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'mr' ? 'गाव / तालुका' : 'City / Village'}
              </Text>
              <Text style={styles.infoVal}>{location.displayCity}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'mr' ? 'जिल्हा' : 'District'}
              </Text>
              <Text style={styles.infoVal}>{location.displayDistrict}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'mr' ? 'राज्य' : 'State'}
              </Text>
              <Text style={styles.infoVal}>{location.state}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {language === 'mr' ? 'पिनकोड' : 'Pincode'}
              </Text>
              <Text style={styles.infoVal}>{location.postalCode || '—'}</Text>
            </View>
          </View>

          {/* Action 1: Use Registered Location */}
          <TouchableOpacity
            style={[styles.detectBtn, { backgroundColor: '#15803d', marginBottom: 8 }]}
            onPress={async () => {
              await reloadFromProfile();
              setShowLocationModal(false);
            }}
            activeOpacity={0.8}>
            <Home size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.detectBtnText}>
              {language === 'mr' ? 'नोंदणीकृत शेत स्थान वापरा' : language === 'hi' ? 'पंजीकृत खेत स्थान उपयोग करें' : 'Use Registered Farm Location'}
            </Text>
          </TouchableOpacity>

          {/* Action 2: Refresh / Detect GPS Location */}
          <TouchableOpacity
            style={[styles.detectBtn, { backgroundColor: '#0284c7', marginBottom: 8 }]}
            onPress={() => requestLocation(true)}
            disabled={isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <Navigation size={16} color="#ffffff" style={{ marginRight: 6 }} />
            )}
            <Text style={styles.detectBtnText}>
              {isLoading
                ? 'Detecting GPS...'
                : (language === 'mr' ? 'चालू GPS स्थान तपासा' : 'Detect GPS Location')}
            </Text>
          </TouchableOpacity>

          {/* Done Button */}
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => setShowLocationModal(false)}
            activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>
              {language === 'mr' ? 'बंद करा' : 'Close'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
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
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    gap: 6,
    marginBottom: 14,
  },
  statusBadgeLive: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  statusBadgeDefault: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  coordVal: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#edf2f7',
    marginVertical: 2,
  },
  detectBtn: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detectBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '700',
  },
  doneBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
});
