// services/firebaseDiary.ts
import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
  where,
} from '@react-native-firebase/firestore';
import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import { ActivityRecord, Crop, FarmPlot, FarmerProfile } from './diaryStorage';

let activeUserId: string | null = null;

export function setActiveUserId(uid: string | null) {
  activeUserId = uid;
}

/**
 * Returns current authenticated user ID or fallback
 */
export function getCurrentUserId(): string {
  if (activeUserId) return activeUserId;

  try {
    const auth = getAuth();
    if (auth.currentUser?.uid) {
      return auth.currentUser.uid;
    }
  } catch (err) {
    console.warn('Could not read Firebase user:', err);
  }
  return 'farmer_01';
}

/**
 * Checks if a given mobile number is already registered in Firebase Cloud Firestore.
 * Queries farmers collection by normalized 10-digit number and E.164 +91 formats.
 */
export async function checkFarmerRegistrationByPhone(phone: string): Promise<{
  isRegistered: boolean;
  farmer?: FarmerProfile;
  userId?: string;
}> {
  const cleaned = phone.replace(/\D/g, '').slice(-10);
  if (cleaned.length < 10) {
    return { isRegistered: false };
  }
  const fullPhone = `+91${cleaned}`;

  try {
    const firestore = getFirestore();
    const farmersColl = collection(firestore, 'farmers');

    // 1. Query farmers where phone matches
    try {
      const q = query(
        farmersColl,
        where('phone', 'in', [cleaned, fullPhone, `+91 ${cleaned}`, `91${cleaned}`])
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as any;
          if (data && data.name && data.name.trim().length > 0) {
            console.log('Farmer registration found in Cloud Firestore:', docSnap.id, data.name);
            return {
              isRegistered: true,
              farmer: {
                id: docSnap.id,
                name: data.name,
                phone: data.phone || fullPhone,
                village: data.village || '',
                district: data.district || '',
                state: data.state || '',
                totalArea: data.totalArea || '',
                areaUnit: data.areaUnit || 'एकर',
                preferredLanguage: data.preferredLanguage || 'mr',
                avatarUri: data.avatarUri || undefined,
                createdDate: data.createdDate || new Date().toISOString(),
              },
              userId: docSnap.id,
            };
          }
        }
      }
    } catch (queryErr) {
      console.warn('Firestore phone query warning:', queryErr);
    }

    // 2. Check direct custom ID: farmer_{cleaned}
    try {
      const directDoc = await getDoc(doc(farmersColl, `farmer_${cleaned}`));
      if (directDoc.exists()) {
        const data = directDoc.data() as any;
        if (data && data.name && data.name.trim().length > 0) {
          return {
            isRegistered: true,
            farmer: {
              id: directDoc.id,
              name: data.name,
              phone: data.phone || fullPhone,
              village: data.village || '',
              district: data.district || '',
              state: data.state || '',
              totalArea: data.totalArea || '',
              areaUnit: data.areaUnit || 'एकर',
              preferredLanguage: data.preferredLanguage || 'mr',
              avatarUri: data.avatarUri || undefined,
              createdDate: data.createdDate || new Date().toISOString(),
            },
            userId: directDoc.id,
          };
        }
      }
    } catch (directErr) {
      console.warn('Firestore direct doc check warning:', directErr);
    }

    // 3. If user is currently signed in, check their auth UID
    try {
      const auth = getAuth();
      if (auth.currentUser?.uid) {
        const authDoc = await getDoc(doc(farmersColl, auth.currentUser.uid));
        if (authDoc.exists()) {
          const data = authDoc.data() as any;
          if (data && data.name && data.name.trim().length > 0) {
            return {
              isRegistered: true,
              farmer: {
                id: authDoc.id,
                name: data.name,
                phone: data.phone || fullPhone,
                village: data.village || '',
                district: data.district || '',
                state: data.state || '',
                totalArea: data.totalArea || '',
                areaUnit: data.areaUnit || 'एकर',
                preferredLanguage: data.preferredLanguage || 'mr',
                avatarUri: data.avatarUri || undefined,
                createdDate: data.createdDate || new Date().toISOString(),
              },
              userId: authDoc.id,
            };
          }
        }
      }
    } catch { }

    return { isRegistered: false };
  } catch (err: any) {
    console.warn('checkFarmerRegistrationByPhone overall warning:', err?.message || err);
    return { isRegistered: false };
  }
}

/**
 * Uploads a local photo to Firebase Storage and returns the public download URL.
 * Gracefully falls back to local file URI if offline or if storage is unreachable.
 */
export async function uploadDiaryPhoto(localUri: string, activityId: string): Promise<string> {
  if (!localUri || localUri.startsWith('http')) {
    return localUri;
  }

  try {
    const userId = getCurrentUserId();
    const storage = getStorage();
    const cleanPath = localUri.startsWith('file://') ? localUri.replace('file://', '') : localUri;
    const storageFileName = `farmers/${userId}/activities/${activityId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, storageFileName);

    console.log('Uploading photo to Firebase Storage:', storageFileName);
    await putFile(storageRef, cleanPath);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Firebase Storage upload successful. Download URL:', downloadUrl);
    return downloadUrl;
  } catch (err: any) {
    console.warn('Firebase Storage upload warning (fallback to local photo):', err?.message || err);
    return localUri;
  }
}

/**
 * Uploads farmer avatar image to Firebase Storage
 */
export async function uploadFarmerAvatar(localUri: string, userId: string): Promise<string> {
  if (!localUri || localUri.startsWith('http')) {
    return localUri;
  }

  try {
    const storage = getStorage();
    const cleanPath = localUri.startsWith('file://') ? localUri.replace('file://', '') : localUri;
    const storageFileName = `farmers/${userId}/profile/avatar.jpg`;
    const storageRef = ref(storage, storageFileName);

    console.log('Uploading farmer avatar to Firebase Storage:', storageFileName, 'path:', cleanPath);
    await putFile(storageRef, cleanPath, {
      contentType: 'image/jpeg',
      cacheControl: 'public,max-age=86400',
    });
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Farmer avatar upload successful. Download URL:', downloadUrl);
    return downloadUrl;
  } catch (err: any) {
    console.error('Firebase avatar upload error:', err?.code, err?.message || err);
    throw err;
  }
}

/**
 * Saves Farmer Profile details into Cloud Firestore under farmers/{userId}
 */
export async function saveFarmerProfileToFirestore(
  profile: FarmerProfile,
  customUserId?: string
): Promise<boolean> {
  try {
    const userId = customUserId || profile.id || getCurrentUserId();
    const firestore = getFirestore();
    const farmerDocRef = doc(collection(firestore, 'farmers'), userId);

    let avatarCloudUrl = profile.avatarUri || null;
    if (avatarCloudUrl && !avatarCloudUrl.startsWith('http')) {
      try {
        avatarCloudUrl = await uploadFarmerAvatar(avatarCloudUrl, userId);
      } catch (err) {
        console.warn('saveFarmerProfileToFirestore avatar upload notice:', err);
      }
    }

    const profileData: Record<string, any> = {
      id: userId,
      userId: userId,
      name: profile.name || '',
      phone: profile.phone || '',
      email: profile.email || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      taluka: profile.taluka || '',
      village: profile.village || '',
      district: profile.district || '',
      state: profile.state || '',
      pincode: profile.pincode || '',
      totalArea: profile.totalArea || '',
      areaUnit: profile.areaUnit || 'एकर',
      preferredLanguage: profile.preferredLanguage || 'mr',
      avatarUri: avatarCloudUrl,
      updatedAt: new Date().toISOString(),
      createdDate: profile.createdDate || new Date().toISOString(),
    };

    await setDoc(farmerDocRef, profileData, { merge: true });
    console.log('Farmer profile successfully saved to Cloud Firestore for user:', userId);
    return true;
  } catch (err: any) {
    console.warn('Firestore saveFarmerProfile warning:', err?.message || err);
    return false;
  }
}

/**
 * Fetches Farmer Profile details from Cloud Firestore
 */
export async function fetchFarmerProfileFromFirestore(
  userId?: string
): Promise<FarmerProfile | null> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const farmerDocRef = doc(collection(firestore, 'farmers'), uid);
    const docSnap = await getDoc(farmerDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      console.log('Fetched farmer profile from Cloud Firestore for user:', uid);
      return {
        id: data.id || uid,
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || undefined,
        dob: data.dob || undefined,
        gender: data.gender || undefined,
        taluka: data.taluka || undefined,
        village: data.village || '',
        district: data.district || '',
        state: data.state || '',
        pincode: data.pincode || undefined,
        totalArea: data.totalArea || '',
        areaUnit: data.areaUnit || 'एकर',
        preferredLanguage: data.preferredLanguage || 'mr',
        avatarUri: data.avatarUri || undefined,
        createdDate: data.createdDate || new Date().toISOString(),
      };
    }
    return null;
  } catch (err: any) {
    console.warn('Firestore fetchFarmerProfile warning:', err?.message || err);
    return null;
  }
}

/**
 * Saves a Crop record to Cloud Firestore under farmers/{userId}/crops/{cropId}
 */
export async function saveCropToFirestore(crop: Crop, userId?: string): Promise<boolean> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const cropDocRef = doc(collection(doc(collection(firestore, 'farmers'), uid), 'crops'), crop.id);

    const dataToSave: Record<string, any> = {
      id: crop.id,
      plotId: crop.plotId || null,
      plotName: crop.plotName || '',
      name: crop.name || '',
      variety: crop.variety || '',
      sowingDate: crop.sowingDate || new Date().toISOString().split('T')[0],
      expectedHarvestDate: crop.expectedHarvestDate || null,
      area: crop.area || '१.०',
      areaUnit: crop.areaUnit || 'एकर',
      status: crop.status || 'active',
      imageUrl: crop.imageUrl || null,
      totalExpenses: crop.totalExpenses || 0,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(cropDocRef, dataToSave, { merge: true });
    console.log('Crop saved to Cloud Firestore:', crop.id);
    return true;
  } catch (err: any) {
    console.warn('Firestore saveCrop warning:', err?.message || err);
    return false;
  }
}

/**
 * Fetches all crops for the given user from Cloud Firestore
 */
export async function fetchCropsFromFirestore(userId?: string): Promise<Crop[]> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const cropsColl = collection(doc(collection(firestore, 'farmers'), uid), 'crops');
    const snapshot = await getDocs(cropsColl);

    const crops: Crop[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      crops.push({
        id: docSnap.id,
        plotId: data.plotId || undefined,
        plotName: data.plotName || undefined,
        name: data.name || '',
        variety: data.variety || '',
        sowingDate: data.sowingDate || '',
        expectedHarvestDate: data.expectedHarvestDate || undefined,
        area: data.area || '१.०',
        areaUnit: data.areaUnit || 'एकर',
        status: data.status || 'active',
        imageUrl: data.imageUrl || undefined,
        totalExpenses: data.totalExpenses || 0,
      });
    });

    console.log(`Fetched ${crops.length} crops from Cloud Firestore for user:`, uid);
    return crops;
  } catch (err: any) {
    console.warn('Firestore fetchCrops warning:', err?.message || err);
    return [];
  }
}

/**
 * Deletes a crop from Cloud Firestore
 */
export async function deleteCropFromFirestore(cropId: string, userId?: string): Promise<boolean> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const cropDocRef = doc(collection(doc(collection(firestore, 'farmers'), uid), 'crops'), cropId);
    await deleteDoc(cropDocRef);
    console.log('Deleted crop from Cloud Firestore:', cropId);
    return true;
  } catch (err: any) {
    console.warn('Firestore deleteCrop warning:', err?.message || err);
    return false;
  }
}

/**
 * Saves a Farm Plot record to Cloud Firestore under farmers/{userId}/plots/{plotId}
 */
export async function savePlotToFirestore(plot: FarmPlot, userId?: string): Promise<boolean> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const plotDocRef = doc(collection(doc(collection(firestore, 'farmers'), uid), 'plots'), plot.id);

    const dataToSave: Record<string, any> = {
      id: plot.id,
      name: plot.name || '',
      area: plot.area || '१.०',
      areaUnit: plot.areaUnit || 'एकर',
      soilType: plot.soilType || 'काळी जमीन',
      irrigationType: plot.irrigationType || 'ठिबक सिंचन',
      updatedAt: new Date().toISOString(),
    };

    await setDoc(plotDocRef, dataToSave, { merge: true });
    console.log('Plot saved to Cloud Firestore:', plot.id);
    return true;
  } catch (err: any) {
    console.warn('Firestore savePlot warning:', err?.message || err);
    return false;
  }
}

/**
 * Fetches all plots for the given user from Cloud Firestore
 */
export async function fetchPlotsFromFirestore(userId?: string): Promise<FarmPlot[]> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const plotsColl = collection(doc(collection(firestore, 'farmers'), uid), 'plots');
    const snapshot = await getDocs(plotsColl);

    const plots: FarmPlot[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      plots.push({
        id: docSnap.id,
        name: data.name || '',
        area: data.area || '१.०',
        areaUnit: data.areaUnit || 'एकर',
        soilType: data.soilType || undefined,
        irrigationType: data.irrigationType || undefined,
      });
    });

    console.log(`Fetched ${plots.length} plots from Cloud Firestore for user:`, uid);
    return plots;
  } catch (err: any) {
    console.warn('Firestore fetchPlots warning:', err?.message || err);
    return [];
  }
}

/**
 * Deletes a farm plot from Cloud Firestore
 */
export async function deletePlotFromFirestore(plotId: string, userId?: string): Promise<boolean> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const plotDocRef = doc(collection(doc(collection(firestore, 'farmers'), uid), 'plots'), plotId);
    await deleteDoc(plotDocRef);
    console.log('Deleted plot from Cloud Firestore:', plotId);
    return true;
  } catch (err: any) {
    console.warn('Firestore deletePlot warning:', err?.message || err);
    return false;
  }
}

/**
 * Saves or updates an Activity Record in Cloud Firestore under farmers/{userId}/activities/{id}
 */
export async function saveActivityToFirestore(
  record: ActivityRecord,
  userId?: string
): Promise<boolean> {
  try {
    const uid = userId || record.userId || getCurrentUserId();
    const firestore = getFirestore();
    const activityDocRef = doc(
      collection(doc(collection(firestore, 'farmers'), uid), 'activities'),
      record.id
    );

    // Sanitize undefined fields for Firestore
    const dataToSave: Record<string, any> = {
      id: record.id,
      userId: uid,
      cropId: record.cropId || null,
      cropName: record.cropName || '',
      plotId: record.plotId || null,
      plotName: record.plotName || '',
      activityType: record.activityType,
      activityTitle: record.activityTitle,
      date: record.date,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
      photoUri: record.photoUri || null,
      location: record.location || null,
      voiceTranscript: record.voiceTranscript || null,
      audioUri: record.audioUri || null,
      structuredAnswers: record.structuredAnswers || [],
      expenses: record.expenses || [],
      totalExpense: record.totalExpense || 0,
      revenue: record.revenue || null,
      quantityHarvested: record.quantityHarvested || null,
      notes: record.notes || '',
      aiSummary: record.aiSummary || '',
      isSynced: true,
      isDraft: !!record.isDraft,
    };

    await setDoc(activityDocRef, dataToSave, { merge: true });
    console.log('Activity saved to Cloud Firestore:', record.id);
    return true;
  } catch (err: any) {
    console.warn('Firestore saveActivity warning:', err?.message || err);
    return false;
  }
}

/**
 * Fetches all activity records for the current user from Cloud Firestore
 */
export async function fetchActivitiesFromFirestore(userId?: string): Promise<ActivityRecord[]> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const activitiesColl = collection(doc(collection(firestore, 'farmers'), uid), 'activities');
    const q = query(activitiesColl, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const records: ActivityRecord[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      records.push({
        ...data,
        id: docSnap.id,
        isSynced: true,
      });
    });

    console.log(`Fetched ${records.length} activities from Cloud Firestore`);
    return records;
  } catch (err: any) {
    console.warn('Firestore fetchActivities warning:', err?.message || err);
    return [];
  }
}

/**
 * Deletes an activity record from Cloud Firestore
 */
export async function deleteActivityFromFirestore(id: string, userId?: string): Promise<boolean> {
  try {
    const uid = userId || getCurrentUserId();
    const firestore = getFirestore();
    const activityDocRef = doc(
      collection(doc(collection(firestore, 'farmers'), uid), 'activities'),
      id
    );
    await deleteDoc(activityDocRef);
    console.log('Deleted activity from Cloud Firestore:', id);
    return true;
  } catch (err: any) {
    console.warn('Firestore deleteActivity warning:', err?.message || err);
    return false;
  }
}

/**
 * Synchronizes ALL user data from Cloud Firestore online (Profile, Crops, Plots, Activities)
 */
export async function syncAllDataFromFirestore(userId?: string): Promise<{
  profile: FarmerProfile | null;
  crops: Crop[];
  plots: FarmPlot[];
  activities: ActivityRecord[];
}> {
  const uid = userId || getCurrentUserId();
  console.log('Starting full sync from Cloud Firestore for user:', uid);

  try {
    const [profile, crops, plots, activities] = await Promise.all([
      fetchFarmerProfileFromFirestore(uid),
      fetchCropsFromFirestore(uid),
      fetchPlotsFromFirestore(uid),
      fetchActivitiesFromFirestore(uid),
    ]);

    return {
      profile,
      crops,
      plots,
      activities,
    };
  } catch (err) {
    console.warn('syncAllDataFromFirestore warning:', err);
    return {
      profile: null,
      crops: [],
      plots: [],
      activities: [],
    };
  }
}
