import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase';
import * as firebaseService from '../services/firebaseService';
import { User, DailyRecord, Question, DailyTracking } from '../services/firebaseService';

import { useEffect } from 'react';

interface UserContextType {
  user: User | null;
  dailyRecords: DailyRecord[];
  dailyTracking: DailyTracking[];
  questions: Question[];
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => void;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
  addDailyRecord: (record: Omit<DailyRecord, 'id' | 'userId'>) => Promise<boolean>;
  addDailyTracking: (tracking: Omit<DailyTracking, 'id' | 'userId'>) => Promise<boolean>;
  updateDailyTracking: (trackingId: string, tracking: Partial<DailyTracking>) => Promise<boolean>;
  deleteDailyTracking: (trackingId: string) => Promise<boolean>;
  addQuestion: (question: Omit<Question, 'id' | 'userId' | 'timestamp' | 'status'>) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>([]);
  const [dailyTracking, setDailyTracking] = useState<DailyTracking[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result from Google/Facebook login
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Google redirect result:', result.user);
          // User will be handled by onAuthStateChanged
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = await firebaseService.getUser(firebaseUser.uid);
        if (userData) {
          setUser(userData);
          setIsLoggedIn(true);
          await loadUserData(firebaseUser.uid);
        } else {
          // Create new user profile for Google/Facebook users
          const newUser: Omit<User, 'id'> = {
            firstName: firebaseUser.displayName?.split(' ')[0] || 'Google',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'User',
            email: firebaseUser.email || '',
            gender: 'male',
            birthDate: '1990-01-01',
            height: 170,
            initialWeight: 70,
            measurements: {
              chest: 90,
              waist: 80,
              hips: 90,
              arm: 30,
              thigh: 50
            },
            registrationDate: new Date().toISOString().split('T')[0],
            photoURL: firebaseUser.photoURL || null
          };
          
          const result = await firebaseService.createUser(firebaseUser.uid, newUser);
          if (result.success) {
            setUser({ id: firebaseUser.uid, ...newUser });
            setIsLoggedIn(true);
            console.log('Google user profile created successfully');
          }
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
        setDailyRecords([]);
        setDailyTracking([]);
        setQuestions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    const [records, tracking, userQuestions] = await Promise.all([
      firebaseService.getUserDailyRecords(userId),
      firebaseService.getUserDailyTracking(userId),
      firebaseService.getUserQuestions(userId)
    ]);
    setDailyRecords(records);
    setDailyTracking(tracking);
    setQuestions(userQuestions);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      await signInWithRedirect(auth, googleProvider);
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const loginWithFacebook = async (): Promise<boolean> => {
    try {
      await signInWithRedirect(auth, facebookProvider);
      return true;
    } catch (error) {
      console.error('Facebook login error:', error);
      return false;
    }
  };

  const register = async (userData: Omit<User, 'id' | 'registrationDate'>): Promise<boolean> => {
    try {
      // This function is no longer used - registration is handled in RegisterPage
      console.warn('This register function is deprecated. Use RegisterPage directly.');
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const registerUser = async (email: string, password: string, userData: Omit<User, 'id' | 'registrationDate'>): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser: Omit<User, 'id'> = {
        ...userData,
        registrationDate: new Date().toISOString().split('T')[0]
      };
      await firebaseService.createUser(userCredential.user.uid, newUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addDailyRecord = async (record: Omit<DailyRecord, 'id' | 'userId'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseService.addDailyRecord({
      ...record,
      userId: user.id
    });
    
    if (result.success) {
      await loadUserData(user.id);
      return true;
    }
    return false;
  };

  const addQuestion = async (question: Omit<Question, 'id' | 'userId' | 'timestamp' | 'status'>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseService.addQuestion({
      ...question,
      userId: user.id,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    if (result.success) {
      await loadUserData(user.id);
      return true;
    }
    return false;
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    const result = await firebaseService.updateUser(user.id, userData);
    if (result.success) {
      setUser({ ...user, ...userData });
      return true;
    }
    return false;
  };

  const refreshData = async (): Promise<void> => {
    if (user) {
      await loadUserData(user.id);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      dailyRecords,
      dailyTracking,
      questions,
      isLoggedIn,
      loading,
      login,
      loginWithGoogle,
      loginWithFacebook,
      logout,
      addDailyRecord,
      addDailyTracking,
      updateDailyTracking,
      deleteDailyTracking,
      addQuestion,
      updateProfile,
      refreshData
    }}>
      {children}
    </UserContext.Provider>
  );
};