// app/(tabs)/_layout.tsx
import { Home, Sprout, Camera, BookOpen, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/components/useColorScheme';
import { useLanguage } from '@/context/LanguageContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 0);
  const tabBarHeight = 68 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#475569',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1.5,
          height: tabBarHeight,
          paddingBottom: bottomInset > 0 ? bottomInset + 2 : 8,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12.5,
          fontWeight: '800',
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: language === 'mr' ? 'मुख्य' : language === 'hi' ? 'होम' : 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <Home
                size={24}
                color={focused ? '#15803d' : '#475569'}
                strokeWidth={focused ? 2.5 : 2}
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
              <Sprout
                size={24}
                color={focused ? '#15803d' : '#475569'}
                strokeWidth={focused ? 2.5 : 2}
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
            fontSize: 12.5,
            fontWeight: '900',
            color: '#15803d',
            marginTop: 3,
          },
          tabBarIcon: () => (
            <View style={styles.floatingCenterBtn}>
              <Camera size={26} color="#ffffff" strokeWidth={2.2} />
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
              <BookOpen
                size={24}
                color={focused ? '#15803d' : '#475569'}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: language === 'mr' ? 'माझे खाते' : language === 'hi' ? 'खाता' : 'Account',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
              <User
                size={24}
                color={focused ? '#15803d' : '#475569'}
                strokeWidth={focused ? 2.5 : 2}
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
    width: 54,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  tabIconWrapActive: {
    backgroundColor: '#dcfce7',
  },
  floatingCenterBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#15803d',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    elevation: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});

