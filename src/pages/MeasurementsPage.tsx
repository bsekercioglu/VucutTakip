import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Scale, Droplets, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Layout from '../components/Layout';

interface MeasurementFormData {
  date: string;
  weight: number;
  bodyFat?: number;
  waterPercentage?: number;
  musclePercentage?: number;
}

const MeasurementsPage: React.FC = () => {
  const { user, dailyRecords, addDailyRecord, isLoggedIn, loading } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MeasurementFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (data: MeasurementFormData) => {
    setIsSubmitting(true);
    try {
      const success = await addDailyRecord({
        date: data.date,
        weight: data.weight,
        bodyFat: data.bodyFat,
        waterPercentage: data.waterPercentage,
        musclePercentage: data.musclePercentage
      });
      
      if (success) {
        console.log('Measurement successfully saved to database');
        reset({
          date: new Date().toISOString().split('T')[0],
          weight: undefined,
          bodyFat: undefined,
          waterPercentage: undefined,
          musclePercentage: undefined
        });
        setShowForm(false);
        alert('Ölçüm başarıyla kaydedildi!');
      } else {
        alert('Ölçüm kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error submitting measurement:', error);
      alert('Ölçüm kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debug logging
  console.log('MeasurementsPage - User:', user?.id);
  console.log('MeasurementsPage - Daily Records:', dailyRecords);
  console.log('MeasurementsPage - Loading:', loading);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Veriler yükleniyor...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800">Debug Info:</h4>
            <p className="text-sm text-yellow-700">User ID: {user?.id}</p>
            <p className="text-sm text-yellow-700">Records Count: {dailyRecords.length}</p>
            <p className="text-sm text-yellow-700">Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Günlük Ölçümler</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Ölçüm
          </button>
        </div>

        {/* Add Measurement Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Ölçüm Ekle</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    {...register('date', { required: 'Tarih gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('weight', { required: 'Ağırlık gerekli', min: 30, max: 200 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yağ Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('bodyFat', { min: 5, max: 50 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="İsteğe bağlı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Su Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('waterPercentage', { min: 40, max: 80 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="İsteğe bağlı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kas Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('musclePercentage', { min: 20, max: 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="İsteğe bağlı"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Kaydediliyor...
                    </>
                  ) : (
                    'Kaydet'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Measurements History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ölçüm Geçmişi</h3>
              <span className="text-sm text-gray-500">
                Toplam {dailyRecords.length} kayıt
              </span>
            </div>
          </div>
          
          {dailyRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Scale className="h-4 w-4 mr-1" />
                        Ağırlık
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-1" />
                        Yağ Oranı
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <Droplets className="h-4 w-4 mr-1" />
                        Su Oranı
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Kas Oranı
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Değişim
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyRecords.slice().reverse().map((record, index) => {
                    const prevRecord = index < dailyRecords.length - 1 ? dailyRecords[dailyRecords.length - 2 - index] : null;
                    const weightChange = prevRecord ? record.weight - prevRecord.weight : 0;
                    
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.bodyFat ? `${record.bodyFat}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.waterPercentage ? `${record.waterPercentage}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.musclePercentage ? `${record.musclePercentage}%` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {weightChange !== 0 && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              weightChange > 0 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ölçüm yok</h3>
              <p className="text-gray-600 mb-4">İlk ölçümünüzü ekleyerek başlayın.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                İlk Ölçümü Ekle
              </button>
            </div>
          )}
        </div>

        {/* Firebase Connection Status */}
        {!user && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">Kullanıcı bilgileri yüklenemedi. Lütfen sayfayı yenileyin.</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MeasurementsPage;
      date: data.date,
      weight: data.weight,
      bodyFat: data.bodyFat,
      waterPercentage: data.waterPercentage,
      musclePercentage: data.musclePercentage
    }).then((success) => {
      if (success) {
        console.log('Measurement successfully saved to database');
        reset();
        setShowForm(false);
      } else {
        alert('Ölçüm kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
      }
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Günlük Ölçümler</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Ölçüm
          </button>
        </div>

        {/* Add Measurement Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Ölçüm Ekle</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                  <input
                    type="date"
                    {...register('date', { required: 'Tarih gerekli' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.date && (
                    <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ağırlık (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('weight', { required: 'Ağırlık gerekli', min: 30, max: 200 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.weight && (
                    <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yağ Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('bodyFat', { min: 5, max: 50 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="İsteğe bağlı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Su Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('waterPercentage', { min: 40, max: 80 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="İsteğe bağlı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kas Oranı (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('musclePercentage', { min: 20, max: 60 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="İsteğe bağlı"
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Measurements History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Ölçüm Geçmişi</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Scale className="h-4 w-4 mr-1" />
                      Ağırlık
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Yağ Oranı
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Droplets className="h-4 w-4 mr-1" />
                      Su Oranı
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Kas Oranı
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Değişim
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyRecords.slice().reverse().map((record, index) => {
                  const prevRecord = index < dailyRecords.length - 1 ? dailyRecords[dailyRecords.length - 2 - index] : null;
                  const weightChange = prevRecord ? record.weight - prevRecord.weight : 0;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.weight} kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.bodyFat ? `${record.bodyFat}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.waterPercentage ? `${record.waterPercentage}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.musclePercentage ? `${record.musclePercentage}%` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {weightChange !== 0 && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            weightChange > 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {dailyRecords.length === 0 && (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ölçüm yok</h3>
              <p className="text-gray-600 mb-4">İlk ölçümünüzü ekleyerek başlayın.</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                İlk Ölçümü Ekle
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MeasurementsPage;