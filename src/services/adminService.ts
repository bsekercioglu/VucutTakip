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

// Auto-create admin collection and first admin user
export const initializeAdminSystem = async (userId: string) => {
  try {
    console.log('🚀 Initializing admin system for userId:', userId);
    
    // Check if admins collection exists by trying to get any document
    const adminsRef = collection(db, 'admins');
    const snapshot = await getDocs(adminsRef);
    
    if (snapshot.empty) {
      console.log('📝 Admins collection is empty, creating first admin...');
      
      // Create first admin user
      const firstAdminData = {
        userId,
        role: 'admin' as const,
        permissions: [
          'manage_users',
          'view_all_data',
          'manage_orders',
          'send_recommendations',
          'answer_questions'
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'admins', userId), firstAdminData);
      console.log('✅ First admin created successfully!');
      
      return { success: true, created: true, adminData: firstAdminData };
    } else {
      console.log('📋 Admins collection already exists');
      return { success: true, created: false };
    }
  } catch (error) {
    console.error('❌ Error initializing admin system:', error);
    return { success: false, error };
  }
};

// Enhanced getAdminUser with auto-initialization
export const getAdminUserWithInit = async (userId: string): Promise<AdminUser | null> => {
  try {
    console.log('🔍 Checking admin status for userId:', userId);
    
    // First try to get existing admin
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    console.log('📄 Admin document exists:', adminDoc.exists());
    
    if (adminDoc.exists()) {
      const adminData = { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
      console.log('👑 Admin data found:', adminData);
      return adminData;
    } else {
      console.log('❌ No admin document found, checking if should auto-create...');
      
      // Check if this is the first user in the system (auto-create first admin)
      const initResult = await initializeAdminSystem(userId);
      
      if (initResult.success && initResult.created) {
        console.log('🎉 Auto-created first admin, returning admin data');
        return {
          id: userId,
          userId,
          role: 'admin',
          permissions: [
            'manage_users',
            'view_all_data',
            'manage_orders',
            'send_recommendations',
            'answer_questions'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as AdminUser;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting admin user:', error);
    console.error('Error details:', error.code, error.message);
    return null;
  }
};

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
    console.log('🔍 Checking admin status for userId:', userId);
    const adminDoc = await getDoc(doc(db, 'admins', userId));
    console.log('📄 Admin document exists:', adminDoc.exists());
    if (adminDoc.exists()) {
      const adminData = { id: adminDoc.id, ...adminDoc.data() } as AdminUser;
      console.log('👑 Admin data found:', adminData);
      return adminData;
    } else {
      console.log('❌ No admin document found for userId:', userId);
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting admin user:', error);
    console.error('Error details:', error.code, error.message);
    return null;
  }
};

// Get all admin users (only for super admins)
export const getAllAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'admins'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
  } catch (error) {
    console.error('Error getting all admin users:', error);
    return [];
  }
};

// Get all users (only for admins)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Update admin user
export const updateAdminUser = async (adminId: string, adminData: Partial<AdminUser>) => {
  try {
    const updateData = {
      ...adminData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'admins', adminId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating admin user:', error);
    return { success: false, error };
  }
};

// Delete admin user
export const deleteAdminUser = async (adminId: string) => {
  try {
    await deleteDoc(doc(db, 'admins', adminId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return { success: false, error };
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
    // First check if user is admin/sponsor
    const adminUser = await getAdminUser(userId);
    if (!adminUser) {
      console.log('User is not admin/sponsor, returning empty messages');
      return [];
    }
    
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
    // First check if user is admin/sponsor
    const adminUser = await getAdminUser(userId);
    if (!adminUser) {
      console.log('User is not admin/sponsor, returning empty recommendations');
      return [];
    }
    
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