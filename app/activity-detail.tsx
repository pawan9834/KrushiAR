// app/activity-detail.tsx
// Activity Detail Screen - Screen 5 matching Reference UI
import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronLeft,
  Pencil,
  Trash2,
  Sprout,
  Calendar,
  Cloud,
  MapPin,
  CheckCircle2,
  Users,
  Wallet,
  Pause,
  Play,
  FileText,
  Navigation,
  XCircle,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/context/LanguageContext';
import {
  ActivityRecord,
  getActivityById,
  deleteActivity,
  updateActivity,
} from '@/services/diaryStorage';
import * as Speech from 'expo-speech';

export default function ActivityDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<ActivityRecord | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCrop, setEditCrop] = useState('');
  const [editExpense, setEditExpense] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadRecord = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getActivityById(id);
      if (data) {
        setRecord(data);
      }
    } catch {
      console.warn('Error fetching record detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecord();
    return () => {
      try {
        if (Speech) Speech.stop();
      } catch {}
    };
  }, [id]);

  const handleStartEdit = () => {
    setEditTitle(record?.activityTitle || displayTitle);
    setEditCrop(record?.cropName || '');
    setEditExpense(String(record?.totalExpense || 0));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!record?.id) return;
    try {
      setIsSavingEdit(true);
      const updated = await updateActivity(record.id, {
        activityTitle: editTitle.trim() || record.activityTitle,
        cropName: editCrop.trim() || record.cropName,
        totalExpense: parseFloat(editExpense) || 0,
      });
      setRecord(updated);
      setShowEditModal(false);
      Alert.alert('यशस्वी', 'नोंद यशस्वीरीत्या अद्ययावत केली.');
    } catch (err) {
      Alert.alert('त्रुटी', 'नोंद दुरुस्त करता आली नाही.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleTogglePlayAudio = () => {
    if (!Speech) return;
    try {
      if (isPlayingAudio) {
        Speech.stop();
        setIsPlayingAudio(false);
      } else {
        setIsPlayingAudio(true);
        const transcriptText = record?.voiceTranscript || 'आज मी टोमॅटोची लागवड केली.';
        Speech.speak(transcriptText, {
          language: 'mr-IN',
          rate: 0.88,
          onDone: () => setIsPlayingAudio(false),
          onStopped: () => setIsPlayingAudio(false),
          onError: () => setIsPlayingAudio(false),
        });
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'नोंद हटवा',
      'तुम्हाला खात्री आहे का? ही नोंद कायमची हटवली जाईल.',
      [
        { text: 'रद्द करा', style: 'cancel' },
        {
          text: 'हटवा',
          style: 'destructive',
          onPress: async () => {
            if (record?.id) {
              await deleteActivity(record.id);
            }
            router.back();
          },
        },
      ]
    );
  };

  const handleOpenMap = () => {
    if (record?.location?.latitude && record?.location?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${record.location.latitude},${record.location.longitude}`;
      Linking.openURL(url).catch(() => Alert.alert('Notice', 'नकाशा उघडता आला नाही.'));
      return;
    }
    const query = record?.location?.placeName || 'Chopda, Jalgaon, Maharashtra';
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => Alert.alert('Notice', 'नकाशा उघडता आला नाही.'));
  };

  // Dynamic fallback data matching design mockup if record fields are sparse
  const displayTitle = record?.activityTitle || 'टोमॅटो लागवड';
  const displayDate = record?.date ? `${record.date}, 09:15` : '9 ऑक्टोबर 2026, 09:15';
  const displayLocation = record?.location?.placeName || 'शेत क्रमांक 1, चोपडा, जळगाव';
  const displayPhoto = record?.photoUri || 'https://images.unsplash.com/photo-1592417817098-8f3d6ef1284a?w=800&q=80';
  const displayTranscript = record?.voiceTranscript || 'आज मी टोमॅटोची लागवड केली.';
  const displayTotal = record?.totalExpense ? record.totalExpense.toLocaleString('en-IN') : '3,200';

  if (loading) {
    return (
      <View style={[styles.loadingBox, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#136f42" />
        <Text style={styles.loadingText}>माहिती उघडत आहे...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. Header Bar: < नोंद तपशील   ✏️  🗑️ */}
      <View style={[styles.headerOverlay, { paddingTop: 11 }]}>
        <View style={styles.topHeaderBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn} accessibilityLabel="मागे जा">
            <ChevronLeft size={24} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>नोंद तपशील</Text>

          <View style={styles.headerActionsRight}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={handleStartEdit}
              accessibilityLabel="नोंद बदला"
            >
              <Pencil size={18} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionIconBtn} onPress={handleDelete} accessibilityLabel="नोंद हटवा">
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollBody}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Full Photo Banner with 1/3 > Count Overlay */}
        <View style={styles.fullPhotoWrap}>
          <Image source={{ uri: displayPhoto }} style={styles.fullPhoto} />
          <View style={styles.photoCountBadge}>
            <Text style={styles.photoCountText}>1/3 &gt;</Text>
          </View>
        </View>

        {/* 3. Crop Header Card */}
        <View style={styles.cropHeaderCard}>
          <View style={styles.cropIconCircle}>
            <Sprout size={24} color="#15803d" />
          </View>
          <View style={styles.cropHeaderTextCol}>
            <Text style={styles.cropTitleText}>{displayTitle}</Text>
            <View style={styles.cropMetaRow}>
              <Calendar size={13} color="#64748b" />
              <Text style={styles.cropMetaText}>{displayDate}</Text>
            </View>
            {record?.isSynced ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Cloud size={13} color="#15803d" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '600' }}>क्लाउडवर सुरक्षित (Cloud Synced)</Text>
              </View>
            ) : null}
            <View style={styles.cropMetaRow}>
              <MapPin size={13} color="#15803d" />
              <Text style={styles.cropMetaText}>{displayLocation}</Text>
            </View>
          </View>
        </View>

        {/* 4. कामाची माहिती (Work Information Card) - DYNAMIC DATA */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>कामाची माहिती</Text>

          {record?.cropName ? (
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <Sprout size={16} color="#15803d" />
                <Text style={styles.infoRowLabel}>पीक</Text>
              </View>
              <Text style={styles.infoRowValue}>{record.cropName}</Text>
            </View>
          ) : null}

          {record?.plotName ? (
            <View style={styles.infoRow}>
              <View style={styles.infoRowLeft}>
                <MapPin size={16} color="#15803d" />
                <Text style={styles.infoRowLabel}>शेत / प्लॉट</Text>
              </View>
              <Text style={styles.infoRowValue}>{record.plotName}</Text>
            </View>
          ) : null}

          {record?.structuredAnswers && record.structuredAnswers.length > 0 ? (
            record.structuredAnswers.map((ans, idx) => (
              <View key={idx} style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <CheckCircle2 size={16} color="#15803d" />
                  <Text style={styles.infoRowLabel}>{ans.question}</Text>
                </View>
                <Text style={styles.infoRowValue}>{ans.answer}</Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <Sprout size={16} color="#64748b" />
                  <Text style={styles.infoRowLabel}>जातीचे नाव</Text>
                </View>
                <Text style={styles.infoRowValue}>अभिलाष</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <MapPin size={16} color="#64748b" />
                  <Text style={styles.infoRowLabel}>क्षेत्र</Text>
                </View>
                <Text style={styles.infoRowValue}>0.5 एकर</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <Users size={16} color="#64748b" />
                  <Text style={styles.infoRowLabel}>मजूर संख्या</Text>
                </View>
                <Text style={styles.infoRowValue}>4</Text>
              </View>
            </>
          )}

          {record?.expenses && record.expenses.length > 0 ? (
            record.expenses.map((exp) => (
              <View key={exp.id} style={styles.infoRow}>
                <View style={styles.infoRowLeft}>
                  <Wallet size={16} color="#64748b" />
                  <Text style={styles.infoRowLabel}>{exp.title}</Text>
                </View>
                <Text style={styles.infoRowValue}>₹ {exp.amount.toLocaleString('en-IN')}</Text>
              </View>
            ))
          ) : null}

          {/* एकूण खर्च Highlight Badge */}
          <View style={styles.totalCostHighlightRow}>
            <View style={styles.totalCostLeft}>
              <Wallet size={18} color="#15803d" />
              <Text style={styles.totalCostLabel}>एकूण खर्च</Text>
            </View>
            <Text style={styles.totalCostValue}>₹ {displayTotal}</Text>
          </View>
        </View>

        {/* 5. बोललेली नोंद (Transcript Card with Audio Player) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>बोललेली नोंद (Transcript)</Text>

          {/* Audio Player Bar */}
          <View style={styles.audioWaveBox}>
            <TouchableOpacity
              style={styles.playBtnCircle}
              onPress={handleTogglePlayAudio}
            >
              {isPlayingAudio ? (
                <Pause size={16} color="#ffffff" />
              ) : (
                <Play size={16} color="#ffffff" />
              )}
            </TouchableOpacity>

            <View style={styles.waveformWrap}>
              <Text style={styles.waveformBars}>||||||||||||||||||||||||||||||||||||||||</Text>
            </View>

            <Text style={styles.audioTimerText}>00:04</Text>
          </View>

          <Text style={styles.transcriptQuoteText}>&ldquo;{displayTranscript}&rdquo;</Text>
        </View>

        {/* शेतकरी टिपा (Notes) */}
        {record?.notes ? (
          <View style={styles.sectionCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <FileText size={18} color="#15803d" style={{ marginRight: 6 }} />
              <Text style={styles.sectionCardTitle}>शेतकरी टिपा (Notes)</Text>
            </View>
            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>{record.notes}</Text>
          </View>
        ) : null}

        {/* 6. ठिकाण (Location Map Card) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>ठिकाण</Text>

          <View style={styles.locAddressRow}>
            <MapPin size={16} color="#15803d" />
            <Text style={styles.locAddressText}>{displayLocation}</Text>
          </View>

          {record?.location?.latitude && record?.location?.longitude && (
            <View style={styles.coordsDetailBadge}>
              <Navigation size={14} color="#15803d" />
              <Text style={styles.coordsDetailText}>
                GPS: {record.location.latitude.toFixed(5)}° N, {record.location.longitude.toFixed(5)}° E
              </Text>
            </View>
          )}

          <View style={styles.mapGraphicCard}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80' }}
              style={styles.mapGraphicImg}
            />
            <View style={styles.mapPinDot}>
              <MapPin size={26} color="#ef4444" />
            </View>
            <TouchableOpacity
              style={styles.viewMapPill}
              onPress={handleOpenMap}
            >
              <Text style={styles.viewMapPillText}>नकाशा पहा</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Edit Activity Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>नोंद दुरुस्त करा</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} accessibilityLabel="बंद करा">
                <XCircle size={26} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>कामाचे शीर्षक</Text>
            <TextInput
              style={styles.inputField}
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="उदा. टोमॅटो खत दिले"
            />

            <Text style={styles.inputLabel}>पीक</Text>
            <TextInput
              style={styles.inputField}
              value={editCrop}
              onChangeText={setEditCrop}
              placeholder="उदा. टोमॅटो"
            />

            <Text style={styles.inputLabel}>एकूण खर्च (₹)</Text>
            <TextInput
              style={styles.inputField}
              value={editExpense}
              onChangeText={setEditExpense}
              keyboardType="numeric"
              placeholder="उदा. 1200"
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveEdit}
              disabled={isSavingEdit}
              activeOpacity={0.85}
            >
              {isSavingEdit ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>बदल जतन करा</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerOverlay: {
    backgroundColor: '#ffffff',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  fullPhotoWrap: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  fullPhoto: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cropHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cropIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropHeaderTextCol: {
    flex: 1,
    gap: 2,
  },
  cropTitleText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0f172a',
  },
  cropMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cropMetaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  totalCostHighlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  totalCostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalCostLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  totalCostValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
  },
  audioWaveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
    marginTop: 4,
  },
  playBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  waveformBars: {
    fontSize: 13,
    color: '#15803d',
    letterSpacing: -1,
  },
  audioTimerText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  transcriptQuoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#334155',
    lineHeight: 20,
    marginTop: 10,
  },
  locAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  locAddressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  coordsDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  coordsDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  mapGraphicCard: {
    position: 'relative',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapGraphicImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mapPinDot: {
    position: 'absolute',
    top: '30%',
    left: '48%',
  },
  viewMapPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  viewMapPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  modalSaveBtn: {
    backgroundColor: '#136f42',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  modalSaveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
