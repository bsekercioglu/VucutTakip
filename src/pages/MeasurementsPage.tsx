import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Scale, Droplets, TrendingDown, TrendingUp, Edit3, Trash2, Save, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import ConfirmDialog from '../components/ConfirmDialog';
import { debugLog } from '../config/appConfig';
import Layout from '../components/Layout';

interface MeasurementFormData {
  date: string;
  weight: number;
  bodyFat?: number;
  waterPercentage?: number;
  musclePercentage?: number;
  // Body measurements
  chest?: number;
  waist?: number;
  hips?: number;
  arm?: number;
  thigh?: number;
  neck?: number;
}

const MeasurementsPage: React.FC = () => {
  const { user, dailyRecords, addDailyRecord, updateDailyRecord, deleteDailyRecord, isLoggedIn, loading } = useUser();
  const { success, error } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [measurementType, setMeasurementType] = useState<'digital' | 'manual'>('digital');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    recordId: string;
    recordDate: string;
  }>({
    isOpen: false,
    recordId: '',
    recordDate: ''
  });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<MeasurementFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  debugLog.log('MeasurementsPage - User:', user?.id);
  debugLog.log('MeasurementsPage - Daily Records:', dailyRecords);
  debugLog.log('MeasurementsPage - Loading:', loading);
  debugLog.log('MeasurementsPage - isLoggedIn:', isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Basit loading kontrolü - sadece auth loading'i kontrol et
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

  const recordsCount = dailyRecords?.length || 0;
  const hasRecords = recordsCount > 0;

  debugLog.log('MeasurementsPage - Records count:', recordsCount);
  debugLog.log('MeasurementsPage - Has records:', hasRecords);

  const onSubmit = async (data: MeasurementFormData) => {
    setIsSubmitting(true);
    try {
      const measurements = measurementType === 'manual' ? {
        chest: data.chest,
        waist: data.waist,
        hips: data.hips,
        arm: data.arm,
        thigh: data.thigh,
        neck: data.neck
      } : undefined;
      
      // Remove undefined values from measurements
      const cleanMeasurements = measurements ? Object.fromEntries(
        Object.entries(measurements).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      ) : undefined;
      
      let success;
      if (editingRecord) {
        success = await updateDailyRecord(editingRecord, {
          date: data.date,
          weight: data.weight,
          bodyFat: data.bodyFat,
          waterPercentage: data.waterPercentage,
          musclePercentage: data.musclePercentage,
          measurements: Object.keys(cleanMeasurements || {}).length > 0 ? cleanMeasurements : undefined
        });
      } else {
        success = await addDailyRecord({
          date: data.date,
          weight: data.weight,
          bodyFat: data.bodyFat,
          waterPercentage: data.waterPercentage,
          musclePercentage: data.musclePercentage,
          measurements: Object.keys(cleanMeasurements || {}).length > 0 ? cleanMeasurements : undefined
        });
      }
      
      if (success) {
        reset({
          date: new Date().toISOString().split('T')[0],
          weight: undefined,
          bodyFat: undefined,
          waterPercentage: undefined,
          musclePercentage: undefined,
          chest: undefined,
          waist: undefined,
          hips: undefined,
          arm: undefined,
          thigh: undefined,
          neck: undefined
        });
        setShowForm(false);
        setEditingRecord(null);
        if (editingRecord) {
          success('Başarılı!', 'Ölçüm başarıyla güncellendi');
        } else {
          success('Başarılı!', 'Ölçüm başarıyla kaydedildi');
        }
      } else {
        error('Hata!', editingRecord ? 'Ölçüm güncellenirken hata oluştu' : 'Ölçüm kaydedilirken hata oluştu');
      }
    } catch {
      error('Hata!', 'Beklenmeyen bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: DailyRecord) => {
    debugLog.log('Editing record:', record);
    setEditingRecord(record.id);
    setValue('date', record.date);
    setValue('weight', record.weight);
    setValue('bodyFat', record.bodyFat || undefined);
    setValue('waterPercentage', record.waterPercentage || undefined);
    setValue('musclePercentage', record.musclePercentage || undefined);
    
    // Set measurement type based on available data
    if (record.measurements && Object.keys(record.measurements).length > 0) {
      setMeasurementType('manual');
      setValue('chest', record.measurements.chest || undefined);
      setValue('waist', record.measurements.waist || undefined);
      setValue('hips', record.measurements.hips || undefined);
      setValue('arm', record.measurements.arm || undefined);
      setValue('thigh', record.measurements.thigh || undefined);
      setValue('neck', record.measurements.neck || undefined);
    } else {
      setMeasurementType('digital');
    }
    
    setShowForm(true);
    debugLog.log('Form values set, showForm:', true);
  };

  const handleDeleteClick = (recordId: string, recordDate: string) => {
    setConfirmDialog({
      isOpen: true,
      recordId,
      recordDate
    });
  };

  const handleDeleteConfirm = async () => {
    const deleteSuccess = await deleteDailyRecord(confirmDialog.recordId);
    if (deleteSuccess) {
      success('Başarılı!', 'Ölçüm başarıyla silindi');
    } else {
      error('Hata!', 'Ölçüm silinirken hata oluştu');
    }
    setConfirmDialog({ isOpen: false, recordId: '', recordDate: '' });
  };

  const handleDeleteCancel = () => {
    setConfirmDialog({ isOpen: false, recordId: '', recordDate: '' });
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setShowForm(false);
    setMeasurementType('digital');
    reset({
      date: new Date().toISOString().split('T')[0],
      weight: undefined,
      bodyFat: undefined,
      waterPercentage: undefined,
      musclePercentage: undefined,
      chest: undefined,
      waist: undefined,
      hips: undefined,
      arm: undefined,
      thigh: undefined,
      neck: undefined
    });
  };
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Günlük Ölçümler</h1>
          <button
            onClick={() => {
              setEditingRecord(null);
              setMeasurementType('digital');
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Yeni Ölçüm
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRecord ? 'Ölçümü Düzenle' : 'Yeni Ölçüm Ekle'}
            </h3>
            
            {/* Measurement Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Ölçüm Türü</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="digital"
                    checked={measurementType === 'digital'}
                    onChange={(e) => setMeasurementType(e.target.value as 'digital' | 'manual')}
                    className="mr-2"
                  />
                  <span className="text-sm">📱 Dijital Terazi (Yağ/Su/Kas Oranı)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={measurementType === 'manual'}
                    onChange={(e) => setMeasurementType(e.target.value as 'digital' | 'manual')}
                    className="mr-2"
                  />
                  <span className="text-sm">📏 Manuel Ölçüm (Mezura ile)</span>
                </label>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tarih</label>
                <input
                  type="date"
                  {...register('date', { required: 'Tarih gerekli' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.date && (
                  <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Ağırlık (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('weight', { required: 'Ağırlık gerekli', min: 30, max: 200 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.weight && (
                  <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                )}
              </div>

              {measurementType === 'digital' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Yağ Oranı (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('bodyFat', { min: 5, max: 50 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Su Oranı (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('waterPercentage', { min: 30, max: 80 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kas Oranı (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      {...register('musclePercentage', { min: 20, max: 60 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">📏 Vücut Ölçümleri (cm)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Göğüs</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('chest', { min: 50, max: 200 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="90"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Bel</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('waist', { min: 50, max: 200 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="80"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kalça</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('hips', { min: 50, max: 200 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="95"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Kol</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('arm', { min: 20, max: 60 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Uyluk</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('thigh', { min: 30, max: 100 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="55"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Boyun</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('neck', { min: 25, max: 50 })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="35"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h5 className="text-sm font-medium text-blue-900 mb-2">📋 Ölçüm İpuçları:</h5>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• <strong>Göğüs:</strong> Nefes verirken, göğsün en geniş yerinden</li>
                      <li>• <strong>Bel:</strong> Göbek deliğinin 2-3 cm üstünden</li>
                      <li>• <strong>Kalça:</strong> Kalçanın en geniş yerinden</li>
                      <li>• <strong>Kol:</strong> Pazının en kalın yerinden (gergin değil)</li>
                      <li>• <strong>Uyluk:</strong> Uyluğun en kalın yerinden</li>
                      <li>• <strong>Boyun:</strong> Boyunun en ince yerinden</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (editingRecord ? 'Güncelleniyor...' : 'Kaydediliyor...') : (editingRecord ? 'Güncelle' : 'Kaydet')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title="Ölçümü Sil"
          message={`${new Date(confirmDialog.recordDate).toLocaleDateString('tr-TR')} tarihli ölçümü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          cancelText="İptal"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          type="danger"
        />

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ağırlık (kg)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yağ Oranı (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Su Oranı (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kas Oranı (%)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ölçümler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyRecords.slice().reverse().map((record, index) => {
                    debugLog.log('Rendering record:', record.id, record.date, record.weight);
                    
                    const prevRecord = index < recordsCount - 1 ? dailyRecords[recordsCount - 2 - index] : null;
                    
                    // Calculate changes for all parameters
                    const currentWeight = parseFloat(record.weight?.toString() || '0');
                    const currentBodyFat = record.bodyFat ? parseFloat(record.bodyFat.toString()) : null;
                    const currentWater = record.waterPercentage ? parseFloat(record.waterPercentage.toString()) : null;
                    const currentMuscle = record.musclePercentage ? parseFloat(record.musclePercentage.toString()) : null;
                    
                    const prevWeight = prevRecord ? parseFloat(prevRecord.weight?.toString() || '0') : null;
                    const prevBodyFat = prevRecord?.bodyFat ? parseFloat(prevRecord.bodyFat.toString()) : null;
                    const prevWater = prevRecord?.waterPercentage ? parseFloat(prevRecord.waterPercentage.toString()) : null;
                    const prevMuscle = prevRecord?.musclePercentage ? parseFloat(prevRecord.musclePercentage.toString()) : null;
                    
                    const weightChange = prevWeight ? currentWeight - prevWeight : null;
                    const bodyFatChange = prevBodyFat && currentBodyFat ? currentBodyFat - prevBodyFat : null;
                    const waterChange = prevWater && currentWater ? currentWater - prevWater : null;
                    const muscleChange = prevMuscle && currentMuscle ? currentMuscle - prevMuscle : null;
                    
                    // Helper function to render change indicator
                    const renderChange = (change: number | null, unit: string = '', isPercentage: boolean = false) => {
                      if (change === null || Math.abs(change) < 0.1) return null;
                      
                      const isPositive = change > 0;
                      const colorClass = isPositive 
                        ? (unit === 'kg' || unit === '%' && !isPercentage ? 'text-red-600' : 'text-green-600')
                        : (unit === 'kg' || unit === '%' && !isPercentage ? 'text-green-600' : 'text-red-600');
                      
                      // For body fat, positive change is bad (red), negative is good (green)
                      const bodyFatColorClass = isPercentage && unit === '%' 
                        ? (isPositive ? 'text-red-600' : 'text-green-600')
                        : colorClass;
                      
                      return (
                        <div className={`text-xs ${unit === '%' && isPercentage ? bodyFatColorClass : colorClass} flex items-center mt-1`}>
                          {isPositive ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {isPositive ? '+' : ''}{change.toFixed(1)}{unit}
                        </div>
                      );
                    };
                    
                    return (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.measurements && Object.keys(record.measurements).length > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              📏 Manuel
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              📱 Dijital
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">
                            {currentWeight.toFixed(1)} kg
                          </div>
                          {renderChange(weightChange, 'kg')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">
                            {currentBodyFat ? `${currentBodyFat.toFixed(1)}%` : '-'}
                          </div>
                          {currentBodyFat && renderChange(bodyFatChange, '%', true)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">
                            {currentWater ? `${currentWater.toFixed(1)}%` : '-'}
                          </div>
                          {currentWater && renderChange(waterChange, '%')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-900 font-medium">
                            {currentMuscle ? `${currentMuscle.toFixed(1)}%` : '-'}
                          </div>
                          {currentMuscle && renderChange(muscleChange, '%')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.measurements && Object.keys(record.measurements).length > 0 ? (
                            <div className="space-y-1">
                              {record.measurements.chest && (
                                <div className="text-xs text-gray-600">Göğüs: {record.measurements.chest}cm</div>
                              )}
                              {record.measurements.waist && (
                                <div className="text-xs text-gray-600">Bel: {record.measurements.waist}cm</div>
                              )}
                              {record.measurements.hips && (
                                <div className="text-xs text-gray-600">Kalça: {record.measurements.hips}cm</div>
                              )}
                              {record.measurements.arm && (
                                <div className="text-xs text-gray-600">Kol: {record.measurements.arm}cm</div>
                              )}
                              {record.measurements.thigh && (
                                <div className="text-xs text-gray-600">Uyluk: {record.measurements.thigh}cm</div>
                              )}
                              {record.measurements.neck && (
                                <div className="text-xs text-gray-600">Boyun: {record.measurements.neck}cm</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(record)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Düzenle"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(record.id, record.date)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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
              <p className="text-gray-600 mb-4">İlk ölçümünüzü ekleyerek başlayın</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                İlk Ölçümü Ekle
              </button>
            </div>
          )}
        </div>

        {/* Debug bilgileri - sadece development'ta göster */}
        {debugLog && (
          <div className="bg-gray-100 p-4 rounded-lg text-sm">
            <h4 className="font-semibold mb-2">Debug Bilgileri:</h4>
            <p>User ID: {user?.id}</p>
            <p>Loading: {loading.toString()}</p>
            <p>Records Count: {recordsCount}</p>
            <p>Has Records: {hasRecords.toString()}</p>
            <p>Daily Records Array: {Array.isArray(dailyRecords) ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MeasurementsPage;