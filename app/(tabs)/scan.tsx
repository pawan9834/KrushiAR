import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ARScanScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.viewfinder}>
          <MaterialCommunityIcons name="line-scan" size={90} color={theme.tint} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>AR Crop Scanner</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>
          Point your camera at crops or leaves to diagnose diseases, analyze soil health, and monitor growth stage in real-time.
        </Text>
        <TouchableOpacity style={[styles.scanBtn, { backgroundColor: theme.tint }]}>
          <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.scanBtnText}>Open Camera Scanner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  viewfinder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  scanBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
