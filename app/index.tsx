import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { getAuth } from '@react-native-firebase/auth';
import { isOnboardingComplete } from '@/services/diaryStorage';

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const onboarded = await isOnboardingComplete();
        let firebaseUser = null;
        try {
          const auth = getAuth();
          firebaseUser = auth.currentUser;
        } catch (e) {
          console.warn('Firebase auth check notice:', e);
        }

        // If user is authenticated via Firebase token OR completed onboarding previously
        if (firebaseUser || onboarded) {
          if (isMounted) {
            router.replace('/(tabs)');
          }
          return;
        }
      } catch (err) {
        console.warn('Session verification error:', err);
      }

      if (isMounted) {
        router.replace('/login');
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#16a34a" />
      <Text style={styles.loadingText}>कृषिमित्र सुरू होत आहे...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
});
