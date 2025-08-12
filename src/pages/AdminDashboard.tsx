import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Users, Package, MessageSquare, TrendingUp, Settings, UserPlus } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { getAdminUser, getSponsorTeamMembers, getSponsorOrders, getUserSponsorMessages } from '../services/adminService';
import { AdminUser, SponsorTeam, Order, SponsorMessage } from '../types/admin';
import Layout from '../components/Layout';

const AdminDashboard: React.FC = () => {
  const { user, isLoggedIn } = useUser();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [teamMembers, setTeamMembers] = useState<SponsorTeam[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<SponsorMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!user) return;

      try {
        const admin = await getAdminUser(user.id);
        if (!admin) {
          setLoading(false);
          return;
        }

        setAdminUser(admin);

        if (admin.role === 'sponsor') {
          const [members, sponsorOrders, sponsorMessages] = await Promise.all([
            getSponsorTeamMembers(user.id),
            getSponsorOrders(user.id),
            getUserSponsorMessages(user.id)
          ]);

          setTeamMembers(members);
          setOrders(sponsorOrders);
          setMessages(sponsorMessages);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, [user]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
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

  if (!adminUser) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Yetkisiz Erişim</h3>
          <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
        </div>
      </Layout>
    );
  }

  const stats = [
    {
      title: 'Ekip Üyeleri',
      value: teamMembers.length,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Bekleyen Siparişler',
      value: orders.filter(o => o.status === 'pending').length,
      icon: Package,
      color: 'bg-yellow-500'
    },
    {
      title: 'Mesajlar',
      value: messages.filter(m => !m.response).length,
      icon: MessageSquare,
      color: 'bg-green-500'
    },
    {
      title: 'Toplam Sipariş',
      value: orders.length,
      icon: TrendingUp,
      color: 'bg-purple-500'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {adminUser.role === 'admin' ? 'Admin Paneli' : 'Sponsor Paneli'}
            </h1>
            <p className="text-gray-600 mt-1">
              {adminUser.role === 'sponsor' && adminUser.sponsorCode && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  Sponsor Kodu: {adminUser.sponsorCode}
                </span>
              )}
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Yeni Üye Ekle
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ekip Üyeleri</h3>
          </div>
          <div className="p-6">
            {teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Üye ID: {member.memberId}</p>
                      <p className="text-sm text-gray-600">
                        Katılım: {new Date(member.joinedAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Aktif
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz ekip üyeniz bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Son Siparişler</h3>
          </div>
          <div className="p-6">
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Sipariş #{order.id.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.products.length} ürün - ₺{order.totalAmount}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status === 'pending' ? 'Bekliyor' :
                       order.status === 'processing' ? 'İşleniyor' :
                       order.status === 'shipped' ? 'Kargoda' :
                       order.status === 'delivered' ? 'Teslim Edildi' : 'İptal'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Henüz sipariş bulunmamaktadır.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;