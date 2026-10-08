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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage, Language } from '@/context/LanguageContext';

interface FarmTaskItem {
  id: string;
  titleKey: string;
  subKey: string;
  defaultTitle: string;
  defaultSub: string;
  imageUri: string;
  time: string;
  dateStr?: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  section: 'today' | 'upcoming';
}

export default function FarmTasksScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();

  // Active Filter: all | pending | completed
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Selected Day in horizontal strip (1-7)
  const [selectedDayIndex, setSelectedDayIndex] = useState(1); // Tue 7 Oct is index 1

  // Language Modal state
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // Add Task Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCrop, setNewTaskCrop] = useState('');

  // Weekly Date Strip items
  const weekDays = [
    { dayName: t.dayMon, dayNum: '6', month: t.monthOct },
    { dayName: t.dayTue, dayNum: '7', month: t.monthOct },
    { dayName: t.dayWed, dayNum: '8', month: t.monthOct },
    { dayName: t.dayThu, dayNum: '9', month: t.monthOct },
    { dayName: t.dayFri, dayNum: '10', month: t.monthOct },
    { dayName: t.daySat, dayNum: '11', month: t.monthOct },
    { dayName: t.daySun, dayNum: '12', month: t.monthOct },
  ];

  // Tasks state
  const [tasks, setTasks] = useState<FarmTaskItem[]>([
    // Today's Tasks
    {
      id: 'task-1',
      titleKey: 'taskCheckSoilMoisture',
      subKey: 'taskCheckSoilMoistureSub',
      defaultTitle: 'Check soil moisture',
      defaultSub: 'Soybean • Plot 1 (1.5 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=240&q=80',
      time: '09:00 AM - 10:00 AM',
      priority: 'high',
      completed: true,
      section: 'today',
    },
    {
      id: 'task-2',
      titleKey: 'taskIrrigationTitle',
      subKey: 'taskIrrigationSub',
      defaultTitle: 'Irrigation',
      defaultSub: 'Maize • Plot 2 (2 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=240&q=80',
      time: '02:00 PM - 03:00 PM',
      priority: 'medium',
      completed: false,
      section: 'today',
    },
    {
      id: 'task-3',
      titleKey: 'taskApplyFertilizer',
      subKey: 'taskApplyFertilizerSub',
      defaultTitle: 'Apply fertilizer (Urea)',
      defaultSub: 'Cotton • Plot 3 (1 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=240&q=80',
      time: '04:00 PM - 05:00 PM',
      priority: 'low',
      completed: false,
      section: 'today',
    },
    // Upcoming Tasks
    {
      id: 'task-4',
      titleKey: 'taskWeeding',
      subKey: 'taskWeedingSub',
      defaultTitle: 'Weeding',
      defaultSub: 'Onion • Plot 4 (1 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=240&q=80',
      dateStr: 'Thu, 9 Oct 2026',
      time: '06:00 AM - 08:00 AM',
      priority: 'high',
      completed: false,
      section: 'upcoming',
    },
    {
      id: 'task-5',
      titleKey: 'taskPestMonitoring',
      subKey: 'taskPestMonitoringSub',
      defaultTitle: 'Pest monitoring',
      defaultSub: 'Soybean • Plot 1 (1.5 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=240&q=80',
      dateStr: 'Sat, 11 Oct 2026',
      time: '07:00 AM - 08:00 AM',
      priority: 'medium',
      completed: false,
      section: 'upcoming',
    },
    {
      id: 'task-6',
      titleKey: 'taskFoliarSpray',
      subKey: 'taskFoliarSpraySub',
      defaultTitle: 'Foliar spray',
      defaultSub: 'Maize • Plot 2 (2 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=240&q=80',
      dateStr: 'Mon, 13 Oct 2026',
      time: '04:00 PM - 05:00 PM',
      priority: 'low',
      completed: false,
      section: 'upcoming',
    },
    {
      id: 'task-7',
      titleKey: 'taskHarvestPrep',
      subKey: 'taskHarvestPrepSub',
      defaultTitle: 'Harvest preparation',
      defaultSub: 'Cotton • Plot 3 (1 Acre)',
      imageUri: 'https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=240&q=80',
      dateStr: 'Wed, 15 Oct 2026',
      time: '09:00 AM - 11:00 AM',
      priority: 'medium',
      completed: false,
      section: 'upcoming',
    },
  ]);

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((tItem) =>
        tItem.id === taskId ? { ...tItem, completed: !tItem.completed } : tItem
      )
    );
  };

  const handleAddNewTask = () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Please enter a task title');
      return;
    }
    const newTask: FarmTaskItem = {
      id: `task-${Date.now()}`,
      titleKey: '',
      subKey: '',
      defaultTitle: newTaskTitle.trim(),
      defaultSub: newTaskCrop.trim() ? `${newTaskCrop.trim()} • Plot 1` : 'Farm • Plot 1',
      imageUri: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=240&q=80',
      time: '10:00 AM - 11:00 AM',
      priority: 'medium',
      completed: false,
      section: 'today',
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskCrop('');
    setShowAddModal(false);
  };

  // Filter tasks based on activeFilter
  const filterTaskPredicate = (item: FarmTaskItem) => {
    if (activeFilter === 'pending') return !item.completed;
    if (activeFilter === 'completed') return item.completed;
    return true;
  };

  const todayTasksList = tasks.filter((tItem) => tItem.section === 'today').filter(filterTaskPredicate);
  const upcomingTasksList = tasks.filter((tItem) => tItem.section === 'upcoming').filter(filterTaskPredicate);

  const todayTotalCount = tasks.filter((tItem) => tItem.section === 'today').length;

  const languageOptions: { key: Language; label: string; sub: string }[] = [
    { key: 'en', label: 'English', sub: 'Default' },
    { key: 'mr', label: 'मराठी', sub: 'प्रादेशिक' },
    { key: 'hi', label: 'हिंदी', sub: 'राष्ट्रभाषा' },
  ];

  // Helper for translated task titles
  const getTaskTitle = (item: FarmTaskItem) => {
    if (item.titleKey && (t as any)[item.titleKey]) {
      return (t as any)[item.titleKey];
    }
    return item.defaultTitle;
  };

  // Helper for translated task subtitles
  const getTaskSub = (item: FarmTaskItem) => {
    if (item.subKey && (t as any)[item.subKey]) {
      return (t as any)[item.subKey];
    }
    return item.defaultSub;
  };

  const renderPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') {
      return (
        <View style={[styles.priorityBadge, styles.priorityBadgeHigh]}>
          <Ionicons name="arrow-up" size={11} color="#dc2626" />
          <Text style={[styles.priorityBadgeText, styles.priorityTextHigh]}>{t.priorityHigh}</Text>
        </View>
      );
    }
    if (priority === 'medium') {
      return (
        <View style={[styles.priorityBadge, styles.priorityBadgeMedium]}>
          <Text style={[styles.priorityBadgeText, styles.priorityTextMedium]}>= {t.priorityMedium}</Text>
        </View>
      );
    }
    return (
      <View style={[styles.priorityBadge, styles.priorityBadgeLow]}>
        <Ionicons name="arrow-down" size={11} color="#16a34a" />
        <Text style={[styles.priorityBadgeText, styles.priorityTextLow]}>{t.priorityLow}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#f8fafc' }]}>
      {/* 1. Header with Scenic Rolling Green Farmland & Tractor Backdrop */}
      <View style={styles.headerContainer}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' }}
          style={styles.headerBg}
          resizeMode="cover">
          <View style={styles.headerOverlay}>
            <View style={[styles.headerContentRow, { paddingTop: insets.top > 0 ? insets.top + 6 : 26 }]}>
              {/* Back Button */}
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color="#0f172a" />
              </TouchableOpacity>

              {/* Title & Subtitle */}
              <View style={styles.headerTitlesCol}>
                <Text style={styles.screenTitle}>{t.farmTasksTitle}</Text>
                <Text style={styles.screenSub} numberOfLines={1}>{t.farmTasksSub}</Text>
              </View>

              {/* Quick Language Switcher Chip */}
              <TouchableOpacity
                style={styles.langPillBtn}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}>
                <Ionicons name="globe-outline" size={15} color="#16a34a" />
                <Text style={styles.langPillText}>
                  {language === 'en' ? 'EN' : language === 'mr' ? 'मराठी' : 'हिंदी'}
                </Text>
              </TouchableOpacity>

              {/* Add Task '+' Green Button */}
              <TouchableOpacity
                style={styles.addCircleBtn}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}>
                <Ionicons name="add" size={22} color="#ffffff" />
              </TouchableOpacity>

              {/* 3-Dots Menu Button */}
              <TouchableOpacity
                style={styles.menuCircleBtn}
                onPress={() => setShowLanguageModal(true)}
                activeOpacity={0.8}>
                <Ionicons name="ellipsis-vertical" size={18} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>
      </View>

      <ScrollView
        style={styles.scrollWrap}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 85 }]}
        showsVerticalScrollIndicator={false}>
        {/* 2. Status Filter Tabs (All Tasks | Pending | Completed) */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[
              styles.filterTabPill,
              activeFilter === 'all' ? styles.filterTabActive : styles.filterTabInactive,
            ]}
            onPress={() => setActiveFilter('all')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'all' ? styles.filterTabTextActive : styles.filterTabTextInactive,
              ]}>
              {t.allTasks}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTabPill,
              activeFilter === 'pending' ? styles.filterTabActive : styles.filterTabInactive,
            ]}
            onPress={() => setActiveFilter('pending')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'pending' ? styles.filterTabTextActive : styles.filterTabTextInactive,
              ]}>
              {t.pendingTasksTab}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterTabPill,
              activeFilter === 'completed' ? styles.filterTabActive : styles.filterTabInactive,
            ]}
            onPress={() => setActiveFilter('completed')}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.filterTabText,
                activeFilter === 'completed' ? styles.filterTabTextActive : styles.filterTabTextInactive,
              ]}>
              {t.completedTasksTab}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Horizontal Weekly Calendar Date Selector Strip */}
        <View style={styles.weeklyStripRow}>
          {weekDays.map((dayItem, index) => {
            const isSelected = selectedDayIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  isSelected ? styles.dayCardSelected : styles.dayCardUnselected,
                ]}
                onPress={() => setSelectedDayIndex(index)}
                activeOpacity={0.8}>
                <Text
                  style={[
                    styles.dayNameText,
                    isSelected ? styles.dayNameSelected : styles.dayNameUnselected,
                  ]}>
                  {dayItem.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayNumText,
                    isSelected ? styles.dayNumSelected : styles.dayNumUnselected,
                  ]}>
                  {dayItem.dayNum}
                </Text>
                <Text
                  style={[
                    styles.dayMonthText,
                    isSelected ? styles.dayMonthSelected : styles.dayMonthUnselected,
                  ]}>
                  {dayItem.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Section 1: Today's Tasks */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleLeft}>
            <Text style={styles.sectionTitleText}>{t.todaysTasksSection}</Text>
            <View style={styles.taskCountBadge}>
              <Text style={styles.taskCountBadgeText}>{todayTotalCount}</Text>
            </View>
          </View>
          <Text style={styles.sectionDateSubText}>
            {weekDays[selectedDayIndex].dayName}, {weekDays[selectedDayIndex].dayNum} {weekDays[selectedDayIndex].month} 2026
          </Text>
        </View>

        {/* Today's Tasks List */}
        <View style={styles.taskListCol}>
          {todayTasksList.map((item) => {
            const isChecked = item.completed;
            return (
              <View key={item.id} style={styles.taskCard}>
                {/* Crop Thumbnail */}
                <Image source={{ uri: item.imageUri }} style={styles.taskThumb} />

                {/* Middle Info */}
                <View style={styles.taskInfoCol}>
                  <Text
                    style={[
                      styles.taskItemTitle,
                      isChecked && styles.taskTitleCompleted,
                    ]}
                    numberOfLines={1}>
                    {getTaskTitle(item)}
                  </Text>
                  <Text style={styles.taskItemSub} numberOfLines={1}>
                    {getTaskSub(item)}
                  </Text>

                  {/* Time & Priority Row */}
                  <View style={styles.metaRow}>
                    <View style={styles.timeWrap}>
                      <Ionicons name="time-outline" size={13} color="#64748b" />
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                    {renderPriorityBadge(item.priority)}
                  </View>
                </View>

                {/* Checkbox and 3-dots actions */}
                <View style={styles.cardActionsCol}>
                  <TouchableOpacity
                    style={[
                      styles.checkboxWrap,
                      isChecked ? styles.checkboxChecked : styles.checkboxUnchecked,
                    ]}
                    onPress={() => toggleTaskCompletion(item.id)}
                    activeOpacity={0.8}>
                    {isChecked && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.taskDotsBtn} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-vertical" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* 5. Section 2: Upcoming Tasks */}
        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
          <Text style={styles.sectionTitleText}>{t.upcomingTasksSection}</Text>
          <Text style={styles.sectionDateSubText}>{t.next7Days}</Text>
        </View>

        {/* Upcoming Tasks List */}
        <View style={styles.taskListCol}>
          {upcomingTasksList.map((item) => {
            const isChecked = item.completed;
            return (
              <View key={item.id} style={styles.taskCard}>
                {/* Crop Thumbnail */}
                <Image source={{ uri: item.imageUri }} style={styles.taskThumb} />

                {/* Middle Info */}
                <View style={styles.taskInfoCol}>
                  <Text
                    style={[
                      styles.taskItemTitle,
                      isChecked && styles.taskTitleCompleted,
                    ]}
                    numberOfLines={1}>
                    {getTaskTitle(item)}
                  </Text>
                  <Text style={styles.taskItemSub} numberOfLines={1}>
                    {getTaskSub(item)}
                  </Text>

                  {/* Date, Time & Priority Row */}
                  <View style={styles.metaRowUpcoming}>
                    {item.dateStr && (
                      <View style={styles.dateWrap}>
                        <Ionicons name="calendar-outline" size={12} color="#64748b" />
                        <Text style={styles.dateText}>{item.dateStr}</Text>
                      </View>
                    )}
                    <View style={styles.timeWrap}>
                      <Ionicons name="time-outline" size={12} color="#64748b" />
                      <Text style={styles.timeText}>{item.time}</Text>
                    </View>
                    {renderPriorityBadge(item.priority)}
                  </View>
                </View>

                {/* Checkbox and 3-dots actions */}
                <View style={styles.cardActionsCol}>
                  <TouchableOpacity
                    style={[
                      styles.checkboxWrap,
                      isChecked ? styles.checkboxChecked : styles.checkboxUnchecked,
                    ]}
                    onPress={() => toggleTaskCompletion(item.id)}
                    activeOpacity={0.8}>
                    {isChecked && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.taskDotsBtn} activeOpacity={0.7}>
                    <Ionicons name="ellipsis-vertical" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Floating Navigation Bar (matching reference mockup) */}
      <View style={[styles.bottomNavBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 10 }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)')}
          activeOpacity={0.7}>
          <Ionicons name="home-outline" size={22} color="#64748b" />
          <Text style={styles.navLabel}>{t.tabHome}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/farm')}
          activeOpacity={0.7}>
          <MaterialCommunityIcons name="sprout-outline" size={22} color="#16a34a" />
          <Text style={[styles.navLabel, { color: '#16a34a', fontWeight: '700' }]}>{t.tabFarm}</Text>
        </TouchableOpacity>

        {/* Center Green Floating AR Scan Button */}
        <View style={styles.centerFabContainer}>
          <TouchableOpacity
            style={styles.fabBtn}
            onPress={() => router.push('/(tabs)/scan')}
            activeOpacity={0.85}>
            <Ionicons name="camera" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.fabLabel}>{t.tabScan}</Text>
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/market')}
          activeOpacity={0.7}>
          <Ionicons name="storefront-outline" size={22} color="#64748b" />
          <Text style={styles.navLabel}>{t.tabMarket}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/settings')}
          activeOpacity={0.7}>
          <Ionicons name="person-outline" size={22} color="#64748b" />
          <Text style={styles.navLabel}>{t.tabProfile}</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Ionicons name="globe-outline" size={20} color="#16a34a" />
                <Text style={styles.modalTitle}>{t.selectLanguageModalTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.radioGroup}>
              {languageOptions.map((item) => {
                const isSelected = language === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLanguage(item.key);
                      setShowLanguageModal(false);
                    }}
                    style={[
                      styles.langRadioCard,
                      isSelected && styles.langRadioCardActive,
                    ]}>
                    <View style={styles.langRadioLeft}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View>
                        <Text style={[styles.langRadioLabel, isSelected && styles.langRadioLabelActive]}>
                          {item.label}
                        </Text>
                        <Text style={styles.langRadioSub}>{item.sub}</Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add New Task Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleWrap}>
                <Ionicons name="add-circle" size={22} color="#16a34a" />
                <Text style={styles.modalTitle}>{t.newTaskTitle}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View>
                <Text style={styles.inputLabel}>Task Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Drip Irrigation check"
                  placeholderTextColor="#94a3b8"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Crop & Plot</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Cotton, Plot 2"
                  placeholderTextColor="#94a3b8"
                  value={newTaskCrop}
                  onChangeText={setNewTaskCrop}
                />
              </View>

              <TouchableOpacity
                style={styles.submitTaskBtn}
                onPress={handleAddNewTask}
                activeOpacity={0.8}>
                <Text style={styles.submitTaskBtnText}>{t.addTask}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    overflow: 'hidden',
  },
  headerBg: {
    width: '100%',
  },
  headerOverlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingBottom: 14,
  },
  headerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  backBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitlesCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  screenSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  langPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  addCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  menuCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scrollWrap: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  /* 2. Filter Tabs */
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterTabPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#15803d',
  },
  filterTabInactive: {
    backgroundColor: '#f1f5f9',
  },
  filterTabText: {
    fontSize: 13,
  },
  filterTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  filterTabTextInactive: {
    color: '#475569',
    fontWeight: '600',
  },

  /* 3. Weekly Date Strip */
  weeklyStripRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  dayCard: {
    flex: 1,
    marginHorizontal: 2.5,
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  dayCardSelected: {
    backgroundColor: '#166534',
    borderColor: '#166534',
    ...Platform.select({
      ios: {
        shadowColor: '#166534',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 2.5,
      },
    }),
  },
  dayCardUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  dayNameText: {
    fontSize: 10,
    marginBottom: 2,
  },
  dayNameSelected: {
    color: '#dcfce7',
    fontWeight: '600',
  },
  dayNameUnselected: {
    color: '#64748b',
    fontWeight: '500',
  },
  dayNumText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 1,
  },
  dayNumSelected: {
    color: '#ffffff',
  },
  dayNumUnselected: {
    color: '#0f172a',
  },
  dayMonthText: {
    fontSize: 9.5,
  },
  dayMonthSelected: {
    color: '#dcfce7',
    fontWeight: '500',
  },
  dayMonthUnselected: {
    color: '#64748b',
  },

  /* 4. Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  taskCountBadge: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  taskCountBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionDateSubText: {
    fontSize: 11.5,
    color: '#64748b',
  },

  /* 5. Tasks List */
  taskListCol: {
    gap: 10,
  },
  taskCard: {
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
        elevation: 1.2,
      },
    }),
  },
  taskThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    marginRight: 12,
  },
  taskInfoCol: {
    flex: 1,
  },
  taskItemTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  taskItemSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaRowUpcoming: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
  },

  /* Priority Badges */
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 3,
  },
  priorityBadgeHigh: {
    backgroundColor: '#fee2e2',
  },
  priorityBadgeMedium: {
    backgroundColor: '#ffedd5',
  },
  priorityBadgeLow: {
    backgroundColor: '#dcfce7',
  },
  priorityBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  priorityTextHigh: {
    color: '#dc2626',
  },
  priorityTextMedium: {
    color: '#ea580c',
  },
  priorityTextLow: {
    color: '#16a34a',
  },

  /* Card Actions Col */
  cardActionsCol: {
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  checkboxWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
  },
  checkboxUnchecked: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  taskDotsBtn: {
    padding: 2,
  },

  /* Bottom Nav Bar */
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  centerFabContainer: {
    alignItems: 'center',
    top: -12,
  },
  fabBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  fabLabel: {
    fontSize: 10,
    color: '#16a34a',
    fontWeight: '700',
    marginTop: 2,
  },

  /* Language Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  radioGroup: {
    gap: 10,
  },
  langRadioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  langRadioCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  langRadioLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#16a34a',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
  },
  langRadioLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  langRadioLabelActive: {
    color: '#16a34a',
  },
  langRadioSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },

  /* Add Task Form */
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  submitTaskBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitTaskBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
