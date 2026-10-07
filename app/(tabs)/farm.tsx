import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface PlotData {
  id: string;
  name: string;
  crop: string;
  area: string;
  stage: string;
  health: number;
  moisture: number;
  irrigation: string;
  status: 'Healthy' | 'Needs Attention' | 'Harvest Ready';
  statusColor: string;
}

const PLOTS: PlotData[] = [
  {
    id: '1',
    name: 'Plot A • North Canal',
    crop: 'Cotton (Bt-2)',
    area: '5.5 Acres',
    stage: 'Flowering (Day 64)',
    health: 94,
    moisture: 68,
    irrigation: 'Drip System #1',
    status: 'Healthy',
    statusColor: '#16a34a',
  },
  {
    id: '2',
    name: 'Plot B • East Orchard',
    crop: 'Alphonso Mango',
    area: '3.5 Acres',
    stage: 'Fruit Formation',
    health: 86,
    moisture: 58,
    irrigation: 'Micro Sprinklers',
    status: 'Needs Attention',
    statusColor: '#f59e0b',
  },
  {
    id: '3',
    name: 'Plot C • Sunrise Valley',
    crop: 'Sharbati Wheat',
    area: '5.2 Acres',
    stage: 'Grain Filling (Day 82)',
    health: 98,
    moisture: 64,
    irrigation: 'Smart Drip #3',
    status: 'Healthy',
    statusColor: '#16a34a',
  },
];

export default function MyFarmScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [selectedPlot, setSelectedPlot] = useState<string>('1');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      {/* Farm Overview Stats */}
      <View style={[styles.farmOverviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.farmTitleRow}>
          <View>
            <Text style={[styles.farmName, { color: theme.text }]}>Krushi Green Valley</Text>
            <Text style={[styles.farmSub, { color: theme.subtext }]}>GPS: 19.8762° N, 75.3433° E</Text>
          </View>
          <View style={[styles.badgeTotal, { backgroundColor: theme.tintLight }]}>
            <Text style={[styles.badgeText, { color: theme.tint }]}>14.2 Acres</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.text }]}>3</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Active Plots</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.text }]}>2</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Crop Types</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statCol}>
            <Text style={[styles.statNum, { color: theme.tint }]}>93%</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>Avg Health</Text>
          </View>
        </View>
      </View>

      {/* Plot List Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Farm Plots & Crops</Text>
        <TouchableOpacity style={[styles.addPlotBtn, { backgroundColor: theme.tintLight }]}>
          <Ionicons name="add" size={18} color={theme.tint} />
          <Text style={[styles.addPlotText, { color: theme.tint }]}>Add Plot</Text>
        </TouchableOpacity>
      </View>

      {PLOTS.map((plot) => {
        const isSelected = selectedPlot === plot.id;
        return (
          <TouchableOpacity
            key={plot.id}
            activeOpacity={0.8}
            onPress={() => setSelectedPlot(plot.id)}
            style={[
              styles.plotCard,
              {
                backgroundColor: theme.card,
                borderColor: isSelected ? theme.tint : theme.border,
                borderWidth: isSelected ? 2 : 1,
              },
            ]}>
            <View style={styles.plotHeader}>
              <View style={styles.plotHeaderLeft}>
                <MaterialCommunityIcons name="sprout" size={24} color={theme.tint} />
                <View>
                  <Text style={[styles.plotCrop, { color: theme.text }]}>{plot.crop}</Text>
                  <Text style={[styles.plotName, { color: theme.subtext }]}>{plot.name}</Text>
                </View>
              </View>
              <View style={[styles.statusTag, { backgroundColor: `${plot.statusColor}15` }]}>
                <Text style={[styles.statusTagText, { color: plot.statusColor }]}>{plot.status}</Text>
              </View>
            </View>

            <View style={[styles.plotDetailsGrid, { backgroundColor: theme.background }]}>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Area</Text>
                <Text style={[styles.detailVal, { color: theme.text }]}>{plot.area}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Growth Stage</Text>
                <Text style={[styles.detailVal, { color: theme.text }]}>{plot.stage}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Moisture</Text>
                <Text style={[styles.detailVal, { color: theme.text }]}>{plot.moisture}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>Health</Text>
                <Text style={[styles.detailVal, { color: theme.tint }]}>{plot.health}%</Text>
              </View>
            </View>

            <View style={styles.plotFooter}>
              <View style={styles.irrigationTag}>
                <Ionicons name="water-outline" size={14} color={theme.subtext} />
                <Text style={[styles.irrigationTagText, { color: theme.subtext }]}>{plot.irrigation}</Text>
              </View>
              <TouchableOpacity style={styles.actionArrow}>
                <Text style={[styles.manageText, { color: theme.tint }]}>Manage</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.tint} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Soil Health & Nutrients */}
      <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>
        Soil Nutrients Analysis (NPK)
      </Text>
      <View style={[styles.soilCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.npkRow}>
          {/* Nitrogen */}
          <View style={styles.npkItem}>
            <View style={[styles.npkCircle, { borderColor: '#3b82f6' }]}>
              <Text style={[styles.npkLetter, { color: '#3b82f6' }]}>N</Text>
              <Text style={[styles.npkValue, { color: theme.text }]}>280</Text>
            </View>
            <Text style={[styles.npkLabel, { color: theme.subtext }]}>Nitrogen (kg/ha)</Text>
            <Text style={[styles.npkStatus, { color: '#16a34a' }]}>Sufficient</Text>
          </View>

          {/* Phosphorus */}
          <View style={styles.npkItem}>
            <View style={[styles.npkCircle, { borderColor: '#f59e0b' }]}>
              <Text style={[styles.npkLetter, { color: '#f59e0b' }]}>P</Text>
              <Text style={[styles.npkValue, { color: theme.text }]}>24</Text>
            </View>
            <Text style={[styles.npkLabel, { color: theme.subtext }]}>Phosphorus (kg/ha)</Text>
            <Text style={[styles.npkStatus, { color: '#f59e0b' }]}>Medium</Text>
          </View>

          {/* Potassium */}
          <View style={styles.npkItem}>
            <View style={[styles.npkCircle, { borderColor: '#10b981' }]}>
              <Text style={[styles.npkLetter, { color: '#10b981' }]}>K</Text>
              <Text style={[styles.npkValue, { color: theme.text }]}>310</Text>
            </View>
            <Text style={[styles.npkLabel, { color: theme.subtext }]}>Potassium (kg/ha)</Text>
            <Text style={[styles.npkStatus, { color: '#16a34a' }]}>High</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.soilReportBtn, { borderColor: theme.border }]}>
          <FontAwesome5 name="file-medical-alt" size={16} color={theme.tint} />
          <Text style={[styles.soilReportText, { color: theme.tint }]}>View Soil Test Lab Report</Text>
        </TouchableOpacity>
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
  farmOverviewCard: {
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
  farmTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  farmName: {
    fontSize: 18,
    fontWeight: '700',
  },
  farmSub: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeTotal: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  addPlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addPlotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  plotCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  plotHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plotCrop: {
    fontSize: 16,
    fontWeight: '700',
  },
  plotName: {
    fontSize: 12,
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  plotDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    width: '47%',
  },
  detailLabel: {
    fontSize: 11,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  plotFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  irrigationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  irrigationTagText: {
    fontSize: 12,
  },
  actionArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  soilCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginTop: 12,
  },
  npkRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  npkItem: {
    alignItems: 'center',
  },
  npkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  npkLetter: {
    fontSize: 15,
    fontWeight: '800',
  },
  npkValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  npkLabel: {
    fontSize: 11,
  },
  npkStatus: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  soilReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  soilReportText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
