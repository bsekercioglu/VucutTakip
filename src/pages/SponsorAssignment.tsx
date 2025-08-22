import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import { 
  getAllAdminUsers,
  getAllAdminAndSponsorUsers,
  getAllUsers,
  createAdminUser,
  deleteAdminUser,
  generateSponsorCode,
  assignUsersToSponsor,
  removeUsersFromSponsor
} from '../services/adminService';
import { AdminUser } from '../types/admin';
import { User } from '../services/firebaseService';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { debugLog } from '../config/appConfig';

interface SponsorAssignmentProps {}

const SponsorAssignment: React.FC<SponsorAssignmentProps> = () => {
  const { user, adminUser, isLoggedIn } = useUser();
  const { success, error } = useToast();
  
  // State management
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSponsor, setSelectedSponsor] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  
  // Confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'success' | 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      debugLog.log('🔍 SponsorAssignment: Loading data...');
      
      if (!adminUser || adminUser.role !== 'admin') {
        debugLog.log('❌ SponsorAssignment: User is not admin');
        setLoading(false);
        return;
      }
      
      const [adminAndSponsorUsers, users] = await Promise.all([
        getAllAdminAndSponsorUsers(),
        getAllUsers()
      ]);
      
      debugLog.log('✅ SponsorAssignment: Loaded', adminAndSponsorUsers.length, 'admin and sponsor users and', users.length, 'users');
      setAdminUsers(adminAndSponsorUsers);
      setAllUsers(users);
    } catch (err) {
      debugLog.error('Error loading data:', err);
      error('Hata!', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Access control
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
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

  // Helper functions
  const getSponsorUsers = () => adminUsers.filter(admin => admin.role === 'sponsor');
  const getRegularUsers = () => allUsers.filter(user => 
    !adminUsers.some(admin => admin.userId === user.id)
  );

  const getUserName = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Bilinmeyen Kullanıcı';
  };

  const getUserEmail = (userId: string) => {
    const user = allUsers.find(u => u.id === userId);
    return user?.email || '';
  };

  const getSponsorName = (sponsorId: string) => {
    const sponsor = adminUsers.find(admin => admin.userId === sponsorId);
    return sponsor ? getUserName(sponsor.userId) : 'Bilinmeyen Sponsor';
  };

  // Filter users based on search term
  const filteredUsers = getRegularUsers().filter(user => {
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const email = user.email.toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Bulk assignment functions
  const handleBulkAssignment = async () => {
    if (!selectedSponsor || selectedUsers.length === 0) {
      error('Hata!', 'Lütfen sponsor ve kullanıcıları seçin');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Toplu Sponsor Atama',
      message: `${selectedUsers.length} kullanıcıyı "${getSponsorName(selectedSponsor)}" sponsoruna atamak istediğinizden emin misiniz?`,
      onConfirm: async () => {
        try {
          const result = await assignUsersToSponsor(selectedSponsor, selectedUsers);
          if (result.success) {
            success('Başarılı!', `${selectedUsers.length} kullanıcı başarıyla atandı`);
            setSelectedUsers([]);
            setSelectedSponsor('');
            setShowBulkAssignment(false);
            await loadData();
                     } else {
             error('Hata!', result.error || 'Atama işlemi başarısız');
           }
        } catch (err) {
          error('Hata!', 'Beklenmeyen bir hata oluştu');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      type: 'success'
    });
  };

  const handleRemoveFromSponsor = async (userId: string, sponsorId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sponsor Atamasını Kaldır',
      message: `${getUserName(userId)} kullanıcısının sponsor atamasını kaldırmak istediğinizden emin misiniz?`,
      onConfirm: async () => {
        try {
          const result = await removeUsersFromSponsor(sponsorId, [userId]);
          if (result.success) {
            success('Başarılı!', 'Sponsor ataması kaldırıldı');
            await loadData();
          } else {
            error('Hata!', 'Kaldırma işlemi başarısız');
          }
        } catch (err) {
          error('Hata!', 'Beklenmeyen bir hata oluştu');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      type: 'danger'
    });
  };

  const handleCreateSponsor = async (userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sponsor Oluştur',
      message: `${getUserName(userId)} kullanıcısını sponsor yapmak istediğinizden emin misiniz?`,
      onConfirm: async () => {
        try {
          const sponsorData = {
            role: 'sponsor' as const,
            permissions: ['send_recommendations', 'answer_questions'],
            sponsorCode: generateSponsorCode(),
            parentSponsorId: ''
          };

          const result = await createAdminUser(userId, sponsorData);
          if (result.success) {
            success('Başarılı!', 'Sponsor başarıyla oluşturuldu');
            await loadData();
          } else {
            error('Hata!', 'Sponsor oluşturma başarısız');
          }
        } catch (err) {
          error('Hata!', 'Beklenmeyen bir hata oluştu');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      type: 'success'
    });
  };

  const handleRemoveSponsor = async (adminId: string, userId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Sponsor Yetkisini Kaldır',
      message: `${getUserName(userId)} kullanıcısının sponsor yetkisini kaldırmak istediğinizden emin misiniz?`,
      onConfirm: async () => {
        try {
          const result = await deleteAdminUser(adminId);
          if (result.success) {
            success('Başarılı!', 'Sponsor yetkisi kaldırıldı');
            await loadData();
          } else {
            error('Hata!', 'Kaldırma işlemi başarısız');
          }
        } catch (err) {
          error('Hata!', 'Beklenmeyen bir hata oluştu');
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      type: 'danger'
    });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(filteredUsers.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sponsor Yönetimi</h1>
            <p className="text-gray-600 mt-1">
              Kullanıcıları sponsorlara ata ve sponsor yetkilerini yönet
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowBulkAssignment(!showBulkAssignment)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Toplu Atama
            </button>
            <button
              onClick={() => setShowUserManagement(!showUserManagement)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Users className="h-4 w-4 mr-2" />
              Kullanıcı Yönetimi
            </button>
            <button
              onClick={loadData}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </button>
          </div>
        </div>

        {/* Bulk Assignment Panel */}
        {showBulkAssignment && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Toplu Sponsor Atama
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sponsor Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sponsor Seçin
                </label>
                <select
                  value={selectedSponsor}
                  onChange={(e) => setSelectedSponsor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Sponsor seçin</option>
                  {getSponsorUsers().map(sponsor => (
                    <option key={sponsor.id} value={sponsor.userId}>
                      {getUserName(sponsor.userId)} ({sponsor.sponsorCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* User Selection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kullanıcı Seçin ({selectedUsers.length} seçili)
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllUsers}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      Tümünü Seç
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                    >
                      Temizle
                    </button>
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                  {filteredUsers.map(user => (
                    <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBulkAssignment(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleBulkAssignment}
                disabled={!selectedSponsor || selectedUsers.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedUsers.length} Kullanıcıyı Ata
              </button>
            </div>
          </div>
        )}

        {/* User Management Panel */}
        {showUserManagement && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Kullanıcı Yönetimi
            </h3>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kullanıcı
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sponsor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const userSponsor = adminUsers.find(admin => 
                      admin.role === 'sponsor' && admin.userId === user.id
                    );
                    const isAssignedToSponsor = adminUsers.some(admin => 
                      admin.role === 'sponsor' && admin.parentSponsorId === user.id
                    );

                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {userSponsor ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Sponsor
                            </span>
                          ) : isAssignedToSponsor ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Atanmış
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Atanmamış
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userSponsor ? (
                            <div>
                              <div className="font-medium">Kendi Sponsor</div>
                              <div className="text-xs text-gray-500">{userSponsor.sponsorCode}</div>
                            </div>
                          ) : isAssignedToSponsor ? (
                            <div className="flex items-center">
                              <ArrowRight className="h-3 w-3 mr-1 text-gray-400" />
                              <span>Alt ekip üyesi</span>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            {!userSponsor && (
                              <button
                                onClick={() => handleCreateSponsor(user.id)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="Sponsor Yap"
                              >
                                <UserPlus className="h-4 w-4" />
                              </button>
                            )}
                            {userSponsor && (
                              <button
                                onClick={() => handleRemoveSponsor(userSponsor.id, user.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                                title="Sponsor Yetkisini Kaldır"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sponsor Teams Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sponsor Ekipleri</h3>
          </div>
          
          <div className="p-6">
            {getSponsorUsers().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getSponsorUsers().map(sponsor => {
                  const teamMembers = adminUsers.filter(admin => 
                    (admin.role === 'sponsor' || admin.role === 'user') && admin.parentSponsorId === sponsor.userId
                  );
                  
                  return (
                    <div key={sponsor.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getUserName(sponsor.userId)}
                          </h4>
                          <p className="text-sm text-gray-500">{getUserEmail(sponsor.userId)}</p>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {sponsor.sponsorCode}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <strong>Ekip Üyeleri:</strong> {teamMembers.length}
                        </div>
                        
                        {teamMembers.length > 0 && (
                          <div className="max-h-32 overflow-y-auto">
                            {teamMembers.map(member => (
                              <div key={member.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span>{getUserName(member.userId)}</span>
                                <button
                                  onClick={() => handleRemoveFromSponsor(member.userId, sponsor.userId)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Ekipten Çıkar"
                                >
                                  <XCircle className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz sponsor yok</h3>
                <p className="text-gray-600">İlk sponsoru oluşturarak başlayın.</p>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText="Onayla"
          cancelText="İptal"
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
          type={confirmDialog.type}
        />
      </div>
    </Layout>
  );
};

export default SponsorAssignment;
