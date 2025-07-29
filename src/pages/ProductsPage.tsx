import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Star, ShoppingCart, Filter, Search } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Layout from '../components/Layout';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  description: string;
  benefits: string[];
}

const ProductsPage: React.FC = () => {
  const { isLoggedIn } = useUser();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const products: Product[] = [
    {
      id: '1',
      name: 'Premium Whey Protein',
      category: 'protein',
      price: 299,
      rating: 4.8,
      reviews: 245,
      image: 'https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Yüksek kaliteli whey protein tozu, kas gelişimi için ideal.',
      benefits: ['Hızlı emilim', 'BCAA içeriği', 'Lezzet çeşitliliği']
    },
    {
      id: '2',
      name: 'Omega-3 Balık Yağı',
      category: 'supplement',
      price: 89,
      rating: 4.6,
      reviews: 156,
      image: 'https://images.pexels.com/photos/3683107/pexels-photo-3683107.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'EPA ve DHA içeren kaliteli omega-3 takviyesi.',
      benefits: ['Kalp sağlığı', 'Beyin fonksiyonu', 'İltihap önleyici']
    },
    {
      id: '3',
      name: 'Akıllı Vücut Analiz Terazisi',
      category: 'equipment',
      price: 449,
      rating: 4.9,
      reviews: 89,
      image: 'https://images.pexels.com/photos/6975474/pexels-photo-6975474.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Bluetooth özellikli, 13 farklı vücut ölçümü yapabilen terazi.',
      benefits: ['Bluetooth bağlantı', 'Mobil uygulama', 'Çoklu kullanıcı']
    },
    {
      id: '4',
      name: 'Kreatin Monohidrat',
      category: 'supplement',
      price: 159,
      rating: 4.7,
      reviews: 178,
      image: 'https://images.pexels.com/photos/4162519/pexels-photo-4162519.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Performans artırıcı kreatin monohidrat takviyesi.',
      benefits: ['Güç artışı', 'Dayanıklılık', 'Kas hacmi']
    },
    {
      id: '5',
      name: 'Günlük Vitamin Paketi',
      category: 'vitamin',
      price: 199,
      rating: 4.5,
      reviews: 234,
      image: 'https://images.pexels.com/photos/3683042/pexels-photo-3683042.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Günlük ihtiyaçları karşılayan vitamin ve mineral karışımı.',
      benefits: ['Tüm vitaminler', 'Günlük doz', 'Kolay kullanım']
    },
    {
      id: '6',
      name: 'Yoga Matı Premium',
      category: 'equipment',
      price: 189,
      rating: 4.8,
      reviews: 92,
      image: 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=400',
      description: 'Anti-slip özellikli kaliteli yoga ve egzersiz matı.',
      benefits: ['Kaymaz taban', 'Taşıma çantası', 'Ekstra kalınlık']
    }
  ];

  const categories = [
    { id: 'all', name: 'Tümü' },
    { id: 'protein', name: 'Protein' },
    { id: 'supplement', name: 'Takviye' },
    { id: 'vitamin', name: 'Vitamin' },
    { id: 'equipment', name: 'Ekipman' }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Önerilen Ürünler</h1>
          <p className="text-gray-600 mt-1">
            Hedeflerinize ulaşmanıza yardımcı olacak kaliteli ürünler
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-w-16 aspect-h-12">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                />
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {categories.find(c => c.id === product.category)?.name}
                  </span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {product.rating} ({product.reviews})
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{product.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Faydaları:</h4>
                  <div className="flex flex-wrap gap-1">
                    {product.benefits.map((benefit, index) => (
                      <span
                        key={index}
                        className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                      >
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    ₺{product.price}
                  </div>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Sepete Ekle
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ürün bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinizi değiştirmeyi deneyin.</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ Önemli Uyarı</h3>
          <p className="text-yellow-800 text-sm">
            Bu ürünler tavsiye niteliğindedir. Herhangi bir takviye kullanmadan önce doktorunuza danışın. 
            Ürün satışları güvenilir üçüncü parti satıcılar tarafından gerçekleştirilir.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProductsPage;