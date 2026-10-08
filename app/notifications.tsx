import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';

export type NotificationCategory = 'all' | 'tasks' | 'crops' | 'weather' | 'market' | 'system';

interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  timeText: string;
  section: 'today' | 'yesterday' | 'thisWeek';
  isUnread: boolean;
  iconName: string;
  iconType: 'ionicons' | 'mci';
  iconColor: string;
  iconBg: string;
  imageUri?: string;
  isWarning?: boolean;
  route?: string;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('all');

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    // Today
    {
      id: 'notif-1',
      category: 'tasks',
      title: 'Task Reminder',
      description: 'Check soil moisture for Soybean (Plot 1) at 09:00 AM.',
      timeText: '1 hour ago',
      section: 'today',
      isUnread: true,
      iconName: 'checkmark-circle',
      iconType: 'ionicons',
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      route: '/tasks',
    },
    {
      id: 'notif-2',
      category: 'weather',
      title: 'Weather Alert',
      description: 'High temperature (32°C) expected in Chopda today. Consider adjusting irrigation schedule.',
      timeText: '2 hours ago',
      section: 'today',
      isUnread: true,
      iconName: 'sunny',
      iconType: 'ionicons',
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
    },
    {
      id: 'notif-3',
      category: 'crops',
      title: 'Pest Alert',
      description: 'Higher risk of leaf miner detected in Maize crops. Check your field and take preventive measures.',
      timeText: '4 hours ago',
      section: 'today',
      isUnread: true,
      iconName: 'bug',
      iconType: 'ionicons',
      iconColor: '#ef4444',
      iconBg: '#fee2e2',
      imageUri: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=200&q=80',
      isWarning: true,
      route: '/crop-details',
    },
    {
      id: 'notif-4',
      category: 'market',
      title: 'Market Price Update',
      description: 'Soybean price increased by 2%. Current price: ₹4,850 / Qtl',
      timeText: '6 hours ago',
      section: 'today',
      isUnread: true,
      iconName: 'chart-line',
      iconType: 'mci',
      iconColor: '#7c3aed',
      iconBg: '#ede9fe',
      imageUri: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=200&q=80',
      route: '/(tabs)/market',
    },
    // Yesterday
    {
      id: 'notif-5',
      category: 'tasks',
      title: 'Irrigation Completed',
      description: 'Irrigation for Maize (Plot 2) completed successfully.',
      timeText: 'Yesterday, 3:00 PM',
      section: 'yesterday',
      isUnread: false,
      iconName: 'water',
      iconType: 'ionicons',
      iconColor: '#0284c7',
      iconBg: '#e0f2fe',
      route: '/tasks',
    },
    {
      id: 'notif-6',
      category: 'crops',
      title: 'Crop Update',
      description: 'Soybean in Plot 1 has entered flowering stage.',
      timeText: 'Yesterday, 11:20 AM',
      section: 'yesterday',
      isUnread: false,
      iconName: 'sprout',
      iconType: 'mci',
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
      imageUri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=200&q=80',
      route: '/crop-details',
    },
    {
      id: 'notif-7',
      category: 'system',
      title: 'Advisory',
      description: 'Apply foliar spray for micronutrients in Cotton within next 3 days for better yield.',
      timeText: 'Yesterday, 9:00 AM',
      section: 'yesterday',
      isUnread: false,
      iconName: 'notifications',
      iconType: 'ionicons',
      iconColor: '#f59e0b',
      iconBg: '#fef3c7',
    },
    // This Week
    {
      id: 'notif-8',
      category: 'system',
      title: 'Report Ready',
      description: 'Your monthly farm activity report for September 2026 is ready to view.',
      timeText: '5 Oct 2026',
      section: 'thisWeek',
      isUnread: false,
      iconName: 'file-document-outline',
      iconType: 'mci',
      iconColor: '#16a34a',
      iconBg: '#dcfce7',
    },
    {
      id: 'notif-9',
      category: 'system',
      title: 'Expense Alert',
      description: 'You have crossed 70% of your monthly budget. Current expenses: ₹12,450',
      timeText: '4 Oct 2026',
      section: 'thisWeek',
      isUnread: false,
      iconName: 'currency-inr',
      iconType: 'mci',
      iconColor: '#dc2626',
      iconBg: '#fee2e2',
    },
  ]);

  const categories = [
    { key: 'all' as NotificationCategory, label: t.filterAll, icon: 'layers-outline' as const, isMCI: false },
    { key: 'tasks' as NotificationCategory, label: t.filterTasksCat, icon: 'checkmark-circle-outline' as const, isMCI: false },
    { key: 'crops' as NotificationCategory, label: t.filterCropsCat, icon: 'sprout-outline' as const, isMCI: true },
    { key: 'weather' as NotificationCategory, label: t.filterWeatherCat, icon: 'sunny-outline' as const, isMCI: false },
    { key: 'market' as NotificationCategory, label: t.filterMarketCat, icon: 'bar-chart-outline' as const, isMCI: false },
    { key: 'system' as NotificationCategory, label: t.filterSystemCat, icon: 'notifications-outline' as const, isMCI: false },
  ];

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isUnread: false })));
    Alert.alert('Notifications', 'All notifications marked as read.');
  };

  const handleNotificationPress = (item: NotificationItem) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
    );
    // Navigate if route specified
    if (item.route) {
      router.push(item.route as any);
    }
  };

  const filterPredicate = (item: NotificationItem) => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  };

  const todayList = notifications.filter((n) => n.section === 'today').filter(filterPredicate);
  const yesterdayList = notifications.filter((n) => n.section === 'yesterday').filter(filterPredicate);
  const thisWeekList = notifications.filter((n) => n.section === 'thisWeek').filter(filterPredicate);

  const todayUnreadCount = notifications.filter((n) => n.section === 'today' && n.isUnread).length;

  const renderIcon = (item: NotificationItem) => {
    if (item.iconType === 'mci') {
      return <MaterialCommunityIcons name={item.iconName as any} size={20} color={item.iconColor} />;
    }
    return <Ionicons name={item.iconName as any} size={20} color={item.iconColor} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* 1. Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top > 0 ? insets.top + 6 : 24 }]}>
        <View style={styles.headerRow}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          {/* Title & Subtitle */}
          <View style={styles.titleCol}>
            <Text style={styles.screenTitle}>{t.notificationsTitle}</Text>
            <Text style={styles.screenSub}>{t.notifHeaderSub}</Text>
          </View>

          {/* Mark All Read Button */}
          <TouchableOpacity
            style={styles.markReadBtn}
            onPress={handleMarkAllRead}
            activeOpacity={0.8}>
            <Ionicons name="checkmark-done" size={15} color="#16a34a" />
            <Text style={styles.markReadText}>{t.markAllRead}</Text>
          </TouchableOpacity>
        </View>

        {/* 2. Horizontal Filter Pills Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}>
          {categories.map((cat) => {
            const isActive = activeFilter === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveFilter(cat.key)}
                style={[
                  styles.filterPill,
                  isActive ? styles.filterPillActive : styles.filterPillInactive,
                ]}
                activeOpacity={0.8}>
                {cat.isMCI ? (
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={15}
                    color={isActive ? '#ffffff' : '#64748b'}
                  />
                ) : (
                  <Ionicons
                    name={cat.icon as any}
                    size={15}
                    color={isActive ? '#ffffff' : '#64748b'}
                  />
                )}
                <Text
                  style={[
                    styles.filterPillText,
                    isActive ? styles.filterPillTextActive : styles.filterPillTextInactive,
                  ]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Notifications List */}
      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}>
        {/* Section: Today */}
        {todayList.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t.sectionToday}</Text>
              {todayUnreadCount > 0 && (
                <Text style={styles.unreadCountBadge}>
                  {todayUnreadCount} {t.newNotificationsBadge}
                </Text>
              )}
            </View>

            <View style={styles.cardsCol}>
              {todayList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.notifCard,
                    item.isWarning && styles.warningCardBg,
                  ]}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.75}>
                  {/* Icon wrap with unread green dot */}
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    {item.isUnread && <View style={styles.unreadDot} />}
                  </View>

                  {/* Body Col */}
                  <View style={styles.bodyCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color="#94a3b8" />
                      <Text style={styles.timeText}>{item.timeText}</Text>
                    </View>
                  </View>

                  {/* Optional Image Thumbnail */}
                  {item.imageUri && (
                    <Image source={{ uri: item.imageUri }} style={styles.thumbImg} />
                  )}

                  {/* Chevron Right */}
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section: Yesterday */}
        {yesterdayList.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t.sectionYesterday}</Text>
              <Text style={styles.sectionCountText}>{yesterdayList.length}</Text>
            </View>

            <View style={styles.cardsCol}>
              {yesterdayList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.notifCard}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.75}>
                  {/* Icon wrap */}
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    {item.isUnread && <View style={styles.unreadDot} />}
                  </View>

                  {/* Body Col */}
                  <View style={styles.bodyCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color="#94a3b8" />
                      <Text style={styles.timeText}>{item.timeText}</Text>
                    </View>
                  </View>

                  {/* Optional Image Thumbnail */}
                  {item.imageUri && (
                    <Image source={{ uri: item.imageUri }} style={styles.thumbImg} />
                  )}

                  {/* Chevron Right */}
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Section: This Week */}
        {thisWeekList.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t.sectionThisWeek}</Text>
              <Text style={styles.sectionCountText}>{thisWeekList.length}</Text>
            </View>

            <View style={styles.cardsCol}>
              {thisWeekList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.notifCard}
                  onPress={() => handleNotificationPress(item)}
                  activeOpacity={0.75}>
                  {/* Icon wrap */}
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
                      {renderIcon(item)}
                    </View>
                    {item.isUnread && <View style={styles.unreadDot} />}
                  </View>

                  {/* Body Col */}
                  <View style={styles.bodyCol}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={12} color="#94a3b8" />
                      <Text style={styles.timeText}>{item.timeText}</Text>
                    </View>
                  </View>

                  {/* Chevron Right */}
                  <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  titleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  filterPillsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: '#15803d',
  },
  filterPillInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterPillTextInactive: {
    color: '#475569',
  },
  scrollWrap: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  unreadCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  sectionCountText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardsCol: {
    gap: 10,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  warningCardBg: {
    backgroundColor: '#fffdfb',
    borderColor: '#fee2e2',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#16a34a',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bodyCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemDesc: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  thumbImg: {
    width: 52,
    height: 44,
    borderRadius: 8,
    marginLeft: 6,
  },
});
