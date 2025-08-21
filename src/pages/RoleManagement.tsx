import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Shield,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Save,
  X,
  Copy,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { UserRole } from '../types/admin';
import { debugLog } from '../config/appConfig';
import { 
  loadUserRoles, 
  createUserRole, 
  updateUserRole, 
  deleteUserRole 
} from '../services/adminService';

const RoleManagement: React.FC = () => {
  const { user, adminUser, isLoggedIn } = useUser();
  const { success, error } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<UserRole | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    canCreateInvitations: false,
    canViewTeamData: false,
    maxTeamLevel: 0
  });

  // Available permissions
  const availablePermissions = [
    { key: 'manage_users', label: 'Kullanıcı Yönetimi' },
    { key: 'view_all_data', label: 'Tüm Verileri Görüntüleme' },
    { key: 'manage_orders', label: 'Sipariş Yönetimi' },
    { key: 'send_recommendations', label: 'Ürün Önerisi Gönderme' },
    { key: 'answer_questions', label: 'Soru Cevaplama' },
    { key: 'create_invitations', label: 'Davet Linki Oluşturma' },
    { key: 'view_team_data', label: 'Ekip Verilerini Görüntüleme' },
    { key: 'manage_roles', label: 'Rol Yönetimi' },
    { key: 'export_data', label: 'Veri Dışa Aktarma' },
    { key: 'view_analytics', label: 'Analitik Görüntüleme' }
  ];

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin using adminUser from context
  if (!user || !adminUser || adminUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await loadUserRoles();
      setRoles(rolesData);
    } catch (err) {
      debugLog.error('Error loading roles:', err);
      error('Hata!', 'Roller yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleAddRole = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      canCreateInvitations: false,
      canViewTeamData: false,
      maxTeamLevel: 0
    });
    setEditingRole(null);
    setShowAddForm(true);
  };

  const handleEditRole = (role: UserRole) => {
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      canCreateInvitations: role.canCreateInvitations,
      canViewTeamData: role.canViewTeamData,
      maxTeamLevel: role.maxTeamLevel
    });
    setEditingRole(role);
    setShowAddForm(true);
  };

  const handleDeleteRole = (role: UserRole) => {
    setRoleToDelete(role);
    setShowDeleteDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      error('Hata!', 'Rol adı gereklidir');
      return;
    }

    try {
      const roleData = {
        ...formData,
        createdAt: editingRole ? editingRole.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingRole) {
        await updateUserRole(editingRole.id, roleData);
        setRoles(roles.map(r => r.id === editingRole.id ? { ...roleData, id: editingRole.id } : r));
        success('Başarılı!', 'Rol güncellendi');
      } else {
        const newRole = await createUserRole(roleData);
        setRoles([...roles, newRole]);
        success('Başarılı!', 'Rol oluşturuldu');
      }

      setShowAddForm(false);
      setEditingRole(null);
    } catch (err) {
      debugLog.error('Error saving role:', err);
      error('Hata!', 'Rol kaydedilirken hata oluştu');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;

    try {
      await deleteUserRole(roleToDelete.id);
      setRoles(roles.filter(r => r.id !== roleToDelete.id));
      success('Başarılı!', 'Rol silindi');
    } catch (err) {
      debugLog.error('Error deleting role:', err);
      error('Hata!', 'Rol silinirken hata oluştu');
    } finally {
      setShowDeleteDialog(false);
      setRoleToDelete(null);
    }
  };

  const getPermissionLabel = (permission: string): string => {
    const perm = availablePermissions.find(p => p.key === permission);
    return perm ? perm.label : permission;
  };

  const copyInvitationTemplate = (role: UserRole) => {
    const template = `🎉 VücutTakip'e Davetlisiniz!

👋 Merhaba! ${role.name} rolü ile VücutTakip sistemine davet edildiniz.

📋 Rol Detayları:
• Rol: ${role.name}
• Açıklama: ${role.description}
• Davet Linki Oluşturabilir: ${role.canCreateInvitations ? 'Evet' : 'Hayır'}
• Ekip Verilerini Görebilir: ${role.canViewTeamData ? 'Evet' : 'Hayır'}

🔗 Kayıt olmak için aşağıdaki linki kullanın:
[DAVET_LINKI_BURAYA]

📱 VücutTakip ile sağlıklı yaşam yolculuğunuza başlayın!

#VücutTakip #SağlıklıYaşam`;

    navigator.clipboard.writeText(template);
    success('Başarılı!', 'Davet şablonu kopyalandı');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rol Yönetimi</h1>
          <p className="mt-2 text-gray-600">
            Sistem kullanıcılarının rollerini ve yetkilerini yönetin
          </p>
        </div>

        {/* Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 mr-2" />
              {roles.length} rol tanımlı
            </div>
          </div>
          <button
            onClick={handleAddRole}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Rol Ekle
          </button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditRole(role)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyInvitationTemplate(role)}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Davet Şablonu Kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {role.id !== '1' && ( // Don't allow deleting Admin role
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Role Features */}
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  {role.canCreateInvitations ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={role.canCreateInvitations ? 'text-green-700' : 'text-gray-500'}>
                    Davet Linki Oluşturabilir
                  </span>
                </div>

                <div className="flex items-center text-sm">
                  {role.canViewTeamData ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                  )}
                  <span className={role.canViewTeamData ? 'text-green-700' : 'text-gray-500'}>
                    Ekip Verilerini Görebilir
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  <span className="font-medium">Maksimum Ekip Seviyesi:</span> {role.maxTeamLevel === 0 ? 'Sınırsız' : role.maxTeamLevel}
                </div>
              </div>

              {/* Permissions */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">İzinler:</h4>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.length > 0 ? (
                    role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                      >
                        {getPermissionLabel(permission)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">İzin yok</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Role Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingRole ? 'Rol Düzenle' : 'Yeni Rol Ekle'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maksimum Ekip Seviyesi
                  </label>
                  <select
                    value={formData.maxTeamLevel}
                    onChange={(e) => setFormData({ ...formData, maxTeamLevel: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={0}>Sınırsız (Admin)</option>
                    <option value={1}>1 Seviye (Sponsor)</option>
                    <option value={2}>2 Seviye (Alt Sponsor)</option>
                    <option value={3}>3 Seviye</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.canCreateInvitations}
                      onChange={(e) => setFormData({ ...formData, canCreateInvitations: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Davet Linki Oluşturabilir</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.canViewTeamData}
                      onChange={(e) => setFormData({ ...formData, canViewTeamData: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Ekip Verilerini Görebilir</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İzinler
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availablePermissions.map((permission) => (
                      <label key={permission.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                permissions: [...formData.permissions, permission.key]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                permissions: formData.permissions.filter(p => p !== permission.key)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{permission.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingRole(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingRole ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteConfirm}
          title="Rol Sil"
          message={`"${roleToDelete?.name}" rolünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
        />
      </div>
    </Layout>
  );
};

export default RoleManagement;
