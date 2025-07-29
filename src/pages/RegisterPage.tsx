import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { Activity, ArrowLeft } from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';
import * as firebaseService from '../services/firebaseService';

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthDate: string;
  gender: 'male' | 'female';
  height: number;
  initialWeight: number;
  chest: number;
  waist: number;
  hips: number;
  arm: number;
  thigh: number;
}

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: `${data.firstName} ${data.lastName}`
      });
      
      // Save user data to Firestore
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        birthDate: data.birthDate,
        gender: data.gender,
        height: data.height,
        initialWeight: data.initialWeight,
        measurements: {
          chest: data.chest,
          waist: data.waist,
          hips: data.hips,
          arm: data.arm,
          thigh: data.thigh
        },
        registrationDate: new Date().toISOString().split('T')[0]
      };
      
      const result = await firebaseService.createUser(userCredential.user.uid, userData);
      if (result.success) {
        console.log('User successfully registered and saved to database');
        navigate('/dashboard');
      } else {
        console.error('Error saving user data:', result.error);
        alert('Kullanıcı bilgileri kaydedilirken hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/email-already-in-use') {
        alert('Bu e-posta adresi zaten kullanımda.');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('E-posta/şifre ile kayıt şu anda devre dışı. Lütfen sistem yöneticisi ile iletişime geçin.');
      } else if (error.code === 'auth/project-not-found') {
        alert('Firebase projesi bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
      } else if (error.code === 'auth/weak-password') {
        alert('Şifre çok zayıf. En az 6 karakter olmalı.');
      } else if (error.code === 'auth/invalid-email') {
        alert('Geçersiz e-posta adresi.');
      } else {
        console.error('Registration error details:', error);
        alert(`Kayıt sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      }
    }
  };

  const handleGoogleRegistration = async () => {
    try {
      setIsGoogleRegistration(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user already exists in our database
      const existingUser = await firebaseService.getUser(user.uid);
      if (existingUser) {
        // User already exists, redirect to dashboard
        navigate('/dashboard');
        return;
      }
      
      // New user, create profile with Google info
      const names = user.displayName?.split(' ') || ['', ''];
      const userData = {
        firstName: names[0] || 'Google',
        lastName: names.slice(1).join(' ') || 'User',
        email: user.email || '',
        birthDate: '1990-01-01', // Default, user can update later
        gender: 'male' as const, // Default, user can update later
        height: 170, // Default
        initialWeight: 70, // Default
        measurements: {
          chest: 90,
          waist: 80,
          hips: 90,
          arm: 30,
          thigh: 50
        },
        registrationDate: new Date().toISOString().split('T')[0],
        photoURL: user.photoURL || undefined
      };
      
      const result2 = await firebaseService.createUser(user.uid, userData);
      if (result2.success) {
        console.log('Google user successfully registered and saved to database');
        navigate('/dashboard');
      } else {
        console.error('Error saving Google user data:', result2.error);
        alert('Google ile kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error: any) {
      console.error('Google registration error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        alert('Google kayıt işlemi iptal edildi.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Popup engellendi. Lütfen popup engelleyiciyi devre dışı bırakın.');
      } else {
        alert(`Google ile kayıt sırasında bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
      }
    } finally {
      setIsGoogleRegistration(false);
    }
  };
  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Ana Sayfa
          </Link>
          <div className="flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-blue-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">VücutTakip</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Hesap Oluştur</h2>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i <= step ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
        </div>

        {/* Google Registration Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleRegistration}
            disabled={isGoogleRegistration}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleRegistration ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isGoogleRegistration ? 'Google ile kayıt oluşturuluyor...' : 'Google ile Hızlı Kayıt'}
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">veya manuel kayıt</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Kişisel Bilgiler</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ad</label>
                  <input
                    {...register('firstName', { required: 'Ad gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Soyad</label>
                  <input
                    {...register('lastName', { required: 'Soyad gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">E-posta</label>
                <input
                  type="email"
                  {...register('email', { required: 'E-posta gerekli' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Şifre</label>
                <input
                  type="password"
                  {...register('password', { required: 'Şifre gerekli', minLength: 6 })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Şifre Tekrar</label>
                <input
                  type="password"
                  {...register('confirmPassword', {
                    required: 'Şifre tekrarı gerekli',
                    validate: (value) => value === watch('password') || 'Şifreler eşleşmiyor'
                  })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={nextStep}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Devam Et
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Fiziksel Bilgiler</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Cinsiyet</label>
                <select
                  {...register('gender', { required: 'Cinsiyet seçimi gerekli' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700">Doğum Tarihi</label>
                <input
                  type="date"
                  {...register('birthDate', { required: 'Doğum tarihi gerekli' })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.birthDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.birthDate.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Boy (cm)</label>
                  <input
                    type="number"
                    {...register('height', { required: 'Boy gerekli', min: 120, max: 220 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.height && (
                    <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ağırlık (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('initialWeight', { required: 'Ağırlık gerekli', min: 30, max: 200 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.initialWeight && (
                    <p className="text-red-500 text-sm mt-1">{errors.initialWeight.message}</p>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Vücut Ölçümleri (cm)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Göğüs</label>
                  <input
                    type="number"
                    {...register('chest', { required: 'Göğüs ölçümü gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bel</label>
                  <input
                    type="number"
                    {...register('waist', { required: 'Bel ölçümü gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kalça</label>
                  <input
                    type="number"
                    {...register('hips', { required: 'Kalça ölçümü gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kol</label>
                  <input
                    type="number"
                    {...register('arm', { required: 'Kol ölçümü gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Uyluk</label>
                  <input
                    type="number"
                    {...register('thigh', { required: 'Uyluk ölçümü gerekli' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                >
                  Hesap Oluştur
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="text-center text-sm text-gray-600">
          Zaten hesabınız var mı?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800">
            Giriş yapın
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;