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
import { AdminUser, SponsorTeam, Order, ProductRecommendation, SponsorMessage } from '../types/admin';

// Admin User Management
export const createAdminUser = async (userId: string, adminData: Omit<AdminUser, 'id' | 'userId'>) => {
  try {
    const adminWithTimestamp = {
      ...adminData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'admins', userId), adminWithTimestamp);
    return { success: true };
  } catch (error) {
    console.error('Error creating admin user:', error);
    return { success: false, error };
  }
};

export const getAdminUser = async (userId: string): Promise<AdminUser | null> => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    if (adminDoc.exists()) {
      return { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting admin user:', error);
    return null;
  }
};

export const generateSponsorCode = (): string => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};

// Sponsor Team Management
export const addTeamMember = async (sponsorId: string, memberId: string) => {
  try {
    const teamData = {
      sponsorId,
      memberId,
      joinedAt: new Date().toISOString(),
      status: 'active'
    };
    const docRef = await addDoc(collection(db, 'sponsorTeams'), teamData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding team member:', error);
    return { success: false, error };
  }
};

export const getSponsorTeamMembers = async (sponsorId: string) => {
  try {
    const q = query(
      collection(db, 'sponsorTeams'),
      where('sponsorId', '==', sponsorId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SponsorTeam));
  } catch (error) {
    console.error('Error getting team members:', error);
    return [];
  }
};

export const getUserSponsor = async (userId: string): Promise<string | null> => {
  try {
    const q = query(
      collection(db, 'sponsorTeams'),
      where('memberId', '==', userId),
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const teamData = querySnapshot.docs[0].data() as SponsorTeam;
      return teamData.sponsorId;
    }
    return null;
  } catch (error) {
    console.error('Error getting user sponsor:', error);
    return null;
  }
};

// Order Management
export const createOrder = async (orderData: Omit<Order, 'id'>) => {
  try {
    const orderWithTimestamp = {
      ...orderData,
      orderDate: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'orders'), orderWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
  }
};

export const getSponsorOrders = async (sponsorId: string) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('sponsorId', '==', sponsorId),
      orderBy('orderDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  } catch (error) {
    console.error('Error getting sponsor orders:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    await updateDoc(doc(db, 'orders', orderId), { status });
    return { success: true };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error };
  }
};

// Product Recommendations
export const sendProductRecommendation = async (recommendationData: Omit<ProductRecommendation, 'id'>) => {
  try {
    const recommendationWithTimestamp = {
      ...recommendationData,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    const docRef = await addDoc(collection(db, 'productRecommendations'), recommendationWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error sending product recommendation:', error);
    return { success: false, error };
  }
};

export const getUserRecommendations = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'productRecommendations'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductRecommendation));
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    return [];
  }
};

// Sponsor Messages
export const sendSponsorMessage = async (messageData: Omit<SponsorMessage, 'id'>) => {
  try {
    const messageWithTimestamp = {
      ...messageData,
      timestamp: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'sponsorMessages'), messageWithTimestamp);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error sending sponsor message:', error);
    return { success: false, error };
  }
};

export const getUserSponsorMessages = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'sponsorMessages'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SponsorMessage));
  } catch (error) {
    console.error('Error getting sponsor messages:', error);
    return [];
  }
};

export const respondToSponsorMessage = async (messageId: string, response: string) => {
  try {
    await updateDoc(doc(db, 'sponsorMessages', messageId), {
      response,
      responseTimestamp: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error responding to sponsor message:', error);
    return { success: false, error };
  }
};

// Question forwarding to sponsor
export const forwardQuestionToSponsor = async (questionId: string, userId: string) => {
  try {
    const sponsorId = await getUserSponsor(userId);
    if (!sponsorId) {
      return { success: false, error: 'No sponsor found for user' };
    }

    // Get the original question
    const questionDoc = await getDoc(doc(db, 'questions', questionId));
    if (!questionDoc.exists()) {
      return { success: false, error: 'Question not found' };
    }

    const questionData = questionDoc.data();
    
    // Create a sponsor message
    const messageData = {
      sponsorId,
      userId,
      message: `Kullanıcı sorusu: ${questionData.title}\n\n${questionData.message}`,
      type: 'question' as const
    };

    const result = await sendSponsorMessage(messageData);
    return result;
  } catch (error) {
    console.error('Error forwarding question to sponsor:', error);
    return { success: false, error };
  }
};