import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Plus, Edit3, Trash2, Key, UserCheck } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import { 
  getAllAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser,
  generateSponsorCode,
  getAllUsers 
} from '../services/adminService';
import { AdminUser } from '../types/admin';
import { User } from '../services/firebaseService';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';

const AdminManagement: React.FC = () => {
  const { user, adminUser, isLoggedIn } = useUser();
  const { success, error } = useToast();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
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
    role: 'sponsor' as 'admin' | 'sponsor',
    permissions: [] as string[],
    sponsorCode: '',
    parentSponsorId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [admins, users] = await Promise.all([
        getAllAdminUsers(),
        getAllUsers()
      ]);
      setAdminUsers(admins);
      setAllUsers(users);
    } catch (err) {
      console.error('Error loading data:', err);
      error('Hata!', 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId) {
      error('Hata!', 'Kullanıcı seçimi gerekli');
      return;
    }

    const adminData = {
      role: formData.role,
      permissions: formData.permissions,
      sponsorCode: formData.role === 'sponsor' ? (formData.sponsorCode || generateSponsorCode()) : undefined,
      parentSponsorId: formData.parentSponsorId || undefined
    };

    try {
      let result;
      if (editingAdmin) {
        result = await updateAdminUser(editingAdmin.id, adminData);
      } else {
        result = await createAdminUser(formData.userId, adminData);
      }

      if (result.success) {
        success('Başarılı!', editingAdmin ? 'Yetki güncellendi' : 'Yeni yetki eklendi');
        setShowAddForm(false);
        setEditingAdmin(null);
        resetForm();
        await loadData();
      } else {
        error('Hata!', 'İşlem sırasında hata oluştu');
      }
    } catch (err) {
      console.error('Error saving admin:', err);
      error('Hata!', 'Beklenmeyen bir hata oluştu');
    }
  };

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormData({
      userId: admin.userId,
      role: admin.role,
      permissions: admin.permissions,
      sponsorCode: admin.sponsorCode || '',
      parentSponsorId: admin.parentSponsorId || ''
    });
    setShowAddForm(true);
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

  const resetForm = () => {
    setFormData({
      userId: '',
      role: 'sponsor',
      permissions: [],
      sponsorCode: '',
      parentSponsorId: ''
    });
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingAdmin(null);
    resetForm();
  };

  const availablePermissions = [
    'manage_users',
    'view_all_data',
    'manage_orders',
    'send_recommendations',
    'answer_questions'
  ];

  const getPermissionLabel = (permission: string) => {
    const labels = {
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
    !adminUsers.some(admin => admin.userId === u.id) || 
    (editingAdmin && editingAdmin.userId === u.id)
  );

  const sponsorUsers = adminUsers.filter(admin => admin.role === 'sponsor');

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
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Yetki Ekle
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'sponsor' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="sponsor">Sponsor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

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
            <h3 className="text-lg font-semibold text-gray-900">Yetkili Kullanıcılar</h3>
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

        {/* Manual Firebase Setup */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">🔧 Manuel Admin Ekleme (Firebase Console)</h3>
          <div className="space-y-2 text-blue-800 text-sm">
            <p><strong>1.</strong> Firebase Console → Firestore Database</p>
            <p><strong>2.</strong> "admins" koleksiyonuna git</p>
            <p><strong>3.</strong> Yeni doküman ekle (Document ID = User ID)</p>
            <p><strong>4.</strong> Aşağıdaki alanları ekle:</p>
            <div className="bg-blue-100 p-3 rounded mt-2 font-mono text-xs">
              <p>userId: "kullanıcı_id_buraya"</p>
              <p>role: "admin" veya "sponsor"</p>
              <p>permissions: ["manage_users", "view_all_data"]</p>
              <p>sponsorCode: "SPONSOR123" (sadece sponsor için)</p>
              <p>createdAt: "2024-01-01T00:00:00.000Z"</p>
              <p>updatedAt: "2024-01-01T00:00:00.000Z"</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminManagement;