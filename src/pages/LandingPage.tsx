import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Scale, TrendingUp, Users, MessageCircle, Award } from 'lucide-react';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: Scale,
      title: 'Günlük Takip',
      description: 'Ağırlık, yağ oranı ve su oranınızı günlük olarak kaydedin ve gelişiminizi izleyin.'
    },
    {
      icon: TrendingUp,
      title: 'Gelişim Analizi',
      description: 'Detaylı grafikler ve analizlerle vücut gelişiminizi objektif şekilde değerlendirin.'
    },
    {
      icon: MessageCircle,
      title: 'Uzman Danışmanlık',
      description: 'Profesyonel danışmanlarımızdan kişisel tavsiyeler alın ve sorularınızı sorun.'
    },
    {
      icon: Award,
      title: 'Kişisel Program',
      description: 'Size özel beslenme ve egzersiz programları ile hedeflerinize ulaşın.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">VücutTakip</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Üye Ol
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Vücut Gelişiminizi
              <span className="text-blue-600 block">Profesyonel Şekilde Takip Edin</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Günlük ölçümlerinizi kaydedin, gelişiminizi analiz edin ve uzman danışmanlarımızdan 
              kişisel tavsiyeleri alarak hedeflerinize ulaşın.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/register"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors transform hover:scale-105"
              >
                Hemen Başla
              </Link>
              <Link
                to="/login"
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Neden VücutTakip?
            </h2>
            <p className="text-xl text-gray-600">
              Sağlıklı yaşam yolculuğunuzda size eşlik edecek özellikler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 group-hover:bg-blue-200 transition-colors">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-12">
              Güvenilir Platform
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">50,000+</div>
                <div className="text-blue-100">Aktif Kullanıcı</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">1M+</div>
                <div className="text-blue-100">Günlük Ölçüm</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">95%</div>
                <div className="text-blue-100">Memnuniyet Oranı</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-blue-400" />
              <span className="ml-2 text-xl font-bold">VücutTakip</span>
            </div>
            <p className="text-gray-400 mb-4">
              Sağlıklı yaşam yolculuğunuzda en güvenilir takip platformu
            </p>
            <div className="text-sm text-gray-500">
              © 2024 VücutTakip. Tüm hakları saklıdır.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;