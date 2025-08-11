import React from 'react';
import { Navigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Scale, TrendingDown, TrendingUp, Target, Calendar, Share2 } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Layout from '../components/Layout';
import { getBodyCompositionRanges, calculateAge } from '../utils/bodyComposition';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import html2canvas from 'html2canvas';

// calculateAge fonksiyonunu import etmek için utils'den alıyoruz
// Eğer zaten import edilmişse bu satırı kaldırabilirsiniz

const Dashboard: React.FC = () => {
  const { user, dailyRecords, isLoggedIn } = useUser();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Calculate stats
  const latestRecord = dailyRecords[dailyRecords.length - 1];
  const firstRecord = dailyRecords[0];
  const weightChange = latestRecord && firstRecord ? latestRecord.weight - firstRecord.weight : 0;
  const bodyFatChange = latestRecord && firstRecord && latestRecord.bodyFat && firstRecord.bodyFat 
    ? latestRecord.bodyFat - firstRecord.bodyFat : 0;

  // Calculate age and get reference ranges
  const age = user?.birthDate ? calculateAge(user.birthDate) : 25;
  const ranges = user ? getBodyCompositionRanges(age, user.gender) : null;

  // Prepare chart data
  const chartData = dailyRecords.map(record => ({
    date: new Date(record.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
    weight: record.weight,
    bodyFat: record.bodyFat,
    water: record.waterPercentage,
    muscle: record.musclePercentage
  }));

  const shareProgress = async () => {
    const element = document.getElementById('progress-charts');
    if (element) {
      const canvas = await html2canvas(element);
      const dataUrl = canvas.toDataURL();
      
      // Create a temporary link to download the image
      const link = document.createElement('a');
      link.download = 'vucut-gelisimim.png';
      link.href = dataUrl;
      link.click();
    }
  };

  const statCards = [
    {
      title: 'Mevcut Ağırlık',
      value: latestRecord ? `${latestRecord.weight} kg` : 'N/A',
      change: weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '',
      icon: Scale,
      color: weightChange > 0 ? 'text-red-600' : weightChange < 0 ? 'text-green-600' : 'text-gray-600'
    },
    {
      title: 'Yağ Oranı',
      value: latestRecord?.bodyFat ? `${latestRecord.bodyFat}%` : 'N/A',
      change: bodyFatChange !== 0 ? `${bodyFatChange > 0 ? '+' : ''}${bodyFatChange.toFixed(1)}%` : '',
      icon: TrendingDown,
      color: bodyFatChange > 0 ? 'text-red-600' : bodyFatChange < 0 ? 'text-green-600' : 'text-gray-600'
    },
    {
      title: 'Su Oranı',
      value: latestRecord?.waterPercentage ? `${latestRecord.waterPercentage}%` : 'N/A',
      change: '',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      title: 'Takip Süresi',
      value: `${dailyRecords.length} gün`,
      change: '',
      icon: Calendar,
      color: 'text-purple-600'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">
            Hoş geldin, {user?.firstName}!
          </h1>
          <p className="text-blue-100">
            Bugün nasıl hissediyorsun? Günlük ölçümlerini eklemeyi unutma.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <Icon className="h-6 w-6 text-gray-600" />
                  </div>
                  {stat.change && (
                    <span className={`text-sm font-medium ${stat.color}`}>
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div id="progress-charts" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Gelişim Grafikleri</h2>
            <button
              onClick={shareProgress}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Paylaş
            </button>
          </div>

          {/* Profile Summary for Share */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">{user?.firstName} {user?.lastName}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-blue-100">Yaş</div>
                    <div className="font-semibold">{user?.birthDate ? calculateAge(user.birthDate) : '-'}</div>
                  </div>
                  <div>
                    <div className="text-blue-100">Boy</div>
                    <div className="font-semibold">{user?.height} cm</div>
                  </div>
                  <div>
                    <div className="text-blue-100">Başlangıç</div>
                    <div className="font-semibold">{user?.initialWeight} kg</div>
                  </div>
                  <div>
                    <div className="text-blue-100">Mevcut</div>
                    <div className="font-semibold">{latestRecord ? `${latestRecord.weight} kg` : '-'}</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-blue-100 text-sm">Toplam Değişim</div>
                <div className="text-2xl font-bold">
                  {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg` : '0 kg'}
                </div>
                <div className="text-blue-100 text-sm">{dailyRecords.length} gün takip</div>
              </div>
            </div>
          </div>

          {/* Weight Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ağırlık Gelişimi</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Body Fat Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yağ Oranı Gelişimi</h3>
            {ranges && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-200 mr-2"></span>
                Optimal: {ranges.bodyFat.optimal}% | 
                <span className="inline-block w-3 h-3 bg-yellow-200 mx-2"></span>
                Normal: {ranges.bodyFat.min}-{ranges.bodyFat.max}%
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  {ranges && (
                    <>
                      <ReferenceLine y={ranges.bodyFat.optimal} stroke="#10B981" strokeDasharray="5 5" />
                      <ReferenceLine y={ranges.bodyFat.min} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={ranges.bodyFat.max} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bodyFat" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Yağ Oranı (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Percentage Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Su Oranı Gelişimi</h3>
            {ranges && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-200 mr-2"></span>
                Optimal: {ranges.water.optimal}% | 
                <span className="inline-block w-3 h-3 bg-yellow-200 mx-2"></span>
                Normal: {ranges.water.min}-{ranges.water.max}%
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  {ranges && (
                    <>
                      <ReferenceLine y={ranges.water.optimal} stroke="#10B981" strokeDasharray="5 5" />
                      <ReferenceLine y={ranges.water.min} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={ranges.water.max} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="water"
                    stroke="#06B6D4" 
                    strokeWidth={2}
                    name="Su Oranı (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Muscle Percentage Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kas Oranı Gelişimi</h3>
            {ranges && (
              <div className="mb-4 text-sm text-gray-600">
                <span className="inline-block w-3 h-3 bg-green-200 mr-2"></span>
                Optimal: {ranges.muscle.optimal}% | 
                <span className="inline-block w-3 h-3 bg-yellow-200 mx-2"></span>
                Normal: {ranges.muscle.min}-{ranges.muscle.max}%
              </div>
            )}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  {ranges && (
                    <>
                      <ReferenceLine y={ranges.muscle.optimal} stroke="#10B981" strokeDasharray="5 5" />
                      <ReferenceLine y={ranges.muscle.min} stroke="#F59E0B" strokeDasharray="3 3" />
                      <ReferenceLine y={ranges.muscle.max} stroke="#F59E0B" strokeDasharray="3 3" />
                    </>
                  )}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #ccc',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="muscle"
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Kas Oranı (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Share Statistics Summary */}
        <div id="share-stats" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gelişim Özeti</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dailyRecords.length}</div>
              <div className="text-sm text-gray-600">Gün Takip</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weightChange !== 0 ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}` : '0'}
              </div>
              <div className="text-sm text-gray-600">kg Değişim</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {latestRecord?.bodyFat ? `${latestRecord.bodyFat}%` : '-'}
              </div>
              <div className="text-sm text-gray-600">Yağ Oranı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {user ? (user.initialWeight / Math.pow(user.height / 100, 2)).toFixed(1) : '-'}
              </div>
              <div className="text-sm text-gray-600">BMI</div>
            </div>
          </div>
          
          {/* VücutTakip Branding */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <div className="flex items-center justify-center text-blue-600">
              <Activity className="h-6 w-6 mr-2" />
              <span className="text-lg font-bold">VücutTakip</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Sağlıklı yaşam yolculuğunuzda yanınızdayız</p>
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Ölçümler</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-200">
                  <th className="pb-3 text-sm font-medium text-gray-600">Tarih</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Ağırlık</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Yağ Oranı</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Su Oranı</th>
                  <th className="pb-3 text-sm font-medium text-gray-600">Kas Oranı</th>
                </tr>
              </thead>
              <tbody>
                {dailyRecords.slice(-5).reverse().map((record) => (
                  <tr key={record.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 text-sm text-gray-900">{record.weight} kg</td>
                    <td className="py-3 text-sm text-gray-900">
                      {record.bodyFat ? `${record.bodyFat}%` : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {record.waterPercentage ? `${record.waterPercentage}%` : '-'}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {record.musclePercentage ? `${record.musclePercentage}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;