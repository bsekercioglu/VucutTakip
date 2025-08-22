import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Plus, Edit3, Edit, Trash2, Key, UserCheck } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import { 
  getAllAdminUsers,
  getAllAdminAndSponsorUsers,
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser,
  generateSponsorCode,
  getAllUsers,
  createUserInvitation,
  applyRoleToUser,
  getRolePermissions,
  updateUserRoleWithTeamTransfer,
  fixAdminTeamLevel
} from '../services/adminService';
import { AdminUser } from '../types/admin';
import { User } from '../services/firebaseService';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { debugLog } from '../config/appConfig';

const AdminManagement: React.FC = () => {
  const { user, adminUser, isLoggedIn } = useUser();
  const { success, error } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [sponsorUsers, setSponsorUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    adminId: string;
    adminName: string;
  }>({
    isOpen: false,
    adminId: '',
    adminName: ''
  });

  const [formData, setFormData] = useState({
    userId: '',
    role: 'sponsor' as 'admin' | 'sponsor' | 'user',
    permissions: [] as string[],
    sponsorCode: '',
    parentSponsorId: '',
    selectedRoleName: '', // Rol tablosundan seçilen rol adı
    selectedAdminId: '' // Sponsor → User geçişinde seçilen admin ID
  });

  const [newUserFormData, setNewUserFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'sponsor' as 'admin' | 'sponsor',
    permissions: ['send_recommendations', 'answer_questions'] as string[],
    sponsorCode: '',
    parentSponsorId: ''
  });

  const [invitationResult, setInvitationResult] = useState<{
    link: string;
    show: boolean;
  }>({
    link: '',
    show: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
     debugLog.log('🔍 AdminManagement: Loading data...');
     debugLog.log('🔍 AdminManagement: Current admin user:', adminUser);
     
     if (!adminUser || adminUser.role !== 'admin') {
       debugLog.log('❌ AdminManagement: User is not admin, skipping data load');
       setLoading(false);
       return;
     }
     
      const [allAdminUsers, users] = await Promise.all([
        getAllAdminAndSponsorUsers(),
        getAllUsers()
      ]);
     debugLog.log('✅ AdminManagement: Loaded', allAdminUsers.length, 'admin and sponsor users and', users.length, 'users');
     
     // Admin ve sponsor kullanıcıları ayır
     const actualAdmins = allAdminUsers.filter(admin => admin.role === 'admin');
     const actualSponsors = allAdminUsers.filter(admin => admin.role === 'sponsor');
     
     debugLog.log('📊 Filtered admins:', actualAdmins.length);
     debugLog.log('📊 Filtered sponsors:', actualSponsors.length);
     
     // Debug: Admin ve sponsor rollerini logla
     actualAdmins.forEach((admin, index) => {
       console.log(`🔍 Admin ${index + 1}: ID=${admin.id}, UserID=${admin.userId}, Role=${admin.role}`);
     });
     
     actualSponsors.forEach((sponsor, index) => {
       console.log(`🔍 Sponsor ${index + 1}: ID=${sponsor.id}, UserID=${sponsor.userId}, Role=${sponsor.role}, SponsorCode=${sponsor.sponsorCode}`);
     });
     
      setAdminUsers(actualAdmins);
      setSponsorUsers(actualSponsors);
      setAllUsers(users);
    } catch (err) {
      debugLog.error('Error loading data:', err);
      error('Hata!', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin using adminUser from context
  if (!user || !adminUser || adminUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Yetkisiz Erişim</h3>
          <p className="text-gray-600">Bu sayfaya sadece sistem yöneticileri erişebilir.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Yükleniyor...</span>
        </div>
      </Layout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      error('Hata!', 'Kullanıcı seçimi gerekli');
      return;
    }

    // Check if user is already an admin (for new admin creation)
    if (!editingAdmin) {
      const existingAdmin = adminUsers.find(admin => admin.userId === formData.userId);
      if (existingAdmin) {
        error('Hata!', 'Bu kullanıcı zaten yetkilendirilmiş');
        return;
      }
    }

    try {
      let result;
      if (editingAdmin) {
        // Debug log ekle
        console.log('🔍 Debug - Current admin role:', editingAdmin.role);
        console.log('🔍 Debug - New form role:', formData.role);
        console.log('🔍 Debug - Selected role name:', formData.selectedRoleName);
        
        // Eğer rol değişikliği varsa team transfer ile güncelle
        console.log('🔍 Debug - Comparing roles:');
        console.log('  - Current admin role:', editingAdmin.role);
        console.log('  - New form role:', formData.role);
        console.log('  - Roles are different:', editingAdmin.role !== formData.role);
        
        if (editingAdmin.role !== formData.role) {
          console.log('🔄 Role change detected, using team transfer update');
          debugLog.log('🔄 Role change detected, using team transfer update');
          
          // Sponsor'dan user'a geçişte seçilen admin'i kullan
          let customAdminId: string | undefined;
          if (editingAdmin.role === 'sponsor' && formData.role === 'user' && formData.selectedAdminId) {
            customAdminId = formData.selectedAdminId;
            console.log('🎯 Using selected admin for team transfer:', customAdminId);
          }
          
          result = await updateUserRoleWithTeamTransfer(
            editingAdmin.id,
            formData.role,
            formData.permissions,
            formData.role === 'sponsor' ? (formData.sponsorCode || generateSponsorCode()) : undefined,
            customAdminId // Yeni parametre
          );
          
          console.log('🔍 Team transfer result:', result);
          console.log('🔍 Form data role:', formData.role);
          console.log('🔍 Editing admin role before update:', editingAdmin.role);
          
          if (result.success) {
            if (result.transferredCount && result.transferredCount > 0) {
              success('Başarılı!', `Yetki güncellendi ve ${result.transferredCount} ekip üyesi transfer edildi`);
            } else {
              success('Başarılı!', 'Yetki güncellendi');
            }
            setShowAddForm(false);
            setEditingAdmin(null);
            resetForm();
            await loadData();
            console.log('🔍 Data reloaded after team transfer');
            
            // Yeni yüklenen verileri kontrol et
            const updatedAdmins = await getAllAdminUsers();
            console.log('🔍 Fresh admin data after reload:');
            updatedAdmins.forEach((admin, index) => {
              console.log(`  ${index + 1}. ID: ${admin.id}, UserID: ${admin.userId}, Role: ${admin.role}`);
            });
            
            console.log('🔍 Current admin users after reload:', adminUsers);
            return; // Başarılı işlem sonrası fonksiyondan çık
          } else {
            error('Hata!', result.error || 'Yetki güncellenirken hata oluştu');
            return;
          }
        } else {
          // Sadece izinler güncelleniyorsa normal güncelleme
          const adminData: Omit<AdminUser, 'id' | 'userId'> = {
            role: formData.role,
            permissions: formData.permissions,
            sponsorCode: formData.role === 'sponsor' ? (formData.sponsorCode || generateSponsorCode()) : undefined,
            parentSponsorId: formData.parentSponsorId || null,
            teamLevel: formData.role === 'admin' ? 0 : (formData.parentSponsorId ? 2 : 1),
            teamPath: formData.role === 'admin' ? [] : (formData.parentSponsorId ? [adminUser?.userId || '', formData.parentSponsorId] : [adminUser?.userId || '']),
            createdAt: editingAdmin.createdAt,
            updatedAt: new Date().toISOString()
          };
          result = await updateAdminUser(editingAdmin.id, adminData);
          
          if (result.success) {
            success('Başarılı!', 'Yetki güncellendi');
            setShowAddForm(false);
            setEditingAdmin(null);
            resetForm();
            await loadData();
            return;
          } else {
            error('Hata!', result.error || 'Yetki güncellenirken hata oluştu');
            return;
          }
        }
      } else {
        // Yeni admin oluşturma
        const adminData: Omit<AdminUser, 'id' | 'userId'> = {
          role: formData.role,
          permissions: formData.permissions,
          sponsorCode: formData.role === 'sponsor' ? (formData.sponsorCode || generateSponsorCode()) : undefined,
          parentSponsorId: formData.parentSponsorId || null,
          teamLevel: formData.role === 'admin' ? 0 : (formData.parentSponsorId ? 2 : 1),
          teamPath: formData.role === 'admin' ? [] : (formData.parentSponsorId ? [adminUser?.userId || '', formData.parentSponsorId] : [adminUser?.userId || '']),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        result = await createAdminUser(formData.userId, adminData);
      }

      if (result.success) {
        success('Başarılı!', editingAdmin ? 'Yetki güncellendi' : 'Yeni yetki eklendi');
        setShowAddForm(false);
        setEditingAdmin(null);
        resetForm();
        await loadData();
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : 'İşlem sırasında hata oluştu';
        error('Hata!', errorMessage);
      }
    } catch (err) {
      console.error('Error saving admin:', err);
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      error('Hata!', errorMessage);
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    
    // Rol adını doğru şekilde ayarla
    const roleNameMapping: Record<string, string> = {
      'admin': 'Admin',
      'sponsor': 'Sponsor',
      'user': 'Kullanıcı'
    };
    
    setFormData({
      userId: admin.userId,
      role: admin.role, // Gerçek rolü kullan
      permissions: admin.permissions,
      sponsorCode: admin.sponsorCode || '',
      parentSponsorId: admin.parentSponsorId || '',
      selectedRoleName: roleNameMapping[admin.role] || 'Sponsor', // Rol adını doğru şekilde ayarla
      selectedAdminId: '' // Admin seçimi için boş bırak
    });
    setShowAddForm(true);
    
    // Debug log ekle
    console.log('🔍 handleEdit - Admin role:', admin.role);
    console.log('🔍 handleEdit - Form role set to:', admin.role);
  };

  const handleDeleteClick = (adminId: string, adminName: string) => {
    setConfirmDialog({
      isOpen: true,
      adminId,
      adminName
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deleteAdminUser(confirmDialog.adminId);
      if (result.success) {
        success('Başarılı!', 'Yetki silindi');
        await loadData();
      } else {
        error('Hata!', 'Silme işlemi başarısız');
      }
    } catch (err) {
      error('Hata!', 'Beklenmeyen bir hata oluştu');
    }
    setConfirmDialog({ isOpen: false, adminId: '', adminName: '' });
  };

  const handleFixTeamLevel = async (adminId: string) => {
    try {
      debugLog.log('🔧 Fixing teamLevel for admin:', adminId);
      const result = await fixAdminTeamLevel(adminId);
      if (result.success) {
        success('Başarılı!', 'Admin teamLevel düzeltildi');
        await loadData();
      } else {
        error('Hata!', result.error || 'TeamLevel düzeltme işlemi başarısız');
      }
    } catch (err) {
      debugLog.error('Error fixing teamLevel:', err);
      error('Hata!', 'Beklenmeyen bir hata oluştu');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      role: 'sponsor',
      permissions: [],
      sponsorCode: '',
      parentSponsorId: '',
      selectedRoleName: '',
      selectedAdminId: ''
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAdmin(null);
    resetForm();
  };

  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🔍 Form submitted with data:', newUserFormData);

    // Basic validation
    if (!newUserFormData.email || !newUserFormData.firstName || !newUserFormData.lastName) {
      error('Hata!', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (newUserFormData.permissions.length === 0) {
      error('Hata!', 'En az bir izin seçmelisiniz');
      return;
    }

    try {
      console.log('🔍 Calling createUserInvitation...');
      console.log('🔍 User data being sent:', {
        email: newUserFormData.email,
        firstName: newUserFormData.firstName,
        lastName: newUserFormData.lastName,
        role: newUserFormData.role,
        permissions: newUserFormData.permissions,
        sponsorCode: newUserFormData.role === 'sponsor' ? (newUserFormData.sponsorCode || generateSponsorCode()) : undefined,
        parentSponsorId: newUserFormData.parentSponsorId || null
      });

      const result = await createUserInvitation({
        email: newUserFormData.email,
        firstName: newUserFormData.firstName,
        lastName: newUserFormData.lastName,
        role: newUserFormData.role,
        permissions: newUserFormData.permissions,
        sponsorCode: newUserFormData.role === 'sponsor' ? (newUserFormData.sponsorCode || generateSponsorCode()) : undefined,
        parentSponsorId: newUserFormData.parentSponsorId || null
      });

      console.log('🔍 createUserInvitation result:', result);
      console.log('🔍 Result success:', result.success);
      console.log('🔍 Result error:', result.error);

      if (result.success) {
        console.log('✅ Success! Setting invitation result...');
        success('Başarılı!', 'Davet linki oluşturuldu');
        setInvitationResult({
          link: result.invitationLink || '',
          show: true
        });
        console.log('✅ Invitation result set:', {
          link: result.invitationLink || '',
          show: true
        });
        resetNewUserForm();
      } else {
        console.log('❌ Error in result:', result.error);
        const errorMessage = typeof result.error === 'string' ? result.error : 'İşlem sırasında hata oluştu';
        error('Hata!', errorMessage);
      }
    } catch (err) {
      console.error('❌ Exception in handleNewUserSubmit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu';
      error('Hata!', errorMessage);
    }
  };

  const resetNewUserForm = () => {
    setNewUserFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'sponsor',
      permissions: ['send_recommendations', 'answer_questions'],
      sponsorCode: '',
      parentSponsorId: ''
    });
  };

  const handleNewUserCancel = () => {
    setShowNewUserForm(false);
    resetNewUserForm();
  };

  const availablePermissions = [
    'manage_users',
    'view_all_data',
    'manage_orders',
    'send_recommendations',
    'answer_questions'
  ];

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      'manage_users': 'Kullanıcı Yönetimi',
      'view_all_data': 'Tüm Verileri Görme',
      'manage_orders': 'Sipariş Yönetimi',
      'send_recommendations': 'Ürün Önerisi Gönderme',
      'answer_questions': 'Soru Yanıtlama'
    };
    return labels[permission] || permission;
  };

  const getUserName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Bilinmeyen Kullanıcı';
  };

  const getUserEmail = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.email || '';
  };

  const availableUsers = allUsers.filter(u => 
    (!adminUsers.some(admin => admin.userId === u.id) && !sponsorUsers.some(sponsor => sponsor.userId === u.id)) || 
    (editingAdmin && editingAdmin.userId === u.id)
  );



  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yetki Yönetimi</h1>
            <p className="text-gray-600 mt-1">
              Sistem yöneticileri ve sponsorları yönetin
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNewUserForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Davet Linki Oluştur
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Mevcut Kullanıcıya Yetki Ver
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={handleCancel}>
            <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAdmin ? 'Yetki Düzenle' : 'Yeni Yetki Ekle'}
                </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanıcı
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!!editingAdmin}
                >
                  <option value="">Kullanıcı seçin</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol Tablosundan Seç
                </label>
                <select
                  value={formData.selectedRoleName}
                  onChange={async (e) => {
                    const selectedRole = e.target.value;
                    console.log('🔍 Role selection changed to:', selectedRole);
                    setFormData({ ...formData, selectedRoleName: selectedRole });
                    
                    if (selectedRole) {
                      // Seçilen rolün izinlerini al
                      const permissions = await getRolePermissions(selectedRole);
                      const roleMapping: Record<string, 'admin' | 'sponsor' | 'user'> = {
                        'Admin': 'admin',
                        'Sponsor': 'sponsor',
                        'Kullanıcı': 'user'
                      };
                      
                      const newRole = roleMapping[selectedRole] || 'sponsor';
                      console.log('🔍 Mapped role:', newRole, 'Permissions:', permissions);
                      
                      setFormData(prev => ({
                        ...prev,
                        role: newRole,
                        permissions: permissions
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Rol seçin</option>
                  <option value="Admin">Admin</option>
                  <option value="Sponsor">Sponsor</option>
                  <option value="Kullanıcı">Kullanıcı</option>
                </select>
              </div>

              {/* Team Transfer Uyarısı */}
              {editingAdmin && editingAdmin.role === 'sponsor' && formData.selectedRoleName === 'Kullanıcı' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Önemli Uyarı:</h4>
                  <p className="text-sm text-yellow-800">
                    Bu kullanıcı sponsor'dan kullanıcı'ya düşürülecek. Tüm ekip üyeleri üst sponsor'a aktarılacaktır.
                  </p>
                  
                  {/* Admin Seçimi */}
                  {(() => {
                    const availableAdmins = adminUsers.filter((admin: AdminUser) => admin.role === 'admin' && admin.teamLevel === 0);
                    if (availableAdmins.length > 1) {
                      return (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-yellow-900 mb-2">
                            🎯 Ekip Üyelerini Hangi Admin'e Aktaralım?
                          </label>
                          <select
                            value={formData.selectedAdminId}
                            onChange={(e) => setFormData({ ...formData, selectedAdminId: e.target.value })}
                            className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                            required
                          >
                            <option value="">Admin seçin</option>
                            {availableAdmins.map((admin: AdminUser) => (
                              <option key={admin.id} value={admin.id}>
                                {allUsers.find((u: any) => u.id === admin.userId)?.firstName || 'Bilinmeyen'} {allUsers.find((u: any) => u.id === admin.userId)?.lastName || 'Kullanıcı'}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-yellow-700 mt-1">
                            Birden fazla admin olduğu için ekip üyelerinin hangi admin'e aktarılacağını seçmelisiniz.
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {formData.role === 'sponsor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sponsor Kodu
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.sponsorCode}
                        onChange={(e) => setFormData({ ...formData, sponsorCode: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Otomatik oluşturulacak"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sponsorCode: generateSponsorCode() })}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Üst Sponsor
                    </label>
                    <select
                      value={formData.parentSponsorId}
                      onChange={(e) => setFormData({ ...formData, parentSponsorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Üst sponsor yok</option>
                      {sponsorUsers
                        .filter(s => s.userId !== formData.userId)
                        .map(sponsor => (
                        <option key={sponsor.id} value={sponsor.userId}>
                          {getUserName(sponsor.userId)} ({sponsor.sponsorCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İzinler
                </label>
                <div className="space-y-2">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, permission]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {getPermissionLabel(permission)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingAdmin ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>
        )}

        {/* New User Creation Form */}
        {showNewUserForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Yeni Üye Oluştur
            </h3>
            
            <form onSubmit={handleNewUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad *
                  </label>
                  <input
                    type="text"
                    value={newUserFormData.firstName}
                    onChange={(e) => setNewUserFormData({ ...newUserFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Soyad *
                  </label>
                  <input
                    type="text"
                    value={newUserFormData.lastName}
                    onChange={(e) => setNewUserFormData({ ...newUserFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta *
                </label>
                <input
                  type="email"
                  value={newUserFormData.email}
                  onChange={(e) => setNewUserFormData({ ...newUserFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="ornek@email.com"
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol *
                </label>
                <select
                  value={newUserFormData.role}
                  onChange={(e) => setNewUserFormData({ ...newUserFormData, role: e.target.value as 'admin' | 'sponsor' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="sponsor">Sponsor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {newUserFormData.role === 'sponsor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sponsor Kodu
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newUserFormData.sponsorCode}
                        onChange={(e) => setNewUserFormData({ ...newUserFormData, sponsorCode: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Otomatik oluşturulacak"
                      />
                      <button
                        type="button"
                        onClick={() => setNewUserFormData({ ...newUserFormData, sponsorCode: generateSponsorCode() })}
                        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Üst Sponsor
                    </label>
                    <select
                      value={newUserFormData.parentSponsorId}
                      onChange={(e) => setNewUserFormData({ ...newUserFormData, parentSponsorId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Üst sponsor yok</option>
                      {sponsorUsers.map(sponsor => (
                        <option key={sponsor.id} value={sponsor.userId}>
                          {getUserName(sponsor.userId)} ({sponsor.sponsorCode})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İzinler
                </label>
                <div className="space-y-2">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newUserFormData.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUserFormData({
                              ...newUserFormData,
                              permissions: [...newUserFormData.permissions, permission]
                            });
                          } else {
                            setNewUserFormData({
                              ...newUserFormData,
                              permissions: newUserFormData.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">
                        {getPermissionLabel(permission)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleNewUserCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Davet Linki Oluştur
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invitation Link Modal */}
        {invitationResult.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Davet Linki Oluşturuldu
              </h3>
              
              <p className="text-gray-600 mb-4">
                Aşağıdaki linki yeni kullanıcıya gönderin. Bu link ile kayıt olduğunda otomatik olarak belirlenen yetkiler atanacaktır.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Davet Linki:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={invitationResult.link}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(invitationResult.link);
                      success('Başarılı!', 'Link kopyalandı');
                    }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Kopyala
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Önemli Notlar:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Link 7 gün boyunca geçerlidir</li>
                  <li>• Sadece belirtilen e-posta adresi ile kullanılabilir</li>
                  <li>• Kayıt tamamlandığında otomatik yetki atanır</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setInvitationResult({ link: '', show: false })}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={() => {
                    setInvitationResult({ link: '', show: false });
                    setShowNewUserForm(false);
                  }}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Yetkiyi Sil"
          message={`${confirmDialog.adminName} kullanıcısının yetkilerini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDialog({ isOpen: false, adminId: '', adminName: '' })}
          type="danger"
        />

        {/* Admin Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Admin Kullanıcılar ({adminUsers.length})</h3>
          </div>
          
          {adminUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sponsor Kodu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Üst Sponsor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İzinler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adminUsers.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(admin.userId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getUserEmail(admin.userId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.role === 'admin' ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            <>
                              <Users className="h-3 w-3 mr-1" />
                              Sponsor
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          admin.teamLevel === 0 
                            ? 'bg-purple-100 text-purple-800' 
                            : admin.teamLevel === 1
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {admin.teamLevel === undefined ? 'Undefined' : admin.teamLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.sponsorCode ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                            {admin.sponsorCode}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {admin.parentSponsorId ? (
                          <div>
                            <div className="font-medium">
                              {getUserName(admin.parentSponsorId)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sponsorUsers.find(s => s.userId === admin.parentSponsorId)?.sponsorCode}
                            </div>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {admin.permissions.map(permission => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {getPermissionLabel(permission)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(admin)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Düzenle"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          {admin.role === 'admin' && (
                            <button
                              onClick={() => handleFixTeamLevel(admin.id)}
                              className="text-orange-600 hover:text-orange-800 transition-colors"
                              title="TeamLevel Düzelt"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                          )}
                          {admin.userId !== user?.id && (
                            <button
                              onClick={() => handleDeleteClick(admin.id, getUserName(admin.userId))}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz yetkili kullanıcı yok</h3>
              <p className="text-gray-600">İlk yetkili kullanıcıyı ekleyerek başlayın.</p>
            </div>
          )}
        </div>

        {/* Sponsor Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sponsor Kullanıcılar ({sponsorUsers.length})</h3>
          </div>
          
          {sponsorUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sponsor Kodu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Üst Sponsor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İzinler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sponsorUsers.map((sponsor) => (
                    <tr key={sponsor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getUserName(sponsor.userId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getUserEmail(sponsor.userId)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sponsor.sponsorCode ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono">
                            {sponsor.sponsorCode}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          sponsor.teamLevel === 0 
                            ? 'bg-purple-100 text-purple-800' 
                            : sponsor.teamLevel === 1
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {sponsor.teamLevel === undefined ? 'Undefined' : sponsor.teamLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sponsor.parentSponsorId ? (
                          <div>
                            <div className="font-medium">
                              {getUserName(sponsor.parentSponsorId)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sponsorUsers.find(s => s.userId === sponsor.parentSponsorId)?.sponsorCode || 'Kod Yok'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Üst sponsor yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {sponsor.permissions.slice(0, 2).map((permission) => (
                            <span
                              key={permission}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {getPermissionLabel(permission)}
                            </span>
                          ))}
                          {sponsor.permissions.length > 2 && (
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              +{sponsor.permissions.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(sponsor)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {adminUser && adminUser.userId !== sponsor.userId && (
                            <button
                              onClick={() => handleDeleteClick(sponsor.id, getUserName(sponsor.userId))}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz sponsor kullanıcı yok</h3>
              <p className="text-gray-600">İlk sponsor kullanıcıyı ekleyerek başlayın.</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3">📋 Yetki Yönetimi Rehberi</h3>
          <div className="space-y-2 text-yellow-800 text-sm">
            <p><strong>Admin:</strong> Tüm sistem yetkilerine sahip, diğer adminleri yönetebilir</p>
            <p><strong>Sponsor:</strong> Alt ekip üyelerini yönetir, siparişleri takip eder</p>
            <p><strong>Sponsor Kodu:</strong> Yeni üyelerin kayıt olması için kullanılır</p>
            <p><strong>Üst Sponsor:</strong> Hiyerarşik yapı için üst seviye sponsor</p>
          </div>
        </div>

        {/* Toplu Sponsor Atama */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">👥 Toplu Sponsor Atama</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-green-800 mb-2">
                Sponsor Seçin
              </label>
              <select
                value={bulkAssignmentData.selectedSponsorId}
                onChange={(e) => setBulkAssignmentData({ ...bulkAssignmentData, selectedSponsorId: e.target.value })}
                className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Sponsor seçin...</option>
                {sponsorUsers.map(sponsor => (
                  <option key={sponsor.id} value={sponsor.userId}>
                    {getUserName(sponsor.userId)} ({sponsor.sponsorCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-green-800 mb-2">
                Atanacak Kullanıcılar
              </label>
              <div className="max-h-40 overflow-y-auto border border-green-300 rounded-md p-2">
                {availableUsers.length > 0 ? (
                  availableUsers.map(user => (
                    <label key={user.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={bulkAssignmentData.selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkAssignmentData({
                              ...bulkAssignmentData,
                              selectedUserIds: [...bulkAssignmentData.selectedUserIds, user.id]
                            });
                          } else {
                            setBulkAssignmentData({
                              ...bulkAssignmentData,
                              selectedUserIds: bulkAssignmentData.selectedUserIds.filter(id => id !== user.id)
                            });
                          }
                        }}
                        className="rounded border-green-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-green-800">
                        {user.firstName} {user.lastName} ({user.email})
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-green-600">Atanacak kullanıcı bulunamadı</p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleBulkAssignment}
                disabled={!bulkAssignmentData.selectedSponsorId || bulkAssignmentData.selectedUserIds.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Seçili Kullanıcıları Ata
              </button>
              <button
                onClick={() => setBulkAssignmentData({ selectedSponsorId: '', selectedUserIds: [] })}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>

        {/* Manual Firebase Setup */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🔧 Manuel Admin Ekleme (Firebase Console)</h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <p><strong>1.</strong> Firebase Console → Firestore Database</p>
            <p><strong>2.</strong> Authentication → Users → UID'yi kopyala</p>
            <p><strong>3.</strong> "admins" koleksiyonu oluştur (Document ID = UID)</p>
            <p><strong>4.</strong> Aşağıdaki alanları ekle:</p>
            <div className="bg-blue-100 p-3 rounded mt-2 font-mono text-xs">
              <p>userId: "kullanıcı_id_buraya"</p>
              <p>role: "admin" veya "sponsor"</p>
              <p>permissions: ["manage_users", "view_all_data", "manage_orders"]</p>
              <p>sponsorCode: "SPONSOR123" (sadece sponsor için)</p>
              <p>createdAt: "2024-01-01T00:00:00.000Z"</p>
              <p>updatedAt: "2024-01-01T00:00:00.000Z"</p>
            </div>
            <p className="mt-2"><strong>5.</strong> Uygulamada logout/login yapın</p>
            <p><strong>6.</strong> Sol menüde "Admin Panel" görünecek</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminManagement;