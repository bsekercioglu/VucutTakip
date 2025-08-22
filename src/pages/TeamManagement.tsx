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
  RefreshCw,
  Copy,
  Eye,
  BarChart3,
  Download,
  ChevronDown,
  ChevronRight,
  Crown,
  Star,
  User
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import { AdminUser } from '../types/admin';
import { debugLog } from '../config/appConfig';
import { 
  loadUserTeamData, 
  createTeamInvitationLink,
  getSponsorHierarchy,
  getMultipleUsersInfo
} from '../services/adminService';

interface TeamMember extends AdminUser {
  teamSize: number;
  directMembers: number;
  totalMembers: number;
  performance: {
    totalOrders: number;
    totalRevenue: number;
    activeMembers: number;
  };
}

const TeamManagement: React.FC = () => {
  const { user, adminUser, isLoggedIn } = useUser();
  const { success, error } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [invitationLink, setInvitationLink] = useState('');
  const [usersInfo, setUsersInfo] = useState<Map<string, {
    displayName: string;
    email: string;
    firstName?: string;
    lastName?: string;
  }>>(new Map());

  // getUserName fonksiyonunu burada tanımla
  const getUserName = (userId: string) => {
    const userInfo = usersInfo.get(userId);
    if (userInfo) {
      return userInfo.displayName;
    }
    return userId; // Fallback to userId if no user info found
  };

  // İzin etiketlerini çevir
  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      'manage_users': 'Kullanıcı Yönetimi',
      'view_all_data': 'Tüm Verileri Görme',
      'manage_orders': 'Sipariş Yönetimi',
      'send_recommendations': 'Ürün Önerisi Gönderme',
      'answer_questions': 'Soru Yanıtlama',
      'view_reports': 'Raporları Görme',
      'manage_products': 'Ürün Yönetimi',
      'view_analytics': 'Analitik Görme',
      'export_data': 'Veri Dışa Aktarma',
      'manage_settings': 'Ayarları Yönetme'
    };
    return labels[permission] || permission;
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has team management permissions using adminUser from context
  if (!user || !adminUser || (adminUser.role !== 'admin' && adminUser.role !== 'sponsor')) {
    return <Navigate to="/" replace />;
  }

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        error('Hata!', 'Kullanıcı bilgisi bulunamadı');
        return;
      }
      
      // Admin ise tüm sponsorları, sponsor ise sadece kendi ekibini getir
      if (adminUser?.role === 'admin') {
        // Admin için tüm sponsorları getir
        const allSponsors = await loadUserTeamData(user.id);
        
        // Kullanıcı bilgilerini çek
        const userIds = allSponsors.map(sponsor => sponsor.userId);
        const usersInfoMap = await getMultipleUsersInfo(userIds);
        setUsersInfo(usersInfoMap);
        
        // Performance verilerini ekle
        const sponsorsWithPerformance: TeamMember[] = allSponsors.map(sponsor => ({
          ...sponsor,
          teamSize: Math.floor(Math.random() * 20) + 5, // Mock data
          directMembers: Math.floor(Math.random() * 8) + 2,
          totalMembers: Math.floor(Math.random() * 25) + 10,
          performance: {
            totalOrders: Math.floor(Math.random() * 50) + 10,
            totalRevenue: Math.floor(Math.random() * 10000) + 5000,
            activeMembers: Math.floor(Math.random() * 10) + 5
          }
        }));
        
        setTeamMembers(sponsorsWithPerformance);
      } else if (adminUser?.role === 'sponsor') {
        // Sponsor için sadece kendi ekibini getir
        const hierarchy = await getSponsorHierarchy(user.id);
        
        // Kullanıcı bilgilerini çek
        const userIds = hierarchy.directMembers.map(member => member.userId);
        const usersInfoMap = await getMultipleUsersInfo(userIds);
        setUsersInfo(usersInfoMap);
        
        const teamMembersData: TeamMember[] = hierarchy.directMembers.map(member => ({
          ...member,
          teamSize: hierarchy.allMembers.length,
          directMembers: hierarchy.directMembers.length,
          totalMembers: hierarchy.allMembers.length,
          performance: {
            totalOrders: Math.floor(Math.random() * 50) + 10, // Mock data
            totalRevenue: Math.floor(Math.random() * 10000) + 5000,
            activeMembers: Math.floor(Math.random() * 10) + 5
          }
        }));
        setTeamMembers(teamMembersData);
      }
    } catch (err) {
      debugLog.error('Error loading team data:', err);
      error('Hata!', 'Ekip verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const userName = getUserName(member.userId).toLowerCase();
    const matchesSearch = member.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.sponsorCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userName.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const toggleTeamExpansion = (memberId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(memberId)) {
      newExpanded.delete(memberId);
    } else {
      newExpanded.add(memberId);
    }
    setExpandedTeams(newExpanded);
  };

  const createInvitationLink = async (member: TeamMember) => {
    try {
      debugLog.log('🔄 Creating invitation link for member:', member.userId);
      debugLog.log('📋 Member data:', {
        userId: member.userId,
        role: member.role,
        sponsorCode: member.sponsorCode,
        teamLevel: member.teamLevel
      });
      
      // Kullanıcı durumunu kontrol et
      debugLog.log('👤 Current user:', user?.id);
      debugLog.log('🔐 Admin user:', adminUser);
      debugLog.log('🔑 Is logged in:', isLoggedIn);
      
      if (!user?.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı');
      }
      
      if (!isLoggedIn) {
        throw new Error('Kullanıcı giriş yapmamış');
      }
      
      setSelectedMember(member);
      
      debugLog.log('🔗 Calling createTeamInvitationLink...');
      const link = await createTeamInvitationLink(member.userId);
      debugLog.log('✅ Link created:', link);
      
      setInvitationLink(link);
      setShowInvitationModal(true);
      
      debugLog.log('✅ Invitation modal opened successfully');
    } catch (err) {
      debugLog.error('❌ Error creating invitation link:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      error('Hata!', `Davet linki oluşturulurken hata oluştu: ${errorMessage}`);
    }
  };

  const copyInvitationLink = () => {
    navigator.clipboard.writeText(invitationLink);
    success('Başarılı!', 'Davet linki kopyalandı');
  };

  const copyInvitationTemplate = async (member: TeamMember) => {
    try {
      debugLog.log('🔄 Creating invitation template for member:', member.userId);
      
      // Davet linkini oluştur
      const invitationLink = await createTeamInvitationLink(member.userId);
      
      const template = `🎉 VücutTakip Ekip Daveti!

👋 Merhaba! ${member.sponsorCode} sponsor kodlu ekibimize davet edildiniz.

👥 Ekip Bilgileri:
• Sponsor: ${getUserName(member.userId)}
• Sponsor Kodu: ${member.sponsorCode}
• Ekip Büyüklüğü: ${member.teamSize} üye
• Aktif Üyeler: ${member.performance.activeMembers}

📊 Ekip Performansı:
• Toplam Sipariş: ${member.performance.totalOrders}
• Toplam Gelir: ${member.performance.totalRevenue} TL
• Başarı Oranı: ${Math.round((member.performance.activeMembers / member.teamSize) * 100)}%

🔗 Kayıt olmak için aşağıdaki linki kullanın:
${invitationLink}

📱 VücutTakip ile sağlıklı yaşam yolculuğunuza başlayın!

#VücutTakip #Ekip #SağlıklıYaşam`;

      // Şablonu panoya kopyala
      await navigator.clipboard.writeText(template);
      
      debugLog.log('✅ Invitation template copied to clipboard');
      
      // Toast mesajı ile şablonu göster
      success(
        'Davet Şablonu Kopyalandı! 📋', 
        `Şablon panoya kopyalandı. Şablonu görmek için tıklayın.`,
        {
          duration: 8000,
          action: {
            label: 'Şablonu Göster',
            onClick: () => {
              // Şablonu modal olarak göster
              setSelectedMember(member);
              setInvitationLink(invitationLink);
              setShowInvitationModal(true);
            }
          }
        }
      );
      
    } catch (err) {
      debugLog.error('❌ Error creating invitation template:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      error('Hata!', `Davet şablonu oluşturulurken hata oluştu: ${errorMessage}`);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'sponsor':
        return <Star className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'sponsor':
        return 'Sponsor';
      default:
        return 'Kullanıcı';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Ekip Yönetimi</h1>
          <p className="mt-2 text-gray-600">
            Ekip üyelerinizi yönetin, performanslarını takip edin ve davet linkleri oluşturun
          </p>
        </div>

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Ekip</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.reduce((sum, member) => sum + member.totalMembers, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aktif Üyeler</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.reduce((sum, member) => sum + member.performance.activeMembers, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.reduce((sum, member) => sum + member.performance.totalOrders, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teamMembers.reduce((sum, member) => sum + member.performance.totalRevenue, 0).toLocaleString()} TL
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Kullanıcı adı, ID veya Sponsor Kodu ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Tüm Roller</option>
                <option value="admin">Admin</option>
                <option value="sponsor">Sponsor</option>
                <option value="user">Kullanıcı</option>
              </select>
              
              <button
                onClick={loadTeamData}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                title="Yenile"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ekip Üyeleri</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <div key={member.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member.role)}
                      <span className="text-sm font-medium text-gray-900">
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{getUserName(member.userId)}</h3>
                      <p className="text-sm text-gray-600">
                        {member.sponsorCode ? `Sponsor Kodu: ${member.sponsorCode}` : 'Kullanıcı'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Ekip Büyüklüğü</p>
                      <p className="text-lg font-semibold text-gray-900">{member.teamSize}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Performans</p>
                      <p className="text-lg font-semibold text-green-600">
                        {Math.round((member.performance.activeMembers / member.teamSize) * 100)}%
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleTeamExpansion(member.id)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                        title="Ekip Detayları"
                      >
                        {expandedTeams.has(member.id) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => createInvitationLink(member)}
                        className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Davet Linki Oluştur"
                      >
                        <UserPlus className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => copyInvitationTemplate(member)}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                        title="Davet Şablonu Kopyala"
                      >
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Team Details */}
                {expandedTeams.has(member.id) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Ekip İstatistikleri</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Doğrudan Üyeler:</span>
                            <span className="text-sm font-medium">{member.directMembers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Toplam Üyeler:</span>
                            <span className="text-sm font-medium">{member.totalMembers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Ekip Seviyesi:</span>
                            <span className="text-sm font-medium">{member.teamLevel}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Performans</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Toplam Sipariş:</span>
                            <span className="text-sm font-medium">{member.performance.totalOrders}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Toplam Gelir:</span>
                            <span className="text-sm font-medium">{member.performance.totalRevenue.toLocaleString()} TL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Aktif Üyeler:</span>
                            <span className="text-sm font-medium">{member.performance.activeMembers}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">İzinler</h4>
                        <div className="flex flex-wrap gap-1">
                          {member.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {getPermissionLabel(permission)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Invitation Modal */}
        {showInvitationModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Davet Linki ve Şablonu
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Davet Linki Bölümü */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">🔗 Davet Linki</h4>
                  <p className="text-gray-600 mb-4">
                    <strong>{getUserName(selectedMember.userId)}</strong> için davet linki oluşturuldu.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Davet Linki:
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={invitationLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                      />
                      <button
                        onClick={copyInvitationLink}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                      >
                        Kopyala
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Önemli Notlar:</h5>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Link 7 gün boyunca geçerlidir</li>
                      <li>• Yeni üyeler otomatik olarak ekibe katılır</li>
                      <li>• Sponsor kodu: {selectedMember.sponsorCode}</li>
                    </ul>
                  </div>
                </div>

                {/* Şablon Bölümü */}
                <div>
                  <h4 className="text-md font-medium text-gray-700 mb-3">📋 Davet Şablonu</h4>
                  <p className="text-gray-600 mb-4">
                    Aşağıdaki şablon panoya kopyalandı. İhtiyacınıza göre düzenleyebilirsiniz.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şablon:
                    </label>
                    <textarea
                      value={`🎉 VücutTakip Ekip Daveti!

👋 Merhaba! ${selectedMember.sponsorCode} sponsor kodlu ekibimize davet edildiniz.

👥 Ekip Bilgileri:
• Sponsor: ${getUserName(selectedMember.userId)}
• Sponsor Kodu: ${selectedMember.sponsorCode}
• Ekip Büyüklüğü: ${selectedMember.teamSize} üye
• Aktif Üyeler: ${selectedMember.performance.activeMembers}

📊 Ekip Performansı:
• Toplam Sipariş: ${selectedMember.performance.totalOrders}
• Toplam Gelir: ${selectedMember.performance.totalRevenue} TL
• Başarı Oranı: ${Math.round((selectedMember.performance.activeMembers / selectedMember.teamSize) * 100)}%

🔗 Kayıt olmak için aşağıdaki linki kullanın:
${invitationLink}

📱 VücutTakip ile sağlıklı yaşam yolculuğunuza başlayın!

#VücutTakip #Ekip #SağlıklıYaşam`}
                      readOnly
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-mono resize-none"
                    />
                  </div>
                  
                  <button
                    onClick={() => {
                      const template = `🎉 VücutTakip Ekip Daveti!

👋 Merhaba! ${selectedMember.sponsorCode} sponsor kodlu ekibimize davet edildiniz.

👥 Ekip Bilgileri:
• Sponsor: ${getUserName(selectedMember.userId)}
• Sponsor Kodu: ${selectedMember.sponsorCode}
• Ekip Büyüklüğü: ${selectedMember.teamSize} üye
• Aktif Üyeler: ${selectedMember.performance.activeMembers}

📊 Ekip Performansı:
• Toplam Sipariş: ${selectedMember.performance.totalOrders}
• Toplam Gelir: ${selectedMember.performance.totalRevenue} TL
• Başarı Oranı: ${Math.round((selectedMember.performance.activeMembers / selectedMember.teamSize) * 100)}%

🔗 Kayıt olmak için aşağıdaki linki kullanın:
${invitationLink}

📱 VücutTakip ile sağlıklı yaşam yolculuğunuza başlayın!

#VücutTakip #Ekip #SağlıklıYaşam`;
                      navigator.clipboard.writeText(template);
                      success('Başarılı!', 'Şablon tekrar kopyalandı');
                    }}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Şablonu Tekrar Kopyala
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowInvitationModal(false)}
                  className="bg-gray-300 text-gray-700 py-2 px-6 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeamManagement;
