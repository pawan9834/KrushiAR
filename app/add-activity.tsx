// app/add-activity.tsx
import { useLanguage } from '@/context/LanguageContext';
import {
  finalizeActivityRecordWithAi,
  processFarmerSpeechAndNextQuestion,
} from '@/services/diaryAi';
import {
  ActivityType,
  addActivity,
  Crop,
  ExpenseItem,
  getCrops,
  savePermanentPhoto,
  StructuredAnswer
} from '@/services/diaryStorage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let Speech: typeof import('expo-speech') | null = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  // Graceful fallback
}

type WorkflowStep = 'photo_voice' | 'ai_questions' | 'review_save';

export default function AddActivityScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  // Workflow Step State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('photo_voice');

  // Step 1: Photo & Location & DateTime
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
    placeName?: string;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [recordedDate, setRecordedDate] = useState<string>(new Date().toISOString());

  // Step 2: Speech / Initial Transcript
  const [transcript, setTranscript] = useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [availableCrops, setAvailableCrops] = useState<Crop[]>([]);

  // Step 3: AI Q&A Conversation
  const [conversation, setConversation] = useState<{
    role: 'ai' | 'farmer';
    text: string;
    questionKey?: string;
  }[]>([]);
  const [currentAiQuestion, setCurrentAiQuestion] = useState<string | null>(null);
  const [currentQuestionKey, setCurrentQuestionKey] = useState<string | undefined>();
  const [farmerAnswerInput, setFarmerAnswerInput] = useState<string>('');
  const [detectedActivityType, setDetectedActivityType] = useState<ActivityType>('other');
  const [detectedCropName, setDetectedCropName] = useState<string>('');
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [isSpeakingAi, setIsSpeakingAi] = useState<boolean>(false);

  // Step 4: Final Structured Review
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [structuredAnswers, setStructuredAnswers] = useState<StructuredAnswer[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load initial crops and request location on mount
  useEffect(() => {
    async function init() {
      try {
        const crops = await getCrops();
        setAvailableCrops(crops);
        if (crops.length > 0) setSelectedCrop(crops[0]);
      } catch (err) {
        console.warn('Failed to load crops:', err);
      }

      // Automatically capture GPS location with friendly permissions
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationStatus('granted');
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          let placeName = 'शेत';
          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (geocode && geocode[0]) {
              placeName = `${geocode[0].city || geocode[0].district || geocode[0].region || ''}, ${geocode[0].region || ''}`.replace(/^, /, '');
            }
          } catch { }
          setLocationCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            placeName,
          });
        } else {
          setLocationStatus('denied');
        }
      } catch {
        setLocationStatus('denied');
      }
    }

    init();

    return () => {
      try {
        if (Speech) Speech.stop();
      } catch { }
    };
  }, []);

  // Photo handlers
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'mr' ? 'परवानगी हवी' : 'Permission Required',
          language === 'mr'
            ? 'फोटो काढण्यासाठी कॅमेऱ्याची परवानगी आवश्यक आहे.'
            : 'Camera permission is required to take photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    }
  };

  // Text-To-Speech speaker
  const speakText = (text: string) => {
    if (!Speech) return;
    try {
      Speech.stop();
      setIsSpeakingAi(true);
      const speechLang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
      Speech.speak(text, {
        language: speechLang,
        rate: 0.88,
        onDone: () => setIsSpeakingAi(false),
        onStopped: () => setIsSpeakingAi(false),
        onError: () => setIsSpeakingAi(false),
      });
    } catch {
      setIsSpeakingAi(false);
    }
  };

  // Simulation / voice mic trigger
  const handleToggleVoiceInput = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
    } else {
      setIsRecordingVoice(true);
      // Realistic simulated voice recognition with authentic rural presets
      setTimeout(() => {
        setIsRecordingVoice(false);
        if (!transcript.trim()) {
          const sample =
            language === 'mr'
              ? 'आज मी शेतात अभिनव जातीच्या टोमॅटोची लागवड केली.'
              : language === 'hi'
                ? 'आज मैंने खेत में टमाटर की बुवाई की।'
                : 'Today I planted tomatoes in the field.';
          setTranscript(sample);
        }
      }, 2000);
    }
  };

  // Start AI Q&A Workflow
  const handleProceedToAiQuestions = async () => {
    if (!transcript.trim()) {
      Alert.alert(
        language === 'mr' ? 'माहिती आवश्यक' : 'Input Required',
        language === 'mr'
          ? 'कृपया तुम्ही काय काम केले ते बोला किंवा टाईप करा.'
          : 'Please speak or type what farming activity was performed.'
      );
      return;
    }

    setIsAiProcessing(true);
    setCurrentStep('ai_questions');

    try {
      const result = await processFarmerSpeechAndNextQuestion({
        initialTranscript: transcript,
        conversationHistory: [],
        selectedCropName: selectedCrop?.name,
        language,
      });

      setDetectedActivityType(result.activityType);
      setDetectedCropName(result.cropName);

      const firstAiQ =
        result.nextQuestion ||
        (language === 'mr'
          ? 'कोणती जात लावली आणि किती क्षेत्रामध्ये काम केले?'
          : 'किस किस्म की बुवाई की और कितना क्षेत्र है?');

      setCurrentAiQuestion(firstAiQ);
      setCurrentQuestionKey(result.questionKey);
      setConversation([{ role: 'ai', text: firstAiQ, questionKey: result.questionKey }]);
      speakText(firstAiQ);
    } catch (err) {
      console.warn('AI initial processing error:', err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Submit Answer to AI Question
  const handleSendAnswer = async (skippedText?: string) => {
    const answerText = skippedText || farmerAnswerInput.trim();
    if (!answerText && !skippedText) return;

    const updatedHistory = [
      ...conversation,
      { role: 'farmer' as const, text: answerText, questionKey: currentQuestionKey },
    ];
    setConversation(updatedHistory);
    setFarmerAnswerInput('');
    setIsAiProcessing(true);

    try {
      const result = await processFarmerSpeechAndNextQuestion({
        initialTranscript: transcript,
        conversationHistory: updatedHistory,
        selectedCropName: detectedCropName || selectedCrop?.name,
        language,
      });

      if (result.isReadyToSave || !result.nextQuestion || questionIndex >= 3) {
        // AI has gathered enough information -> Proceed to Review Step!
        await compileAndShowReview(updatedHistory);
      } else {
        // Ask Next Question
        setQuestionIndex((prev) => prev + 1);
        setCurrentAiQuestion(result.nextQuestion);
        setCurrentQuestionKey(result.questionKey);
        setConversation([
          ...updatedHistory,
          { role: 'ai', text: result.nextQuestion, questionKey: result.questionKey },
        ]);
        speakText(result.nextQuestion);
      }
    } catch (err) {
      console.warn('Error in AI follow up:', err);
      await compileAndShowReview(updatedHistory);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Compile Review Screen
  const compileAndShowReview = async (history: { role: string; text: string }[]) => {
    setIsAiProcessing(true);
    try {
      const compiled = await finalizeActivityRecordWithAi({
        initialTranscript: transcript,
        conversationHistory: history,
        cropName: detectedCropName || selectedCrop?.name || 'पीक',
        activityType: detectedActivityType,
        photoUri: photoUri || undefined,
        location: locationCoords || undefined,
        language,
      });

      setActivityTitle(compiled.activityTitle);
      setStructuredAnswers(compiled.structuredAnswers);
      setExpenses(compiled.expenses);
      setTotalExpense(compiled.totalExpense);
      setNotes(compiled.notes);

      setCurrentStep('review_save');
      speakText(
        language === 'mr'
          ? `नोंद तयार झाली आहे. एकूण खर्च ${compiled.totalExpense} रुपये. कृपया तपासा आणि जतन करा.`
          : `Record is ready with total cost of ${compiled.totalExpense} rupees. Please verify and save.`
      );
    } catch (err) {
      console.warn('Compile review error:', err);
      setCurrentStep('review_save');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Final Confirmation & Save
  const handleSaveActivityRecord = async () => {
    setIsSaving(true);
    try {
      let finalPhotoPath = photoUri || undefined;
      if (finalPhotoPath && !finalPhotoPath.startsWith('http')) {
        finalPhotoPath = await savePermanentPhoto(finalPhotoPath);
      }

      await addActivity({
        userId: 'farmer_01',
        cropId: selectedCrop?.id,
        cropName: detectedCropName || selectedCrop?.name || 'शेती पीक',
        plotId: selectedCrop?.plotId,
        plotName: selectedCrop?.plotName || 'शेताचा तुकडा',
        activityType: detectedActivityType,
        activityTitle: activityTitle || `${detectedCropName || 'शेती'} नोंद`,
        date: recordedDate,
        photoUri: finalPhotoPath,
        location: locationCoords || undefined,
        voiceTranscript: transcript,
        structuredAnswers,
        expenses,
        totalExpense,
        notes,
        aiSummary: `${detectedCropName} शेती काम नोंदवले गेले. एकूण खर्च ₹ ${totalExpense}.`,
      });

      Alert.alert(
        language === 'mr' ? '✅ नोंद यशस्वी!' : '✅ Record Saved!',
        language === 'mr'
          ? 'तुमचे शेती काम रोजनिशीमध्ये सुरक्षित सेव्ह झाले आहे.'
          : 'Your farming activity record has been saved successfully in your diary.',
        [
          {
            text: language === 'mr' ? 'ठीक आहे' : 'OK',
            onPress: () => router.replace('/(tabs)/market'),
          },
        ]
      );
    } catch (err) {
      console.error('Save activity error:', err);
      Alert.alert('त्रुटी', 'नोंद सेव्ह करताना समस्या आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: insets.top > 0 ? insets.top + 8 : 16, paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topNavHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (currentStep === 'review_save') setCurrentStep('ai_questions');
              else if (currentStep === 'ai_questions') setCurrentStep('photo_voice');
              else router.back();
            }}
            activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color="#0f172a" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.screenMainTitle}>
              {language === 'mr' ? 'नवीन शेती नोंद करा' : language === 'hi' ? 'नई कृषि गतिविधि दर्ज करें' : 'Record Farming Activity'}
            </Text>
            <Text style={styles.screenStepSubtitle}>
              {currentStep === 'photo_voice'
                ? language === 'mr' ? 'पायरी १: फोटो व आवाज' : 'Step 1: Photo & Voice'
                : currentStep === 'ai_questions'
                  ? language === 'mr' ? `पायरी २: AI प्रश्नोत्तरे (${questionIndex}/३)` : `Step 2: AI Q&A (${questionIndex}/3)`
                  : language === 'mr' ? 'पायरी ३: पडताळणी व जतन' : 'Step 3: Review & Save'}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* STEP 1: PHOTO + GPS + VOICE INPUT */}
        {/* ========================================================================= */}
        {currentStep === 'photo_voice' && (
          <View>
            {/* 1. Photo Capture Box */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'mr' ? '१. कामाचा फोटो (Photograph)' : '1. Photograph of Activity'}
              </Text>
              <Text style={styles.cardHeaderSub}>
                {language === 'mr' ? 'शेतातील पिकाचा किंवा कामाचा स्पष्ट फोटो काढा' : 'Capture field photo'}
              </Text>

              {photoUri ? (
                <View style={styles.photoPreviewWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreviewImg} />
                  <TouchableOpacity
                    style={styles.retakePhotoBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}>
                    <Ionicons name="camera-reverse" size={16} color="#ffffff" />
                    <Text style={styles.retakePhotoText}>
                      {language === 'mr' ? 'दुसरा फोटो काढा' : 'Retake'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoActionsRow}>
                  <TouchableOpacity
                    style={styles.cameraBigBtn}
                    onPress={handleTakePhoto}
                    activeOpacity={0.8}>
                    <Ionicons name="camera" size={32} color="#ffffff" />
                    <Text style={styles.cameraBigBtnText}>
                      {language === 'mr' ? 'कॅमेरा उघडा' : 'Take Photo'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.galleryPickBtn}
                    onPress={handlePickPhoto}
                    activeOpacity={0.8}>
                    <Ionicons name="images" size={24} color="#15803d" />
                    <Text style={styles.galleryPickBtnText}>
                      {language === 'mr' ? 'गॅलरीतून निवडा' : 'Choose Gallery'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 2. GPS Location & Date Box */}
            <View style={styles.cardBox}>
              <View style={styles.locDateRow}>
                <View style={styles.locItem}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={locationStatus === 'granted' ? '#15803d' : '#94a3b8'}
                  />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.locDateLabel}>
                      {language === 'mr' ? 'स्थान (GPS)' : 'Location'}
                    </Text>
                    <Text style={styles.locDateVal}>
                      {locationCoords?.placeName || (locationStatus === 'granted' ? 'स्थान उपलब्ध' : 'स्थान बंद आहे')}
                    </Text>
                  </View>
                </View>

                <View style={styles.dateItem}>
                  <Ionicons name="calendar-outline" size={20} color="#0284c7" />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.locDateLabel}>
                      {language === 'mr' ? 'तारीख' : 'Date'}
                    </Text>
                    <Text style={styles.locDateVal}>{recordedDate.split('T')[0]}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* 3. Crop Selector (Optional helper) */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'mr' ? '२. संबंधित पीक निवडा (Crop)' : '2. Select Crop'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {availableCrops.map((c) => {
                  const isSel = selectedCrop?.id === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.cropSelectChip, isSel && styles.cropSelectChipActive]}
                      onPress={() => setSelectedCrop(c)}
                      activeOpacity={0.8}>
                      <Text
                        style={[
                          styles.cropSelectChipText,
                          isSel && styles.cropSelectChipTextActive,
                        ]}>
                        {c.name} ({c.area})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. Natural Voice Speaking Box */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'mr' ? '३. काय काम केले ते सांगा (Voice / Text)' : '3. Speak What You Did'}
              </Text>
              <Text style={styles.cardHeaderSub}>
                {language === 'mr'
                  ? 'उदा. "आज मी टोमॅटोची लागवड केली आणि ६ मजूर होते."'
                  : 'e.g. "Today I planted tomatoes with 6 workers."'}
              </Text>

              {/* Big Mic Button */}
              <TouchableOpacity
                style={[styles.voiceSpeakBanner, isRecordingVoice && styles.voiceSpeakBannerActive]}
                onPress={handleToggleVoiceInput}
                activeOpacity={0.85}>
                <View style={[styles.micBigPulse, isRecordingVoice && styles.micBigPulseActive]}>
                  <Ionicons name="mic" size={32} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.voiceSpeakTitle}>
                    {isRecordingVoice
                      ? language === 'mr' ? '🔴 आवाज रेकॉर्ड होत आहे...' : '🔴 Recording voice...'
                      : language === 'mr' ? '🎙️ येथे टॅप करून बोला' : '🎙️ Tap to Speak'}
                  </Text>
                  <Text style={styles.voiceSpeakSub}>
                    {language === 'mr'
                      ? 'मराठी, हिंदी किंवा इंग्रजीत बोला'
                      : 'Speak in Marathi, Hindi, or English'}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Editable Transcript Text Area */}
              <View style={styles.transcriptInputBox}>
                <Text style={styles.transcriptLabel}>
                  {language === 'mr' ? 'तुमचे वाक्य (बदल करू शकता):' : 'Transcript (Editable):'}
                </Text>
                <TextInput
                  style={styles.transcriptTextInput}
                  value={transcript}
                  onChangeText={setTranscript}
                  placeholder={
                    language === 'mr'
                      ? 'येथे टाईप करा किंवा वरील माइक दाबून बोला...'
                      : 'Type here or tap microphone to speak...'
                  }
                  placeholderTextColor="#94a3b8"
                  multiline
                />
              </View>
            </View>

            {/* Proceed to AI Questions Button */}
            <TouchableOpacity
              style={styles.proceedNextBtn}
              onPress={handleProceedToAiQuestions}
              activeOpacity={0.85}>
              <Text style={styles.proceedNextBtnText}>
                {language === 'mr' ? 'पुढे जा व AI प्रश्न विचारा →' : 'Proceed to AI Questions →'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CONVERSATIONAL AI Q&A SCREEN */}
        {/* ========================================================================= */}
        {currentStep === 'ai_questions' && (
          <View>
            {/* Conversation Messages Stack */}
            <View style={styles.conversationWrap}>
              <View style={styles.aiBadgeBanner}>
                <Ionicons name="sparkles" size={16} color="#15803d" />
                <Text style={styles.aiBadgeBannerText}>
                  {language === 'mr'
                    ? `AI ने ओळखले: ${detectedCropName} • ${detectedActivityType}`
                    : `Detected: ${detectedCropName} • ${detectedActivityType}`}
                </Text>
              </View>

              {conversation.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chatBubble,
                    msg.role === 'ai' ? styles.chatBubbleAi : styles.chatBubbleFarmer,
                  ]}>
                  <View style={styles.chatBubbleHeader}>
                    <Text style={styles.chatSenderName}>
                      {msg.role === 'ai' ? '🤖 AI शेतकरी सहाय्यक' : '👨‍🌾 तुमचे उत्तर'}
                    </Text>
                    {msg.role === 'ai' && (
                      <TouchableOpacity
                        onPress={() => speakText(msg.text)}
                        style={{ padding: 2 }}>
                        <Ionicons name="volume-high" size={16} color="#15803d" />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.chatMessageText}>{msg.text}</Text>
                </View>
              ))}

              {isAiProcessing && (
                <View style={styles.aiProcessingIndicator}>
                  <ActivityIndicator size="small" color="#15803d" />
                  <Text style={styles.aiProcessingText}>
                    {language === 'mr' ? 'AI विचार करत आहे...' : 'AI is processing...'}
                  </Text>
                </View>
              )}
            </View>

            {/* Farmer Answer Input Box */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'mr' ? 'तुमचे उत्तर सांगा / टाईप करा:' : 'Speak / Type your answer:'}
              </Text>

              <View style={styles.answerInputRow}>
                <TextInput
                  style={styles.answerTextInput}
                  value={farmerAnswerInput}
                  onChangeText={setFarmerAnswerInput}
                  placeholder={
                    language === 'mr' ? 'उदा. अभिनव जात, किंवा ₹ १५०० खर्च...' : 'Your answer...'
                  }
                  placeholderTextColor="#94a3b8"
                />

                <TouchableOpacity
                  style={styles.answerSendBtn}
                  onPress={() => handleSendAnswer()}
                  activeOpacity={0.8}>
                  <Ionicons name="send" size={18} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Action Buttons: Voice Answer, Skip, Finish */}
              <View style={styles.answerHelperButtonsRow}>
                <TouchableOpacity
                  style={styles.quickVoiceAnswerBtn}
                  onPress={() => {
                    setFarmerAnswerInput(language === 'mr' ? '६ मजूर होते आणि ₹ १८०० खर्च झाला.' : '6 workers and 1800 cost.');
                  }}
                  activeOpacity={0.7}>
                  <Ionicons name="mic" size={16} color="#15803d" />
                  <Text style={styles.quickVoiceAnswerText}>
                    {language === 'mr' ? 'बोलून सांगा' : 'Speak Answer'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.skipQuestionBtn}
                  onPress={() => handleSendAnswer(language === 'mr' ? 'माहित नाही / नंतर' : 'Skip')}
                  activeOpacity={0.7}>
                  <Text style={styles.skipQuestionBtnText}>
                    {language === 'mr' ? 'हा प्रश्न वगळा (Skip)' : 'Skip Question'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.finishReadyBtn}
                  onPress={() => compileAndShowReview(conversation)}
                  activeOpacity={0.7}>
                  <Text style={styles.finishReadyBtnText}>
                    {language === 'mr' ? 'पूर्ण करा →' : 'Done →'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: REVIEW & SAVE SCREEN */}
        {/* ========================================================================= */}
        {currentStep === 'review_save' && (
          <View>
            {/* Header Success Notice */}
            <View style={styles.reviewNoticeCard}>
              <Ionicons name="checkmark-circle" size={24} color="#15803d" />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewNoticeTitle}>
                  {language === 'mr' ? 'नोंद पडताळणी (Review Record)' : 'Verify Details Before Saving'}
                </Text>
                <Text style={styles.reviewNoticeSub}>
                  {language === 'mr'
                    ? 'कृपया सर्व माहिती तपासा. ही नोंद तुमच्या शेताच्या इतिहासात सेव्ह होईल.'
                    : 'Please review all details before confirming.'}
                </Text>
              </View>
            </View>

            {/* Photo & Main Title Card */}
            <View style={styles.cardBox}>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.reviewBigImage} />
              )}

              <View style={{ marginTop: 10 }}>
                <Text style={styles.reviewCropBadge}>
                  🌾 {detectedCropName || selectedCrop?.name} • {recordedDate.split('T')[0]}
                </Text>
                <TextInput
                  style={styles.reviewTitleInput}
                  value={activityTitle}
                  onChangeText={setActivityTitle}
                  placeholder="कामाचे नाव..."
                />
              </View>
            </View>

            {/* Structured Answers Table */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'mr' ? 'नोंदवलेली उत्तरे (Answers)' : 'Recorded Answers'}
              </Text>
              {structuredAnswers.map((ans, idx) => (
                <View key={idx} style={styles.reviewAnswerRow}>
                  <Text style={styles.reviewQuestionText}>❓ {ans.question}</Text>
                  <Text style={styles.reviewAnswerText}>✅ {ans.answer}</Text>
                </View>
              ))}
            </View>

            {/* Expenses Breakdown Box */}
            <View style={styles.cardBox}>
              <View style={styles.expensesHeaderRow}>
                <Text style={styles.cardHeaderTitle}>
                  {language === 'mr' ? 'शेती खर्च (Expenses)' : 'Calculated Expenses'}
                </Text>
                <Text style={styles.reviewTotalExpenseText}>
                  एकूण: ₹ {totalExpense.toLocaleString('en-IN')}
                </Text>
              </View>

              {expenses.length === 0 ? (
                <Text style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                  {language === 'mr' ? 'कोणताही खर्च नोंदवला नाही.' : 'No expenses recorded.'}
                </Text>
              ) : (
                expenses.map((exp, idx) => (
                  <View key={idx} style={styles.reviewExpenseRow}>
                    <Text style={styles.reviewExpenseTitle}>{exp.title}</Text>
                    <Text style={styles.reviewExpenseAmount}>₹ {exp.amount}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Notes / Description */}
            <View style={styles.cardBox}>
              <Text style={styles.cardHeaderTitle}>
                {language === 'mr' ? 'अधिक तपशील / शेरा (Notes)' : 'Notes'}
              </Text>
              <TextInput
                style={styles.reviewNotesInput}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* Final Save Confirm Button */}
            <TouchableOpacity
              style={styles.finalSaveBtn}
              onPress={handleSaveActivityRecord}
              disabled={isSaving}
              activeOpacity={0.88}>
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="#ffffff" />
                  <Text style={styles.finalSaveBtnText}>
                    {language === 'mr' ? 'नोंद कायमस्वरूपी जतन करा (Save Record)' : 'Save Record in Diary'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelDraftBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}>
              <Text style={styles.cancelDraftBtnText}>
                {language === 'mr' ? 'रद्द करा' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
  },

  /* Top Nav */
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenMainTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  screenStepSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 1,
  },

  /* Card Box */
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  cardHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    marginBottom: 10,
  },

  /* Photo Actions */
  photoActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cameraBigBtn: {
    flex: 1,
    backgroundColor: '#15803d',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  cameraBigBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  galleryPickBtn: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  galleryPickBtnText: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  photoPreviewWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  photoPreviewImg: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  retakePhotoBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  retakePhotoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Location & Date */
  locDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 12,
  },
  locDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  locDateVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },

  /* Crop Selector */
  cropSelectChip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cropSelectChipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#15803d',
  },
  cropSelectChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cropSelectChipTextActive: {
    color: '#15803d',
    fontWeight: '900',
  },

  /* Voice Banner */
  voiceSpeakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  voiceSpeakBannerActive: {
    backgroundColor: '#fee2e2',
    borderColor: '#f87171',
  },
  micBigPulse: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBigPulseActive: {
    backgroundColor: '#dc2626',
  },
  voiceSpeakTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  voiceSpeakSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
    marginTop: 2,
  },
  transcriptInputBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  transcriptLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  transcriptTextInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    minHeight: 50,
  },

  /* Buttons */
  proceedNextBtn: {
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  proceedNextBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },

  /* Step 2: Conversation Q&A */
  conversationWrap: {
    marginBottom: 12,
    gap: 10,
  },
  aiBadgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  aiBadgeBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  chatBubble: {
    borderRadius: 16,
    padding: 12,
    maxWidth: '92%',
  },
  chatBubbleAi: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#86efac',
    alignSelf: 'flex-start',
  },
  chatBubbleFarmer: {
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-end',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  chatBubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatSenderName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  chatMessageText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
  },
  aiProcessingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  aiProcessingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  answerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  answerTextInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  answerSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerHelperButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickVoiceAnswerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  quickVoiceAnswerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  skipQuestionBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  skipQuestionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  finishReadyBtn: {
    marginLeft: 'auto',
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  finishReadyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* Step 3: Review & Save */
  reviewNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  reviewNoticeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#15803d',
  },
  reviewNoticeSub: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#166534',
    marginTop: 1,
  },
  reviewBigImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
  },
  reviewCropBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 4,
  },
  reviewTitleInput: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reviewAnswerRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reviewQuestionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  reviewAnswerText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  expensesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewTotalExpenseText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#dc2626',
  },
  reviewExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  reviewExpenseTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  reviewExpenseAmount: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  reviewNotesInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 50,
  },
  finalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  finalSaveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelDraftBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelDraftBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
});
