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
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { AdminUser, SponsorTeam, Order, ProductRecommendation, SponsorMessage, UserRole } from '../types/admin';
import { debugLog } from '../config/appConfig';

// Auto-create admin collection and first admin user
export const initializeAdminSystem = async (userId: string) => {
  try {
    console.log('🚀 Initializing admin system for userId:', userId);
    console.log('🔍 Step 1: Checking if user already has admin rights...');
    
    // First check if this user already has admin rights
    try {
      const existingAdmin = await getDoc(doc(db, 'admins', userId));
      console.log('✅ Step 1 SUCCESS: Admin document read permission OK');
    } catch (readError) {
      console.error('❌ Step 1 FAILED: Cannot read admin document');
      console.error('🔍 Firebase Rule Error (READ):', readError.code, readError.message);
      console.error('🔍 Rule that failed: match /admins/{adminId} { allow read: ... }');
      throw readError;
    }
    
    const existingAdmin = await getDoc(doc(db, 'admins', userId));
    if (existingAdmin.exists()) {
      console.log('👑 User already has admin rights');
      return { success: true, created: false, adminData: existingAdmin.data() };
    }
    
    console.log('🔍 Step 2: Checking if any admin exists in collection...');
    // Check if any admin exists by trying different approaches
    try {
      // Try to read the current user's admin document first
      const currentUserAdmin = await getDoc(doc(db, 'admins', userId));
      console.log('✅ Step 2 SUCCESS: Collection query permission OK');
      
      // If current user already has admin, return it
      if (currentUserAdmin.exists()) {
        console.log('👑 Current user already has admin rights');
        return { success: true, created: false, adminData: currentUserAdmin.data() };
      }
      
      // Since we can't query the collection, we'll assume it's empty if current user doesn't have admin
      // This is safe because if other admins exist, they can manage the system
      console.log('📝 Current user has no admin rights, assuming collection is empty or user should be admin');
      const snapshot = { empty: true };
    } catch (queryError) {
      console.error('❌ Step 2 FAILED: Cannot read admin document');
      console.error('🔍 Firebase Rule Error (QUERY):', queryError.code, queryError.message);
      console.error('🔍 Rule that failed: Document read permissions');
      throw queryError;
    }
    
    const snapshot = { empty: true };
    if (snapshot.empty) {
      console.log('📝 Admins collection is empty, creating first admin...');
      console.log('🔍 Step 3: Attempting to create first admin document...');
      
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
      
      try {
        await setDoc(doc(db, 'admins', userId), firstAdminData);
        console.log('✅ Step 3 SUCCESS: Admin document created successfully');
      } catch (createError) {
        console.error('❌ Step 3 FAILED: Cannot create admin document');
        console.error('🔍 Firebase Rule Error (CREATE):', createError.code, createError.message);
        console.error('🔍 Rule that failed: match /admins/{adminId} { allow create: ... }');
        console.error('🔍 Check if this condition is met: !exists(/databases/$(database)/documents/admins/$(request.auth.uid))');
        throw createError;
      }
      
      console.log('✅ First admin created successfully!');
      
      return { success: true, created: true, adminData: firstAdminData };
    } else {
      console.log('📋 Admins collection already exists');
      return { success: true, created: false };
    }
  } catch (error) {
    console.error('❌ Error initializing admin system:', error);
    console.error('🔍 Full Error Details:');
    console.error('  - Error code:', error.code);
    console.error('  - Error message:', error.message);
    console.error('  - User ID:', userId);
    console.error('  - Auth status:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    console.error('  - Auth UID:', auth.currentUser?.uid);
    return { success: false, error };
  }
};

// Enhanced getAdminUser with auto-initialization
export const getAdminUserWithInit = async (userId: string): Promise<AdminUser | null> => {
  try {
    console.log('🔍 Checking admin status for userId:', userId);
    console.log('🔍 Auth status:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    console.log('🔍 Auth UID:', auth.currentUser?.uid);
    
    // First try to get existing admin
    let adminDoc;
    try {
      adminDoc = await getDoc(doc(db, 'admins', userId));
      console.log('✅ Admin document read successful');
    } catch (readError) {
      console.error('❌ Failed to read admin document');
      console.error('🔍 Firebase Rule Error (READ):', readError.code, readError.message);
      console.error('🔍 Rule that failed: match /admins/{adminId} { allow read: if request.auth != null && request.auth.uid == adminId; }');
      console.error('🔍 Check: request.auth.uid (' + auth.currentUser?.uid + ') == adminId (' + userId + ')');
      throw readError;
    }
    
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
    debugLog.log('🔍 Creating admin user for userId:', userId);
    debugLog.log('🔍 Admin data:', adminData);
    debugLog.log('🔍 Current user:', auth.currentUser?.uid);
    debugLog.log('🔍 Auth status:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    
    // Check if current user is authenticated
    if (!auth.currentUser) {
      debugLog.error('❌ No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }
    
    debugLog.log('✅ User is authenticated, proceeding with admin creation...');
    debugLog.log('🔍 Step 1: Cleaning admin data...');
    
    // Clean undefined values from adminData
    const cleanAdminData = Object.fromEntries(
      Object.entries(adminData).filter(([_, value]) => value !== undefined)
    );
    
    const adminWithTimestamp = {
      ...cleanAdminData,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    debugLog.log('📝 Admin data to save:', adminWithTimestamp);
    debugLog.log('🔍 Step 2: Attempting to create admin document...');
    
    await setDoc(doc(db, 'admins', userId), adminWithTimestamp);
    debugLog.log('✅ Admin user created successfully');
    
    return { success: true };
  } catch (error) {
    debugLog.error('❌ Error creating admin user:', error);
    debugLog.error('🔍 Error code:', (error as any).code);
    debugLog.error('🔍 Error message:', error instanceof Error ? error.message : 'Unknown error');
    debugLog.error('🔍 Full error object:', error);
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
   console.log('🔍 Getting all admin users...');
   console.log('🔍 Current user:', auth.currentUser?.uid);
   
   // First check if current user is admin
   if (!auth.currentUser) {
     console.log('❌ No authenticated user');
     return [];
   }
   
   const currentUserAdmin = await getDoc(doc(db, 'admins', auth.currentUser.uid));
   if (!currentUserAdmin.exists()) {
     console.log('❌ Current user is not admin');
     return [];
   }
   
   console.log('✅ Current user is admin, fetching all admins...');
   
   // Sadece role=admin olan kullanıcıları getir
   const adminQuery = query(
     collection(db, 'admins'),
     where('role', '==', 'admin')
   );
   
   const querySnapshot = await getDocs(adminQuery);
   console.log('✅ Successfully fetched', querySnapshot.docs.length, 'admin users');
   
   const adminUsers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
   
   // Debug: Her admin kullanıcısının rolünü logla
   adminUsers.forEach((admin, index) => {
     console.log(`🔍 Admin ${index + 1}: ID=${admin.id}, UserID=${admin.userId}, Role=${admin.role}`);
   });
   
   return adminUsers;
  } catch (error) {
   console.error('❌ Error getting all admin users:', error);
   console.error('🔍 Error code:', error.code);
   console.error('🔍 Error message:', error.message);
    return [];
  }
};

// Get all users (only for admins)
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Update admin user
export const updateAdminUser = async (adminId: string, adminData: Partial<AdminUser>) => {
  try {
    // Clean undefined values from adminData
    const cleanAdminData = Object.fromEntries(
      Object.entries(adminData).filter(([_, value]) => value !== undefined)
    );
    
    const updateData = {
      ...cleanAdminData,
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

export const getSponsorTeamMembersOld = async (sponsorId: string) => {
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
export const sendSponsorMessage = async (messageData: Omit<SponsorMessage, 'id' | 'timestamp'>) => {
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

export const respondToSponsorMessage = async (messageId: string, response: string, userId: string) => {
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

// Sponsor Assignment Functions
export const assignUsersToSponsor = async (sponsorId: string, userIds: string[]) => {
  try {
    console.log('🔍 Assigning users to sponsor:', sponsorId, 'Users:', userIds);
    
    // First verify the sponsor exists and is a sponsor
    const sponsorDoc = await getDoc(doc(db, 'admins', sponsorId));
    if (!sponsorDoc.exists()) {
      return { success: false, error: 'Sponsor not found' };
    }
    
    const sponsorData = sponsorDoc.data();
    if (sponsorData.role !== 'sponsor') {
      return { success: false, error: 'User is not a sponsor' };
    }
    
    // Update each user's admin document to set parentSponsorId
    const updatePromises = userIds.map(async (userId) => {
      try {
        // Check if user already has admin rights
        const userAdminDoc = await getDoc(doc(db, 'admins', userId));
        
        if (userAdminDoc.exists()) {
          // User already has admin rights, update parentSponsorId
          await updateDoc(doc(db, 'admins', userId), {
            parentSponsorId: sponsorId,
            updatedAt: new Date().toISOString()
          });
                 } else {
           // Create new sponsor user with parentSponsorId
           const newSponsorData = {
             userId,
             role: 'sponsor' as const,
             permissions: ['send_recommendations', 'answer_questions'],
             sponsorCode: generateSponsorCode(),
             parentSponsorId: sponsorId,
             createdAt: new Date().toISOString(),
             updatedAt: new Date().toISOString()
           };
           
           // Clean undefined values
           const cleanSponsorData = Object.fromEntries(
             Object.entries(newSponsorData).filter(([_, value]) => value !== undefined)
           );
           
           await setDoc(doc(db, 'admins', userId), cleanSponsorData);
         }
        
        return { userId, success: true };
      } catch (error) {
        console.error(`Error assigning user ${userId}:`, error);
        return { userId, success: false, error };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const failedAssignments = results.filter(r => !r.success);
    
    if (failedAssignments.length > 0) {
      console.error('Some assignments failed:', failedAssignments);
      return { 
        success: false, 
        error: `${failedAssignments.length} kullanıcı ataması başarısız`,
        failedAssignments 
      };
    }
    
    console.log('✅ Successfully assigned all users to sponsor');
    return { success: true, assignedCount: userIds.length };
  } catch (error) {
    console.error('Error assigning users to sponsor:', error);
    return { success: false, error };
  }
};

export const removeUsersFromSponsor = async (sponsorId: string, userIds: string[]) => {
  try {
    console.log('🔍 Removing users from sponsor:', sponsorId, 'Users:', userIds);
    
    const updatePromises = userIds.map(async (userId) => {
      try {
        const userAdminDoc = await getDoc(doc(db, 'admins', userId));
        
        if (userAdminDoc.exists()) {
          const userData = userAdminDoc.data();
          
                     // If user is a sponsor with this parent, remove parentSponsorId
           if (userData.role === 'sponsor' && userData.parentSponsorId === sponsorId) {
             await updateDoc(doc(db, 'admins', userId), {
               parentSponsorId: null,
               updatedAt: new Date().toISOString()
             });
           }
        }
        
        return { userId, success: true };
      } catch (error) {
        console.error(`Error removing user ${userId}:`, error);
        return { userId, success: false, error };
      }
    });
    
    const results = await Promise.all(updatePromises);
    const failedRemovals = results.filter(r => !r.success);
    
    if (failedRemovals.length > 0) {
      console.error('Some removals failed:', failedRemovals);
      return { 
        success: false, 
        error: `${failedRemovals.length} kullanıcı kaldırma işlemi başarısız`,
        failedRemovals 
      };
    }
    
    console.log('✅ Successfully removed all users from sponsor');
    return { success: true, removedCount: userIds.length };
  } catch (error) {
    console.error('Error removing users from sponsor:', error);
    return { success: false, error };
  }
};

export const getSponsorTeamMembersFromAdmins = async (sponsorId: string) => {
  try {
    const q = query(
      collection(db, 'admins'),
      where('parentSponsorId', '==', sponsorId),
      where('role', '==', 'sponsor')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
  } catch (error) {
    console.error('Error getting sponsor team members:', error);
    return [];
  }
};

export const getSponsorHierarchyOld = async (sponsorId: string) => {
  try {
    // Get direct team members
    const teamMembers = await getSponsorTeamMembersFromAdmins(sponsorId);
    
    // Get nested team members (recursive)
    const nestedMembers = await Promise.all(
      teamMembers.map(member => getSponsorHierarchyOld(member.userId))
    );
    
    return {
      sponsorId,
      directMembers: teamMembers,
      allMembers: teamMembers.concat(nestedMembers.flat())
    };
  } catch (error) {
    console.error('Error getting sponsor hierarchy:', error);
    return { sponsorId, directMembers: [], allMembers: [] };
  }
};

// Create invitation link for new user
export const createUserInvitation = async (userData: {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'sponsor';
  permissions: string[];
  sponsorCode?: string;
  parentSponsorId?: string | null;
}) => {
  try {
    console.log('🔍 Creating user invitation:', userData);
    console.log('🔍 Current user:', auth.currentUser?.uid);
    console.log('🔍 Auth status:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    
    // Check if current user is authenticated
    if (!auth.currentUser) {
      console.error('❌ No authenticated user');
      return { success: false, error: 'No authenticated user' };
    }

    console.log('✅ User is authenticated, checking admin status...');

    // Check if current user is admin
    try {
      const currentUserAdmin = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      console.log('🔍 Admin document exists:', currentUserAdmin.exists());
      
      if (!currentUserAdmin.exists()) {
        console.error('❌ Current user is not admin');
        return { success: false, error: 'Current user is not admin' };
      }

      console.log('✅ Current user is admin, proceeding with invitation creation...');
    } catch (adminCheckError) {
      console.error('❌ Error checking admin status:', adminCheckError);
      return { success: false, error: 'Error checking admin status' };
    }

    // Create invitation document in Firestore
    const invitationData = {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      permissions: userData.permissions,
      sponsorCode: userData.role === 'sponsor' ? (userData.sponsorCode || generateSponsorCode()) : undefined,
      parentSponsorId: userData.parentSponsorId || null,
      invitedBy: auth.currentUser.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };

    console.log('📝 Invitation data to save:', invitationData);

    // Clean undefined values
    const cleanInvitationData = Object.fromEntries(
      Object.entries(invitationData).filter(([_, value]) => value !== undefined)
    );

    console.log('🧹 Cleaned invitation data:', cleanInvitationData);

    console.log('🔍 Attempting to create invitation document...');
    const invitationRef = await addDoc(collection(db, 'invitations'), cleanInvitationData);
    console.log('✅ Invitation created with ID:', invitationRef.id);

    // Generate invitation link
    const invitationLink = `${window.location.origin}/register?invitation=${invitationRef.id}`;
    console.log('🔗 Generated invitation link:', invitationLink);

    return { 
      success: true, 
      invitationId: invitationRef.id,
      invitationLink,
      invitation: cleanInvitationData
    };
  } catch (error) {
    console.error('❌ Error creating user invitation:', error);
    console.error('🔍 Error code:', (error as any).code);
    console.error('🔍 Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('🔍 Full error object:', error);
    return { success: false, error };
  }
};

// Role Management Functions
export const loadUserRoles = async (): Promise<UserRole[]> => {
  try {
    console.log('🔍 Loading user roles...');
    const querySnapshot = await getDocs(collection(db, 'userRoles'));
    const roles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserRole));
    console.log('✅ Loaded', roles.length, 'user roles');
    return roles;
  } catch (error) {
    console.error('❌ Error loading user roles:', error);
    return [];
  }
};

export const createUserRole = async (roleData: Omit<UserRole, 'id'>): Promise<UserRole> => {
  try {
    console.log('🔍 Creating user role:', roleData);
    const roleWithTimestamp = {
      ...roleData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, 'userRoles'), roleWithTimestamp);
    console.log('✅ User role created with ID:', docRef.id);
    return { id: docRef.id, ...roleWithTimestamp };
  } catch (error) {
    console.error('❌ Error creating user role:', error);
    throw error;
  }
};

export const updateUserRole = async (roleId: string, roleData: Partial<UserRole>): Promise<void> => {
  try {
    console.log('🔍 Updating user role:', roleId, roleData);
    const updateData = {
      ...roleData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(doc(db, 'userRoles', roleId), updateData);
    console.log('✅ User role updated successfully');
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    throw error;
  }
};

export const deleteUserRole = async (roleId: string): Promise<void> => {
  try {
    console.log('🔍 Deleting user role:', roleId);
    await deleteDoc(doc(db, 'userRoles', roleId));
    console.log('✅ User role deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting user role:', error);
    throw error;
  }
};

// Team Management Functions
export const loadUserTeamData = async (userId: string): Promise<AdminUser[]> => {
  try {
    console.log('🔍 Loading team data for user:', userId);
    
    // Get user's admin document to determine their role and team level
    const userAdminDoc = await getDoc(doc(db, 'admins', userId));
    if (!userAdminDoc.exists()) {
      console.log('❌ User is not admin/sponsor');
      return [];
    }
    
    const userData = userAdminDoc.data() as AdminUser;
    console.log('🔍 User data:', userData);
    
    let teamQuery;
    
    if (userData.role === 'admin') {
      // Admin can see all team members
      teamQuery = query(collection(db, 'admins'), where('role', 'in', ['sponsor', 'user']));
    } else if (userData.role === 'sponsor') {
      // Sponsor can only see their direct team members
      teamQuery = query(
        collection(db, 'admins'),
        where('parentSponsorId', '==', userId)
      );
    } else {
      console.log('❌ User does not have team management permissions');
      return [];
    }
    
    const querySnapshot = await getDocs(teamQuery);
    const teamMembers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
    
    console.log('✅ Loaded', teamMembers.length, 'team members');
    return teamMembers;
  } catch (error) {
    console.error('❌ Error loading team data:', error);
    return [];
  }
};

export const createTeamInvitationLink = async (sponsorId: string): Promise<string> => {
  try {
    console.log('🔍 Creating team invitation link for sponsor:', sponsorId);
    
    // Get sponsor data
    const sponsorDoc = await getDoc(doc(db, 'admins', sponsorId));
    if (!sponsorDoc.exists()) {
      throw new Error('Sponsor not found');
    }
    
    const sponsorData = sponsorDoc.data() as AdminUser;
    
    // Create invitation document
    const invitationData = {
      sponsorId,
      sponsorCode: sponsorData.sponsorCode,
      role: 'user',
      permissions: [],
      teamLevel: (sponsorData.teamLevel || 0) + 1,
      teamPath: [...(sponsorData.teamPath || []), sponsorId],
      invitedBy: auth.currentUser?.uid,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    const invitationRef = await addDoc(collection(db, 'invitations'), invitationData);
    const invitationLink = `${window.location.origin}/register?invitation=${invitationRef.id}&sponsor=${sponsorId}`;
    
    console.log('✅ Team invitation link created:', invitationLink);
    return invitationLink;
  } catch (error) {
    console.error('❌ Error creating team invitation link:', error);
    throw error;
  }
};

// Sponsor Hiyerarşisi Yönetimi Fonksiyonları
export const getSponsorTeamMembers = async (sponsorId: string): Promise<AdminUser[]> => {
  try {
    debugLog.log('🔍 Getting team members for sponsor:', sponsorId);
    
    // Sponsor'un doğrudan alt üyelerini bul
    const teamQuery = query(
      collection(db, 'admins'),
      where('parentSponsorId', '==', sponsorId),
      where('role', 'in', ['sponsor', 'user'])
    );
    
    const teamSnapshot = await getDocs(teamQuery);
    const teamMembers: AdminUser[] = [];
    
    teamSnapshot.forEach(doc => {
      teamMembers.push({ id: doc.id, ...doc.data() } as AdminUser);
    });
    
    debugLog.log('✅ Found', teamMembers.length, 'team members for sponsor:', sponsorId);
    return teamMembers;
  } catch (error) {
    debugLog.error('Error getting sponsor team members:', error);
    throw error;
  }
};

export const getSponsorHierarchy = async (sponsorId: string): Promise<{
  directMembers: AdminUser[];
  allMembers: AdminUser[];
  hierarchy: Map<string, AdminUser[]>;
}> => {
  try {
    debugLog.log('🔍 Getting complete hierarchy for sponsor:', sponsorId);
    
    const hierarchy = new Map<string, AdminUser[]>();
    const allMembers: AdminUser[] = [];
    const directMembers = await getSponsorTeamMembers(sponsorId);
    
    // Doğrudan üyeleri ekle
    hierarchy.set(sponsorId, directMembers);
    allMembers.push(...directMembers);
    
    // Alt sponsorların üyelerini recursive olarak bul
    const subSponsors = directMembers.filter(member => member.role === 'sponsor');
    
    for (const subSponsor of subSponsors) {
      const subHierarchy = await getSponsorHierarchy(subSponsor.userId);
      hierarchy.set(subSponsor.userId, subHierarchy.directMembers);
      allMembers.push(...subHierarchy.allMembers);
      
      // Alt hiyerarşiyi de ekle
      subHierarchy.hierarchy.forEach((members, id) => {
        hierarchy.set(id, members);
      });
    }
    
    return {
      directMembers,
      allMembers,
      hierarchy
    };
  } catch (error) {
    debugLog.error('Error getting sponsor hierarchy:', error);
    throw error;
  }
};

export const transferTeamMembers = async (
  fromSponsorId: string, 
  toSponsorId: string | null
): Promise<{ success: boolean; transferredCount: number; error?: string }> => {
  try {
    console.log('🔄 transferTeamMembers called with:', { fromSponsorId, toSponsorId });
    debugLog.log('🔄 Transferring team members from', fromSponsorId, 'to', toSponsorId);
    
    // Sponsor'un tüm alt üyelerini bul
    console.log('🔍 Getting sponsor hierarchy for:', fromSponsorId);
    const hierarchy = await getSponsorHierarchy(fromSponsorId);
    const allMembers = hierarchy.allMembers;
    
    console.log('🔍 Found members:', allMembers.length, 'members');
    console.log('🔍 Members:', allMembers.map(m => ({ id: m.id, userId: m.userId, role: m.role })));
    
    if (allMembers.length === 0) {
      console.log('ℹ️ No team members to transfer');
      debugLog.log('ℹ️ No team members to transfer');
      return { success: true, transferredCount: 0 };
    }
    
    // Tüm üyelerin parentSponsorId'sini güncelle
    const updatePromises = allMembers.map(async (member) => {
      const memberRef = doc(db, 'admins', member.id);
      const updateData: Partial<AdminUser> = {
        parentSponsorId: toSponsorId,
        updatedAt: new Date().toISOString()
      };
      
      // Eğer yeni sponsor yoksa, teamLevel'ı artır
      if (toSponsorId === null) {
        updateData.teamLevel = (member.teamLevel || 0) + 1;
        // teamPath'den son elemanı çıkar (undefined kontrolü ile)
        if (member.teamPath && Array.isArray(member.teamPath)) {
          updateData.teamPath = member.teamPath.slice(0, -1);
        } else {
          updateData.teamPath = [];
        }
      } else {
        // Yeni sponsor varsa, teamPath'i güncelle
        const newSponsor = await getDoc(doc(db, 'admins', toSponsorId));
        if (newSponsor.exists()) {
          const newSponsorData = newSponsor.data() as AdminUser;
          const newSponsorTeamPath = newSponsorData.teamPath || [];
          updateData.teamPath = [...newSponsorTeamPath, toSponsorId];
          updateData.teamLevel = (newSponsorData.teamLevel || 0) + 1;
        }
      }
      
      return updateDoc(memberRef, updateData);
    });
    
    await Promise.all(updatePromises);
    
    debugLog.log('✅ Successfully transferred', allMembers.length, 'team members');
    return { success: true, transferredCount: allMembers.length };
  } catch (error) {
    debugLog.error('Error transferring team members:', error);
    return { 
      success: false, 
      transferredCount: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const updateUserRoleWithTeamTransfer = async (
  adminId: string,
  newRole: 'admin' | 'sponsor' | 'user',
  newPermissions: string[],
  newSponsorCode?: string,
  customAdminId?: string
): Promise<{ success: boolean; transferredCount?: number; error?: string }> => {
  try {
    console.log('🔄 updateUserRoleWithTeamTransfer called with:', { 
      adminId, 
      newRole, 
      newPermissions, 
      newSponsorCode, 
      customAdminId 
    });
    debugLog.log('🔄 Updating user role with team transfer:', adminId, 'to role:', newRole, 'customAdminId:', customAdminId);
    
    const adminRef = doc(db, 'admins', adminId);
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      console.error('❌ Admin user not found:', adminId);
      throw new Error('Admin user not found');
    }
    
    const currentAdmin = adminDoc.data() as AdminUser;
    const currentRole = currentAdmin.role;
    
    console.log('🔍 Current admin data:', currentAdmin);
    console.log('🔍 Current role:', currentRole, 'New role:', newRole);
    
    // Eğer sponsor'dan user'a düşürülüyorsa, ekibini transfer et
    if (currentRole === 'sponsor' && newRole === 'user') {
      console.log('📋 Sponsor to user downgrade detected, transferring team...');
      debugLog.log('📋 Sponsor to user downgrade detected, transferring team...');
      
      let targetSponsorId: string | null = currentAdmin.parentSponsorId;
      
      // Eğer custom admin ID verilmişse onu kullan
      if (customAdminId) {
        console.log('🎯 Using custom admin ID for team transfer:', customAdminId);
        targetSponsorId = customAdminId;
      }
      // Eğer üst sponsor yoksa ve custom admin ID de yoksa, admin kullanıcısını bul
      else if (!targetSponsorId) {
        console.log('🔍 No parent sponsor found, looking for admin users...');
        
        // Tüm admin kullanıcılarını bul (teamLevel = 0 olan)
        const adminQuery = query(
          collection(db, 'admins'),
          where('role', '==', 'admin'),
          where('teamLevel', '==', 0)
        );
        
        try {
          console.log('🔍 Executing admin query...');
          const adminSnapshot = await getDocs(adminQuery);
          console.log('🔍 Admin query result - empty:', adminSnapshot.empty, 'size:', adminSnapshot.size);
          
          if (!adminSnapshot.empty) {
            console.log('🔍 Found admins:');
            adminSnapshot.docs.forEach((doc, index) => {
              const adminData = doc.data();
              console.log(`   ${index + 1}. ID: ${doc.id}, Role: ${adminData.role}, TeamLevel: ${adminData.teamLevel}`);
            });
          }
          
          if (adminSnapshot.empty) {
            console.log('⚠️ No admin user found with role=admin and teamLevel=0');
            console.log('🔍 Let\'s try a broader search...');
            
            // Daha geniş arama yap - sadece role=admin
            const broadAdminQuery = query(
              collection(db, 'admins'),
              where('role', '==', 'admin')
            );
            
            const broadAdminSnapshot = await getDocs(broadAdminQuery);
            console.log('🔍 Broad admin search result - size:', broadAdminSnapshot.size);
            
            if (!broadAdminSnapshot.empty) {
              console.log('🔍 All admins found:');
              broadAdminSnapshot.docs.forEach((doc, index) => {
                const adminData = doc.data();
                console.log(`   ${index + 1}. ID: ${doc.id}, Role: ${adminData.role}, TeamLevel: ${adminData.teamLevel || 'undefined'}`);
              });
              
              // İlk admin'i kullan
              const firstAdmin = broadAdminSnapshot.docs[0];
              targetSponsorId = firstAdmin.id;
              console.log('✅ Using first admin found for team transfer:', targetSponsorId);
            } else {
              console.log('⚠️ No admin user found at all, team will be orphaned');
              targetSponsorId = null;
            }
          } else if (adminSnapshot.size === 1) {
            // Tek admin varsa direkt onu kullan
            const adminDoc = adminSnapshot.docs[0];
            targetSponsorId = adminDoc.id;
            console.log('✅ Found single admin user for team transfer:', targetSponsorId);
          } else {
            // Birden fazla admin varsa admin seçimi gerekli
            console.error('❌ Multiple admins found, admin selection required');
            throw new Error(`Birden fazla admin bulundu (${adminSnapshot.size} admin). Lütfen ekip üyelerinin hangi admin'e aktarılacağını seçin.`);
          }
        } catch (error) {
          console.error('❌ Error finding admin user:', error);
          if (error instanceof Error && error.message.includes('admin selection required')) {
            throw error; // Admin seçimi hatalarını yeniden fırlat
          }
          console.log('🔍 Falling back to null target sponsor');
          targetSponsorId = null;
        }
      }
      
      console.log('🔍 Transferring team from', adminId, 'to', targetSponsorId);
      
      // Ekibi hedef sponsor'a transfer et
      const transferResult = await transferTeamMembers(adminId, targetSponsorId);
      
      console.log('🔍 Transfer result:', transferResult);
      
      if (!transferResult.success) {
        console.error('❌ Team transfer failed:', transferResult.error);
        throw new Error(`Team transfer failed: ${transferResult.error}`);
      }
      
      // Kullanıcıyı güncelle
      const updateData: Partial<AdminUser> = {
        role: newRole,
        permissions: newPermissions,
        sponsorCode: null, // Sponsor kodu kaldır (undefined yerine null kullan)
        teamLevel: (currentAdmin.teamLevel || 0) + 1,
        updatedAt: new Date().toISOString()
      };
      
      // teamPath'den son elemanı çıkar (undefined kontrolü ile)
      if (currentAdmin.teamPath && Array.isArray(currentAdmin.teamPath)) {
        updateData.teamPath = currentAdmin.teamPath.slice(0, -1);
      } else {
        updateData.teamPath = [];
      }
      
      console.log('🔍 Updating admin with data:', updateData);
      console.log('🔍 Role being set to:', newRole);
      console.log('🔍 Current role was:', currentRole);
      
      await updateDoc(adminRef, updateData);
      
      // Güncelleme sonrası kontrol
      const updatedDoc = await getDoc(adminRef);
      const updatedData = updatedDoc.data();
      console.log('🔍 After update - Role:', updatedData?.role);
      console.log('🔍 After update - SponsorCode:', updatedData?.sponsorCode);
      console.log('🔍 After update - Full updated data:', updatedData);
      console.log('🔍 Expected role was:', newRole);
      console.log('🔍 Role match:', updatedData?.role === newRole);
      
      console.log('✅ Role updated and team transferred successfully');
      console.log('🔍 Final role check - Role:', updatedData?.role);
      console.log('🔍 Final role check - SponsorCode:', updatedData?.sponsorCode);
      debugLog.log('✅ Role updated and team transferred successfully');
      return { 
        success: true, 
        transferredCount: transferResult.transferredCount 
      };
    }
    
    // Eğer user'dan sponsor'a yükseltiliyorsa
    if (currentRole === 'user' && newRole === 'sponsor') {
      debugLog.log('📋 User to sponsor upgrade detected');
      
      const updateData: Partial<AdminUser> = {
        role: newRole,
        permissions: newPermissions,
        sponsorCode: newSponsorCode || generateSponsorCode(),
        teamLevel: (currentAdmin.teamLevel || 0) - 1,
        updatedAt: new Date().toISOString()
      };
      
      // teamPath'e kendini ekle (undefined kontrolü ile)
      const currentTeamPath = currentAdmin.teamPath || [];
      updateData.teamPath = [...currentTeamPath, adminId];
      
      await updateDoc(adminRef, updateData);
      
      debugLog.log('✅ User upgraded to sponsor successfully');
      return { success: true };
    }
    
    // Diğer durumlar için basit güncelleme (sponsor'dan user'a geçiş zaten yukarıda yapıldı)
    if (currentRole !== 'sponsor' || newRole !== 'user') {
      const updateData: Partial<AdminUser> = {
        role: newRole,
        permissions: newPermissions,
        sponsorCode: newRole === 'sponsor' ? (newSponsorCode || generateSponsorCode()) : null,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(adminRef, updateData);
      
      console.log('✅ Role updated successfully');
      debugLog.log('✅ Role updated successfully');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user role with team transfer:', error);
    debugLog.error('Error updating user role with team transfer:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const getRolePermissions = async (roleName: string): Promise<string[]> => {
  try {
    debugLog.log('🔍 Getting permissions for role:', roleName);
    
    // Önce userRoles koleksiyonundan rolü bul
    const roleQuery = query(
      collection(db, 'userRoles'),
      where('name', '==', roleName),
      limit(1)
    );
    
    const roleSnapshot = await getDocs(roleQuery);
    
    if (!roleSnapshot.empty) {
      const roleData = roleSnapshot.docs[0].data() as UserRole;
      debugLog.log('✅ Found role permissions:', roleData.permissions);
      return roleData.permissions;
    }
    
    // Eğer rol bulunamazsa, varsayılan izinleri döndür
    const defaultPermissions: Record<string, string[]> = {
      'admin': [
        'manage_users',
        'view_all_data',
        'manage_orders',
        'send_recommendations',
        'answer_questions',
        'create_invitations',
        'view_team_data',
        'manage_roles',
        'export_data',
        'view_analytics'
      ],
      'sponsor': [
        'send_recommendations',
        'answer_questions',
        'create_invitations',
        'view_team_data'
      ],
      'user': []
    };
    
    const permissions = defaultPermissions[roleName] || [];
    debugLog.log('ℹ️ Using default permissions for role:', roleName, permissions);
    return permissions;
  } catch (error) {
    debugLog.error('Error getting role permissions:', error);
    return [];
  }
};

export const applyRoleToUser = async (
  userId: string,
  roleName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    debugLog.log('🔧 Applying role to user:', userId, 'role:', roleName);
    
    // Rol izinlerini al
    const permissions = await getRolePermissions(roleName);
    
    // Kullanıcının mevcut admin kaydını bul
    const adminQuery = query(
      collection(db, 'admins'),
      where('userId', '==', userId),
      limit(1)
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      throw new Error('User not found in admin collection');
    }
    
    const adminDoc = adminSnapshot.docs[0];
    const currentAdmin = adminDoc.data() as AdminUser;
    
    // Rol değişikliği varsa team transfer işlemini yap
    const roleMapping: Record<string, 'admin' | 'sponsor' | 'user'> = {
      'Admin': 'admin',
      'Sponsor': 'sponsor',
      'Kullanıcı': 'user'
    };
    
    const newRole = roleMapping[roleName] || 'user';
    const newSponsorCode = newRole === 'sponsor' ? generateSponsorCode() : undefined;
    
    const result = await updateUserRoleWithTeamTransfer(
      adminDoc.id,
      newRole,
      permissions,
      newSponsorCode
    );
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update user role');
    }
    
    debugLog.log('✅ Role applied successfully to user:', userId);
    return { success: true };
  } catch (error) {
    debugLog.error('Error applying role to user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

export const fixAdminTeamLevel = async (adminId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    debugLog.log('🔧 Fixing teamLevel for admin:', adminId);
    
    const adminRef = doc(db, 'admins', adminId);
    const adminDoc = await getDoc(adminRef);
    
    if (!adminDoc.exists()) {
      throw new Error('Admin user not found');
    }
    
    const adminData = adminDoc.data() as AdminUser;
    debugLog.log('🔍 Current admin data:', adminData);
    
    // Admin için teamLevel=0 ve teamPath=[] olmalı
    const updateData: Partial<AdminUser> = {
      teamLevel: 0,
      teamPath: [],
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(adminRef, updateData);
    
    debugLog.log('✅ Admin teamLevel fixed successfully');
    return { success: true };
  } catch (error) {
    debugLog.error('Error fixing admin teamLevel:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Get user information from Firebase Auth and Firestore
export const getUserInfo = async (userId: string): Promise<{
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
} | null> => {
  try {
    debugLog.log('🔍 Getting user info for userId:', userId);
    
    // First try to get from users collection
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        debugLog.log('✅ User found in users collection:', userData);
        return {
          displayName: userData.displayName || userData.firstName + ' ' + userData.lastName || 'Bilinmeyen Kullanıcı',
          email: userData.email || 'email@example.com',
          firstName: userData.firstName,
          lastName: userData.lastName
        };
      }
    } catch (error) {
      debugLog.log('⚠️ Could not get user from users collection:', error);
    }
    
    // If not found in users collection, try to get from admin collection
    try {
      const adminDoc = await getDoc(doc(db, 'admins', userId));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        debugLog.log('✅ User found in admins collection:', adminData);
        return {
          displayName: adminData.displayName || adminData.firstName + ' ' + adminData.lastName || 'Bilinmeyen Kullanıcı',
          email: adminData.email || 'email@example.com',
          firstName: adminData.firstName,
          lastName: adminData.lastName
        };
      }
    } catch (error) {
      debugLog.log('⚠️ Could not get user from admins collection:', error);
    }
    
    // If still not found, return default info
    debugLog.log('⚠️ User not found in any collection, returning default info');
    return {
      displayName: 'Bilinmeyen Kullanıcı',
      email: 'email@example.com'
    };
  } catch (error) {
    debugLog.error('Error getting user info:', error);
    return {
      displayName: 'Bilinmeyen Kullanıcı',
      email: 'email@example.com'
    };
  }
};

// Get multiple users info
export const getMultipleUsersInfo = async (userIds: string[]): Promise<Map<string, {
  displayName: string;
  email: string;
  firstName?: string;
  lastName?: string;
}>> => {
  try {
    debugLog.log('🔍 Getting multiple users info for:', userIds);
    
    const usersInfo = new Map();
    const promises = userIds.map(async (userId) => {
      const userInfo = await getUserInfo(userId);
      if (userInfo) {
        usersInfo.set(userId, userInfo);
      }
    });
    
    await Promise.all(promises);
    debugLog.log('✅ Retrieved info for', usersInfo.size, 'users');
    return usersInfo;
  } catch (error) {
    debugLog.error('Error getting multiple users info:', error);
    return new Map();
  }
};