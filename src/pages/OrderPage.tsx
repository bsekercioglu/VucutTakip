import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ShoppingCart, MapPin, Phone, CreditCard } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../hooks/useToast';
import { createOrder, getUserSponsor } from '../services/adminService';
import { Order, ShippingAddress, ContactInfo } from '../types/admin';
import Layout from '../components/Layout';

interface OrderFormData extends ShippingAddress, ContactInfo {
  notes?: string;
}

interface OrderPageProps {
  selectedProducts: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  onOrderComplete?: () => void;
}

const OrderPage: React.FC<OrderPageProps> = ({ selectedProducts = [], onOrderComplete }) => {
  const { user, isLoggedIn } = useUser();
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<OrderFormData>();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const totalAmount = selectedProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  const onSubmit = async (data: OrderFormData) => {
    if (!user || selectedProducts.length === 0) return;

    setIsSubmitting(true);
    try {
      // Get user's sponsor
      const sponsorId = await getUserSponsor(user.id);

      const orderData: Omit<Order, 'id'> = {
        userId: user.id,
        sponsorId: sponsorId || undefined,
        products: selectedProducts.map(product => ({
          productId: product.id,
          productName: product.name,
          quantity: product.quantity,
          price: product.price,
          totalPrice: product.price * product.quantity
        })),
        totalAmount,
        status: 'pending',
        shippingAddress: {
          fullName: data.fullName,
          address: data.address,
          city: data.city,
          district: data.district,
          postalCode: data.postalCode,
          country: data.country
        },
        contactInfo: {
          phone: data.phone,
          email: data.email,
          alternativePhone: data.alternativePhone
        },
        orderDate: new Date().toISOString(),
        notes: data.notes
      };

      const result = await createOrder(orderData);
      
      if (result.success) {
        success('Başarılı!', 'Siparişiniz başarıyla oluşturuldu');
        onOrderComplete?.();
      } else {
        error('Hata!', 'Sipariş oluşturulurken hata oluştu');
      }
    } catch (err) {
      error('Hata!', 'Beklenmeyen bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sipariş Ver</h1>
          <p className="text-gray-600 mt-1">Sipariş bilgilerinizi doldurun</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Shipping Address */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <MapPin className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Teslimat Adresi</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                    <input
                      {...register('fullName', { required: 'Ad soyad gerekli' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ahmet Yılmaz"
                    />
                    {errors.fullName && (
                      <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
                    )}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                    <textarea
                      {...register('address', { required: 'Adres gerekli' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                      placeholder="Mahalle, sokak, bina no, daire no"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İl</label>
                    <input
                      {...register('city', { required: 'İl gerekli' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="İstanbul"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                    <input
                      {...register('district', { required: 'İlçe gerekli' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Kadıköy"
                    />
                    {errors.district && (
                      <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Posta Kodu</label>
                    <input
                      {...register('postalCode', { required: 'Posta kodu gerekli' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="34000"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ülke</label>
                    <input
                      {...register('country', { required: 'Ülke gerekli' })}
                      defaultValue="Türkiye"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.country && (
                      <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center mb-4">
                  <Phone className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">İletişim Bilgileri</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                    <input
                      type="tel"
                      {...register('phone', { required: 'Telefon gerekli' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0555 123 45 67"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternatif Telefon</label>
                    <input
                      type="tel"
                      {...register('alternativePhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0212 123 45 67"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      {...register('email', { required: 'E-posta gerekli' })}
                      defaultValue={user?.email}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Notları</h3>
                <textarea
                  {...register('notes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-20 resize-none"
                  placeholder="Özel talepleriniz varsa buraya yazabilirsiniz..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || selectedProducts.length === 0}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                {isSubmitting ? 'Sipariş Oluşturuluyor...' : 'Siparişi Tamamla'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-6">
              <div className="flex items-center mb-4">
                <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Sipariş Özeti</h3>
              </div>
              
              <div className="space-y-3">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.quantity} adet</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ₺{(product.price * product.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900">Toplam</p>
                  <p className="text-lg font-bold text-blue-600">₺{totalAmount.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Ücretsiz Kargo:</strong> 500₺ ve üzeri siparişlerde
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderPage;