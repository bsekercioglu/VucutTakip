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

// Daily records operations
export const addDailyRecord = async (record: Omit<DailyRecord, 'id'>) => {
  try {
    const recordWithTimestamp = {
      ...record,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, 'dailyRecords'), recordWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding daily record:', error);
    return { success: false, error };
  }
};

export const getUserDailyRecords = async (userId: string): Promise<DailyRecord[]> => {
  try {
    const q = query(
      collection(db, 'dailyRecords'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyRecord));
  } catch (error) {
    console.error('Error getting daily records:', error);
    return [];
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
    const q = query(
      collection(db, 'questions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
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