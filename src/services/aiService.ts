// AI Service for generating consultant responses
export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
}

export const generateConsultantResponse = async (question: string, userProfile?: any): Promise<AIResponse> => {
  try {
    // Simulate AI response generation
    // In a real implementation, you would call an AI API like OpenAI, Gemini, etc.
    
    const responses = await generateContextualResponse(question, userProfile);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      response: responses
    };
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: 'AI yanıtı oluşturulurken hata oluştu.'
    };
  }
};

const generateContextualResponse = async (question: string, userProfile?: any): Promise<string> => {
  const lowerQuestion = question.toLowerCase();
  
  // Kilo verme soruları
  if (lowerQuestion.includes('kilo') && (lowerQuestion.includes('ver') || lowerQuestion.includes('azalt'))) {
    return `Kilo vermek için şu önerileri uygulayabilirsiniz:

🍎 **Beslenme:**
- Günlük kalori ihtiyacınızdan 300-500 kalori az tüketin
- Protein ağırlıklı beslenin (günlük ${userProfile?.initialWeight ? Math.round(userProfile.initialWeight * 1.2) : 70}g protein)
- Bol su için (günde en az 2-3 litre)
- İşlenmiş gıdalardan kaçının

🏃‍♂️ **Egzersiz:**
- Haftada 3-4 kez kardiyo (30-45 dakika)
- Haftada 2-3 kez ağırlık antrenmanı
- Günlük en az 8000 adım

⏰ **Yaşam Tarzı:**
- Düzenli uyku (7-8 saat)
- Stres yönetimi
- Düzenli ölçüm takibi

Mevcut kilonuz ${userProfile?.initialWeight || 'bilinmiyor'} kg. Sağlıklı kilo verme hızı haftada 0.5-1 kg'dır.`;
  }
  
  // Kas yapma soruları
  if (lowerQuestion.includes('kas') && (lowerQuestion.includes('yap') || lowerQuestion.includes('artır'))) {
    return `Kas yapmak için şu stratejileri uygulayın:

💪 **Antrenman:**
- Haftada 3-4 kez ağırlık antrenmanı
- Compound hareketlere odaklanın (squat, deadlift, bench press)
- Progressive overload uygulayın
- Her kas grubunu haftada 2 kez çalıştırın

🥩 **Beslenme:**
- Yeterli protein alın (günlük ${userProfile?.initialWeight ? Math.round(userProfile.initialWeight * 1.6) : 112}g)
- Kalori fazlası oluşturun (+300-500 kalori)
- Karmaşık karbonhidratları tercih edin
- Sağlıklı yağları ihmal etmeyin

😴 **Dinlenme:**
- Kas grupları arası 48 saat dinlenme
- Kaliteli uyku (7-9 saat)
- Stres seviyesini düşük tutun

Boyunuz ${userProfile?.height || 'bilinmiyor'} cm için ideal kas oranı ${userProfile?.gender === 'male' ? '%40-50' : '%30-40'} arasındadır.`;
  }
  
  // Beslenme soruları
  if (lowerQuestion.includes('beslen') || lowerQuestion.includes('diyet') || lowerQuestion.includes('yemek')) {
    return `Sağlıklı beslenme için şu önerileri takip edin:

🥗 **Temel Prensipler:**
- Günde 3 ana + 2-3 ara öğün
- Tabağınızın yarısı sebze olsun
- Her öğünde protein bulundurun
- İşlenmiş gıdalardan kaçının

📊 **Makro Dağılımı:**
- Protein: %25-30 (günlük ${userProfile?.initialWeight ? Math.round(userProfile.initialWeight * 1.2) : 84}g)
- Karbonhidrat: %40-45
- Yağ: %25-30

💧 **Hidrasyon:**
- Günde en az 2.5-3 litre su
- Öğünlerden 30 dk önce/sonra su için
- Kafein ve alkol tüketimini sınırlayın

⏰ **Zamanlama:**
- Kahvaltıyı atlamamaya özen gösterin
- Son öğünü yatmadan 3 saat önce tüketin
- Antrenman sonrası 30 dk içinde protein alın

Yaşınız ve aktivite seviyenize göre günlük kalori ihtiyacınız yaklaşık ${userProfile ? calculateBMR(userProfile) : '1800-2200'} kaloridir.`;
  }
  
  // Egzersiz soruları
  if (lowerQuestion.includes('egzersiz') || lowerQuestion.includes('antrenman') || lowerQuestion.includes('spor')) {
    return `Etkili egzersiz programı için şu önerileri uygulayın:

🏋️‍♂️ **Ağırlık Antrenmanı:**
- Haftada 3-4 gün
- Compound hareketler (squat, deadlift, bench press)
- 8-12 tekrar, 3-4 set
- Kas grupları arası 48 saat dinlenme

🏃‍♀️ **Kardiyo:**
- Haftada 3-4 gün, 30-45 dakika
- Orta yoğunlukta (konuşabilecek tempoda)
- HIIT antrenmanları haftada 1-2 kez
- Yürüyüş, koşu, bisiklet, yüzme

🧘‍♀️ **Esneklik ve Mobilite:**
- Her antrenman sonrası 10-15 dk stretching
- Haftada 1-2 kez yoga veya pilates
- Foam roller kullanımı

📅 **Program Örneği:**
- Pazartesi: Üst vücut + 20 dk kardiyo
- Salı: Alt vücut + core
- Çarşamba: Dinlenme veya hafif yürüyüş
- Perşembe: Full body + HIIT
- Cuma: Üst vücut
- Hafta sonu: Aktif dinlenme (yürüyüş, bisiklet)

Başlangıç seviyesindeyseniz haftada 3 gün, 30-45 dakikalık antrenmanlarla başlayın.`;
  }
  
  // Ölçüm soruları
  if (lowerQuestion.includes('ölçüm') || lowerQuestion.includes('tartı') || lowerQuestion.includes('takip')) {
    return `Doğru ölçüm ve takip için şu önerileri uygulayın:

⚖️ **Tartı Ölçümü:**
- Her gün aynı saatte (sabah, tuvalete gittikten sonra)
- Aç karnına, minimal kıyafetle
- Aynı teraziyi kullanın
- Haftalık ortalama alın (günlük dalgalanmalar normal)

📏 **Vücut Ölçümleri:**
- Haftada 1 kez, aynı gün ve saatte
- Mezura gergin olmasın, sadece temas etsin
- Nefes verirken ölçün
- Aynı noktalardan ölçmeye özen gösterin

📊 **Vücut Kompozisyonu:**
- Dijital terazi kullanıyorsanız aynı koşullarda ölçün
- Yağ oranı: ${userProfile?.gender === 'male' ? 'Erkek için %10-20 ideal' : 'Kadın için %16-25 ideal'}
- Su oranı: %50-65 arası normal
- Kas oranı: ${userProfile?.gender === 'male' ? 'Erkek için %40-50' : 'Kadın için %30-40'}

📈 **Takip İpuçları:**
- Fotoğraf çekin (aynı pozisyon, aynı ışık)
- Enerji seviyenizi not edin
- Uyku kalitesini takip edin
- Performans gelişimini kaydedin

Mevcut BMI'niz: ${userProfile ? calculateBMI(userProfile) : 'Hesaplanamadı'}`;
  }
  
  // Genel sağlık soruları
  if (lowerQuestion.includes('sağlık') || lowerQuestion.includes('yaşam') || lowerQuestion.includes('alışkanlık')) {
    return `Sağlıklı yaşam için şu alışkanlıkları edinin:

😴 **Uyku:**
- 7-9 saat kaliteli uyku
- Düzenli uyku saatleri
- Yatmadan 2 saat önce ekran kullanımını azaltın
- Yatak odası serin ve karanlık olsun

💧 **Hidrasyon:**
- Günde en az 2.5-3 litre su
- Sabah kalktığınızda 1-2 bardak su için
- İdrar renginizi kontrol edin (açık sarı ideal)

🧘‍♂️ **Stres Yönetimi:**
- Günlük 10-15 dakika meditasyon
- Derin nefes egzersizleri
- Doğada zaman geçirin
- Hobilerinize zaman ayırın

🚶‍♀️ **Aktivite:**
- Günde en az 8000-10000 adım
- Merdiven kullanmayı tercih edin
- Uzun süre oturmaktan kaçının
- Aktif hobiler edinin

🍎 **Beslenme:**
- Çeşitli ve dengeli beslenin
- İşlenmiş gıdaları sınırlayın
- Bol sebze ve meyve tüketin
- Yeterli protein alın

Yaşınız ${userProfile?.birthDate ? calculateAge(userProfile.birthDate) : 'bilinmiyor'} için bu öneriler özellikle önemlidir.`;
  }
  
  // Motivasyon soruları
  if (lowerQuestion.includes('motivasyon') || lowerQuestion.includes('devam') || lowerQuestion.includes('bırak')) {
    return `Motivasyonunuzu yüksek tutmak için:

🎯 **Hedef Belirleme:**
- SMART hedefler koyun (Spesifik, Ölçülebilir, Ulaşılabilir)
- Kısa ve uzun vadeli hedefler belirleyin
- İlerlemenizi görsel olarak takip edin
- Küçük başarıları kutlayın

📊 **Takip ve Ölçüm:**
- Düzenli ölçüm yapın
- Fotoğraf çekin
- Performans gelişimini kaydedin
- VücutTakip uygulamasını aktif kullanın

👥 **Sosyal Destek:**
- Hedeflerinizi yakınlarınızla paylaşın
- Antrenman partneri bulun
- Online toplulukları takip edin
- Başarılarınızı sosyal medyada paylaşın

🏆 **Ödül Sistemi:**
- Haftalık hedeflere ulaştığınızda kendinizi ödüllendirin
- Yeni spor kıyafetleri alın
- Masaj yaptırın
- Sevdiğiniz aktiviteyi yapın

💪 **Zihinsel Güç:**
- "Yapamam" yerine "Nasıl yaparım?" deyin
- Geçici aksilikleri normal karşılayın
- Uzun vadeli düşünün
- Kendinizle sabırlı olun

Şimdiye kadar ${userProfile ? 'kaydettiğiniz' : ''} ilerleme harika! Devam edin! 🌟`;
  }
  
  // Varsayılan yanıt
  return `Sorunuz için teşekkürler! Size yardımcı olmak için elimden geleni yapacağım.

🏥 **Genel Öneriler:**
- Sağlıklı beslenme ve düzenli egzersiz temel taşlardır
- Sabırlı olun, sonuçlar zaman alır
- Düzenli ölçüm ve takip çok önemli
- Kendinizi zorlamayın, kademeli ilerleme yapın

📊 **Profilinize Göre:**
${userProfile ? `
- Yaşınız: ${calculateAge(userProfile.birthDate)} 
- Boyunuz: ${userProfile.height} cm
- Mevcut durumunuz: BMI ${calculateBMI(userProfile)}
- Cinsiyet: ${userProfile.gender === 'male' ? 'Erkek' : 'Kadın'}
` : 'Daha kişisel öneriler için profilinizi tamamlayın.'}

💡 **Daha Spesifik Yardım İçin:**
- "Kilo vermek istiyorum"
- "Kas yapmak istiyorum" 
- "Beslenme önerisi"
- "Egzersiz programı"
- "Ölçüm nasıl yapılır"

Başka sorularınız varsa çekinmeden sorun! 😊`;
};

// Helper functions
const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

const calculateBMI = (userProfile: any): string => {
  if (!userProfile.height || !userProfile.initialWeight) return 'Hesaplanamadı';
  const heightM = userProfile.height / 100;
  const bmi = userProfile.initialWeight / (heightM * heightM);
  return bmi.toFixed(1);
};

const calculateBMR = (userProfile: any): string => {
  if (!userProfile.height || !userProfile.initialWeight || !userProfile.birthDate) return '1800-2200';
  
  const age = calculateAge(userProfile.birthDate);
  let bmr;
  
  if (userProfile.gender === 'male') {
    bmr = 10 * userProfile.initialWeight + 6.25 * userProfile.height - 5 * age + 5;
  } else {
    bmr = 10 * userProfile.initialWeight + 6.25 * userProfile.height - 5 * age - 161;
  }
  
  return Math.round(bmr * 1.4).toString(); // Hafif aktif yaşam tarzı için
};