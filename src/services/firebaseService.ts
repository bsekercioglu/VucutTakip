import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  orderBy,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'male' | 'female';
  birthDate: string;
  height: number;
  initialWeight: number;
  measurements: {
    chest: number;
    waist: number;
    hips: number;
    arm: number;
    thigh: number;
  };
  registrationDate: string;
  photoURL?: string;
}

export interface DailyRecord {
  id: string;
  userId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  waterPercentage?: number;
  musclePercentage?: number;
}

export interface DailyTracking {
  id: string;
  userId: string;
  date: string;
  weight: number;
  bodyFat?: number;
  waterPercentage?: number;
  musclePercentage?: number;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Question {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'pending' | 'answered';
  answer?: string;
  answerTimestamp?: string;
}

// User operations
export const createUser = async (userId: string, userData: Omit<User, 'id'>) => {
  try {
    const userWithTimestamp = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', userId), userWithTimestamp);
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error };
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  try {
    const updateData = {
      ...userData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, 'users', userId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error };
  }
};

// Daily tracking operations
export const addDailyTracking = async (tracking: Omit<DailyTracking, 'id' | 'userId'>, userId: string) => {
  try {
    const trackingWithTimestamp = {
      ...tracking,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'dailyTracking'), trackingWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding daily tracking:', error);
    return { success: false, error };
  }
};

export const getUserDailyTracking = async (userId: string): Promise<DailyTracking[]> => {
  try {
    // Use simple query without ordering to avoid index requirement
    const q = query(
      collection(db, 'dailyTracking'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const tracking = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyTracking));
    
    // Sort manually by date descending to avoid index requirement
    tracking.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return tracking;
  } catch (error) {
    console.error('Error getting daily tracking:', error);
    return [];
  }
};

export const updateDailyTracking = async (trackingId: string, trackingData: Partial<DailyTracking>) => {
  try {
    const updateData = {
      ...trackingData,
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, 'dailyTracking', trackingId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating daily tracking:', error);
    return { success: false, error };
  }
};

export const deleteDailyTracking = async (trackingId: string) => {
  try {
    await deleteDoc(doc(db, 'dailyTracking', trackingId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting daily tracking:', error);
    return { success: false, error };
  }
};

// Daily records operations
export const addDailyRecord = async (record: Omit<DailyRecord, 'id'>) => {
  try {
    console.log('Firebase: Adding daily record:', record);
    
    // Convert string values to numbers for consistency
    const processedRecord = {
      ...record,
      weight: typeof record.weight === 'string' ? parseFloat(record.weight) : record.weight,
      bodyFat: record.bodyFat && typeof record.bodyFat === 'string' ? parseFloat(record.bodyFat) : record.bodyFat,
      waterPercentage: record.waterPercentage && typeof record.waterPercentage === 'string' ? parseFloat(record.waterPercentage) : record.waterPercentage,
      musclePercentage: record.musclePercentage && typeof record.musclePercentage === 'string' ? parseFloat(record.musclePercentage) : record.musclePercentage
    };
    
    const recordWithTimestamp = {
      ...processedRecord,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'dailyRecords'), recordWithTimestamp);
    console.log('Firebase: Daily record added with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding daily record:', error);
    return { success: false, error };
  }
};

export const getUserDailyRecords = async (userId: string): Promise<DailyRecord[]> => {
  try {
    console.log('FirebaseService: Getting daily records for user:', userId);
    
    // Use simple query without ordering to avoid index requirement
    const q = query(
      collection(db, 'dailyRecords'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRecord));
    
    // Sort manually by date to avoid index requirement
    records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log('FirebaseService: Retrieved daily records count:', records.length, 'Records:', records);
    return records;
  } catch (error) {
    console.error('FirebaseService: Error getting daily records:', error);
    return [];
  }
};

export const updateDailyRecord = async (recordId: string, recordData: Partial<DailyRecord>) => {
  try {
    console.log('Firebase: Updating daily record:', recordId, recordData);
    
    // Convert string values to numbers for consistency
    const processedRecord = {
      ...recordData,
      weight: recordData.weight && typeof recordData.weight === 'string' ? parseFloat(recordData.weight) : recordData.weight,
      bodyFat: recordData.bodyFat && typeof recordData.bodyFat === 'string' ? parseFloat(recordData.bodyFat) : recordData.bodyFat,
      waterPercentage: recordData.waterPercentage && typeof recordData.waterPercentage === 'string' ? parseFloat(recordData.waterPercentage) : recordData.waterPercentage,
      musclePercentage: recordData.musclePercentage && typeof recordData.musclePercentage === 'string' ? parseFloat(recordData.musclePercentage) : recordData.musclePercentage
    };
    
    const updateData = {
      ...processedRecord,
      updatedAt: serverTimestamp()
    };
    await updateDoc(doc(db, 'dailyRecords', recordId), updateData);
    console.log('Firebase: Daily record updated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error updating daily record:', error);
    return { success: false, error };
  }
};

export const deleteDailyRecord = async (recordId: string) => {
  try {
    console.log('Firebase: Deleting daily record:', recordId);
    await deleteDoc(doc(db, 'dailyRecords', recordId));
    console.log('Firebase: Daily record deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Error deleting daily record:', error);
    return { success: false, error };
  }
};
// Questions operations
export const addQuestion = async (question: Omit<Question, 'id'>) => {
  try {
    const questionWithTimestamp = {
      ...question,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'questions'), questionWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding question:', error);
    return { success: false, error };
  }
};

export const getUserQuestions = async (userId: string): Promise<Question[]> => {
  try {
    // Use simple query without ordering to avoid index requirement
    const q = query(
      collection(db, 'questions'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const questions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    
    // Sort manually by timestamp descending to avoid index requirement
    questions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return questions;
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
};

// Initialize database collections and indexes
export const initializeDatabase = async () => {
  try {
    // This function will be called to ensure proper database structure
    console.log('Database initialization completed');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  }
};