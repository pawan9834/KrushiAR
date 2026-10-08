import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

import { LanguageProvider } from '@/context/LanguageContext';
import { LocationProvider } from '@/context/LocationContext';
import LocationModal from '@/components/LocationModal';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <LanguageProvider>
      <LocationProvider>
        <RootLayoutNav />
        <LocationModal />
      </LocationProvider>
    </LanguageProvider>
  );
}

function RootLayoutNav() {
  const insets = useSafeAreaInsets();
  const brandGreen = '#16a34a';

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBackgroundColor(brandGreen);
      RNStatusBar.setBarStyle('light-content');
    }
  }, [brandGreen]);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Branded Status Bar Background (where time, battery, wifi render) */}
      <View style={{ height: insets.top, backgroundColor: brandGreen }} />
      <RNStatusBar
        backgroundColor={brandGreen}
        barStyle="light-content"
        translucent={true}
      />
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="personal-info" options={{ headerShown: false }} />
        <Stack.Screen name="crop-details" options={{ headerShown: false }} />
        <Stack.Screen name="tasks" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ headerShown: false }} />
        <Stack.Screen name="weather" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
