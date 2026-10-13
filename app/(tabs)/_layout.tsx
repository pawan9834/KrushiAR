// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/context/LanguageContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 0);
  const tabBarHeight = 62 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#136f42',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingBottom: bottomInset > 0 ? bottomInset : 6,
          paddingTop: 6,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 1,
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: language === 'mr' ? 'मुख्यपृष्ठ' : language === 'hi' ? 'होम' : 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={focused ? '#136f42' : '#64748b'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          title: language === 'mr' ? 'माझी पिके' : language === 'hi' ? 'मेरी फसलें' : 'My Crops',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <MaterialCommunityIcons
                name={focused ? 'sprout' : 'sprout-outline'}
                size={24}
                color={focused ? '#136f42' : '#64748b'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: language === 'mr' ? 'नोंद करा' : language === 'hi' ? 'दर्ज करें' : 'Record',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            color: '#136f42',
            marginTop: 1,
          },
          tabBarIcon: () => (
            <View style={styles.floatingCenterBtn}>
              <Ionicons name="add" size={28} color="#ffffff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: language === 'mr' ? 'इतिहास' : language === 'hi' ? 'इतिहास' : 'History',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={22}
                color={focused ? '#136f42' : '#64748b'}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: language === 'mr' ? 'प्रोफाइल' : language === 'hi' ? 'प्रोफाइल' : 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? '#136f42' : '#64748b'}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 58,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  tabIconWrapActive: {
    backgroundColor: '#e8f5e9',
  },
  floatingCenterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#136f42',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
    elevation: 6,
    shadowColor: '#136f42',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
});
