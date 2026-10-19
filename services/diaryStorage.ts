// services/diaryStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import {
  checkFarmerRegistrationByPhone,
  deleteActivityFromFirestore,
  deleteCropFromFirestore,
  deletePlotFromFirestore,
  fetchActivitiesFromFirestore,
  fetchCropsFromFirestore,
  fetchFarmerProfileFromFirestore,
  fetchPlantingQuestionFromFirestore,
  fetchPlotsFromFirestore,
  getCurrentUserId,
  saveActivityToFirestore,
  saveCropToFirestore,
  saveFarmerProfileToFirestore,
  savePlotToFirestore,
  setActiveUserId,
  syncAllDataFromFirestore,
  uploadDiaryAudio,
  uploadDiaryPhoto,
  uploadFarmerAvatar,
} from './firebaseDiary';

export { fetchPlantingQuestionFromFirestore };

export type ActivityType =
  | 'planting'
  | 'fertilizer'
  | 'pesticide'
  | 'irrigation'
  | 'harvesting'
  | 'sales'
  | 'weeding'
  | 'tillage'
  | 'other';

export type ExpenseCategory =
  | 'seeds'
  | 'fertilizer'
  | 'pesticide'
  | 'labour'
  | 'irrigation'
  | 'machinery'
  | 'transport'
  | 'other';

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
}

export interface StructuredAnswer {
  question: string;
  answer: string;
  fieldKey?: string;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  cropId?: string;
  cropName: string;
  plotId?: string;
  plotName: string;
  activityType: ActivityType;
  activityTitle: string;
  date: string; // ISO date string (when activity happened)
  createdAt: string; // ISO timestamp
  updatedAt: string;
  photoUri?: string;
  location?: {
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  voiceTranscript?: string;
  audioUri?: string;
  structuredAnswers: StructuredAnswer[];
  expenses: ExpenseItem[];
  totalExpense: number;
  revenue?: number; // for sales
  quantityHarvested?: string;
  notes?: string;
  aiSummary?: string;
  isSynced: boolean;
  isDraft: boolean;
}

export interface Crop {
  id: string;
  plotId?: string;
  plotName?: string;
  name: string;
  variety: string;
  sowingDate: string;
  expectedHarvestDate?: string;
  area: string;
  areaUnit: string;
  status: 'active' | 'harvested' | 'archived';
  imageUrl?: string;
  totalExpenses?: number;
}

export interface FarmPlot {
  id: string;
  name: string;
  area: string;
  areaUnit: string;
  soilType?: string;
  irrigationType?: string;
}

export interface FarmerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  gender?: string;
  taluka?: string;
  village: string;
  district: string;
  state: string;
  pincode?: string;
  totalArea: string;
  areaUnit: string;
  preferredLanguage: 'mr' | 'hi' | 'en';
  createdDate: string;
  avatarUri?: string;
}

export interface DiaryDatabase {
  farmer: FarmerProfile;
  plots: FarmPlot[];
  crops: Crop[];
  activities: ActivityRecord[];
  drafts: ActivityRecord[];
}

const DB_FILE_NAME = 'farming_diary_db_v1.json';

function getDbPath(): string {
  const dir = FileSystem.documentDirectory || '';
  return `${dir}${DB_FILE_NAME}`;
}

const INITIAL_SEED_DATA: DiaryDatabase = {
  farmer: {
    id: '',
    name: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    taluka: '',
    village: '',
    district: '',
    state: '',
    pincode: '',
    totalArea: '',
    areaUnit: '',
    preferredLanguage: 'mr',
    createdDate: new Date().toISOString(),
  },
  plots: [],
  crops: [],
  activities: [],
  drafts: [],
};

let cachedDb: DiaryDatabase | null = null;

export async function getDiaryDatabase(): Promise<DiaryDatabase> {
  if (cachedDb) return cachedDb;

  try {
    const filePath = getDbPath();
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(filePath);
      const parsed = JSON.parse(content) as DiaryDatabase;
      if (parsed && parsed.farmer) {
        // Strip out any previous static mock activities
        parsed.activities = (parsed.activities || []).filter(
          (a) => !['act_1', 'act_2', 'act_3', 'act_4'].includes(a.id)
        );
        parsed.drafts = parsed.drafts || [];

        // Strip out legacy static mock crops and plots
        parsed.crops = (parsed.crops || []).filter(
          (c) => !['crop_1', 'crop_2', 'crop_3', 'crop_4'].includes(c.id)
        );
        parsed.plots = (parsed.plots || []).filter(
          (p) => !['plot_1', 'plot_2', 'plot_3', 'plot_4'].includes(p.id)
        );

        // Remove legacy static seed mock data if present
        if (parsed.farmer.name === 'पवन पाटील' && (parsed.farmer.phone === '९८२२१२३४५६' || parsed.farmer.id === 'farmer_01')) {
          parsed.farmer.name = '';
          parsed.farmer.phone = '';
          parsed.farmer.village = '';
          parsed.farmer.district = '';
          parsed.farmer.state = '';
          parsed.farmer.pincode = '';
          parsed.farmer.totalArea = '';
        }
        cachedDb = parsed;
        await saveDiaryDatabase(cachedDb);
        return cachedDb;
      }
    }
  } catch (err) {
    console.warn('Could not read existing diary DB, initializing fresh:', err);
  }

  // Initialize with seed data
  cachedDb = INITIAL_SEED_DATA;
  await saveDiaryDatabase(cachedDb);
  return cachedDb;
}

export async function saveDiaryDatabase(db: DiaryDatabase): Promise<void> {
  cachedDb = db;
  try {
    const filePath = getDbPath();
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Failed to write diary database:', err);
  }
}

// Photo Management: copies captured camera/picker temp photo to app document storage
export async function savePermanentPhoto(tempUri: string): Promise<string> {
  try {
    if (!tempUri || tempUri.startsWith('http')) return tempUri;
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) return tempUri;

    const photosDir = `${baseDir}diary_photos/`;
    const dirInfo = await FileSystem.getInfoAsync(photosDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(photosDir, { intermediates: true });
    }

    const filename = `crop_${Date.now()}_${Math.floor(Math.random() * 10000)}.jpg`;
    const destPath = `${photosDir}${filename}`;

    await FileSystem.copyAsync({
      from: tempUri,
      to: destPath,
    });

    return destPath;
  } catch (err) {
    console.warn('Failed to persist photo locally, keeping original URI:', err);
    return tempUri;
  }
}

// Audio Management: copies captured voice audio to app document storage so it is not lost
export async function savePermanentAudio(tempUri: string): Promise<string> {
  try {
    if (!tempUri || tempUri.startsWith('http')) return tempUri;
    const baseDir = FileSystem.documentDirectory;
    if (!baseDir) return tempUri;

    const audioDir = `${baseDir}diary_audio/`;
    const dirInfo = await FileSystem.getInfoAsync(audioDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
    }

    const filename = `voice_${Date.now()}_${Math.floor(Math.random() * 10000)}.m4a`;
    const destPath = `${audioDir}${filename}`;

    await FileSystem.copyAsync({
      from: tempUri,
      to: destPath,
    });

    return destPath;
  } catch (err) {
    console.warn('Failed to persist audio locally, keeping original URI:', err);
    return tempUri;
  }
}

// Activity Record Queries & Mutations
export async function getActivities(filter?: {
  cropId?: string;
  activityType?: ActivityType;
  search?: string;
}): Promise<ActivityRecord[]> {
  const db = await getDiaryDatabase();
  let list = (db.activities || []).filter((a) => !['act_1', 'act_2', 'act_3', 'act_4'].includes(a.id));

  if (filter?.cropId) {
    list = list.filter((a) => a.cropId === filter.cropId);
  }

  if (filter?.activityType) {
    list = list.filter((a) => a.activityType === filter.activityType);
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.cropName.toLowerCase().includes(q) ||
        a.activityTitle.toLowerCase().includes(q) ||
        (a.notes && a.notes.toLowerCase().includes(q)) ||
        (a.voiceTranscript && a.voiceTranscript.toLowerCase().includes(q)) ||
        a.plotName.toLowerCase().includes(q)
    );
  }

  // Sort descending: newest activity date first
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getActivityById(id: string): Promise<ActivityRecord | undefined> {
  const db = await getDiaryDatabase();
  return db.activities.find((a) => a.id === id);
}

export async function addActivity(
  record: Omit<ActivityRecord, 'id' | 'createdAt' | 'updatedAt' | 'isSynced' | 'isDraft'>
): Promise<ActivityRecord> {
  const db = await getDiaryDatabase();
  const now = new Date().toISOString();
  const activityId = `act_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  let finalPhotoUri = record.photoUri;
  if (finalPhotoUri && !finalPhotoUri.startsWith('http')) {
    finalPhotoUri = await savePermanentPhoto(finalPhotoUri);
  }

  // Upload photo to Firebase Storage if available (falls back to local uri if offline)
  let cloudPhotoUri = finalPhotoUri;
  if (finalPhotoUri) {
    try {
      cloudPhotoUri = await uploadDiaryPhoto(finalPhotoUri, activityId);
    } catch (err) {
      console.warn('Firebase photo upload fallback:', err);
    }
  }

  // Persist voice audio locally & upload to Firebase Storage if available
  console.log('💾 addActivity - record.audioUri received:', record.audioUri);
  let finalAudioUri = record.audioUri;
  if (finalAudioUri && !finalAudioUri.startsWith('http')) {
    finalAudioUri = await savePermanentAudio(finalAudioUri);
  }

  let cloudAudioUri = finalAudioUri;
  if (finalAudioUri) {
    try {
      cloudAudioUri = await uploadDiaryAudio(finalAudioUri, activityId);
    } catch (err) {
      console.warn('Firebase audio upload fallback:', err);
    }
  }

  const newRecord: ActivityRecord = {
    ...record,
    id: activityId,
    photoUri: cloudPhotoUri,
    audioUri: cloudAudioUri,
    createdAt: now,
    updatedAt: now,
    isSynced: false,
    isDraft: false,
  };

  db.activities.unshift(newRecord);

  // Update associated crop expenses
  if (newRecord.cropId && newRecord.totalExpense > 0) {
    const crop = db.crops.find((c) => c.id === newRecord.cropId);
    if (crop) {
      crop.totalExpenses = (crop.totalExpenses || 0) + newRecord.totalExpense;
    }
  }

  await saveDiaryDatabase(db);

  // Save to Cloud Firestore in background/online
  try {
    const savedInCloud = await saveActivityToFirestore(newRecord);
    if (savedInCloud) {
      newRecord.isSynced = true;
      const idx = db.activities.findIndex((a) => a.id === activityId);
      if (idx !== -1) {
        db.activities[idx].isSynced = true;
        await saveDiaryDatabase(db);
      }
    }
  } catch (err) {
    console.warn('Firestore sync warning (stored offline):', err);
  }

  return newRecord;
}

export async function updateActivity(
  id: string,
  updates: Partial<ActivityRecord>
): Promise<ActivityRecord> {
  const db = await getDiaryDatabase();
  const index = db.activities.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error('Activity record not found');
  }

  const oldRecord = db.activities[index];
  const oldExpense = oldRecord.totalExpense || 0;

  const updated: ActivityRecord = {
    ...oldRecord,
    ...updates,
    id: oldRecord.id,
    createdAt: oldRecord.createdAt, // preserve original timestamp
    updatedAt: new Date().toISOString(),
    isSynced: false,
  };

  db.activities[index] = updated;

  // Recalculate crop expense delta
  if (updated.cropId && updates.totalExpense !== undefined) {
    const delta = (updated.totalExpense || 0) - oldExpense;
    const crop = db.crops.find((c) => c.id === updated.cropId);
    if (crop) {
      crop.totalExpenses = Math.max(0, (crop.totalExpenses || 0) + delta);
    }
  }

  await saveDiaryDatabase(db);

  // Update in Cloud Firestore
  try {
    const saved = await saveActivityToFirestore(updated);
    if (saved) {
      updated.isSynced = true;
      db.activities[index].isSynced = true;
      await saveDiaryDatabase(db);
    }
  } catch (err) {
    console.warn('Firestore update warning:', err);
  }

  return updated;
}

export async function deleteActivity(id: string): Promise<boolean> {
  const db = await getDiaryDatabase();
  const record = db.activities.find((a) => a.id === id);
  if (!record) return false;

  db.activities = db.activities.filter((a) => a.id !== id);

  // Deduct from crop expenses
  if (record.cropId && record.totalExpense > 0) {
    const crop = db.crops.find((c) => c.id === record.cropId);
    if (crop) {
      crop.totalExpenses = Math.max(0, (crop.totalExpenses || 0) - record.totalExpense);
    }
  }

  await saveDiaryDatabase(db);

  // Also delete from Cloud Firestore
  try {
    await deleteActivityFromFirestore(id);
  } catch (err) {
    console.warn('Firestore delete warning:', err);
  }

  return true;
}

/**
 * Synchronizes local activities with Cloud Firestore (bidirectional)
 */
export async function syncActivitiesWithCloud(): Promise<ActivityRecord[]> {
  try {
    const db = await getDiaryDatabase();
    const cloudActivities = await fetchActivitiesFromFirestore();

    if (cloudActivities && cloudActivities.length > 0) {
      const localMap = new Map(db.activities.map((a) => [a.id, a]));
      for (const cAct of cloudActivities) {
        localMap.set(cAct.id, cAct);
      }
      db.activities = Array.from(localMap.values()).sort(
        (a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()
      );
      await saveDiaryDatabase(db);
    }

    // Push unsynced local activities to Cloud Firestore
    const unsynced = db.activities.filter((a) => !a.isSynced);
    for (const unsyncedAct of unsynced) {
      const success = await saveActivityToFirestore(unsyncedAct);
      if (success) {
        unsyncedAct.isSynced = true;
      }
    }
    if (unsynced.length > 0) {
      await saveDiaryDatabase(db);
    }

    return db.activities;
  } catch (err) {
    console.warn('Cloud sync error:', err);
    const db = await getDiaryDatabase();
    return db.activities;
  }
}

// Crops
export async function getCrops(): Promise<Crop[]> {
  const db = await getDiaryDatabase();
  // Fetch latest crops from Cloud Firestore online
  try {
    const cloudCrops = await fetchCropsFromFirestore();
    if (cloudCrops && cloudCrops.length > 0) {
      db.crops = cloudCrops.filter((c) => !['crop_1', 'crop_2', 'crop_3', 'crop_4'].includes(c.id));
      await saveDiaryDatabase(db);
    }
  } catch (err) {
    console.warn('fetchCropsFromFirestore notice:', err);
  }
  return (db.crops || []).filter((c) => !['crop_1', 'crop_2', 'crop_3', 'crop_4'].includes(c.id));
}

export async function getCropById(id: string): Promise<Crop | undefined> {
  const db = await getDiaryDatabase();
  return db.crops.find((c) => c.id === id);
}

export async function addCrop(cropData: Omit<Crop, 'id'>): Promise<Crop> {
  const db = await getDiaryDatabase();
  const newCrop: Crop = {
    ...cropData,
    id: `crop_${Date.now()}`,
    totalExpenses: cropData.totalExpenses || 0,
  };
  db.crops.push(newCrop);
  await saveDiaryDatabase(db);

  // Save online in Cloud Firestore
  try {
    await saveCropToFirestore(newCrop);
  } catch (err) {
    console.warn('saveCropToFirestore error:', err);
  }
  return newCrop;
}

export async function updateCrop(id: string, updates: Partial<Crop>): Promise<Crop> {
  const db = await getDiaryDatabase();
  const index = db.crops.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Crop not found');

  db.crops[index] = {
    ...db.crops[index],
    ...updates,
    id,
  };

  await saveDiaryDatabase(db);

  // Update online in Cloud Firestore
  try {
    await saveCropToFirestore(db.crops[index]);
  } catch (err) {
    console.warn('saveCropToFirestore update error:', err);
  }
  return db.crops[index];
}

export async function deleteCrop(id: string): Promise<boolean> {
  const db = await getDiaryDatabase();
  db.crops = db.crops.filter((c) => c.id !== id);
  await saveDiaryDatabase(db);

  // Delete online in Cloud Firestore
  try {
    await deleteCropFromFirestore(id);
  } catch (err) {
    console.warn('deleteCropFromFirestore error:', err);
  }
  return true;
}

// Plots
export async function getPlots(): Promise<FarmPlot[]> {
  const db = await getDiaryDatabase();
  // Fetch latest plots from Cloud Firestore online
  try {
    const cloudPlots = await fetchPlotsFromFirestore();
    if (cloudPlots && cloudPlots.length > 0) {
      db.plots = cloudPlots.filter((p) => !['plot_1', 'plot_2', 'plot_3', 'plot_4'].includes(p.id));
      await saveDiaryDatabase(db);
    }
  } catch (err) {
    console.warn('fetchPlotsFromFirestore notice:', err);
  }
  return (db.plots || []).filter((p) => !['plot_1', 'plot_2', 'plot_3', 'plot_4'].includes(p.id));
}

export async function addPlot(plotData: Omit<FarmPlot, 'id'>): Promise<FarmPlot> {
  const db = await getDiaryDatabase();
  const newPlot: FarmPlot = {
    ...plotData,
    id: `plot_${Date.now()}`,
  };
  db.plots.push(newPlot);
  await saveDiaryDatabase(db);

  // Save online in Cloud Firestore
  try {
    await savePlotToFirestore(newPlot);
  } catch (err) {
    console.warn('savePlotToFirestore error:', err);
  }
  return newPlot;
}

export async function deletePlot(id: string): Promise<boolean> {
  const db = await getDiaryDatabase();
  db.plots = db.plots.filter((p) => p.id !== id);
  await saveDiaryDatabase(db);

  // Delete online in Cloud Firestore
  try {
    await deletePlotFromFirestore(id);
  } catch (err) {
    console.warn('deletePlotFromFirestore error:', err);
  }
  return true;
}

// Farmer Profile
export async function getFarmerProfile(): Promise<FarmerProfile> {
  const db = await getDiaryDatabase();
  // Try to restore from Cloud Firestore online
  try {
    const cloudProfile = await fetchFarmerProfileFromFirestore();
    if (cloudProfile && cloudProfile.name) {
      db.farmer = cloudProfile;
      await saveDiaryDatabase(db);
      return cloudProfile;
    }
  } catch (err) {
    console.warn('fetchFarmerProfileFromFirestore notice:', err);
  }
  return db.farmer;
}

export async function updateFarmerProfile(updates: Partial<FarmerProfile>): Promise<FarmerProfile> {
  const db = await getDiaryDatabase();
  const currentId =
    updates.id ||
    (db.farmer?.id && db.farmer.id !== 'farmer_01' ? db.farmer.id : getCurrentUserId());

  // If local photo is being set, upload directly to Firebase Storage first
  if (updates.avatarUri && !updates.avatarUri.startsWith('http')) {
    try {
      const cloudUrl = await uploadFarmerAvatar(updates.avatarUri, currentId);
      if (cloudUrl && cloudUrl.startsWith('http')) {
        updates.avatarUri = cloudUrl;
      }
    } catch (uploadErr) {
      console.warn('Avatar upload error during updateFarmerProfile:', uploadErr);
    }
  }

  db.farmer = {
    ...db.farmer,
    ...updates,
    id: currentId,
  };
  await saveDiaryDatabase(db);

  // Sync profile details to Cloud Firestore online
  try {
    await saveFarmerProfileToFirestore(db.farmer, currentId);
  } catch (err) {
    console.warn('Firestore profile sync error:', err);
  }

  return db.farmer;
}

// Financial Analytics (never double counts, calculates strictly from database)
export async function getExpenseSummary(cropId?: string) {
  const db = await getDiaryDatabase();
  let activities = db.activities;

  if (cropId) {
    activities = activities.filter((a) => a.cropId === cropId);
  }

  let totalExpense = 0;
  let totalRevenue = 0;
  const byCrop: Record<string, number> = {};
  const byCategory: Record<string, number> = {
    seeds: 0,
    fertilizer: 0,
    pesticide: 0,
    labour: 0,
    irrigation: 0,
    machinery: 0,
    other: 0,
  };

  for (const act of activities) {
    // Add activity level expenses
    if (act.expenses && act.expenses.length > 0) {
      for (const item of act.expenses) {
        const cat = item.category || 'other';
        byCategory[cat] = (byCategory[cat] || 0) + item.amount;
        totalExpense += item.amount;
      }
    } else if (act.totalExpense > 0) {
      totalExpense += act.totalExpense;
      const cat = act.activityType === 'planting' ? 'seeds' : act.activityType === 'fertilizer' ? 'fertilizer' : act.activityType === 'pesticide' ? 'pesticide' : 'other';
      byCategory[cat] = (byCategory[cat] || 0) + act.totalExpense;
    }

    if (act.cropName) {
      byCrop[act.cropName] = (byCrop[act.cropName] || 0) + act.totalExpense;
    }

    if (act.revenue && act.revenue > 0) {
      totalRevenue += act.revenue;
    }
  }

  const netProfit = totalRevenue - totalExpense;

  return {
    totalExpense,
    totalRevenue,
    netProfit,
    byCrop,
    byCategory,
    recentActivities: activities.slice(0, 10),
  };
}

// Export backup
export async function exportDiaryData(): Promise<string> {
  const db = await getDiaryDatabase();
  return JSON.stringify(db, null, 2);
}

// Onboarding & Login Status
export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const path = `${FileSystem.documentDirectory}onboarding_completed.txt`;
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(completed: boolean): Promise<void> {
  try {
    const path = `${FileSystem.documentDirectory}onboarding_completed.txt`;
    if (completed) {
      await FileSystem.writeAsStringAsync(path, 'true');
    } else {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch (err) {
    console.warn('Failed to update onboarding state:', err);
  }
}

/**
 * Checks if the user is already registered.
 * Can take an optional phone number to check Cloud Firestore before login.
 */
export async function isUserRegistered(phoneNumber?: string): Promise<boolean> {
  // 1. If phone number is passed, check Cloud Firestore directly
  if (phoneNumber && phoneNumber.replace(/\D/g, '').length >= 10) {
    try {
      const check = await checkFarmerRegistrationByPhone(phoneNumber);
      if (check.isRegistered) {
        if (check.farmer) {
          const db = await getDiaryDatabase();
          db.farmer = check.farmer;
          await saveDiaryDatabase(db);
        }
        await setUserRegistered(true);
        return true;
      }
    } catch (err) {
      console.warn('Phone registration check notice:', err);
    }
  }

  // 2. Check local persistent file
  try {
    const path = `${FileSystem.documentDirectory}user_registered.txt`;
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return true;
  } catch { }

  // 3. Check Cloud Firestore for currently signed in user
  try {
    const cloudProfile = await fetchFarmerProfileFromFirestore();
    if (cloudProfile && cloudProfile.name && cloudProfile.name.trim().length > 0) {
      const db = await getDiaryDatabase();
      db.farmer = cloudProfile;
      await saveDiaryDatabase(db);
      await setUserRegistered(true);
      return true;
    }
  } catch (e) {
    console.warn('Cloud profile registration check warning:', e);
  }

  // 4. Check if profile was previously saved in the local database
  try {
    const db = await getDiaryDatabase();
    return !!(db.farmer && db.farmer.name && db.farmer.name.trim().length > 0);
  } catch {
    return false;
  }
}

export async function setUserRegistered(registered: boolean): Promise<void> {
  try {
    const path = `${FileSystem.documentDirectory}user_registered.txt`;
    if (registered) {
      await FileSystem.writeAsStringAsync(path, 'true');
    } else {
      await FileSystem.deleteAsync(path, { idempotent: true });
    }
  } catch (err) {
    console.warn('Failed to update user_registered state:', err);
  }
}

/**
 * Loads all online data from Cloud Firestore (profile, crops, plots, activities)
 * and synchronizes with local storage.
 */
export async function loadUserOnlineData(userId?: string): Promise<DiaryDatabase> {
  if (userId) {
    setActiveUserId(userId);
  }
  const cloudData = await syncAllDataFromFirestore(userId);
  const db = await getDiaryDatabase();

  if (cloudData.profile) {
    db.farmer = cloudData.profile;
  }
  if (cloudData.crops && cloudData.crops.length > 0) {
    db.crops = cloudData.crops;
  }
  if (cloudData.plots && cloudData.plots.length > 0) {
    db.plots = cloudData.plots;
  }
  if (cloudData.activities && cloudData.activities.length > 0) {
    db.activities = cloudData.activities;
  }

  await saveDiaryDatabase(db);
  return db;
}

/**
 * Clears local session and resets in-memory database cache on logout
 */
export async function clearLocalDiarySession(): Promise<void> {
  setActiveUserId(null);
  try {
    const filePath = getDbPath();
    await FileSystem.deleteAsync(filePath, { idempotent: true });
  } catch (err) {
    console.warn('Error clearing local diary cache:', err);
  }
}
