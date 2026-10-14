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
} from '@react-native-firebase/firestore';
import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import { ActivityRecord, FarmerProfile } from './diaryStorage';

/**
 * Returns current authenticated user ID or fallback
 */
export function getCurrentUserId(): string {
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
 * Saves or updates an Activity Record in Cloud Firestore under farmers/{userId}/activities/{id}
 */
export async function saveActivityToFirestore(record: ActivityRecord): Promise<boolean> {
  try {
    const userId = record.userId || getCurrentUserId();
    const firestore = getFirestore();
    const activityDocRef = doc(collection(doc(collection(firestore, 'farmers'), userId), 'activities'), record.id);

    // Sanitize undefined fields for Firestore
    const dataToSave: Record<string, any> = {
      id: record.id,
      userId: userId,
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
    const activityDocRef = doc(collection(doc(collection(firestore, 'farmers'), uid), 'activities'), id);
    await deleteDoc(activityDocRef);
    console.log('Deleted activity from Cloud Firestore:', id);
    return true;
  } catch (err: any) {
    console.warn('Firestore deleteActivity warning:', err?.message || err);
    return false;
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
    const storageFileName = `farmers/${userId}/profile/avatar_${Date.now()}.jpg`;
    const storageRef = ref(storage, storageFileName);

    console.log('Uploading farmer avatar to Firebase Storage:', storageFileName);
    await putFile(storageRef, cleanPath);
    const downloadUrl = await getDownloadURL(storageRef);
    console.log('Farmer avatar upload successful:', downloadUrl);
    return downloadUrl;
  } catch (err: any) {
    console.warn('Firebase avatar upload warning (fallback to local):', err?.message || err);
    return localUri;
  }
}

/**
 * Saves Farmer Profile details into Cloud Firestore under farmers/{userId}
 */
export async function saveFarmerProfileToFirestore(profile: FarmerProfile): Promise<boolean> {
  try {
    const userId = getCurrentUserId();
    const firestore = getFirestore();
    const farmerDocRef = doc(collection(firestore, 'farmers'), userId);

    let avatarCloudUrl = profile.avatarUri || null;
    if (avatarCloudUrl && !avatarCloudUrl.startsWith('http')) {
      avatarCloudUrl = await uploadFarmerAvatar(avatarCloudUrl, userId);
    }

    const profileData: Record<string, any> = {
      id: profile.id || userId,
      userId: userId,
      name: profile.name || '',
      phone: profile.phone || '',
      village: profile.village || '',
      district: profile.district || 'जळगाव',
      state: profile.state || 'महाराष्ट्र',
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
export async function fetchFarmerProfileFromFirestore(userId?: string): Promise<FarmerProfile | null> {
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
        village: data.village || '',
        district: data.district || '',
        state: data.state || '',
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
