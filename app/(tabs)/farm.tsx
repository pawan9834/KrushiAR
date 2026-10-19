import { useLanguage } from '@/context/LanguageContext';
import { useUserLocation } from '@/context/LocationContext';
import {
  getCrops,
  getPlots,
  getFarmerProfile,
  getExpenseSummary,
  addCrop,
  deleteCrop,
  fetchPlantingQuestionFromFirestore,
  Crop,
  FarmPlot,
  FarmerProfile,
} from '@/services/diaryStorage';
import {
  MapPin,
  ChevronDown,
  ChevronRight,
  Bell,
  Volume2,
  Square,
  PlusCircle,
  ShieldCheck,
  Droplets,
  Sprout,
  CheckSquare,
  Trash2,
  Lightbulb,
  Camera,
  Map,
  Package,
  Phone,
  XCircle,
  Sparkles,
  Mountain,
  Mic,
  CheckCircle2,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { parseCropDetailsFromAudio } from '@/services/diaryAi';

export default function MyFarmScreen() {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { location, setShowLocationModal } = useUserLocation();

  // 🔊 Audio Speech State
  const [activeSpeakingKey, setActiveSpeakingKey] = useState<string | null>(null);

  // Sub-tabs: 'crops' | 'plots' | 'expenses' | 'advisory'
  const [activeTab, setActiveTab] = useState<'crops' | 'plots' | 'expenses' | 'advisory'>('crops');

  // Selected plot
  const [selectedPlotId, setSelectedPlotId] = useState<string>('1');

  // Dynamic Farm Data from Storage
  const [crops, setCrops] = useState<Crop[]>([]);
  const [plots, setPlots] = useState<FarmPlot[]>([]);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [expenseSummary, setExpenseSummary] = useState<{
    totalExpense: number;
    totalRevenue: number;
    netProfit: number;
    byCategory: Record<string, number>;
  }>({ totalExpense: 0, totalRevenue: 0, netProfit: 0, byCategory: {} });

  // Add Crop Modal
  const [showAddCropModal, setShowAddCropModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCropVariety, setNewCropVariety] = useState('');
  const [newCropArea, setNewCropArea] = useState('१.०');

  // AI Voice Planting Prompt State
  const [aiCropPromptState, setAiCropPromptState] = useState<'idle' | 'countdown' | 'speaking' | 'listening' | 'completed'>('idle');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [aiCountdown, setAiCountdown] = useState<number>(3);
  const [aiQuestionPrompt, setAiQuestionPrompt] = useState<string>('');
  const aiCountdownTimerRef = useRef<any>(null);
  const aiCountdownIntervalRef = useRef<any>(null);
  const isModalActiveRef = useRef<boolean>(false);
  const activeQuestionIndexRef = useRef<number>(0);
  const cropNameRef = useRef<string>('');
  const cropVarietyRef = useRef<string>('');
  const cropAreaRef = useRef<string>('१.०');

  // Voice recording state for Add Crop
  const [isRecordingCropVoice, setIsRecordingCropVoice] = useState(false);
  const [isProcessingCropVoice, setIsProcessingCropVoice] = useState(false);
  const [cropVoiceFeedback, setCropVoiceFeedback] = useState<string | null>(null);

  const cropAudioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // 🎙️ Automatically start microphone recording for user to speak
  const startAutoCropMic = async () => {
    if (!isModalActiveRef.current) return;
    setAiCropPromptState('listening');
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          language === 'mr' ? 'मायक्रोफोन परवानगी आवश्यक' : language === 'hi' ? 'माइक्रोफोन अनुमति आवश्यक' : 'Microphone Permission Required',
          language === 'mr'
            ? 'कृपया बोलून माहिती भरण्यासाठी मायक्रोफोन परवानगी द्या.'
            : 'Please allow microphone access to speak and fill crop details.'
        );
        return;
      }

      await cropAudioRecorder.prepareToRecordAsync();
      cropAudioRecorder.record();
      setIsRecordingCropVoice(true);
      setCropVoiceFeedback(null);
    } catch (err) {
      console.warn('Auto start crop mic error, fallback:', err);
      setIsRecordingCropVoice(true);
      setCropVoiceFeedback(null);
    }
  };

  // 🤖 Trigger AI Question after 3-second countdown, then auto-turn mic on
  const triggerAiQuestion = async (questionIdx: number, spokenIntro?: string) => {
    if (!isModalActiveRef.current) return;

    if (aiCountdownTimerRef.current) clearTimeout(aiCountdownTimerRef.current);
    if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
    try {
      if (Speech) Speech.stop();
    } catch {}

    activeQuestionIndexRef.current = questionIdx;
    setActiveQuestionIndex(questionIdx);
    setAiCropPromptState('countdown');
    setAiCountdown(3);

    // Speak quick confirmation of previous response if provided
    if (spokenIntro && Speech) {
      Speech.speak(spokenIntro, {
        language: language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
        rate: 0.95,
      });
    }

    // Pre-fetch question from Firebase
    let fetchedQuestion = '';
    fetchPlantingQuestionFromFirestore(language, questionIdx)
      .then((q) => {
        fetchedQuestion = q;
        if (isModalActiveRef.current) {
          setAiQuestionPrompt(q);
        }
      })
      .catch((e) => {
        console.warn('Planting question fetch notice:', e);
      });

    // 3-second countdown interval (3.. 2.. 1..)
    let secondsLeft = 3;
    aiCountdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setAiCountdown(secondsLeft);
      } else {
        if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
      }
    }, 1000);

    // After exactly 3 seconds, AI speaks the question from Firebase and turns mic on
    aiCountdownTimerRef.current = setTimeout(async () => {
      if (!isModalActiveRef.current) return;

      const questionToAsk =
        fetchedQuestion ||
        (questionIdx === 0
          ? (language === 'mr' ? 'तुम्ही कोणते रोप किंवा पीक लावत आहात?' : language === 'hi' ? 'आप कौन सा पौधा या फसल लगा रहे हैं?' : 'Which plant or crop are you planting?')
          : questionIdx === 1
          ? (language === 'mr' ? 'कोणती जात लावली?' : language === 'hi' ? 'कौन सी किस्म लगाई?' : 'Which variety did you plant?')
          : (language === 'mr' ? 'किती एकर क्षेत्रात लागवड केली?' : language === 'hi' ? 'कितने एकड़ में रोपाई या बुवाई की?' : 'How many acres did you plant?'));

      setAiQuestionPrompt(questionToAsk);
      setAiCropPromptState('speaking');

      const onSpeechEnd = () => {
        if (!isModalActiveRef.current) return;
        startAutoCropMic();
      };

      try {
        const speechLang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        if (Speech) {
          Speech.speak(questionToAsk, {
            language: speechLang,
            rate: 0.9,
            pitch: 1.0,
            onDone: onSpeechEnd,
            onError: onSpeechEnd,
          });
        } else {
          startAutoCropMic();
        }
      } catch (err) {
        console.warn('Speech error, starting mic directly:', err);
        startAutoCropMic();
      }
    }, 3000);
  };

  // 🤖 Triggered when user taps "+ Add Crop":
  const handleOpenAddCropModal = async () => {
    // 1. Clear any ongoing speech or timers
    if (aiCountdownTimerRef.current) clearTimeout(aiCountdownTimerRef.current);
    if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
    try {
      if (Speech) Speech.stop();
    } catch {}

    // 2. Reset crop fields
    setNewCropName('');
    setNewCropVariety('');
    setNewCropArea('१.०');
    cropNameRef.current = '';
    cropVarietyRef.current = '';
    cropAreaRef.current = '१.०';
    setCropVoiceFeedback(null);
    setIsRecordingCropVoice(false);
    setIsProcessingCropVoice(false);

    // 3. Initiate modal and start Question 1
    setShowAddCropModal(true);
    isModalActiveRef.current = true;
    triggerAiQuestion(0);
  };

  // Close modal and cancel all timers/recordings safely
  const handleCloseAddCropModal = () => {
    isModalActiveRef.current = false;
    if (aiCountdownTimerRef.current) clearTimeout(aiCountdownTimerRef.current);
    if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
    try {
      if (Speech) Speech.stop();
    } catch {}
    if (isRecordingCropVoice) {
      try {
        cropAudioRecorder.stop();
      } catch {}
      setIsRecordingCropVoice(false);
    }
    setAiCropPromptState('idle');
    setShowAddCropModal(false);
    Keyboard.dismiss();
  };

  const handleToggleCropVoice = async () => {
    // If during countdown or speaking, cancel timer and immediately start recording
    if (aiCropPromptState === 'countdown' || aiCropPromptState === 'speaking') {
      if (aiCountdownTimerRef.current) clearTimeout(aiCountdownTimerRef.current);
      if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
      try {
        if (Speech) Speech.stop();
      } catch {}
      await startAutoCropMic();
      return;
    }

    if (isRecordingCropVoice) {
      // Stop recording
      setIsRecordingCropVoice(false);
      setIsProcessingCropVoice(true);
      try {
        await cropAudioRecorder.stop();
        const uri = cropAudioRecorder.uri;
        let base64Audio: string | undefined = undefined;
        if (uri) {
          base64Audio = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        const currentField = activeQuestionIndexRef.current === 0 ? 'crop' : activeQuestionIndexRef.current === 1 ? 'variety' : 'area';
        const result = await parseCropDetailsFromAudio({
          base64Audio,
          language,
          currentField,
          existingCropName: cropNameRef.current,
          existingVariety: cropVarietyRef.current,
          existingArea: cropAreaRef.current,
        });

        if (activeQuestionIndexRef.current === 0) {
          // Question 1 answered: Crop name
          const detectedCrop = result.cropName || (language === 'mr' ? 'कांदा' : 'Onion');
          setNewCropName(detectedCrop);
          cropNameRef.current = detectedCrop;

          // Check if user answered all 3 in one single sentence
          const hasCustomVariety = result.variety && result.variety !== 'सुधारित' && result.variety !== 'Standard';
          const hasCustomArea = result.area && result.area !== '1.0' && result.area !== '१.०';

          if (hasCustomVariety && hasCustomArea) {
            setNewCropVariety(result.variety);
            setNewCropArea(result.area);
            cropVarietyRef.current = result.variety;
            cropAreaRef.current = result.area;
            setCropVoiceFeedback(result.recognizedText || `${result.area} एकर ${detectedCrop} (${result.variety})`);
            setAiCropPromptState('completed');

            if (Speech) {
              const spokenMsg =
                language === 'mr'
                  ? `${detectedCrop}, जात ${result.variety}, क्षेत्र ${result.area} एकर माहिती भरली आहे.`
                  : language === 'hi'
                  ? `${detectedCrop}, किस्म ${result.variety}, क्षेत्रफल ${result.area} एकड़ दर्ज हुआ।`
                  : `Added ${detectedCrop}, variety ${result.variety}, area ${result.area} acres.`;
              Speech.speak(spokenMsg, {
                language: language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
                rate: 0.9,
              });
            }
          } else {
            // User gave ans of 1st question -> after 3 sec ask next question (Question 2: Variety)!
            setCropVoiceFeedback(language === 'mr' ? `✅ पीक: ${detectedCrop}` : `✅ Crop: ${detectedCrop}`);
            const introMsg = language === 'mr' ? `${detectedCrop} नोंदवले.` : `${detectedCrop} noted.`;
            triggerAiQuestion(1, introMsg);
          }
        } else if (activeQuestionIndexRef.current === 1) {
          // Question 2 answered: Variety
          const detectedVariety = result.variety || (language === 'mr' ? 'सुधारित' : 'Standard');
          setNewCropVariety(detectedVariety);
          cropVarietyRef.current = detectedVariety;
          setCropVoiceFeedback(language === 'mr' ? `✅ जात: ${detectedVariety}` : `✅ Variety: ${detectedVariety}`);

          // After 3 sec ask next question (Question 3: Area)!
          const introMsg = language === 'mr' ? `जात ${detectedVariety} नोंदवली.` : `Variety ${detectedVariety} noted.`;
          triggerAiQuestion(2, introMsg);
        } else {
          // Question 3 answered: Area
          const detectedArea = result.area || '1.0';
          setNewCropArea(detectedArea);
          cropAreaRef.current = detectedArea;
          setCropVoiceFeedback(language === 'mr' ? `✅ क्षेत्र: ${detectedArea} एकर` : `✅ Area: ${detectedArea} Acres`);
          setAiCropPromptState('completed');

          if (Speech) {
            const spokenMsg =
              language === 'mr'
                ? `${cropNameRef.current || result.cropName}, जात ${cropVarietyRef.current || 'सुधारित'}, क्षेत्र ${detectedArea} एकर माहिती पूर्ण भरली आहे.`
                : language === 'hi'
                ? `${cropNameRef.current || result.cropName}, किस्म ${cropVarietyRef.current || 'सुधारित'}, क्षेत्रफल ${detectedArea} एकड़ दर्ज हुआ।`
                : `${cropNameRef.current || result.cropName}, variety ${cropVarietyRef.current || 'Standard'}, area ${detectedArea} acres completed.`;
            Speech.speak(spokenMsg, {
              language: language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
              rate: 0.9,
            });
          }
        }
      } catch (err) {
        console.warn('Crop voice recording stop error:', err);
      } finally {
        setIsProcessingCropVoice(false);
      }
    } else {
      // Start recording manually
      await startAutoCropMic();
    }
  };

  const handleApplyVoiceSample = async (sampleText: string) => {
    if (aiCountdownTimerRef.current) clearTimeout(aiCountdownTimerRef.current);
    if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
    try {
      if (Speech) Speech.stop();
    } catch {}

    setIsProcessingCropVoice(true);
    try {
      const result = await parseCropDetailsFromAudio({
        transcript: sampleText,
        language,
      });
      setNewCropName(result.cropName);
      setNewCropVariety(result.variety);
      setNewCropArea(result.area);
      setCropVoiceFeedback(result.recognizedText || sampleText);
      setAiCropPromptState('completed');

      if (Speech) {
        Speech.speak(
          language === 'mr'
            ? `${result.cropName}, जात ${result.variety}, ${result.area} एकर माहिती भरली आहे.`
            : `${result.cropName}, variety ${result.variety}, ${result.area} acres filled.`,
          { language: language === 'mr' ? 'mr-IN' : 'en-IN', rate: 0.9 }
        );
      }
    } finally {
      setIsProcessingCropVoice(false);
    }
  };

  const loadFarmData = useCallback(async () => {
    try {
      const [cropList, plotList, profile, expenses] = await Promise.all([
        getCrops(),
        getPlots(),
        getFarmerProfile(),
        getExpenseSummary(),
      ]);
      setCrops(cropList);
      setPlots(plotList);
      setFarmerProfile(profile);
      setExpenseSummary(expenses);
      if (cropList.length > 0 && !cropList.some((c) => c.id === selectedPlotId)) {
        setSelectedPlotId(cropList[0].id);
      }
    } catch (err) {
      console.warn('Error loading farm data:', err);
    }
  }, [selectedPlotId]);

  useFocusEffect(
    useCallback(() => {
      loadFarmData();
    }, [loadFarmData])
  );

  // Cleanup speech and AI timers on unmount
  useEffect(() => {
    return () => {
      isModalActiveRef.current = false;
      if (aiCountdownTimerRef.current) clearTimeout(aiCountdownTimerRef.current);
      if (aiCountdownIntervalRef.current) clearInterval(aiCountdownIntervalRef.current);
      try {
        if (Speech) Speech.stop();
      } catch { }
    };
  }, []);

  const handleToggleSpeak = (key: string, textToSpeak: string) => {
    if (!Speech) return;
    try {
      if (activeSpeakingKey === key) {
        Speech.stop();
        setActiveSpeakingKey(null);
      } else {
        Speech.stop();
        setActiveSpeakingKey(key);
        const speechLang = language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
        Speech.speak(textToSpeak, {
          language: speechLang,
          rate: 0.88,
          pitch: 1.0,
          onDone: () => setActiveSpeakingKey(null),
          onStopped: () => setActiveSpeakingKey(null),
          onError: () => setActiveSpeakingKey(null),
        });
      }
    } catch {
      setActiveSpeakingKey(null);
    }
  };

  const getCropImage = (name: string, customUrl?: string) => {
    if (customUrl && customUrl.startsWith('http')) return customUrl;
    const n = (name || '').toLowerCase();
    if (n.includes('टोमॅटो') || n.includes('tomato')) {
      return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80';
    }
    if (n.includes('कापूस') || n.includes('cotton')) {
      return 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&q=80';
    }
    if (n.includes('कांदा') || n.includes('onion')) {
      return 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80';
    }
    if (n.includes('मका') || n.includes('maize') || n.includes('corn')) {
      return 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&q=80';
    }
    if (n.includes('गहू') || n.includes('wheat')) {
      return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80';
    }
    if (n.includes('सोयाबीन') || n.includes('soybean')) {
      return 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80';
  };

  const handleDeleteCrop = (cropId: string, cropName: string) => {
    Alert.alert(
      language === 'mr' ? 'पीक हटवा' : language === 'hi' ? 'फसल हटाएं' : 'Delete Crop',
      language === 'mr'
        ? `तुम्हाला खात्री आहे की "${cropName}" हे पीक हटवायचे आहे?`
        : language === 'hi'
          ? `क्या आप वाकई "${cropName}" को हटाना चाहते हैं?`
          : `Are you sure you want to delete "${cropName}"?`,
      [
        { text: language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: language === 'mr' ? 'हटवा' : language === 'hi' ? 'हटाएं' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCrop(cropId);
              await loadFarmData();
            } catch (err) {
              console.error('Failed to delete crop:', err);
            }
          },
        },
      ]
    );
  };

  const handleSaveCrop = async () => {
    if (!newCropName.trim()) {
      Alert.alert(language === 'mr' ? 'कृपया पिकाचे नाव टाका' : 'Please enter crop name');
      return;
    }
    try {
      const chosenImage = getCropImage(newCropName.trim());
      await addCrop({
        name: newCropName.trim(),
        variety: newCropVariety.trim() || (language === 'mr' ? 'सुधारित जात' : 'Standard'),
        area: newCropArea.trim() || '१.०',
        areaUnit: farmerProfile?.areaUnit || (language === 'en' ? 'Acres' : 'एकर'),
        sowingDate: new Date().toISOString().split('T')[0],
        status: 'active',
        plotName: plots[0]?.name || (language === 'mr' ? 'शेताचा तुकडा १' : 'Plot 1'),
        imageUrl: chosenImage,
      });
      if (Speech) {
        const spokenMsg =
          language === 'mr'
            ? `${newCropName.trim()} पीक शेतात यशस्वीपणे जतन झाले आहे.`
            : language === 'hi'
              ? `${newCropName.trim()} फसल सफलतापूर्वक खेत में दर्ज हो गई है।`
              : `${newCropName.trim()} crop saved successfully.`;
        Speech.speak(spokenMsg, { language: language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN' });
      }
      setNewCropName('');
      setNewCropVariety('');
      setNewCropArea('१.०');
      handleCloseAddCropModal();
      await loadFarmData();
    } catch (err) {
      console.error('Failed to add crop:', err);
    }
  };

  const calculatedCropArea = crops.reduce((acc, c) => acc + (parseFloat(c.area) || 0), 0);
  const calculatedPlotArea = plots.reduce((acc, p) => acc + (parseFloat(p.area) || 0), 0);
  const totalAreaVal = farmerProfile?.totalArea
    ? parseFloat(farmerProfile.totalArea)
    : calculatedPlotArea > 0
      ? calculatedPlotArea
      : calculatedCropArea;
  const totalAreaText = totalAreaVal > 0 ? totalAreaVal.toFixed(1).replace(/\.0$/, '') : '०';
  const areaUnitText = farmerProfile?.areaUnit || (language === 'en' ? 'Acres' : 'एकर');

  const farmSpokenSummary =
    crops.length > 0
      ? language === 'mr'
        ? `माझे शेत अहवाल: तुमचे एकूण शेत ${totalAreaText} ${areaUnitText} असून सध्या शेतात ${crops.length} पिके आहेत: ${crops.map((c) => c.name).join(', ')}. सर्व पिकांची स्थिती समाधानकारक आहे.`
        : language === 'hi'
          ? `मेरा खेत रिपोर्ट: आपका कुल खेत ${totalAreaText} ${areaUnitText} है और वर्तमान में ${crops.length} फसलें हैं: ${crops.map((c) => c.name).join(', ')}।`
          : `My Farm Report: Total land is ${totalAreaText} ${areaUnitText} with ${crops.length} active crops: ${crops.map((c) => c.name).join(', ')}.`
      : language === 'mr'
        ? 'माझे शेत: सध्या कोणतेही पीक नोंदवलेले नाही. नवीन पीक जोडण्यासाठी खालील बटणावर दाबा.'
        : language === 'hi'
          ? 'मेरा खेत: अभी कोई फसल दर्ज नहीं है। नई फसल जोड़ने के लिए नीचे दिए बटन को दबाएं।'
          : 'My Farm: No crops added yet. Tap Add Crop to record your first crop.';

  // Dynamically formatted Crops list derived from storage
  const cropsList = crops.map((c) => ({
    id: c.id,
    name: c.name,
    variety: c.variety || (language === 'mr' ? 'सुधारित' : 'Standard'),
    area: `${c.area} ${c.areaUnit || areaUnitText}`,
    plotName: c.plotName || (language === 'mr' ? 'शेताचा तुकडा' : 'Farm Plot'),
    stage: language === 'mr' ? 'वाढीची अवस्था' : language === 'hi' ? 'वृद्धि अवस्था' : 'Vegetative Stage',
    stageColor: '#15803d',
    stageBg: '#dcfce7',
    progress: '55%',
    progressColor: '#15803d',
    daysLeft: language === 'mr' ? 'काढणी लवकरच' : language === 'hi' ? 'कटाई जल्द' : 'Harvest soon',
    sowingDate: c.sowingDate || new Date().toISOString().split('T')[0],
    advice:
      language === 'mr'
        ? 'मातीत ओलावा तपासा, आवश्यकतेनुसार पाणी व खत द्या.'
        : language === 'hi'
          ? 'मिट्टी में नमी जांचें, आवश्यक अनुसार सिंचाई करें।'
          : 'Check soil moisture, irrigate as required.',
    spokenText: `${c.name}: ${c.area} ${c.areaUnit || areaUnitText}. जात ${c.variety}.`,
    image: getCropImage(c.name, c.imageUrl),
    totalExpenses: c.totalExpenses || 0,
  }));

  const handleCallKisanHelpline = () => {
    Linking.openURL('tel:18001801551').catch(() => { });
  };

  const selectedPlotCrop = cropsList.find((c) => c.id === selectedPlotId) || cropsList[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#f1f5f9' }]}
      contentContainerStyle={[
        styles.contentContainer,
        { paddingTop: insets.top > 0 ? insets.top + 6 : 14, paddingBottom: 40 },
      ]}
      showsVerticalScrollIndicator={false}>
      {/* 1. Header with Location & Farmer Details */}
      <View style={styles.headerRow}>
        <View style={styles.brandCol}>
          <View style={styles.titleRow}>
            <View style={styles.headerIconCircle}>
              <Mountain size={24} color="#ffffff" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {language === 'mr' ? 'माझे शेत' : language === 'hi' ? 'मेरा खेत' : 'My Farm'}
              </Text>
              <Text style={styles.headerSub}>
                {language === 'mr'
                  ? `${totalAreaText} ${areaUnitText} जमीन • ${crops.length} पिके`
                  : language === 'hi'
                    ? `${totalAreaText} ${areaUnitText} जमीन • ${crops.length} फसलें`
                    : `${totalAreaText} ${areaUnitText} Land • ${crops.length} Active Crops`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            style={styles.locationChip}
            onPress={() => setShowLocationModal(true)}
            activeOpacity={0.7}>
            <MapPin size={15} color="#15803d" />
            <Text style={styles.locationText}>{location.displayCity}</Text>
            <ChevronDown size={12} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}>
            <Bell size={20} color="#0f172a" strokeWidth={2} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{crops.length}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. 🔊 TOP FARM AUDIO HERO BANNER (१-टॅप शेताचा अहवाल ऐका) */}
      <TouchableOpacity
        style={[
          styles.audioHeroBanner,
          activeSpeakingKey === 'farmSummary' && styles.audioHeroBannerActive,
        ]}
        onPress={() => handleToggleSpeak('farmSummary', farmSpokenSummary)}
        activeOpacity={0.85}>
        <View style={styles.audioHeroLeft}>
          <View style={styles.audioHeroBadge}>
            {activeSpeakingKey === 'farmSummary' ? (
              <Volume2 size={14} color="#ffffff" />
            ) : (
              <Sparkles size={14} color="#ffffff" />
            )}
            <Text style={styles.audioHeroBadgeText}>
              {language === 'mr' ? 'व्हॉइस अहवाल' : language === 'hi' ? 'वॉइस रिपोर्ट' : 'Voice Report'}
            </Text>
          </View>
          <Text style={styles.audioHeroTitle}>
            {activeSpeakingKey === 'farmSummary'
              ? language === 'mr' ? '⏹️ आवाज थांबवा' : language === 'hi' ? '⏹️ आवाज रोकें' : '⏹️ Stop Audio'
              : language === 'mr' ? '🔊 शेताचा अहवाल ऐका' : language === 'hi' ? '🔊 खेत रिपोर्ट सुनें' : '🔊 Listen Farm Report'}
          </Text>
          <Text style={styles.audioHeroSub}>
            {language === 'mr'
              ? 'सर्व पिके, काढणीचे दिवस व शेताची स्थिती एका टॅपने ऐका'
              : language === 'hi'
                ? 'सभी फसलें, कटाई दिन और खेत स्थिति आवाज़ में सुनें'
                : 'Listen to crops status, harvest timeline and farm health'}
          </Text>
        </View>

        <View style={styles.audioPlayCircle}>
          {activeSpeakingKey === 'farmSummary' ? (
            <Square size={24} color="#dc2626" fill="#dc2626" />
          ) : (
            <Volume2 size={26} color="#15803d" strokeWidth={2.2} />
          )}
        </View>
      </TouchableOpacity>

      {/* 3. 4 BIG CATEGORY TABS (मोठे पर्याय टॅब्स) */}
      <View style={styles.categoryTabsGrid}>
        {[
          {
            key: 'crops' as const,
            label: language === 'mr' ? '🌾 माझी पिके' : language === 'hi' ? '🌾 फसलें' : '🌾 My Crops',
            sub: `${crops.length} ${language === 'mr' ? 'पिके' : language === 'hi' ? 'फसलें' : 'Crops'}`,
          },
          {
            key: 'plots' as const,
            label: language === 'mr' ? '🗺️ शेताचे तुकडे' : language === 'hi' ? '🗺️ खेत टुकड़े' : '🗺️ Farm Plots',
            sub: `${totalAreaText} ${areaUnitText}`,
          },
          {
            key: 'expenses' as const,
            label: language === 'mr' ? '💰 खर्च व नफा' : language === 'hi' ? '💰 खर्च व लाभ' : '💰 Expenses',
            sub: `₹ ${expenseSummary.totalExpense.toLocaleString('en-IN')}`,
          },
          {
            key: 'advisory' as const,
            label: language === 'mr' ? '🧪 शेती सल्ला' : language === 'hi' ? '🧪 कृषि सलाह' : '🧪 Advisory',
            sub: language === 'mr' ? 'माती व पाणी' : 'Soil & Water',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.categoryTabBtn,
                isActive ? styles.categoryTabBtnActive : styles.categoryTabBtnInactive,
              ]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}>
              <Text
                style={[
                  styles.categoryTabLabel,
                  isActive ? styles.categoryTabLabelActive : styles.categoryTabLabelInactive,
                ]}>
                {tab.label}
              </Text>
              <Text
                style={[
                  styles.categoryTabSub,
                  isActive ? styles.categoryTabSubActive : styles.categoryTabSubInactive,
                ]}>
                {tab.sub}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 4. TOTAL LAND & SOIL HEALTH SUMMARY CARD */}
      <View style={styles.totalLandCard}>
        <View style={styles.totalLandTopRow}>
          <View>
            <Text style={styles.totalLandLabel}>
              {language === 'mr' ? 'एकूण शेत जमीन (Total Area)' : language === 'hi' ? 'कुल खेत क्षेत्र' : 'Total Farm Area'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 2 }}>
              <Text style={styles.totalLandFigure}>{totalAreaText} {areaUnitText}</Text>
              <Text style={styles.totalLandSubUnit}> ({plots.length} {language === 'mr' ? 'तुकडे' : 'Plots'})</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addCropQuickBtn}
            onPress={handleOpenAddCropModal}
            activeOpacity={0.8}>
            <PlusCircle size={18} color="#ffffff" />
            <Text style={styles.addCropQuickText}>
              {language === 'mr' ? '+ नवीन पीक' : language === 'hi' ? '+ नई फसल' : '+ Add Crop'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 Quick Farm Health Metrics */}
        <View style={styles.farmMetricsRow}>
          <View style={styles.farmMetricBox}>
            <ShieldCheck size={18} color="#15803d" strokeWidth={2.2} />
            <Text style={styles.farmMetricVal}>
              {language === 'mr' ? 'उत्कृष्ट' : language === 'hi' ? 'उत्कृष्ट' : 'Good'}
            </Text>
            <Text style={styles.farmMetricLbl}>
              {language === 'mr' ? 'आरोग्य' : language === 'hi' ? 'स्वास्थ्य' : 'Health'}
            </Text>
          </View>
          <View style={styles.farmMetricDivider} />
          <View style={styles.farmMetricBox}>
            <Droplets size={18} color="#0284c7" strokeWidth={2.2} />
            <Text style={styles.farmMetricVal}>६२%</Text>
            <Text style={styles.farmMetricLbl}>
              {language === 'mr' ? 'ओलावा' : language === 'hi' ? 'नमी' : 'Moisture'}
            </Text>
          </View>
          <View style={styles.farmMetricDivider} />
          <View style={styles.farmMetricBox}>
            <Sprout size={18} color="#15803d" strokeWidth={2.2} />
            <Text style={styles.farmMetricVal}>{crops.length} {language === 'mr' ? 'पिके' : language === 'hi' ? 'फसलें' : 'Crops'}</Text>
            <Text style={styles.farmMetricLbl}>
              {language === 'mr' ? 'लागवड' : language === 'hi' ? 'फसलें' : 'Active'}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. TAB 1: CROPS LIST (माझी पिके) */}
      {activeTab === 'crops' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? `माझी सक्रिय पिके (${crops.length})` : language === 'hi' ? `मेरी सक्रिय फसलें (${crops.length})` : `Active Crops (${crops.length})`}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'पिकांची माहिती व काढणीचे दिवस' : language === 'hi' ? 'फसल विवरण और कटाई दिन' : 'Crop details & harvest schedule'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.tasksBtnTop}
              onPress={() => router.push('/tasks')}
              activeOpacity={0.7}>
              <CheckSquare size={16} color="#15803d" />
              <Text style={styles.tasksBtnTopText}>
                {language === 'mr' ? 'कामे तपासा' : language === 'hi' ? 'कार्य देखें' : 'Tasks'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Crops List or Empty State */}
          {cropsList.length === 0 ? (
            <View style={styles.emptyCardContainer}>
              <View style={styles.emptyIconCircle}>
                <Sprout size={40} color="#15803d" strokeWidth={2} />
              </View>
              <Text style={styles.emptyCardTitle}>
                {language === 'mr'
                  ? 'अद्याप कोणतेही पीक जोडलेले नाही'
                  : language === 'hi'
                    ? 'अभी कोई फसल नहीं जोड़ी गई है'
                    : 'No Crops Added Yet'}
              </Text>
              <Text style={styles.emptyCardSub}>
                {language === 'mr'
                  ? 'तुमच्या शेतातील पिकांची नोंद करा आणि वाढ, पाणी, खत व खर्चाचे व्यवस्थापन ठेवा.'
                  : language === 'hi'
                    ? 'अपने खेत की फसलें जोड़ें और वृद्धि, पानी, खाद व खर्च का प्रबंधन करें।'
                    : 'Add your farm crops to track growth stages, irrigation schedules, and expenses.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCardBtn}
                onPress={handleOpenAddCropModal}
                activeOpacity={0.8}>
                <PlusCircle size={18} color="#ffffff" />
                <Text style={styles.emptyCardBtnText}>
                  {language === 'mr' ? '+ नवीन पीक जोडा' : language === 'hi' ? '+ नई फसल जोड़ें' : '+ Add Crop'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cropsCardsStack}>
              {cropsList.map((crop) => {
                const isSpeakingThisCrop = activeSpeakingKey === `crop_${crop.id}`;
                return (
                  <View key={crop.id} style={styles.farmerCropCard}>
                    {/* Top Row: Photo + Name + Acre + Delete Button */}
                    <View style={styles.cropCardTopRow}>
                      <Image source={{ uri: crop.image }} style={styles.cropBigPhoto} />

                      <View style={styles.cropDetailsCenter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={styles.cropBigName}>{crop.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.cropAreaBadgeText}>{crop.area}</Text>
                            <TouchableOpacity
                              onPress={() => handleDeleteCrop(crop.id, crop.name)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.cropDeleteBtn}>
                              <Trash2 size={17} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={styles.cropVarietyLabel}>जात: {crop.variety}</Text>
                        <Text style={styles.cropPlotLabel}>📍 {crop.plotName}</Text>
                      </View>
                    </View>

                    {/* Stage & Harvest Countdown Row */}
                    <View style={styles.cropBadgesRow}>
                      <View style={[styles.stagePill, { backgroundColor: crop.stageBg }]}>
                        <Text style={[styles.stagePillText, { color: crop.stageColor }]}>
                          ● {crop.stage}
                        </Text>
                      </View>

                      <View style={styles.harvestPill}>
                        <Text style={styles.harvestPillText}>⏳ {crop.daysLeft}</Text>
                      </View>
                    </View>

                    {/* Visual Growth Progress Bar */}
                    <View style={styles.growthProgressContainer}>
                      <View style={styles.growthLabelsRow}>
                        <Text style={styles.growthLabelLeft}>
                          {language === 'mr' ? 'पिकाची वाढ (Growth):' : language === 'hi' ? 'फसल वृद्धि:' : 'Crop Growth:'}
                        </Text>
                        <Text style={[styles.growthLabelRight, { color: crop.progressColor }]}>
                          {crop.progress}
                        </Text>
                      </View>
                      <View style={styles.growthTrack}>
                        <View
                          style={[
                            styles.growthFill,
                            { width: crop.progress as any, backgroundColor: crop.progressColor },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Farmer Action Advice Box */}
                    <View style={styles.cropAdviceBox}>
                      <Lightbulb size={16} color="#15803d" />
                      <Text style={styles.cropAdviceText}>
                        <Text style={{ fontWeight: '800' }}>
                          {language === 'mr' ? 'सल्ला: ' : language === 'hi' ? 'सलाह: ' : 'Advice: '}
                        </Text>
                        {crop.advice}
                      </Text>
                    </View>

                    {/* Bottom Action Buttons: 🔊 Listen, 📸 Scan, ℹ️ Details */}
                    <View style={styles.cropActionButtonsRow}>
                      {/* 1-Tap Audio Button */}
                      <TouchableOpacity
                        style={[
                          styles.cropAudioBtn,
                          isSpeakingThisCrop && styles.cropAudioBtnActive,
                        ]}
                        onPress={() => handleToggleSpeak(`crop_${crop.id}`, crop.spokenText)}
                        activeOpacity={0.7}>
                        {isSpeakingThisCrop ? (
                          <Square size={16} color="#ffffff" fill="#ffffff" />
                        ) : (
                          <Volume2 size={18} color="#15803d" />
                        )}
                        <Text
                          style={[
                            styles.cropAudioBtnText,
                            isSpeakingThisCrop && styles.cropAudioBtnTextActive,
                          ]}>
                          {isSpeakingThisCrop
                            ? language === 'mr' ? 'थांबवा' : language === 'hi' ? 'रोकें' : 'Stop'
                            : language === 'mr' ? '🔊 ऐका' : language === 'hi' ? '🔊 सुनें' : '🔊 Listen'}
                        </Text>
                      </TouchableOpacity>

                      {/* Scan Disease Button */}
                      <TouchableOpacity
                        style={styles.cropScanBtn}
                        onPress={() => router.push('/(tabs)/scan')}
                        activeOpacity={0.7}>
                        <Camera size={16} color="#15803d" strokeWidth={2} />
                        <Text style={styles.cropScanBtnText}>
                          {language === 'mr' ? 'रोग निदान' : language === 'hi' ? 'रोग जांच' : 'Scan'}
                        </Text>
                      </TouchableOpacity>

                      {/* View Details Button */}
                      <TouchableOpacity
                        style={styles.cropDetailsBtn}
                        onPress={() => router.push({ pathname: '/crop-details', params: { cropId: crop.id } })}
                        activeOpacity={0.7}>
                        <Text style={styles.cropDetailsBtnText}>
                          {language === 'mr' ? 'माहिती →' : language === 'hi' ? 'विवरण →' : 'Details →'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 6. TAB 2: PLOTS & LAND (शेताचे तुकडे) */}
      {activeTab === 'plots' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? `शेताचे तुकडे (${plots.length || cropsList.length})` : `Farm Plots (${plots.length || cropsList.length})`}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'तुकड्यावर टॅप करून सविस्तर माहिती पहा' : language === 'hi' ? 'टुकड़े पर टैप करके विवरण देखें' : 'Tap a plot to view details'}
              </Text>
            </View>
          </View>

          {/* Interactive Visual Plot Tiles or Empty State */}
          {cropsList.length === 0 ? (
            <View style={styles.emptyCardContainer}>
              <View style={styles.emptyIconCircle}>
                <Map size={40} color="#15803d" strokeWidth={1.8} />
              </View>
              <Text style={styles.emptyCardTitle}>
                {language === 'mr'
                  ? 'कोणताही शेताचा तुकडा उपलब्ध नाही'
                  : language === 'hi'
                    ? 'कोई खेत टुकड़ा उपलब्ध नहीं'
                    : 'No Farm Plots Available'}
              </Text>
              <Text style={styles.emptyCardSub}>
                {language === 'mr'
                  ? 'नवीन पीक जोडल्यावर शेताचा तुकडा आपोआप तयार होईल.'
                  : language === 'hi'
                    ? 'नई फसल जोड़ने पर खेत का टुकड़ा स्वतः बन जाएगा।'
                    : 'Adding a crop will automatically configure your farm plot.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyCardBtn}
                onPress={handleOpenAddCropModal}
                activeOpacity={0.8}>
                <PlusCircle size={18} color="#ffffff" />
                <Text style={styles.emptyCardBtnText}>
                  {language === 'mr' ? '+ नवीन पीक जोडा' : language === 'hi' ? '+ नई फसल जोड़ें' : '+ Add Crop'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.plotsGridContainer}>
                {cropsList.map((crop) => {
                  const isSelected = selectedPlotId === crop.id;
                  return (
                    <TouchableOpacity
                      key={crop.id}
                      style={[
                        styles.plotTileCard,
                        isSelected && styles.plotTileCardSelected,
                      ]}
                      onPress={() => setSelectedPlotId(crop.id)}
                      activeOpacity={0.8}>
                      <View style={[styles.plotCropIconCircle, { backgroundColor: crop.stageBg }]}>
                        <Sprout
                          size={24}
                          color={crop.stageColor}
                          strokeWidth={2}
                        />
                      </View>

                      <Text style={styles.plotTileName}>{crop.name}</Text>
                      <Text style={styles.plotTileArea}>{crop.area}</Text>
                      <View style={styles.plotTileBadge}>
                        <Text style={styles.plotTileBadgeText}>{crop.plotName}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Plot Detail Card */}
              {selectedPlotCrop && (
                <View style={styles.selectedPlotCard}>
                  <View style={styles.selectedPlotHeaderRow}>
                    <View>
                      <Text style={styles.selectedPlotTitle}>
                        📍 {selectedPlotCrop.plotName}: {selectedPlotCrop.name}
                      </Text>
                      <Text style={styles.selectedPlotArea}>
                        क्षेत्र: {selectedPlotCrop.area} • जात: {selectedPlotCrop.variety}
                      </Text>
                    </View>
                    <View style={[styles.stagePill, { backgroundColor: selectedPlotCrop.stageBg }]}>
                      <Text style={[styles.stagePillText, { color: selectedPlotCrop.stageColor }]}>
                        {selectedPlotCrop.stage}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.selectedPlotMetricsGrid}>
                    <View style={styles.plotMetricItem}>
                      <Text style={styles.plotMetricVal}>{selectedPlotCrop.sowingDate}</Text>
                      <Text style={styles.plotMetricLbl}>पेरणी तारीख</Text>
                    </View>
                    <View style={styles.plotMetricItem}>
                      <Text style={[styles.plotMetricVal, { color: '#b45309' }]}>
                        {selectedPlotCrop.daysLeft}
                      </Text>
                      <Text style={styles.plotMetricLbl}>काढणी वेळ</Text>
                    </View>
                    <View style={styles.plotMetricItem}>
                      <Text style={[styles.plotMetricVal, { color: '#15803d' }]}>६२%</Text>
                      <Text style={styles.plotMetricLbl}>माती ओलावा</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.plotActionBtn}
                    onPress={() => router.push({ pathname: '/crop-details', params: { cropId: selectedPlotCrop.id } })}
                    activeOpacity={0.8}>
                    <Text style={styles.plotActionBtnText}>
                      {language === 'mr' ? 'या तुकड्याचे व्यवस्थापन करा →' : language === 'hi' ? 'इस टुकड़े का प्रबंधन करें →' : 'Manage this plot →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* 7. TAB 3: EXPENSES & PROFIT (खर्च व नफा हिशोब) */}
      {activeTab === 'expenses' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? 'शेती खर्च व नफा हिशोब' : language === 'hi' ? 'खर्च व लाभ हिसाब' : 'Farm Cost & Profit'}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'चालू हंगाम (खरीप २०२६)' : language === 'hi' ? 'वर्तमान सत्र (खरीफ २०२६)' : 'Current Season (Kharif 2026)'}
              </Text>
            </View>
          </View>

          {/* Income vs Expense Cards */}
          <View style={styles.financialSummaryGrid}>
            <View style={[styles.financeCard, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
              <Text style={styles.financeLabel}>
                {language === 'mr' ? 'एकूण खर्च' : language === 'hi' ? 'कुल खर्च' : 'Total Cost'}
              </Text>
              <Text style={[styles.financeFigure, { color: '#dc2626' }]}>
                ₹ {expenseSummary.totalExpense.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.financeSub}>नोंदणीकृत खर्च</Text>
            </View>

            <View style={[styles.financeCard, { backgroundColor: '#dcfce7', borderColor: '#86efac' }]}>
              <Text style={styles.financeLabel}>
                {language === 'mr' ? 'उत्पन्न (विक्री)' : language === 'hi' ? 'अनुमानित आय' : 'Expected Return'}
              </Text>
              <Text style={[styles.financeFigure, { color: '#15803d' }]}>
                ₹ {expenseSummary.totalRevenue > 0 ? expenseSummary.totalRevenue.toLocaleString('en-IN') : (expenseSummary.totalExpense > 0 ? (expenseSummary.totalExpense * 2.5).toLocaleString('en-IN') : '०')}
              </Text>
              <Text style={styles.financeSub}>शेती उत्पन्न</Text>
            </View>
          </View>

          {/* Net Profit Banner */}
          <View style={styles.netProfitBanner}>
            <View>
              <Text style={styles.netProfitLabel}>
                {language === 'mr' ? '💰 अपेक्षित नफा (Net Profit):' : language === 'hi' ? '💰 अनुमानित लाभ:' : '💰 Net Profit:'}
              </Text>
              <Text style={styles.netProfitFigure}>
                {expenseSummary.netProfit >= 0 ? `+ ₹ ${expenseSummary.netProfit.toLocaleString('en-IN')}` : `- ₹ ${Math.abs(expenseSummary.netProfit).toLocaleString('en-IN')}`}
              </Text>
            </View>
          </View>

          {/* Detailed Breakdown List */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>
              {language === 'mr' ? 'खर्चाचा तपशील:' : language === 'hi' ? 'खर्च का विवरण:' : 'Expense Breakdown:'}
            </Text>
            {[
              { item: '🌱 बियाणे (Seeds)', cost: expenseSummary.byCategory['seeds'] || 0 },
              { item: '🧪 खते व औषधे (Fertilizers & Pesticides)', cost: (expenseSummary.byCategory['fertilizer'] || 0) + (expenseSummary.byCategory['pesticide'] || 0) },
              { item: '🚜 नांगरणी व मजुरी (Tractor & Labor)', cost: (expenseSummary.byCategory['machinery'] || 0) + (expenseSummary.byCategory['labour'] || 0) },
              { item: '💧 सिंचन (Irrigation)', cost: expenseSummary.byCategory['irrigation'] || 0 },
              { item: '📦 इतर (Other)', cost: expenseSummary.byCategory['other'] || 0 },
            ].map((entry, idx) => (
              <View key={idx} style={styles.breakdownRow}>
                <Text style={styles.breakdownItemText}>{entry.item}</Text>
                <Text style={styles.breakdownCostText}>₹ {entry.cost.toLocaleString('en-IN')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 8. TAB 4: ADVISORY (शेती सल्ला) */}
      {activeTab === 'advisory' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>
                {language === 'mr' ? 'कृषी सल्ला व सेवा' : language === 'hi' ? 'कृषि सलाह व सेवाएं' : 'Farm Services & Advisory'}
              </Text>
              <Text style={styles.sectionSub}>
                {language === 'mr' ? 'माती, पाणी आणि खत नियोजन' : language === 'hi' ? 'मिट्टी, पानी व खाद योजना' : 'Soil, water and fertilizer management'}
              </Text>
            </View>
          </View>

          <View style={styles.advisoryServicesCol}>
            {/* 1. Soil Testing */}
            <TouchableOpacity style={styles.advisoryServiceCard} activeOpacity={0.8}>
              <View style={[styles.advisoryIconBox, { backgroundColor: '#e8f5e9' }]}>
                <Sprout size={26} color="#15803d" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryServiceTitle}>
                  {language === 'mr' ? 'माती परीक्षण (Soil Health)' : language === 'hi' ? 'मिट्टी परीक्षण' : 'Soil Health Testing'}
                </Text>
                <Text style={styles.advisoryServiceDesc}>
                  {language === 'mr'
                    ? 'मातीतील नत्र, स्फुरद, पालाश (NPK) व सामू (pH) ७.२ (चांगला)'
                    : language === 'hi'
                      ? 'मिट्टी में NPK और pH ७.२ (अच्छा)'
                      : 'NPK nutrients and soil pH 7.2'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 2. Irrigation */}
            <TouchableOpacity style={styles.advisoryServiceCard} activeOpacity={0.8}>
              <View style={[styles.advisoryIconBox, { backgroundColor: '#e0f2fe' }]}>
                <Droplets size={26} color="#0284c7" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryServiceTitle}>
                  {language === 'mr' ? 'पाणी व्यवस्थापन (Irrigation)' : language === 'hi' ? 'सिंचाई प्रबंधन' : 'Water Management'}
                </Text>
                <Text style={styles.advisoryServiceDesc}>
                  {language === 'mr'
                    ? 'ठिबक सिंचनाची वेळ: मक्यासाठी सकाळी ७ ते ९ वाजता'
                    : language === 'hi'
                      ? 'ड्रिप सिंचाई समय: सुबह ७ से ९ बजे'
                      : 'Drip schedule: Morning 7 to 9 AM'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>

            {/* 3. Fertilizer Schedule */}
            <TouchableOpacity style={styles.advisoryServiceCard} activeOpacity={0.8}>
              <View style={[styles.advisoryIconBox, { backgroundColor: '#fef3c7' }]}>
                <Package size={26} color="#d97706" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.advisoryServiceTitle}>
                  {language === 'mr' ? 'खत नियोजन (Fertilizer Plan)' : language === 'hi' ? 'खाद योजना' : 'Fertilizer Schedule'}
                </Text>
                <Text style={styles.advisoryServiceDesc}>
                  {language === 'mr'
                    ? 'कापसासाठी युरिया आणि १९:१९:१९ चा दुसरा हप्ता'
                    : language === 'hi'
                      ? 'कपास के लिए यूरिया व १९:१९:१९ की दूसरी खुराक'
                      : 'Second dose of Urea & 19:19:19 for Cotton'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 9. BIG BUTTON: "+ नवीन पीक जोडा" (Add New Crop) */}
      <TouchableOpacity
        style={styles.addNewCropButton}
        onPress={() => setShowAddCropModal(true)}
        activeOpacity={0.85}>
        <PlusCircle size={22} color="#ffffff" strokeWidth={2.2} />
        <Text style={styles.addNewCropButtonText}>
          {language === 'mr' ? '+ नवीन पीक जोडा (Add New Crop)' : language === 'hi' ? '+ नई फसल जोड़ें' : '+ Add New Crop'}
        </Text>
      </TouchableOpacity>

      {/* 10. KISAN CALL CENTER HELPLINE CARD */}
      <View style={styles.helplineCard}>
        <View style={styles.helplineLeftCol}>
          <View style={styles.helplineHeadRow}>
            <Phone size={18} color="#15803d" />
            <Text style={styles.helplineTitle}>
              {language === 'mr' ? 'किसान कॉल सेंटर (टोल-फ्री)' : language === 'hi' ? 'किसान कॉल सेंटर (टोल-फ्री)' : 'Kisan Call Center (Toll-Free)'}
            </Text>
          </View>
          <Text style={styles.helplineNumber}>📞 १८००-१८०-१५५१</Text>
          <Text style={styles.helplineDesc}>
            {language === 'mr'
              ? 'शेताविषयी शासकीय कृषी तज्ञांशी थेट फोनवर मोफत बोला'
              : language === 'hi'
                ? 'खेत समस्याओं पर सरकारी कृषि विशेषज्ञों से सीधे फोन पर बात करें'
                : 'Free direct phone advice from agricultural scientists'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.callNowBtn}
          onPress={handleCallKisanHelpline}
          activeOpacity={0.8}>
          <Phone size={16} color="#ffffff" />
          <Text style={styles.callNowBtnText}>
            {language === 'mr' ? 'कॉल करा' : language === 'hi' ? 'कॉल करें' : 'Call'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Crop Modal (Bottom Sheet with Keyboard Avoiding) */}
      <Modal
        visible={showAddCropModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={handleCloseAddCropModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
            <TouchableWithoutFeedback onPress={handleCloseAddCropModal}>
              <View style={{ flex: 1 }} />
            </TouchableWithoutFeedback>

            <View
              style={{
                backgroundColor: '#ffffff',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingHorizontal: 20,
                paddingTop: 12,
                paddingBottom: Platform.OS === 'ios' ? 34 : 20,
                maxHeight: '85%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -3 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 10,
              }}>
              {/* Bottom Sheet Handle */}
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: '#cbd5e1',
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginBottom: 12,
                }}
              />

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1e293b' }}>
                  {language === 'mr' ? 'नवीन पीक जोडा' : language === 'hi' ? 'नई फसल जोड़ें' : 'Add New Crop'}
                </Text>
                <TouchableOpacity
                  onPress={handleCloseAddCropModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <XCircle size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 16 }}>
                {/* 🎙️ Primary AI Speak to Fill Card with 3s Countdown & Firebase Question */}
                <View
                  style={{
                    backgroundColor: isRecordingCropVoice
                      ? '#fef2f2'
                      : aiCropPromptState === 'countdown'
                      ? '#fefce8'
                      : aiCropPromptState === 'speaking'
                      ? '#ecfdf5'
                      : '#f0fdf4',
                    borderWidth: 2,
                    borderColor: isRecordingCropVoice
                      ? '#ef4444'
                      : aiCropPromptState === 'countdown'
                      ? '#eab308'
                      : aiCropPromptState === 'speaking'
                      ? '#10b981'
                      : '#86efac',
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 16,
                    shadowColor: isRecordingCropVoice ? '#ef4444' : '#15803d',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                  }}>
                  {/* 3-Step Question Pills */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 6,
                      marginBottom: 12,
                      paddingBottom: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: '#dcfce7',
                    }}>
                    {[
                      { idx: 0, label: language === 'mr' ? '१. रोप / पीक' : '1. Plant/Crop', val: newCropName },
                      { idx: 1, label: language === 'mr' ? '२. जात' : '2. Variety', val: newCropVariety },
                      { idx: 2, label: language === 'mr' ? '३. क्षेत्र (एकर)' : '3. Acres', val: aiCropPromptState === 'completed' || activeQuestionIndex === 2 ? newCropArea : '' },
                    ].map((step) => {
                      const isCurrent = activeQuestionIndex === step.idx && aiCropPromptState !== 'completed';
                      const isDone = !!step.val && (step.idx < activeQuestionIndex || aiCropPromptState === 'completed');
                      return (
                        <TouchableOpacity
                          key={step.idx}
                          activeOpacity={0.8}
                          onPress={() => triggerAiQuestion(step.idx)}
                          style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 4,
                            paddingVertical: 5,
                            paddingHorizontal: 4,
                            borderRadius: 10,
                            backgroundColor: isCurrent ? '#dcfce7' : isDone ? '#f0fdf4' : '#ffffff',
                            borderWidth: 1.5,
                            borderColor: isCurrent ? '#15803d' : isDone ? '#86efac' : '#cbd5e1',
                          }}>
                          {isDone ? (
                            <CheckCircle2 size={13} color="#15803d" />
                          ) : (
                            <Text style={{ fontSize: 11, fontWeight: '800', color: isCurrent ? '#15803d' : '#94a3b8' }}>
                              {step.idx + 1}
                            </Text>
                          )}
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 11.5,
                              fontWeight: isCurrent ? '800' : '600',
                              color: isCurrent ? '#15803d' : isDone ? '#166534' : '#64748b',
                            }}>
                            {step.val ? `${step.val}` : step.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                      onPress={handleToggleCropVoice}
                      disabled={isProcessingCropVoice}
                      activeOpacity={0.8}
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: isRecordingCropVoice
                          ? '#ef4444'
                          : aiCropPromptState === 'countdown'
                          ? '#ca8a04'
                          : aiCropPromptState === 'speaking'
                          ? '#059669'
                          : '#15803d',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: isRecordingCropVoice ? '#ef4444' : '#15803d',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.35,
                        shadowRadius: 5,
                        elevation: 4,
                      }}>
                      {isProcessingCropVoice ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : isRecordingCropVoice ? (
                        <Square size={20} color="#ffffff" />
                      ) : aiCropPromptState === 'countdown' ? (
                        <Text style={{ fontSize: 22, fontWeight: '900', color: '#ffffff' }}>
                          {aiCountdown}
                        </Text>
                      ) : aiCropPromptState === 'speaking' ? (
                        <Volume2 size={24} color="#ffffff" />
                      ) : (
                        <Mic size={26} color="#ffffff" />
                      )}
                    </TouchableOpacity>

                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '800',
                          color: isRecordingCropVoice
                            ? '#b91c1c'
                            : aiCropPromptState === 'countdown'
                            ? '#854d0e'
                            : aiCropPromptState === 'speaking'
                            ? '#065f46'
                            : '#166534',
                        }}>
                        {isProcessingCropVoice
                          ? language === 'mr' ? '✨ AI माहिती भरत आहे...' : language === 'hi' ? '✨ AI जानकारी भर रहा है...' : '✨ AI processing speech...'
                          : isRecordingCropVoice
                          ? activeQuestionIndex === 0
                            ? language === 'mr' ? '🔴 माईक सुरू आहे... पिकाचे नाव बोला!' : '🔴 Mic is ON... Speak crop name!'
                            : activeQuestionIndex === 1
                            ? language === 'mr' ? '🔴 माईक सुरू आहे... जात / व्हरायटी बोला!' : '🔴 Mic is ON... Speak crop variety!'
                            : language === 'mr' ? '🔴 माईक सुरू आहे... क्षेत्र (एकर) बोला!' : '🔴 Mic is ON... Speak area in acres!'
                          : aiCropPromptState === 'countdown'
                          ? language === 'mr' ? `⏳ प्रश्न ${activeQuestionIndex + 1} विचारत आहे... (${aiCountdown}s)` : language === 'hi' ? `⏳ सवाल ${activeQuestionIndex + 1} पूछने वाला है... (${aiCountdown}s)` : `⏳ Asking Q${activeQuestionIndex + 1} in ${aiCountdown}s...`
                          : aiCropPromptState === 'speaking'
                          ? language === 'mr' ? `🤖 AI विचारत आहे (प्रश्न ${activeQuestionIndex + 1}):` : language === 'hi' ? `🤖 AI पूछ रहा है (सवाल ${activeQuestionIndex + 1}):` : `🤖 AI is asking (Q${activeQuestionIndex + 1}):`
                          : language === 'mr' ? '🎙️ बोलून माहिती भरा (माईक दाबा)' : language === 'hi' ? '🎙️ बोलकर जानकारी भरें' : '🎙️ Speak to Fill (Tap Mic)'}
                      </Text>

                      {aiCropPromptState === 'speaking' ? (
                        <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#047857', marginTop: 2 }}>
                          {`"${aiQuestionPrompt || (activeQuestionIndex === 0 ? 'तुम्ही कोणते रोप किंवा पीक लावत आहात?' : activeQuestionIndex === 1 ? 'कोणती जात लावली?' : 'किती एकर क्षेत्रात लागवड केली?')}"`}
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 }}>
                          {isRecordingCropVoice
                            ? language === 'mr' ? 'बोलणे झाल्यावर पुन्हा लाल बटणावर दाबा.' : 'Tap stop button when done speaking.'
                            : aiCropPromptState === 'countdown'
                            ? language === 'mr' ? 'तयार राहा! AI विचारेल आणि माईक आपोआप सुरू होईल.' : 'Get ready! AI will speak and mic turns on automatically.'
                            : language === 'mr' ? 'उदा. "२ एकर केळी G-9" किंवा "दीड एकर टोमॅटो"' : 'e.g. "2 acres G-9 banana" or "1.5 acres tomato"'}
                        </Text>
                      )}
                    </View>
                  </View>

                  {cropVoiceFeedback && (
                    <View style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: '#dcfce7',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                        <CheckCircle2 size={16} color="#15803d" />
                        <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#15803d', flex: 1 }}>
                          {cropVoiceFeedback}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleOpenAddCropModal}
                        style={{
                          backgroundColor: '#ecfdf5',
                          borderWidth: 1,
                          borderColor: '#a7f3d0',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>
                          {language === 'mr' ? '🔄 पुन्हा विचारा' : '🔄 Ask Again'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 1-Tap Voice Shortcut Chips */}
                  {!isRecordingCropVoice && aiCropPromptState !== 'speaking' && (
                    <View style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 6 }}>
                        {language === 'mr' ? 'किंवा खालील नमुना आवाजावर टॅप करा:' : language === 'hi' ? 'या नीचे दिए गए आवाज पर टैप करें:' : 'Or tap sample voice prompt:'}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {[
                          { label: '🍌 २ एकर केळी (G-9)', text: 'मी दोन एकर शेतात जी-९ केळी लावली आहे' },
                          { label: '🍅 १.५ एकर टोमॅटो (अभिनव)', text: 'मी दीड एकर अभिनव टोमॅटो लावला आहे' },
                          { label: '🌱 ३ एकर सोयाबीन (JS-335)', text: 'तीन एकर सोयाबीन जेएस ३३५ पेरले' },
                          { label: '🌿 ५ एकर कापूस (RCH-659)', text: 'पाच एकर कापूस आरसीएच ६५९ लावला' },
                        ].map((s, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => handleApplyVoiceSample(s.text)}
                            style={{
                              backgroundColor: '#ffffff',
                              borderWidth: 1,
                              borderColor: '#cbd5e1',
                              borderRadius: 12,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                            }}>
                            <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#334155' }}>
                              {s.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {/* Quick Crop Selector Chips */}
                <View style={{ marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', marginBottom: 6 }}>
                    {language === 'mr' ? 'लोकप्रिय पिके (टॅप करा):' : language === 'hi' ? 'लोकप्रिय फसलें चुनें:' : 'Quick Select Crop:'}
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                    {[
                      { name: language === 'mr' ? 'सोयाबीन' : language === 'hi' ? 'सोयाबीन' : 'Soybean', variety: 'JS-335' },
                      { name: language === 'mr' ? 'कापूस' : language === 'hi' ? 'कपास' : 'Cotton', variety: 'RCH-659' },
                      { name: language === 'mr' ? 'कांदा' : language === 'hi' ? 'प्याज' : 'Onion', variety: 'पंचगंगा लाल' },
                      { name: language === 'mr' ? 'टोमॅटो' : language === 'hi' ? 'टमाटर' : 'Tomato', variety: 'अभिनव' },
                      { name: language === 'mr' ? 'मका' : language === 'hi' ? 'मक्का' : 'Maize', variety: 'पायोनियर' },
                      { name: language === 'mr' ? 'गहू' : language === 'hi' ? 'गेहूं' : 'Wheat', variety: 'लोकवन' },
                      { name: language === 'mr' ? 'हरभरा' : language === 'hi' ? 'चना' : 'Gram', variety: 'दिग्विजय' },
                    ].map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => {
                          setNewCropName(item.name);
                          setNewCropVariety(item.variety);
                        }}
                        style={{
                          backgroundColor: newCropName === item.name ? '#dcfce7' : '#f1f5f9',
                          borderWidth: 1,
                          borderColor: newCropName === item.name ? '#15803d' : '#cbd5e1',
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                        }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            color: newCropName === item.name ? '#15803d' : '#334155',
                          }}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
                  {language === 'mr' ? 'पिकाचे नाव' : language === 'hi' ? 'फसल का नाम' : 'Crop Name'}
                </Text>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 }}
                  placeholder={language === 'mr' ? 'उदा. टोमॅटो, कापूस, सोयाबीन' : 'e.g. Tomato, Cotton'}
                  value={newCropName}
                  onChangeText={setNewCropName}
                />

                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
                  {language === 'mr' ? 'पिकाची जात / व्हरायटी' : language === 'hi' ? 'किस्म / वैरायटी' : 'Variety'}
                </Text>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 }}
                  placeholder={language === 'mr' ? 'उदा. सुधारित / अभिनव' : 'e.g. Hybrid / Standard'}
                  value={newCropVariety}
                  onChangeText={setNewCropVariety}
                />

                <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 4 }}>
                  {language === 'mr' ? 'क्षेत्र (एकर)' : language === 'hi' ? 'क्षेत्रफल (एकड़)' : 'Area (Acres)'}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {['0.5', '1.0', '1.5', '2.0', '3.0', '5.0'].map((acres) => (
                    <TouchableOpacity
                      key={acres}
                      onPress={() => setNewCropArea(acres)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: newCropArea === acres ? '#dcfce7' : '#f1f5f9',
                        borderWidth: 1.5,
                        borderColor: newCropArea === acres ? '#15803d' : '#cbd5e1',
                      }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: newCropArea === acres ? '#15803d' : '#334155' }}>
                        {acres} {language === 'mr' ? 'एकर' : 'Acre'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 16 }}
                  placeholder="1.0"
                  keyboardType="numeric"
                  value={newCropArea}
                  onChangeText={setNewCropArea}
                />

                <TouchableOpacity
                  style={{ backgroundColor: '#15803d', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                  onPress={handleSaveCrop}>
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 16 }}>
                    {language === 'mr' ? 'पीक जतन करा' : language === 'hi' ? 'फसल सहेजें' : 'Save Crop'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 14,
  },

  /* 1. Header */
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 40,
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  /* 2. Top Audio Hero Banner */
  audioHeroBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15803d',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#166534',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  audioHeroBannerActive: {
    backgroundColor: '#dc2626',
    borderColor: '#991b1b',
  },
  audioHeroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  audioHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  audioHeroBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  audioHeroTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  audioHeroSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#dcfce7',
    lineHeight: 17,
  },
  audioPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  /* 3. Category Tabs */
  categoryTabsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  categoryTabBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  categoryTabBtnActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryTabBtnInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  categoryTabLabel: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  categoryTabLabelActive: {
    color: '#ffffff',
  },
  categoryTabLabelInactive: {
    color: '#0f172a',
  },
  categoryTabSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  categoryTabSubActive: {
    color: '#dcfce7',
  },
  categoryTabSubInactive: {
    color: '#64748b',
  },

  /* 4. Total Land Card */
  totalLandCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  totalLandTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLandLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  totalLandFigure: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  totalLandSubUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  addCropQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
  },
  addCropQuickText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  farmMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  farmMetricBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  farmMetricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  farmMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },

  /* Common Section Header */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  tasksBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tasksBtnTopText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },

  /* 5. Crops Cards Stack */
  cropsCardsStack: {
    gap: 12,
  },
  farmerCropCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cropCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cropBigPhoto: {
    width: 68,
    height: 68,
    borderRadius: 14,
    marginRight: 12,
  },
  cropDetailsCenter: {
    flex: 1,
  },
  cropBigName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  cropAreaBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  cropVarietyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 2,
  },
  cropPlotLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  cropBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stagePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  harvestPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  harvestPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  growthProgressContainer: {
    marginBottom: 10,
  },
  growthLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  growthLabelLeft: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  growthLabelRight: {
    fontSize: 12,
    fontWeight: '900',
  },
  growthTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  growthFill: {
    height: '100%',
    borderRadius: 4,
  },
  cropAdviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  cropAdviceText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 18,
  },
  cropActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cropAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 38,
  },
  cropAudioBtnActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  cropAudioBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803d',
  },
  cropAudioBtnTextActive: {
    color: '#ffffff',
  },
  cropScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 38,
  },
  cropScanBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
  },
  cropDetailsBtn: {
    marginLeft: 'auto',
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    justifyContent: 'center',
  },
  cropDetailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  /* 6. Plots Grid */
  plotsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  plotTileCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  plotTileCardSelected: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
  },
  plotCropIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  plotTileName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  plotTileArea: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
    marginTop: 2,
  },
  plotTileBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  plotTileBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748b',
  },
  selectedPlotCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 14,
  },
  selectedPlotHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedPlotTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  selectedPlotArea: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  selectedPlotMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  plotMetricItem: {
    alignItems: 'center',
  },
  plotMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  plotMetricLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  plotActionBtn: {
    backgroundColor: '#15803d',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  plotActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },

  /* 7. Financial Expenses Tab */
  financialSummaryGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  financeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  financeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  financeFigure: {
    fontSize: 20,
    fontWeight: '900',
    marginVertical: 4,
  },
  financeSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  netProfitBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86efac',
    marginBottom: 12,
  },
  netProfitLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  netProfitFigure: {
    fontSize: 22,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  profitBadge: {
    backgroundColor: '#dcfce7',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  profitBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#15803d',
  },
  breakdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  breakdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  breakdownCostText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },

  /* 8. Advisory Services Tab */
  advisoryServicesCol: {
    gap: 10,
  },
  advisoryServiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  advisoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advisoryServiceTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  advisoryServiceDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },

  /* 9. Big Add Crop Button */
  addNewCropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    borderRadius: 18,
    paddingVertical: 14,
    minHeight: 52,
    marginBottom: 14,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewCropButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },

  /* 10. Helpline Card */
  helplineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helplineLeftCol: {
    flex: 1,
    paddingRight: 10,
  },
  helplineHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  helplineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  helplineNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  helplineDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    lineHeight: 16,
  },
  callNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 46,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  callNowBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyCardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyCardSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  emptyCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyCardBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cropDeleteBtn: {
    padding: 5,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
  },
});
