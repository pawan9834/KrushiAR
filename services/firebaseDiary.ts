// services/firebaseDiary.ts
import { getAuth } from '@react-native-firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from '@react-native-firebase/firestore';
import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import { ActivityRecord } from './diaryStorage';

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
