// services/diaryStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import {
  deleteActivityFromFirestore,
  fetchActivitiesFromFirestore,
  saveActivityToFirestore,
  uploadDiaryPhoto,
} from './firebaseDiary';

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
  village: string;
  district: string;
  state: string;
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
    id: 'farmer_01',
    name: 'पवन पाटील',
    phone: '९८२२१२३४५६',
    village: 'चोपडा',
    district: 'जळगाव',
    state: 'महाराष्ट्र',
    totalArea: '५.५',
    areaUnit: 'एकर',
    preferredLanguage: 'mr',
    createdDate: new Date().toISOString(),
  },
  plots: [
    {
      id: 'plot_1',
      name: 'शेताचा तुकडा १ (विहिरीचे रान)',
      area: '१.५',
      areaUnit: 'एकर',
      soilType: 'काळी कसदार',
      irrigationType: 'ठिबक सिंचन',
    },
    {
      id: 'plot_2',
      name: 'शेताचा तुकडा २ (रस्त्यालगत)',
      area: '२.०',
      areaUnit: 'एकर',
      soilType: 'मध्यम काळी',
      irrigationType: 'ठिबक सिंचन',
    },
    {
      id: 'plot_3',
      name: 'शेताचा तुकडा ३ (बोअरवेल शेत)',
      area: '१.०',
      areaUnit: 'एकर',
      soilType: 'हलकी मुरमाड',
      irrigationType: 'तुषार सिंचन',
    },
    {
      id: 'plot_4',
      name: 'शेताचा तुकडा ४ (नदीकाठचे रान)',
      area: '१.०',
      areaUnit: 'एकर',
      soilType: 'गाळाची जमीन',
      irrigationType: 'ठिबक सिंचन',
    },
  ],
  crops: [
    {
      id: 'crop_1',
      plotId: 'plot_1',
      plotName: 'शेताचा तुकडा १',
      name: 'टोमॅटो',
      variety: 'अभिनव (Seminis)',
      sowingDate: '२०२६-०९-१०',
      expectedHarvestDate: '२०२६-११-२५',
      area: '१.५',
      areaUnit: 'एकर',
      status: 'active',
      imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80',
      totalExpenses: 18500,
    },
    {
      id: 'crop_2',
      plotId: 'plot_2',
      plotName: 'शेताचा तुकडा २',
      name: 'सोयाबीन',
      variety: 'JS-335 (पिवळा)',
      sowingDate: '२०२६-०६-१५',
      expectedHarvestDate: '२०२६-१०-२०',
      area: '२.०',
      areaUnit: 'एकर',
      status: 'active',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80',
      totalExpenses: 14200,
    },
    {
      id: 'crop_3',
      plotId: 'plot_3',
      plotName: 'शेताचा तुकडा ३',
      name: 'कापूस',
      variety: 'RCH-659 (बीटी)',
      sowingDate: '२०२६-०६-१०',
      expectedHarvestDate: '२०२६-११-१५',
      area: '१.०',
      areaUnit: 'एकर',
      status: 'active',
      imageUrl: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&q=80',
      totalExpenses: 12800,
    },
    {
      id: 'crop_4',
      plotId: 'plot_4',
      plotName: 'शेताचा तुकडा ४',
      name: 'कांदा',
      variety: 'लाल कांदा (पंचगंगा)',
      sowingDate: '२०२६-०८-०१',
      expectedHarvestDate: '२०२६-११-३०',
      area: '१.०',
      areaUnit: 'एकर',
      status: 'active',
      imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=80',
      totalExpenses: 0,
    },
  ],
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
        cachedDb = parsed;
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

// Activity Record Queries & Mutations
export async function getActivities(filter?: {
  cropId?: string;
  activityType?: ActivityType;
  search?: string;
}): Promise<ActivityRecord[]> {
  const db = await getDiaryDatabase();
  let list = [...db.activities];

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

  const newRecord: ActivityRecord = {
    ...record,
    id: activityId,
    photoUri: cloudPhotoUri,
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
  return db.crops;
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
  return db.crops[index];
}

// Plots
export async function getPlots(): Promise<FarmPlot[]> {
  const db = await getDiaryDatabase();
  return db.plots;
}

export async function addPlot(plotData: Omit<FarmPlot, 'id'>): Promise<FarmPlot> {
  const db = await getDiaryDatabase();
  const newPlot: FarmPlot = {
    ...plotData,
    id: `plot_${Date.now()}`,
  };
  db.plots.push(newPlot);
  await saveDiaryDatabase(db);
  return newPlot;
}

// Farmer Profile
export async function getFarmerProfile(): Promise<FarmerProfile> {
  const db = await getDiaryDatabase();
  return db.farmer;
}

export async function updateFarmerProfile(updates: Partial<FarmerProfile>): Promise<FarmerProfile> {
  const db = await getDiaryDatabase();
  db.farmer = {
    ...db.farmer,
    ...updates,
    id: db.farmer.id,
  };
  await saveDiaryDatabase(db);
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
