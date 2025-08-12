import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase';
import * as firebaseService from '../services/firebaseService';
import { User, DailyRecord, Question, DailyTracking } from '../services/firebaseService';
import { getAdminUser, getUserSponsorMessages, getUserRecommendations } from '../services/adminService';
import { AdminUser, SponsorMessage, ProductRecommendation } from '../types/admin';

interface UserContextType {
  user: User | null;
  dailyRecords: DailyRecord[];
  dailyTracking: DailyTracking[];
  questions: Question[];
  adminUser: AdminUser | null;
  sponsorMessages: SponsorMessage[];
  recommendations: ProductRecommendation[];
  isLoggedIn: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  registerUser: (
    email: string,
    password: string,
    userData: Omit<User, 'id' | 'registrationDate'>
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  addDailyRecord: (record: Omit<DailyRecord, 'id' | 'userId'>) => Promise<boolean>;
  updateDailyRecord: (recordId: string, record: Partial<DailyRecord>) => Promise<boolean>;
  deleteDailyRecord: (recordId: string) => Promise<boolean>;
  addDailyTracking: (tracking: Omit<DailyTracking, 'id' | 'userId'>) => Promise<boolean>;
  updateDailyTracking: (trackingId: string, tracking: Partial<DailyTracking>) => Promise<boolean>;
  deleteDailyTracking: (trackingId: string) => Promise<boolean>;
  addQuestion: (question: Omit<Question, 'id' | 'userId' | 'timestamp' | 'status'>) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  uploadProfilePhoto: (file: File) => Promise<boolean>;
  deleteProfilePhoto: () => Promise<boolean>;
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
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [sponsorMessages, setSponsorMessages] = useState<SponsorMessage[]>([]);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Kullanıcı verilerini yükleme
  const loadUserData = async (userId: string) => {
    console.log('UserContext: Loading user data for userId:', userId);
    try {
      const [records, tracking, userQuestions, admin, messages, recs] = await Promise.all([
        firebaseService.getUserDailyRecords(userId),
        firebaseService.getUserDailyTracking(userId),
        firebaseService.getUserQuestions(userId),
        getAdminUser(userId),
        getUserSponsorMessages(userId),
        getUserRecommendations(userId)
      ]);
      
      console.log('UserContext: Loaded daily records:', records.length, records);
      console.log('Loaded daily tracking:', tracking);
      console.log('Loaded questions:', userQuestions);
      console.log('Loaded admin user:', admin);
      
      setDailyRecords(records);
      setDailyTracking(tracking);
      setQuestions(userQuestions);
      setAdminUser(admin);
      setSponsorMessages(messages);
      setRecommendations(recs);
    } catch (error) {
      console.error('UserContext: Error loading user data:', error);
      // Set empty arrays on error to prevent undefined state
      setDailyRecords([]);
      setDailyTracking([]);
      setQuestions([]);
      setAdminUser(null);
      setSponsorMessages([]);
      setRecommendations([]);
    }
  };

  // Debug effect to monitor dailyRecords state changes
  React.useEffect(() => {
    console.log('UserContext: dailyRecords state changed:', dailyRecords.length, dailyRecords);
  }, [dailyRecords]);

  // Force refresh data function
  const refreshData = async () => {
    if (user) {
      console.log('UserContext: Force refreshing data for user:', user.id);
      console.log('UserContext: Current dailyRecords before refresh:', dailyRecords.length);
      await loadUserData(user.id);
      console.log('UserContext: Data refreshed, new dailyRecords count:', dailyRecords.length);
    } else {
      console.log('UserContext: No user found, cannot refresh data');
    }
  };

  // Kullanıcı verilerini yükleme (old version - keeping for reference)
  const loadUserDataOld = async (userId: string) => {
    const [records, tracking, userQuestions] = await Promise.all([
      firebaseService.getUserDailyRecords(userId),
      firebaseService.getUserDailyTracking(userId),
      firebaseService.getUserQuestions(userId)
    ]);
    setDailyRecords(records);
    setDailyTracking(tracking);
    setQuestions(userQuestions);
  };

  // Oturum yönetimi
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('Google/Facebook redirect result:', result.user);
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', firebaseUser?.uid);
      if (firebaseUser) {
        const userData = await firebaseService.getUser(firebaseUser.uid);
        console.log('User data from Firestore:', userData);
        if (userData) {
          setUser(userData);
          setIsLoggedIn(true);
          setLoading(true);
          await loadUserData(firebaseUser.uid);
          setLoading(false);
        } else {
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
            setLoading(true);
            await loadUserData(firebaseUser.uid);
            setLoading(false);
            console.log('New Google/Facebook user profile created');
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

  // Auth işlemleri
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Check if user exists in our database
        const userData = await firebaseService.getUser(result.user.uid);
        if (userData) {
          // User exists, login successful
          return true;
        } else {
          // User doesn't exist in our database, create profile
          const names = result.user.displayName?.split(' ') || ['', ''];
          const newUserData = {
            firstName: names[0] || 'Google',
            lastName: names.slice(1).join(' ') || 'User',
            email: result.user.email || '',
            birthDate: '1990-01-01',
            gender: 'male' as const,
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
            photoURL: result.user.photoURL || undefined
          };
          
          const createResult = await firebaseService.createUser(result.user.uid, newUserData);
          if (createResult.success) {
            return true;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const loginWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      if (result.user) {
        // Check if user exists in our database
        const userData = await firebaseService.getUser(result.user.uid);
        if (userData) {
          // User exists, login successful
          return true;
        } else {
          // User doesn't exist in our database, create profile
          const names = result.user.displayName?.split(' ') || ['', ''];
          const newUserData = {
            firstName: names[0] || 'Facebook',
            lastName: names.slice(1).join(' ') || 'User',
            email: result.user.email || '',
            birthDate: '1990-01-01',
            gender: 'male' as const,
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
            photoURL: result.user.photoURL || undefined
          };
          
          const createResult = await firebaseService.createUser(result.user.uid, newUserData);
          if (createResult.success) {
            return true;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Facebook login error:', error);
      return false;
    }
  };

  const registerUser = async (
    email: string,
    password: string,
    userData: Omit<User, 'id' | 'registrationDate'>
  ) => {
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

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // CRUD işlemleri
  const addDailyRecord = async (record: Omit<DailyRecord, 'id' | 'userId'>) => {
    if (!user) return false;
    console.log('Adding daily record:', record, 'for user:', user.id);
    const result = await firebaseService.addDailyRecord({ ...record, userId: user.id });
    console.log('Add daily record result:', result);
    if (result.success) {
      console.log('Daily record added successfully, refreshing data...');
      await loadUserData(user.id);
      return true;
    }
    return false;
  };

  const updateDailyRecord = async (recordId: string, record: Partial<DailyRecord>) => {
    if (!user) return false;
    console.log('Updating daily record:', recordId, record);
    const result = await firebaseService.updateDailyRecord(recordId, record);
    console.log('Update daily record result:', result);
    if (result.success) {
      console.log('Daily record updated successfully, refreshing data...');
      await loadUserData(user.id);
      return true;
    }
    return false;
  };

  const deleteDailyRecord = async (recordId: string) => {
    if (!user) return false;
    console.log('Deleting daily record:', recordId);
    const result = await firebaseService.deleteDailyRecord(recordId);
    console.log('Delete daily record result:', result);
    if (result.success) {
      console.log('Daily record deleted successfully, refreshing data...');
      await loadUserData(user.id);
      return true;
    }
    return false;
  };
  const addDailyTracking = async (tracking: Omit<DailyTracking, 'id' | 'userId'>) => {
    if (!user) return false;
    const result = await firebaseService.addDailyTracking({ ...tracking, userId: user.id });
    if (result.success) {
      await loadUserData(user.id);
      return true;
    }
    return false;
  };

  const updateDailyTracking = async (trackingId: string, tracking: Partial<DailyTracking>) => {
    if (!user) return false;
    try {
      const result = await firebaseService.updateDailyTracking(trackingId, tracking);
      if (result.success) {
        await loadUserData(user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('updateDailyTracking error:', error);
      return false;
    }
  };

  const deleteDailyTracking = async (trackingId: string) => {
    if (!user) return false;
    const result = await firebaseService.deleteDailyTracking(trackingId);
    if (result.success) {
      await loadUserData(user.id);
      return true;
    }
    return false;
  };

  const addQuestion = async (question: Omit<Question, 'id' | 'userId' | 'timestamp' | 'status'>) => {
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

  const updateProfile = async (userData: Partial<User>) => {
    if (!user) return false;
    const result = await firebaseService.updateUser(user.id, userData);
    if (result.success) {
      setUser({ ...user, ...userData });
      return true;
    }
    return false;
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user) return false;
    const result = await firebaseService.uploadProfilePhoto(user.id, file);
    if (result.success) {
      setUser({ ...user, photoURL: result.photoURL });
      return true;
    }
    return false;
  };

  const deleteProfilePhoto = async () => {
    if (!user) return false;
    const result = await firebaseService.deleteProfilePhoto(user.id);
    if (result.success) {
      setUser({ ...user, photoURL: undefined });
      return true;
    }
    return false;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        dailyRecords,
        dailyTracking,
        questions,
        adminUser,
        sponsorMessages,
        recommendations,
        isLoggedIn,
        loading,
        login,
        loginWithGoogle,
        loginWithFacebook,
        registerUser,
        logout,
        addDailyRecord,
        updateDailyRecord,
        deleteDailyRecord,
        addDailyTracking,
        updateDailyTracking,
        deleteDailyTracking,
        addQuestion,
        updateProfile,
        uploadProfilePhoto,
        deleteProfilePhoto,
        refreshData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
