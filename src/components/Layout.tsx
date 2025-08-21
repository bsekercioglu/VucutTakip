import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Scale,
  MessageCircle,
  ShoppingBag,
  User,
  LogOut,
  Activity,
  Shield,
  Users,
  Settings,
  Crown
} from 'lucide-react';
import { debugLog } from '../config/appConfig';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, adminUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/measurements', icon: Scale, label: 'Ölçümler' },
    { path: '/consultant', icon: MessageCircle, label: 'Danışman' },
    { path: '/products', icon: ShoppingBag, label: 'Ürünler' },
    { path: '/profile', icon: User, label: 'Profil' },
  ];

  // Add admin menu item if user is admin/sponsor
  if (adminUser) {
          debugLog.log('🎯 Layout: Adding admin menu for role:', adminUser.role);
      debugLog.log('🎯 Layout: Admin permissions:', adminUser.permissions);
    menuItems.push({
      path: '/admin',
      icon: User,
      label: adminUser.role === 'admin' ? 'Admin Panel' : 'Sponsor Panel'
    });
    
    // Add admin management for super admins
    if (adminUser.role === 'admin') {
      debugLog.log('🎯 Layout: Adding admin management menu');
      menuItems.push({
        path: '/admin-management',
        icon: Shield,
        label: 'Yetki Yönetimi'
      });
          menuItems.push({
      path: '/sponsor-assignment',
      icon: Users,
      label: 'Sponsor Yönetimi'
    });
    menuItems.push({
      path: '/team-management',
      icon: Crown,
      label: 'Ekip Yönetimi'
    });
    menuItems.push({
      path: '/role-management',
      icon: Settings,
      label: 'Rol Yönetimi'
    });
    }
      } else {
      debugLog.log('❌ Layout: No admin user found, admin menu not added');
    }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">VücutTakip</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.photoURL && (
                <img
                  src={user.photoURL}
                  alt={`${user.firstName} profil fotoğrafı`}
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    // Hide image if it fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-sm text-gray-700">
                Hoş geldin, {user?.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;