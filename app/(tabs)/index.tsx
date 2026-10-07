import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [irrigationActive, setIrrigationActive] = useState(true);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <View style={[styles.welcomeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={[styles.greetingText, { color: theme.subtext }]}>Welcome back,</Text>
            <Text style={[styles.farmerName, { color: theme.text }]}>Krushi Mitra 🌾</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color={theme.tint} />
              <Text style={[styles.locationText, { color: theme.subtext }]}>Plot #4 • Green Valley Farm</Text>
            </View>
          </View>
          <View style={[styles.weatherBadge, { backgroundColor: theme.tintLight }]}>
            <Ionicons name="partly-sunny" size={24} color={theme.tint} />
            <Text style={[styles.weatherTemp, { color: theme.tint }]}>29°C</Text>
            <Text style={[styles.weatherCondition, { color: theme.tint }]}>Sunny</Text>
          </View>
        </View>
      </View>

      {/* Real-time Field Metrics */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Real-Time Field Telemetry</Text>
      <View style={styles.metricsGrid}>
        {/* Metric 1 */}
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="water" size={22} color="#0284c7" />
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>68%</Text>
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>Soil Moisture</Text>
          <Text style={[styles.metricStatus, { color: '#16a34a' }]}>● Optimal</Text>
        </View>

        {/* Metric 2 */}
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="thermometer" size={22} color="#d97706" />
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>31°C</Text>
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>Soil Temp</Text>
          <Text style={[styles.metricStatus, { color: '#16a34a' }]}>● Normal</Text>
        </View>

        {/* Metric 3 */}
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#dcfce7' }]}>
            <MaterialCommunityIcons name="heart-pulse" size={22} color="#16a34a" />
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>96%</Text>
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>NDVI Index</Text>
          <Text style={[styles.metricStatus, { color: '#16a34a' }]}>● Healthy</Text>
        </View>

        {/* Metric 4 */}
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#fae8ff' }]}>
            <MaterialCommunityIcons name="molecule" size={22} color="#9333ea" />
          </View>
          <Text style={[styles.metricValue, { color: theme.text }]}>6.8 pH</Text>
          <Text style={[styles.metricLabel, { color: theme.subtext }]}>Soil Acidity</Text>
          <Text style={[styles.metricStatus, { color: '#16a34a' }]}>● Balanced</Text>
        </View>
      </View>

      {/* Smart Irrigation Automation */}
      <View style={[styles.irrigationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.irrigationInfo}>
          <View style={[styles.iconCircle, { backgroundColor: theme.tintLight }]}>
            <Ionicons name="hardware-chip-outline" size={24} color={theme.tint} />
          </View>
          <View style={styles.irrigationTextCol}>
            <Text style={[styles.irrigationTitle, { color: theme.text }]}>Smart Drip Irrigation</Text>
            <Text style={[styles.irrigationSub, { color: theme.subtext }]}>
              {irrigationActive ? 'Valve #2 Active (Flow: 18 L/min)' : 'System Standby'}
            </Text>
          </View>
        </View>
        <Switch
          value={irrigationActive}
          onValueChange={setIrrigationActive}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={irrigationActive ? theme.tint : '#f1f5f9'}
        />
      </View>

      {/* Quick Action Buttons */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Farm Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: '#ecfdf5' }]}>
            <MaterialCommunityIcons name="augmented-reality" size={24} color="#059669" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: theme.text }]}>AR Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: '#eff6ff' }]}>
            <MaterialCommunityIcons name="drone" size={24} color="#2563eb" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Drone Map</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: '#fef2f2' }]}>
            <MaterialCommunityIcons name="bug-outline" size={24} color="#dc2626" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Pest Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.actionIconWrap, { backgroundColor: '#fffbeb' }]}>
            <FontAwesome5 name="seedling" size={20} color="#d97706" />
          </View>
          <Text style={[styles.actionBtnLabel, { color: theme.text }]}>Soil Test</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Agricultural Advisory & Alerts */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Advisory & Tasks</Text>
      <View style={[styles.taskCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.taskItem}>
          <View style={[styles.taskDot, { backgroundColor: '#f59e0b' }]} />
          <View style={styles.taskTextCol}>
            <Text style={[styles.taskHeading, { color: theme.text }]}>Nitrogen Top-Dressing</Text>
            <Text style={[styles.taskDesc, { color: theme.subtext }]}>
              Cotton Field Plot A: Day 65 booster cycle due tomorrow.
            </Text>
          </View>
        </View>

        <View style={[styles.taskDivider, { backgroundColor: theme.border }]} />

        <View style={styles.taskItem}>
          <View style={[styles.taskDot, { backgroundColor: '#10b981' }]} />
          <View style={styles.taskTextCol}>
            <Text style={[styles.taskHeading, { color: theme.text }]}>Favorable Spray Weather</Text>
            <Text style={[styles.taskDesc, { color: theme.subtext }]}>
              Wind speed is below 6 km/h today between 4 PM - 6 PM.
            </Text>
          </View>
        </View>
      </View>

      {/* Live APMC Mandi Rates */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Mandi Prices</Text>
      <View style={styles.mandiScroll}>
        <View style={[styles.mandiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cropName, { color: theme.text }]}>Cotton (Kapas)</Text>
          <Text style={[styles.cropPrice, { color: theme.tint }]}>₹7,250 / Qtl</Text>
          <Text style={styles.pricePositive}>+2.4% Today</Text>
        </View>
        <View style={[styles.mandiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cropName, { color: theme.text }]}>Soybean</Text>
          <Text style={[styles.cropPrice, { color: theme.tint }]}>₹4,820 / Qtl</Text>
          <Text style={styles.pricePositive}>+0.8% Today</Text>
        </View>
        <View style={[styles.mandiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cropName, { color: theme.text }]}>Wheat (Sharbati)</Text>
          <Text style={[styles.cropPrice, { color: theme.tint }]}>₹2,640 / Qtl</Text>
          <Text style={styles.priceNegative}>-0.5% Today</Text>
        </View>
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
    paddingBottom: 32,
  },
  welcomeCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
  },
  weatherBadge: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 70,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  weatherCondition: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
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
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  metricStatus: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  irrigationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  irrigationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  irrigationTextCol: {
    flex: 1,
  },
  irrigationTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  irrigationSub: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  taskTextCol: {
    flex: 1,
  },
  taskHeading: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 18,
  },
  taskDivider: {
    height: 1,
    marginVertical: 12,
  },
  mandiScroll: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  mandiCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cropName: {
    fontSize: 12,
    fontWeight: '600',
  },
  cropPrice: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  pricePositive: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  priceNegative: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 2,
  },
});
