import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Scale, Droplets, TrendingDown, TrendingUp } from 'lucide-react';
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
  const { user, dailyRecords, addDailyRecord, isLoggedIn, loading, refreshData } = useUser();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<MeasurementFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  // Düzeltilmiş veri yükleme useEffect'i
  React.useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      await refreshData();
      setLocalLoading(false);
    };
    
    if (!loading && user && isLoggedIn) {
      loadData();
    }
  }, [user, isLoggedIn, loading, refreshData]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const recordsCount = dailyRecords?.length || 0;
  const hasRecords = recordsCount > 0;

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
    } catch {
      alert('Ölçüm kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || localLoading) {
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

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Ölçüm Ekle</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Form alanları burada... (Değişmedi) */}
              {/* Tarih, Ağırlık, Yağ Oranı, Su Oranı, Kas Oranı */}
              {/* ... */}
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Ölçüm Geçmişi</h3>
            <span className="text-sm text-gray-500">Toplam {recordsCount} kayıt</span>
          </div>
          
          {hasRecords ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th>Tarih</th>
                    <th>Ağırlık</th>
                    <th>Yağ Oranı</th>
                    <th>Su Oranı</th>
                    <th>Kas Oranı</th>
                    <th>Değişim</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRecords.slice().reverse().map((record, index) => {
                    const prevRecord = index < recordsCount - 1 ? dailyRecords[recordsCount - 2 - index] : null;
                    const currentWeight = parseFloat(record.weight?.toString() || '0');
                    const prevWeight = prevRecord ? parseFloat(prevRecord.weight?.toString() || '0') : 0;
                    const weightChange = prevRecord ? currentWeight - prevWeight : 0;
                    return (
                      <tr key={record.id}>
                        <td>{record.date || 'Tarih yok'}</td>
                        <td>{record.weight ? `${currentWeight} kg` : 'Ağırlık yok'}</td>
                        <td>{record.bodyFat ? `${parseFloat(record.bodyFat.toString())}%` : '-'}</td>
                        <td>{record.waterPercentage ? `${parseFloat(record.waterPercentage.toString())}%` : '-'}</td>
                        <td>{record.musclePercentage ? `${parseFloat(record.musclePercentage.toString())}%` : '-'}</td>
                        <td>
                          {weightChange !== 0 && (
                            <span className={weightChange > 0 ? 'text-red-600' : 'text-green-600'}>
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
