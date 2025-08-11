import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Edit3, Save, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import Layout from '../components/Layout';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  gender: 'male' | 'female';
  birthDate: string;
  gender: 'male' | 'female';
  birthDate: string;
  height: number;
  initialWeight: number;
  chest: number;
  waist: number;
  hips: number;
  arm: number;
  thigh: number;
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, uploadProfilePhoto, deleteProfilePhoto, isLoggedIn } = useUser();
  const { success, error } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    defaultValues: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      gender: user.gender,
      birthDate: user.birthDate,
      gender: user.gender,
      birthDate: user.birthDate,
      height: user.height,
      initialWeight: user.initialWeight,
      chest: user.measurements.chest,
      waist: user.measurements.waist,
      hips: user.measurements.hips,
      arm: user.measurements.arm,
      thigh: user.measurements.thigh
    } : undefined
  });

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = (data: ProfileFormData) => {
    const updateSuccess = updateProfile({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      gender: data.gender,
      birthDate: data.birthDate,
      gender: data.gender,
      birthDate: data.birthDate,
      height: data.height,
      initialWeight: data.initialWeight,
      measurements: {
        chest: data.chest,
        waist: data.waist,
        hips: data.hips,
        arm: data.arm,
        thigh: data.thigh
      }
    });
    
    if (updateSuccess) {
      success('Başarılı!', 'Profil bilgileri güncellendi');
      setIsEditing(false);
    } else {
      error('Hata!', 'Profil güncellenirken hata oluştu');
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const handlePhotoUpload = async (file: File) => {
    console.log('ProfilePage: Starting photo upload');
    const uploadSuccess = await uploadProfilePhoto(file);
    if (uploadSuccess) {
      console.log('ProfilePage: Photo upload successful');
      success('Başarılı!', 'Profil fotoğrafı güncellendi');
      return true;
    } else {
      console.log('ProfilePage: Photo upload failed');
      error('Hata!', 'Fotoğraf yüklenirken hata oluştu');
      return false;
    }
  };

  const handlePhotoDelete = async () => {
    const deleteSuccess = await deleteProfilePhoto();
    if (deleteSuccess) {
      success('Başarılı!', 'Profil fotoğrafı silindi');
      return true;
    } else {
      error('Hata!', 'Fotoğraf silinirken hata oluştu');
      return false;
    }
  };

  const bmi = user.initialWeight / Math.pow(user.height / 100, 2);
  let bmiCategory = '';
  let bmiColor = '';

  if (bmi < 18.5) {
    bmiCategory = 'Zayıf';
    bmiColor = 'text-blue-600';
  } else if (bmi < 25) {
    bmiCategory = 'Normal';
    bmiColor = 'text-green-600';
  } else if (bmi < 30) {
    bmiCategory = 'Fazla Kilolu';
    bmiColor = 'text-yellow-600';
  } else {
    bmiCategory = 'Obez';
    bmiColor = 'text-red-600';
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Profil Bilgileri</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Düzenle
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="text-center mb-6">
                <ProfilePhotoUpload
                  currentPhotoURL={user.photoURL}
                  onUpload={handlePhotoUpload}
                  onDelete={handlePhotoDelete}
                  userName={`${user.firstName} ${user.lastName}`}
                />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-600">{user.email}</p>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">Üyelik Tarihi</div>
                  <div className="font-medium">
                    {new Date(user.registrationDate).toLocaleDateString('tr-TR')}
                  </div>
                </div>
              </div>
            </div>

            {/* BMI Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vücut Kitle İndeksi</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {bmi.toFixed(1)}
                </div>
                <div className={`text-sm font-medium ${bmiColor}`}>
                  {bmiCategory}
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  Boy: {user.height} cm | Ağırlık: {user.initialWeight} kg
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Kişisel Bilgiler</h3>
              
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                      <input
                        {...register('firstName', { required: 'Ad gerekli' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                      <input
                        {...register('lastName', { required: 'Soyad gerekli' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                      <input
                        type="email"
                        {...register('email', { required: 'E-posta gerekli' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                      <select
                        {...register('gender', { required: 'Cinsiyet seçimi gerekli' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Seçiniz</option>
                        <option value="male">Erkek</option>
                        <option value="female">Kadın</option>
                      </select>
                      {errors.gender && (
                        <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Doğum Tarihi</label>
                      <input
                        type="date"
                        {...register('birthDate', { required: 'Doğum tarihi gerekli' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.birthDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Boy (cm)</label>
                      <input
                        type="number"
                        {...register('height', { required: 'Boy gerekli', min: 120, max: 220 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.height && (
                        <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Ağırlığı (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        {...register('initialWeight', { required: 'Başlangıç ağırlığı gerekli', min: 30, max: 200 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.initialWeight && (
                        <p className="text-red-500 text-sm mt-1">{errors.initialWeight.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Vücut Ölçümleri (cm)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Göğüs</label>
                        <input
                          type="number"
                          {...register('chest', { required: 'Göğüs ölçümü gerekli' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bel</label>
                        <input
                          type="number"
                          {...register('waist', { required: 'Bel ölçümü gerekli' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kalça</label>
                        <input
                          type="number"
                          {...register('hips', { required: 'Kalça ölçümü gerekli' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kol</label>
                        <input
                          type="number"
                          {...register('arm', { required: 'Kol ölçümü gerekli' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Uyluk</label>
                        <input
                          type="number"
                          {...register('thigh', { required: 'Uyluk ölçümü gerekli' })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors flex items-center justify-center"
                    >
                      <X className="h-4 w-4 mr-2" />
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Kaydet
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Ad</label>
                      <p className="text-lg text-gray-900">{user.firstName}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Soyad</label>
                      <p className="text-lg text-gray-900">{user.lastName}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">E-posta</label>
                      <p className="text-lg text-gray-900">{user.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Cinsiyet</label>
                      <p className="text-lg text-gray-900">{user.gender === 'male' ? 'Erkek' : 'Kadın'}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Doğum Tarihi</label>
                      <p className="text-lg text-gray-900">{new Date(user.birthDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Boy</label>
                      <p className="text-lg text-gray-900">{user.height} cm</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Başlangıç Ağırlığı</label>
                      <p className="text-lg text-gray-900">{user.initialWeight} kg</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Vücut Ölçümleri</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Göğüs</div>
                        <div className="text-lg font-semibold">{user.measurements.chest} cm</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Bel</div>
                        <div className="text-lg font-semibold">{user.measurements.waist} cm</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Kalça</div>
                        <div className="text-lg font-semibold">{user.measurements.hips} cm</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Kol</div>
                        <div className="text-lg font-semibold">{user.measurements.arm} cm</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Uyluk</div>
                        <div className="text-lg font-semibold">{user.measurements.thigh} cm</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;