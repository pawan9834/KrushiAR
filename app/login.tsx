import { Language, useLanguage } from '@/context/LanguageContext';
import { isOnboardingComplete, setOnboardingComplete, updateFarmerProfile } from '@/services/diaryStorage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getAuth,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from '@react-native-firebase/auth';
import { getRecordingPermissionsAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Multi-language UI texts
const STEP_TEXTS = {
  mr: {
    welcomeTitle: 'कृषीमित्र',
    welcomeBadge: 'स्मार्ट AI शेती नोंदवही',
    welcomeSub: 'तुमच्या शेताचा डिजिटल साथी • आवाजाने नोंदी, हवामान व सल्ला',
    welcomeBtn: 'सुरू करा',
    feature1Title: 'आवाजाने शेती नोंदी',
    feature1Sub: 'फक्त बोला, AI आपोआप नोंद करेल',
    feature2Title: 'AI पीक डॉक्टर',
    feature2Sub: 'फोटो काढून रोग व कीड ओळखा',
    feature3Title: 'हवामान व बाजारभाव',
    feature3Sub: 'दररोजचे अचूक स्थानिक अपडेट्स',

    step1Name: 'भाषा',
    step2Name: 'मोबाईल',
    step3Name: 'OTP',
    step4Name: 'प्रोफाइल',
    step5Name: 'परवानग्या',

    langTitle: 'तुमची भाषा निवडा',
    langSub: 'तुम्हाला कृषीमित्र कोणत्या भाषेत वापरायचा आहे?',
    langNext: 'पुढे जा',
    langOptionMr: 'मराठी',
    langOptionMrSub: 'माझी पसंतीची भाषा (शिफारस)',
    langOptionHi: 'हिंदी',
    langOptionHiSub: 'मेरी भाषा',
    langOptionEn: 'English',
    langOptionEnSub: 'My preferred language',

    phoneTitle: 'मोबाईल क्रमांक टाका',
    phoneSub: 'OTP पडताळणीसाठी तुमचा १० अंकी नंबर टाका.',
    phonePlaceholder: '82751 23456',
    phoneBtn: 'OTP मिळवा',
    phoneError: 'कृपया वैध १० अंकी मोबाईल क्रमांक टाका',
    phoneTrust1: '१००% मोफत व सुरक्षित',
    phoneTrust2: 'इंटरनेट कमी असले तरी चालते',

    otpTitle: 'OTP पडताळणी',
    otpSub: 'खालील नंबरवर पाठवलेला ६ अंकी कोड टाका:',
    otpTimerPrefix: 'कोड पुन्हा पाठवा',
    otpTimerSuffix: 'सेकंदात',
    otpBtn: 'सत्यापित करा व पुढे जा',
    otpResendPrompt: 'कोड आला नाही? पुन्हा पाठवा',
    otpResentSuccess: 'नवीन OTP पाठवला आहे: 472190',
    otpFillDemo: '⚡ डेमो कोड वापरा (472190)',

    profileTitle: 'शेतकरी प्रोफाइल',
    profileSub: 'तुमचा अनुभव अधिक अचूक करण्यासाठी थोडी माहिती द्या.',
    profilePhotoUpload: 'फोटो निवडा',
    profilePhotoOptional: '(ऐच्छिक)',
    profileNameLabel: 'पूर्ण नाव',
    profileNamePlaceholder: 'पवनकुमार पाटील',
    profileVillageLabel: 'गाव / तालुका',
    profileVillagePlaceholder: 'चोपडा, जळगाव',
    profileBtn: 'माहिती जतन करा',
    profileNameError: 'कृपया तुमचे नाव टाका',

    permTitle: 'अॅप परवानग्या',
    permSub: 'सर्व आधुनिक सुविधा सुरळीत चालण्यासाठी खालील परवानग्या द्या:',
    permCameraTitle: 'कॅमेरा',
    permCameraSub: 'पिकांचे फोटो व रोगांचे स्कॅनिंग करण्यासाठी',
    permMicTitle: 'मायक्रोफोन (आवाज)',
    permMicSub: 'बोलून शेती कामे नोंदवण्यासाठी व सल्ला विचारण्यासाठी',
    permGpsTitle: 'स्थान (GPS)',
    permGpsSub: 'स्थानिक अचूक हवामान व बाजारभाव मिळवण्यासाठी',
    permBtn: 'पुढे जा',
    permSkip: 'नंतर परवानगी देईन',
    permGranted: 'मंजूर ✓',
    permAllow: 'परवानगी द्या',

    completeTitle: 'अभिनंदन! सर्व सेट झाले',
    completeSub: 'आता तुम्ही तुमच्या शेताच्या सर्व नोंदी आवाजाने व फोटोने करू शकता.',
    completeBtn: 'शेती डायरी सुरू करा →',
  },
  hi: {
    welcomeTitle: 'कृषिमित्र',
    welcomeBadge: 'स्मार्ट AI कृषि डायरी',
    welcomeSub: 'आपके खेत का डिजिटल साथी • आवाज से रिकॉर्ड, मौसम और सलाह',
    welcomeBtn: 'शुरू करें',
    feature1Title: 'बोलकर रिकॉर्ड करें',
    feature1Sub: 'सिर्फ बोलें, AI अपने आप नोट करेगा',
    feature2Title: 'AI फसल डॉक्टर',
    feature2Sub: 'फोटो खींचकर कीट व रोग पहचानें',
    feature3Title: 'मौसम व मंडी भाव',
    feature3Sub: 'रोजाना के सटीक स्थानीय अपडेट',

    step1Name: 'भाषा',
    step2Name: 'मोबाइल',
    step3Name: 'OTP',
    step4Name: 'प्रोफाइल',
    step5Name: 'अनुमति',

    langTitle: 'अपनी भाषा चुनें',
    langSub: 'आप किस भाषा में कृषिमित्र का उपयोग करना चाहते हैं?',
    langNext: 'आगे बढ़ें',
    langOptionMr: 'मराठी',
    langOptionMrSub: 'माझी भाषा',
    langOptionHi: 'हिंदी',
    langOptionHiSub: 'मेरी भाषा (अनुशंसित)',
    langOptionEn: 'English',
    langOptionEnSub: 'My preferred language',

    phoneTitle: 'मोबाइल नंबर दर्ज करें',
    phoneSub: 'सत्यापन के लिए अपना 10 अंकों का मोबाइल नंबर डालें।',
    phonePlaceholder: '82751 23456',
    phoneBtn: 'OTP प्राप्त करें',
    phoneError: 'कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें',
    phoneTrust1: '100% सुरक्षित और मुफ्त',
    phoneTrust2: 'धीमे इंटरनेट पर भी कार्य करता है',

    otpTitle: 'OTP सत्यापन',
    otpSub: 'इस नंबर पर भेजा गया 6 अंकों का कोड दर्ज करें:',
    otpTimerPrefix: 'पुनः भेजें',
    otpTimerSuffix: 'सेकंड में',
    otpBtn: 'सत्यापित करें और आगे बढ़ें',
    otpResendPrompt: 'कोड नहीं मिला? दोबारा भेजें',
    otpResentSuccess: 'नया OTP भेजा गया: 472190',
    otpFillDemo: '⚡ डेमो कोड भरें (472190)',

    profileTitle: 'किसान प्रोफाइल',
    profileSub: 'सटीक सलाह के लिए अपनी जानकारी दर्ज करें।',
    profilePhotoUpload: 'फोटो चुनें',
    profilePhotoOptional: '(वैकल्पिक)',
    profileNameLabel: 'पूरा नाम',
    profileNamePlaceholder: 'पवनकुमार पाटिल',
    profileVillageLabel: 'गांव / तहसील',
    profileVillagePlaceholder: 'चोपड़ा, जलगांव',
    profileBtn: 'जानकारी सहेजें',
    profileNameError: 'कृपया अपना नाम दर्ज करें',

    permTitle: 'ऐप अनुमतियां',
    permSub: 'सभी सुविधाओं के सुचारू संचालन के लिए निम्न अनुमतियां दें:',
    permCameraTitle: 'कैमरा',
    permCameraSub: 'फसल फोटो और रोग स्कैनिंग के लिए',
    permMicTitle: 'माइक्रोफोन (आवाज)',
    permMicSub: 'बोलकर काम दर्ज करने और सवाल पूछने के लिए',
    permGpsTitle: 'स्थान (GPS)',
    permGpsSub: 'सटीक मौसम और मंडी भाव प्राप्त करने के लिए',
    permBtn: 'आगे बढ़ें',
    permSkip: 'बाद में अनुमति दें',
    permGranted: 'स्वीकृत ✓',
    permAllow: 'अनुमति दें',

    completeTitle: 'बधाई हो! सब तैयार है',
    completeSub: 'अब आप अपने खेत का हिसाब बोलकर और फोटो द्वारा आसानी से रख सकते हैं।',
    completeBtn: 'कृषि डायरी शुरू करें →',
  },
  en: {
    welcomeTitle: 'Krushimitra',
    welcomeBadge: 'Smart AI Farm Diary',
    welcomeSub: "Your Farm's Digital Companion • Voice Records, Weather & Advisory",
    welcomeBtn: 'Get Started',
    feature1Title: 'Voice Farm Records',
    feature1Sub: 'Just speak, AI records automatically',
    feature2Title: 'AI Crop Doctor',
    feature2Sub: 'Snap a photo to diagnose pests & diseases',
    feature3Title: 'Weather & Mandi Prices',
    feature3Sub: 'Accurate daily localized updates',

    step1Name: 'Language',
    step2Name: 'Mobile',
    step3Name: 'OTP',
    step4Name: 'Profile',
    step5Name: 'Permissions',

    langTitle: 'Choose Your Language',
    langSub: 'Which language would you like to use Krushimitra in?',
    langNext: 'Continue',
    langOptionMr: 'मराठी',
    langOptionMrSub: 'Regional Language',
    langOptionHi: 'हिंदी',
    langOptionHiSub: 'Hindi',
    langOptionEn: 'English',
    langOptionEnSub: 'English (Default)',

    phoneTitle: 'Enter Mobile Number',
    phoneSub: 'We will send a 6-digit verification code to your phone.',
    phonePlaceholder: '82751 23456',
    phoneBtn: 'Get Verification OTP',
    phoneError: 'Please enter a valid 10-digit mobile number',
    phoneTrust1: '100% Free & Secure',
    phoneTrust2: 'Works smoothly even on low internet',

    otpTitle: 'OTP Verification',
    otpSub: 'Enter the 6-digit code sent to:',
    otpTimerPrefix: 'Resend code in',
    otpTimerSuffix: 'seconds',
    otpBtn: 'Verify & Continue',
    otpResendPrompt: "Didn't get code? Resend",
    otpResentSuccess: 'New OTP sent: 472190',
    otpFillDemo: '⚡ Auto-fill Demo (472190)',

    profileTitle: 'Farmer Profile',
    profileSub: 'Personalize your farming advisory and activity logs.',
    profilePhotoUpload: 'Select Photo',
    profilePhotoOptional: '(Optional)',
    profileNameLabel: 'Full Name',
    profileNamePlaceholder: 'Pawankumar Patil',
    profileVillageLabel: 'Village / Tehsil',
    profileVillagePlaceholder: 'Chopda, Jalgaon',
    profileBtn: 'Save Profile',
    profileNameError: 'Please enter your name',

    permTitle: 'App Permissions',
    permSub: 'Grant permissions for guided AI voice notes and accurate farm data:',
    permCameraTitle: 'Camera',
    permCameraSub: 'Capture crops & scan disease symptoms',
    permMicTitle: 'Microphone (Audio)',
    permMicSub: 'Record activities and talk to AI Assistant by voice',
    permGpsTitle: 'Location (GPS)',
    permGpsSub: 'Receive precise local weather forecasts & mandi prices',
    permBtn: 'Continue',
    permSkip: "I'll grant later",
    permGranted: 'Granted ✓',
    permAllow: 'Allow Access',

    completeTitle: 'All Set & Ready!',
    completeSub: 'You are now ready to maintain your digital farming diary with voice and photos.',
    completeBtn: 'Enter Farm Diary →',
  },
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLanguage();
  const currentLang: Language = language || 'mr';
  const texts = STEP_TEXTS[currentLang] || STEP_TEXTS.mr;

  // Flow State (2: Phone/Login, 3: OTP, 4: Profile, 5: Permissions, 6: Complete)
  const [currentStep, setCurrentStep] = useState<number>(2);

  // Form Fields (Clean initial state for real users)
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [profileName, setProfileName] = useState('');
  const [profileVillage, setProfileVillage] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Permissions state
  const [hasCameraPerm, setHasCameraPerm] = useState(false);
  const [hasMicPerm, setHasMicPerm] = useState(false);
  const [hasGpsPerm, setHasGpsPerm] = useState(false);

  // Firebase Phone Auth confirmation state
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    (async () => {
      try {
        const onboarded = await isOnboardingComplete();
        const auth = getAuth();
        if (auth.currentUser || onboarded) {
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.warn('Login session check warning:', err);
      }
    })();
  }, []);

  // Check existing permissions when entering step 5
  useEffect(() => {
    if (currentStep === 5) {
      (async () => {
        try {
          const cam = await Camera.getCameraPermissionsAsync().catch(() => null);
          if (cam) setHasCameraPerm(cam.granted);

          const mic = await getRecordingPermissionsAsync().catch(() => null);
          if (mic) setHasMicPerm(mic.granted);

          const loc = await Location.getForegroundPermissionsAsync().catch(() => null);
          if (loc) setHasGpsPerm(loc.granted);
        } catch { }
      })();
    }
  }, [currentStep]);

  // OTP inputs references
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: any = null;
    if (currentStep === 3 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, timerSeconds]);

  // Handle Language selection
  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    if (lang === 'en' && profileName === 'पवनकुमार पाटील') {
      setProfileName('Pawankumar Patil');
      setProfileVillage('Chopda, Jalgaon');
    } else if (lang === 'mr' && profileName === 'Pawankumar Patil') {
      setProfileName('पवनकुमार पाटील');
      setProfileVillage('चोपडा, जळगाव');
    }
  };

  // Step 2: Submit Phone via Firebase Phone Auth
  const handlePhoneSubmit = async () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) {
      Alert.alert('सूचना', texts.phoneError);
      return;
    }

    const fullPhone = `+91${cleaned.slice(-10)}`;
    setIsAuthLoading(true);

    try {
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, fullPhone);
      setConfirmResult(confirmation);
      setTimerSeconds(60);
      setOtpDigits(['', '', '', '', '', '']);
      setCurrentStep(3);
    } catch (err: any) {
      console.warn('Phone Auth Error:', err);
      Alert.alert(
        'Something went wrong',
        'Something went wrong. Please try again.',
        [
          { text: 'OK', style: 'cancel' },
          {
            text: 'Test Mode',
            onPress: () => {
              setConfirmResult(null);
              setTimerSeconds(60);
              setOtpDigits(['4', '7', '2', '1', '9', '0']);
              setCurrentStep(3);
            },
          },
        ]
      );
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Step 3: Handle OTP changes
  const handleOtpChange = (val: string, index: number) => {
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length < 10) return;
    const fullPhone = `+91${cleaned.slice(-10)}`;
    setIsAuthLoading(true);
    try {
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, fullPhone);
      setConfirmResult(confirmation);
      setTimerSeconds(60);
      setOtpDigits(['', '', '', '', '', '']);
      Alert.alert('OTP', texts.otpResentSuccess);
    } catch (err: any) {
      console.warn('Resend OTP Error:', err);
      Alert.alert('Something went wrong', 'Something went wrong. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    const entered = otpDigits.join('');
    if (entered.length < 6) {
      Alert.alert('सूचना', 'कृपया ६ अंकी OTP टाका.');
      return;
    }

    setIsAuthLoading(true);
    try {
      if (confirmResult) {
        const userCredential = await confirmResult.confirm(entered);
        console.log('Firebase user authenticated successfully, UID:', userCredential?.user?.uid);
      } else {
        // Fallback demo/test verification
        if (entered !== '472190' && entered !== '123456') {
          Alert.alert('अवैध OTP', 'कृपया योग्य चाचणी OTP (472190 किंवा 123456) टाका.');
          setIsAuthLoading(false);
          return;
        }
      }
      setCurrentStep(4);
    } catch (err: any) {
      console.warn('Firebase OTP verification error:', err);
      let errText = 'तुम्ही टाकलेला OTP चुकीचा किंवा कालबाह्य आहे.';
      if (err?.code === 'auth/invalid-verification-code') {
        errText = 'चुकीचा OTP टाकला आहे. कृपया पुन्हा तपासा.';
      } else if (err?.code === 'auth/session-expired') {
        errText = 'OTP कालबाह्य झाला आहे. कृपया नवीन OTP मागवा.';
      }
      Alert.alert('अवैध OTP', errText);
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Step 4: Profile photo picker
  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setProfilePhoto(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Photo', 'Could not open image picker');
    }
  };

  const handleProfileSubmit = async () => {
    if (!profileName.trim()) {
      Alert.alert('सूचना', texts.profileNameError);
      return;
    }

    try {
      await updateFarmerProfile({
        name: profileName.trim(),
        village: profileVillage.trim() || 'चोपडा',
        phone: phoneNumber,
        preferredLanguage: currentLang,
        avatarUri: profilePhoto || undefined,
      });
    } catch (err) {
      console.warn('Error saving profile:', err);
    }

    setCurrentStep(5);
  };

  // Step 5: Individual permission request functions
  const requestCamera = async () => {
    try {
      const res = await Camera.requestCameraPermissionsAsync();
      setHasCameraPerm(res.granted);
      return res.granted;
    } catch {
      return false;
    }
  };

  // Microphone permission requested just like Location
  const requestMic = async () => {
    try {
      const res = await requestRecordingPermissionsAsync();
      setHasMicPerm(res.granted);
      return res.granted;
    } catch {
      return false;
    }
  };

  const requestLocation = async () => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      setHasGpsPerm(res.granted);
      return res.granted;
    } catch {
      return false;
    }
  };

  // Step 5: Master handler when user taps "पुढे जा"
  const handleRequestPermissions = async () => {
    try {
      await requestCamera();
      await requestMic();
      await requestLocation();
    } catch { }
    setCurrentStep(6);
  };

  // Step 6: Finish onboarding and navigate to Home
  const handleFinishOnboarding = async () => {
    await setOnboardingComplete(true);
    router.replace('/(tabs)');
  };

  // Back button handler
  const handleGoBack = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper Stepper indicator
  const renderStepIndicator = () => {
    if (currentStep < 2 || currentStep === 6) return null;
    const steps = [
      { id: 2, num: 1, label: texts.step2Name },
      { id: 3, num: 2, label: texts.step3Name },
      { id: 4, num: 3, label: texts.step4Name },
      { id: 5, num: 4, label: texts.step5Name },
    ];

    return (
      <View style={styles.stepperContainer}>
        {steps.map((st, i) => {
          const isDone = currentStep > st.id;
          const isActive = currentStep === st.id;
          return (
            <React.Fragment key={st.id}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepBadge,
                    isDone && styles.stepBadgeDone,
                    isActive && styles.stepBadgeActive,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={13} color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepBadgeText,
                        isActive && styles.stepBadgeTextActive,
                      ]}
                    >
                      {st.num}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isDone && styles.stepLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {st.label}
                </Text>
              </View>
              {i < steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    currentStep > st.id && styles.stepLineDone,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // Floating Quick Language Switcher Bar
  const renderLanguageSwitchHeader = () => (
    <View style={styles.topQuickLangBar}>
      {(['mr', 'hi', 'en'] as Language[]).map((lng) => {
        const isSelected = currentLang === lng;
        const label = lng === 'mr' ? 'मराठी' : lng === 'hi' ? 'हिंदी' : 'English';
        return (
          <TouchableOpacity
            key={lng}
            onPress={() => handleSelectLanguage(lng)}
            style={[styles.quickLangPill, isSelected && styles.quickLangPillActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.quickLangText, isSelected && styles.quickLangTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ==========================================
  // RENDER: STEP 0 - WELCOME & VALUE HERO
  // ==========================================
  if (currentStep === 0) {
    return (
      <View style={styles.mainContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* Hero Background Image */}
        <View style={styles.heroImageWrap}>
          <Image
            source={require('../assets/images/farm_banner.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          {/* Subtle gradient dark wash */}
          <View style={styles.heroOverlay} />

          {/* Top Floating Language Toggle */}
          <SafeAreaView edges={['top']} style={styles.topBarContainer}>
            <View style={styles.topBarInner}>
              <View style={styles.brandPill}>
                <MaterialCommunityIcons name="sprout" size={18} color="#22c55e" />
                <Text style={styles.brandPillText}>KrushiAR</Text>
              </View>
              {renderLanguageSwitchHeader()}
            </View>
          </SafeAreaView>

          {/* Hero Welcome Text */}
          <View style={styles.heroTextContent}>
            <View style={styles.welcomeTagBadge}>
              <Text style={styles.welcomeTagText}>{texts.welcomeBadge}</Text>
            </View>
            <Text style={styles.heroMainTitle}>{texts.welcomeTitle}</Text>
            <Text style={styles.heroMainSub}>{texts.welcomeSub}</Text>
          </View>
        </View>

        {/* Feature Cards Bottom Sheet */}
        <SafeAreaView
          edges={['bottom']}
          style={[styles.welcomeSheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.featuresList}>
            {/* 1. Voice Record Feature */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="mic" size={22} color="#15803d" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{texts.feature1Title}</Text>
                <Text style={styles.featureSub}>{texts.feature1Sub}</Text>
              </View>
            </View>

            {/* 2. Crop Doctor */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="scan" size={22} color="#0284c7" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{texts.feature2Title}</Text>
                <Text style={styles.featureSub}>{texts.feature2Sub}</Text>
              </View>
            </View>

            {/* 3. Weather & Mandi */}
            <View style={styles.featureRow}>
              <View style={[styles.featureIconWrap, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="partly-sunny" size={22} color="#d97706" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{texts.feature3Title}</Text>
                <Text style={styles.featureSub}>{texts.feature3Sub}</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.actionGreenBtn}
            onPress={() => setCurrentStep(1)}
            activeOpacity={0.88}
          >
            <Text style={styles.actionGreenBtnText}>{texts.welcomeBtn}</Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  // ==========================================
  // SHARED HEADER WRAPPER FOR STEPS 1-5
  // ==========================================
  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Hero Header Strip */}
      <View style={styles.compactHeroHeader}>
        <Image
          source={require('../assets/images/farm_banner.jpg')}
          style={styles.compactHeroImage}
          resizeMode="cover"
        />
        <View style={styles.compactHeroOverlay} />

        <SafeAreaView edges={['top']} style={styles.compactHeaderTop}>
          <View style={styles.headerNavRow}>
            {currentStep > 2 && currentStep < 6 ? (
              <TouchableOpacity
                style={styles.navRoundBtn}
                onPress={handleGoBack}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={22} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 38 }} />
            )}

            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitleText}>{texts.welcomeTitle}</Text>
            </View>

            {renderLanguageSwitchHeader()}
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Card (Curved Sheet) */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView edges={['bottom']} style={styles.cardSheet}>
          {/* Stepper Dots */}
          {renderStepIndicator()}

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.sheetScrollContent,
              { paddingBottom: Math.max(insets.bottom + 28, 44) },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ========================================== */}
            {/* STEP 1: LANGUAGE SELECTION                 */}
            {/* ========================================== */}
            {currentStep === 1 && (
              <View>
                <Text style={styles.formSectionTitle}>{texts.langTitle}</Text>
                <Text style={styles.formSectionSub}>{texts.langSub}</Text>

                <View style={styles.languageCardsList}>
                  {/* Marathi */}
                  <TouchableOpacity
                    style={[
                      styles.langOptionCard,
                      currentLang === 'mr' && styles.langOptionCardActive,
                    ]}
                    onPress={() => handleSelectLanguage('mr')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.langInitialBadge, { backgroundColor: '#15803d' }]}>
                      <Text style={styles.langInitialText}>म</Text>
                    </View>
                    <View style={styles.langInfoCol}>
                      <Text style={styles.langName}>{texts.langOptionMr}</Text>
                      <Text style={styles.langSubInfo}>{texts.langOptionMrSub}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioRing,
                        currentLang === 'mr' && styles.radioRingActive,
                      ]}
                    >
                      {currentLang === 'mr' && <View style={styles.radioDotInside} />}
                    </View>
                  </TouchableOpacity>

                  {/* Hindi */}
                  <TouchableOpacity
                    style={[
                      styles.langOptionCard,
                      currentLang === 'hi' && styles.langOptionCardActive,
                    ]}
                    onPress={() => handleSelectLanguage('hi')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.langInitialBadge, { backgroundColor: '#0284c7' }]}>
                      <Text style={styles.langInitialText}>हिं</Text>
                    </View>
                    <View style={styles.langInfoCol}>
                      <Text style={styles.langName}>{texts.langOptionHi}</Text>
                      <Text style={styles.langSubInfo}>{texts.langOptionHiSub}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioRing,
                        currentLang === 'hi' && styles.radioRingActive,
                      ]}
                    >
                      {currentLang === 'hi' && <View style={styles.radioDotInside} />}
                    </View>
                  </TouchableOpacity>

                  {/* English */}
                  <TouchableOpacity
                    style={[
                      styles.langOptionCard,
                      currentLang === 'en' && styles.langOptionCardActive,
                    ]}
                    onPress={() => handleSelectLanguage('en')}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.langInitialBadge, { backgroundColor: '#475569' }]}>
                      <Text style={styles.langInitialText}>En</Text>
                    </View>
                    <View style={styles.langInfoCol}>
                      <Text style={styles.langName}>{texts.langOptionEn}</Text>
                      <Text style={styles.langSubInfo}>{texts.langOptionEnSub}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioRing,
                        currentLang === 'en' && styles.radioRingActive,
                      ]}
                    >
                      {currentLang === 'en' && <View style={styles.radioDotInside} />}
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Continue Button */}
                <TouchableOpacity
                  style={[styles.actionGreenBtn, { marginTop: 24 }]}
                  onPress={() => setCurrentStep(2)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.actionGreenBtnText}>{texts.langNext}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 2: ENTER MOBILE NUMBER                */}
            {/* ========================================== */}
            {currentStep === 2 && (
              <View>
                <Text style={styles.formSectionTitle}>{texts.phoneTitle}</Text>
                <Text style={styles.formSectionSub}>{texts.phoneSub}</Text>

                {/* Phone Input Box */}
                <View style={styles.modernPhoneCard}>
                  <View style={styles.countryFlagTag}>
                    <Text style={{ fontSize: 18, marginRight: 4 }}>🇮🇳</Text>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <View style={styles.vDivider} />
                  <TextInput
                    style={styles.mobileTextInput}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder={texts.phonePlaceholder}
                    placeholderTextColor="#94a3b8"
                    maxLength={10}
                    autoFocus
                  />
                  {phoneNumber.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPhoneNumber('')}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Trust Badges */}
                <View style={styles.trustBadgesRow}>
                  <View style={styles.trustPill}>
                    <Ionicons name="shield-checkmark" size={14} color="#16a34a" />
                    <Text style={styles.trustPillText}>{texts.phoneTrust1}</Text>
                  </View>
                  <View style={styles.trustPill}>
                    <Ionicons name="flash" size={14} color="#0284c7" />
                    <Text style={styles.trustPillText}>{texts.phoneTrust2}</Text>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.actionGreenBtn, { marginTop: 24 }, isAuthLoading && { opacity: 0.75 }]}
                  onPress={handlePhoneSubmit}
                  disabled={isAuthLoading}
                  activeOpacity={0.88}
                >
                  {isAuthLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.actionGreenBtnText}>{texts.phoneBtn}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 3: OTP VERIFICATION                   */}
            {/* ========================================== */}
            {currentStep === 3 && (
              <View>
                <Text style={styles.formSectionTitle}>{texts.otpTitle}</Text>
                <Text style={styles.formSectionSub}>{texts.otpSub}</Text>

                {/* Phone Pill */}
                <View style={styles.otpTargetPill}>
                  <Ionicons name="phone-portrait-outline" size={16} color="#15803d" />
                  <Text style={styles.otpTargetNumber}>+91 {phoneNumber}</Text>
                  <TouchableOpacity
                    onPress={() => setCurrentStep(2)}
                    style={styles.editNumberBtn}
                  >
                    <Text style={styles.editNumberText}>बदला</Text>
                  </TouchableOpacity>
                </View>

                {/* 6 OTP Boxes */}
                <View style={styles.otpBoxesRow}>
                  {otpDigits.map((digit, idx) => (
                    <TextInput
                      key={idx}
                      ref={(ref) => {
                        otpInputRefs.current[idx] = ref;
                      }}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, idx)}
                      onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                      keyboardType="number-pad"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {/* Countdown Timer */}
                <View style={styles.otpTimerContainer}>
                  <Text style={styles.otpTimerDesc}>
                    {texts.otpTimerPrefix}{' '}
                    <Text style={{ fontWeight: '700', color: '#15803d' }}>
                      {`00:${timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}`}
                    </Text>{' '}
                    {texts.otpTimerSuffix}
                  </Text>
                </View>

                {/* Demo Quick Fill Chip */}
                <TouchableOpacity
                  style={styles.demoFillChip}
                  onPress={() => setOtpDigits(['4', '7', '2', '1', '9', '0'])}
                  activeOpacity={0.75}
                >
                  <Text style={styles.demoFillChipText}>{texts.otpFillDemo}</Text>
                </TouchableOpacity>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.actionGreenBtn, { marginTop: 18 }, isAuthLoading && { opacity: 0.75 }]}
                  onPress={handleOtpSubmit}
                  disabled={isAuthLoading}
                  activeOpacity={0.88}
                >
                  {isAuthLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.actionGreenBtnText}>{texts.otpBtn}</Text>
                      <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Resend Link */}
                <TouchableOpacity
                  style={styles.resendLinkBtn}
                  onPress={handleResendOtp}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resendLinkText}>{texts.otpResendPrompt}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 4: FARMER PROFILE                     */}
            {/* ========================================== */}
            {currentStep === 4 && (
              <View>
                <Text style={styles.formSectionTitle}>{texts.profileTitle}</Text>
                <Text style={styles.formSectionSub}>{texts.profileSub}</Text>

                {/* Avatar Picker Card */}
                <View style={styles.profileAvatarCard}>
                  <TouchableOpacity
                    style={styles.avatarWrapper}
                    onPress={handlePickPhoto}
                    activeOpacity={0.8}
                  >
                    {profilePhoto ? (
                      <Image source={{ uri: profilePhoto }} style={styles.avatarImg} />
                    ) : (
                      <Image
                        source={require('../assets/images/farmer_avatar.jpg')}
                        style={styles.avatarImg}
                      />
                    )}
                    <View style={styles.cameraIconBadge}>
                      <Ionicons name="camera" size={14} color="#ffffff" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handlePickPhoto}>
                    <Text style={styles.avatarChangeText}>
                      {texts.profilePhotoUpload}{' '}
                      <Text style={{ color: '#64748b', fontWeight: '400' }}>
                        {texts.profilePhotoOptional}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Full Name Input */}
                <View style={styles.profileInputWrapper}>
                  <Text style={styles.inputFieldLabel}>{texts.profileNameLabel}</Text>
                  <View style={styles.profileInputField}>
                    <Ionicons name="person-outline" size={18} color="#15803d" />
                    <TextInput
                      style={styles.profileInputText}
                      value={profileName}
                      onChangeText={setProfileName}
                      placeholder={texts.profileNamePlaceholder}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                {/* Village / City Input */}
                <View style={[styles.profileInputWrapper, { marginTop: 14 }]}>
                  <Text style={styles.inputFieldLabel}>{texts.profileVillageLabel}</Text>
                  <View style={styles.profileInputField}>
                    <Ionicons name="location-outline" size={18} color="#15803d" />
                    <TextInput
                      style={styles.profileInputText}
                      value={profileVillage}
                      onChangeText={setProfileVillage}
                      placeholder={texts.profileVillagePlaceholder}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                  style={[styles.actionGreenBtn, { marginTop: 24 }]}
                  onPress={handleProfileSubmit}
                  activeOpacity={0.88}
                >
                  <Text style={styles.actionGreenBtnText}>{texts.profileBtn}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 5: PERMISSIONS (CAMERA, MIC, GPS)     */}
            {/* ========================================== */}
            {currentStep === 5 && (
              <View>
                <Text style={styles.formSectionTitle}>{texts.permTitle}</Text>
                <Text style={styles.formSectionSub}>{texts.permSub}</Text>

                <View style={styles.permissionsGroup}>
                  {/* 1. Camera */}
                  <TouchableOpacity
                    style={[
                      styles.permissionCardItem,
                      hasCameraPerm && styles.permissionCardGranted,
                    ]}
                    onPress={() => (hasCameraPerm ? setHasCameraPerm(false) : requestCamera())}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.permIconBadge, { backgroundColor: '#e0f2fe' }]}>
                      <Ionicons name="camera" size={22} color="#0284c7" />
                    </View>
                    <View style={styles.permTextGroup}>
                      <Text style={styles.permItemTitle}>{texts.permCameraTitle}</Text>
                      <Text style={styles.permItemSub}>{texts.permCameraSub}</Text>
                    </View>
                    <View
                      style={[
                        styles.permActionPill,
                        hasCameraPerm && styles.permActionPillGranted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.permActionPillText,
                          hasCameraPerm && styles.permActionPillTextGranted,
                        ]}
                      >
                        {hasCameraPerm ? texts.permGranted : texts.permAllow}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 2. Microphone (Handled just like location!) */}
                  <TouchableOpacity
                    style={[
                      styles.permissionCardItem,
                      hasMicPerm && styles.permissionCardGranted,
                    ]}
                    onPress={() => (hasMicPerm ? setHasMicPerm(false) : requestMic())}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.permIconBadge, { backgroundColor: '#dcfce7' }]}>
                      <Ionicons name="mic" size={22} color="#15803d" />
                    </View>
                    <View style={styles.permTextGroup}>
                      <Text style={styles.permItemTitle}>{texts.permMicTitle}</Text>
                      <Text style={styles.permItemSub}>{texts.permMicSub}</Text>
                    </View>
                    <View
                      style={[
                        styles.permActionPill,
                        hasMicPerm && styles.permActionPillGranted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.permActionPillText,
                          hasMicPerm && styles.permActionPillTextGranted,
                        ]}
                      >
                        {hasMicPerm ? texts.permGranted : texts.permAllow}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* 3. Location GPS */}
                  <TouchableOpacity
                    style={[
                      styles.permissionCardItem,
                      hasGpsPerm && styles.permissionCardGranted,
                    ]}
                    onPress={() => (hasGpsPerm ? setHasGpsPerm(false) : requestLocation())}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.permIconBadge, { backgroundColor: '#fef3c7' }]}>
                      <Ionicons name="location" size={22} color="#d97706" />
                    </View>
                    <View style={styles.permTextGroup}>
                      <Text style={styles.permItemTitle}>{texts.permGpsTitle}</Text>
                      <Text style={styles.permItemSub}>{texts.permGpsSub}</Text>
                    </View>
                    <View
                      style={[
                        styles.permActionPill,
                        hasGpsPerm && styles.permActionPillGranted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.permActionPillText,
                          hasGpsPerm && styles.permActionPillTextGranted,
                        ]}
                      >
                        {hasGpsPerm ? texts.permGranted : texts.permAllow}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Continue / Master Permission Button */}
                <TouchableOpacity
                  style={[styles.actionGreenBtn, { marginTop: 26 }]}
                  onPress={handleRequestPermissions}
                  activeOpacity={0.88}
                >
                  <Text style={styles.actionGreenBtnText}>{texts.permBtn}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {/* Skip Link */}
                <TouchableOpacity
                  style={styles.skipLinkBtn}
                  onPress={() => setCurrentStep(6)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipLinkText}>{texts.permSkip}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ========================================== */}
            {/* STEP 6: SETUP COMPLETE CELEBRATION         */}
            {/* ========================================== */}
            {currentStep === 6 && (
              <View style={styles.celebrationBox}>
                {/* Big Green Badge */}
                <View style={styles.celebrateCheckWrap}>
                  <Ionicons name="checkmark-circle" size={72} color="#16a34a" />
                </View>

                <Text style={styles.celebrateTitle}>{texts.completeTitle}</Text>
                <Text style={styles.celebrateSub}>{texts.completeSub}</Text>

                {/* Farmer Info Summary Card */}
                <View style={styles.summaryProfileCard}>
                  <Image
                    source={
                      profilePhoto
                        ? { uri: profilePhoto }
                        : require('../assets/images/farmer_avatar.jpg')
                    }
                    style={styles.summaryAvatar}
                  />
                  <View style={styles.summaryTextCol}>
                    <Text style={styles.summaryName}>{profileName}</Text>
                    <Text style={styles.summaryVillage}>
                      📍 {profileVillage || 'चोपडा'} • {phoneNumber}
                    </Text>
                  </View>
                </View>

                {/* Finish and Enter Dashboard */}
                <TouchableOpacity
                  style={[styles.actionGreenBtn, { marginTop: 24, width: '100%' }]}
                  onPress={handleFinishOnboarding}
                  activeOpacity={0.88}
                >
                  <Text style={styles.actionGreenBtnText}>{texts.completeBtn}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main layout
  mainContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  // Hero Screen (Step 0)
  heroImageWrap: {
    height: '52%',
    position: 'relative',
    justifyContent: 'space-between',
  },
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  topBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  brandPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },

  // Floating Quick Language bar
  topQuickLangBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    padding: 3,
    gap: 2,
  },
  quickLangPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
  },
  quickLangPillActive: {
    backgroundColor: '#ffffff',
  },
  quickLangText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  quickLangTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },

  // Hero Typography
  heroTextContent: {
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  welcomeTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  welcomeTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroMainTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroMainSub: {
    fontSize: 15,
    color: '#f1f5f9',
    marginTop: 6,
    lineHeight: 22,
    maxWidth: '92%',
  },

  // Welcome Bottom Sheet (Step 0)
  welcomeSheetContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
  },
  featuresList: {
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  featureSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  // Compact Header for Steps 1–5
  compactHeroHeader: {
    height: 140,
    position: 'relative',
  },
  compactHeroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  compactHeroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  compactHeaderTop: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Curved Sheet Wrapper
  cardSheet: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  sheetScrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 32,
  },

  // Stepper Header
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stepItem: {
    alignItems: 'center',
    gap: 3,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#15803d',
    elevation: 2,
  },
  stepBadgeDone: {
    backgroundColor: '#22c55e',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  stepBadgeTextActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  stepLabelActive: {
    color: '#15803d',
    fontWeight: '800',
  },
  stepLabelDone: {
    color: '#16a34a',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 4,
    marginBottom: 12,
  },
  stepLineDone: {
    backgroundColor: '#22c55e',
  },

  // Section Typography
  formSectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  formSectionSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },

  // Step 1: Language Cards
  languageCardsList: {
    gap: 12,
  },
  langOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  langOptionCardActive: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  langInitialBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  langInitialText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  langInfoCol: {
    flex: 1,
  },
  langName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  langSubInfo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  radioRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioRingActive: {
    borderColor: '#15803d',
  },
  radioDotInside: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#15803d',
  },

  // Step 2: Phone Input
  modernPhoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  countryFlagTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  vDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 12,
  },
  mobileTextInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: 1,
    paddingVertical: 0,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trustPillText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Step 3: OTP
  otpTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 20,
  },
  otpTargetNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  editNumberBtn: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  editNumberText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  otpBoxFilled: {
    borderColor: '#15803d',
    backgroundColor: '#f0fdf4',
  },
  otpTimerContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  otpTimerDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  demoFillChip: {
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  demoFillChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  resendLinkBtn: {
    alignSelf: 'center',
    marginTop: 14,
    padding: 6,
  },
  resendLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },

  // Step 4: Profile
  profileAvatarCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    position: 'relative',
    borderWidth: 3,
    borderColor: '#15803d',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#15803d',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarChangeText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },
  profileInputWrapper: {
    gap: 6,
  },
  inputFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  profileInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  profileInputText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    paddingVertical: 0,
  },

  // Step 5: Permissions
  permissionsGroup: {
    gap: 12,
  },
  permissionCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  permissionCardGranted: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  permIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  permTextGroup: {
    flex: 1,
  },
  permItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  permItemSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  permActionPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  permActionPillGranted: {
    backgroundColor: '#16a34a',
  },
  permActionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  permActionPillTextGranted: {
    color: '#ffffff',
  },
  skipLinkBtn: {
    alignSelf: 'center',
    marginTop: 14,
    padding: 6,
  },
  skipLinkText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },

  // Step 6: Celebration
  celebrationBox: {
    alignItems: 'center',
    paddingTop: 10,
  },
  celebrateCheckWrap: {
    marginBottom: 14,
  },
  celebrateTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  celebrateSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: '90%',
  },
  summaryProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    gap: 14,
    elevation: 2,
  },
  summaryAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  summaryTextCol: {
    flex: 1,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  summaryVillage: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },

  // Master Action Button
  actionGreenBtn: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#15803d',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  actionGreenBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
