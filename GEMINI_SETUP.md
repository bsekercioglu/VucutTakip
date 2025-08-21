# GEMINI API ve Ödeme Sistemi Kurulum Rehberi

Bu rehber, VucutTakip projesinde Google Generative AI (GEMINI) API entegrasyonu ve ödeme sistemi kurulumu için detaylı adımları içerir.

## 📋 İçindekiler

1. [GEMINI API Kurulumu](#gemini-api-kurulumu)
2. [Ödeme Sistemi Kurulumu](#ödeme-sistemi-kurulumu)
3. [Güvenlik ve En İyi Uygulamalar](#güvenlik-ve-en-iyi-uygulamalar)
4. [Test ve Doğrulama](#test-ve-doğrulama)
5. [Sorun Giderme](#sorun-giderme)

---

## 🤖 GEMINI API Kurulumu

### 1. Google AI Studio'ya Erişim

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. "Get API key" butonuna tıklayın
4. Yeni bir API anahtarı oluşturun

### 2. API Anahtarı Güvenliği

```bash
# .env dosyasına ekleyin
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ Güvenlik Uyarıları:**
- API anahtarını asla doğrudan kod içinde saklamayın
- `.env` dosyasını `.gitignore`'a eklediğinizden emin olun
- Production ortamında environment variable olarak ayarlayın

### 3. GEMINI API Servis Yapılandırması

`src/services/aiService.ts` dosyasını güncelleyin:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// API anahtarını environment variable'dan al
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Model seçimi
const MODEL_NAME = 'gemini-1.5-flash'; // veya 'gemini-1.5-pro'

export class AIService {
  private model = genAI.getGenerativeModel({ model: MODEL_NAME });

  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      const fullPrompt = context 
        ? `${context}\n\nKullanıcı Sorusu: ${prompt}`
        : prompt;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('GEMINI API Error:', error);
      throw new Error('AI yanıtı alınamadı. Lütfen daha sonra tekrar deneyin.');
    }
  }

  async analyzeBodyComposition(measurements: any): Promise<string> {
    const prompt = `
      Aşağıdaki vücut ölçümlerini analiz edin ve sağlık önerileri verin:
      
      Boy: ${measurements.height} cm
      Kilo: ${measurements.weight} kg
      Vücut Yağı: ${measurements.bodyFat}%
      Su: ${measurements.water}%
      Kas: ${measurements.muscle}%
      
      Lütfen:
      1. BMI hesaplayın
      2. Vücut kompozisyonunu değerlendirin
      3. İyileştirme önerileri verin
      4. Hedef belirleme konusunda tavsiyeler verin
    `;

    return this.generateResponse(prompt);
  }

  async generateWorkoutPlan(userProfile: any): Promise<string> {
    const prompt = `
      Kullanıcı profili:
      - Yaş: ${userProfile.age}
      - Cinsiyet: ${userProfile.gender}
      - Hedef: ${userProfile.goal}
      - Seviye: ${userProfile.fitnessLevel}
      
      Bu bilgilere göre 4 haftalık egzersiz planı oluşturun.
    `;

    return this.generateResponse(prompt);
  }

  async generateNutritionAdvice(userData: any): Promise<string> {
    const prompt = `
      Kullanıcı verileri:
      - Günlük aktivite seviyesi: ${userData.activityLevel}
      - Hedef: ${userData.goal}
      - Mevcut kilo: ${userData.currentWeight} kg
      - Hedef kilo: ${userData.targetWeight} kg
      
      Beslenme tavsiyeleri ve örnek menü oluşturun.
    `;

    return this.generateResponse(prompt);
  }
}

export const aiService = new AIService();
```

### 4. Rate Limiting ve Error Handling

```typescript
// src/utils/rateLimiter.ts
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 60; // 1 dakikada maksimum istek
  private windowMs = 60000; // 1 dakika

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

export const rateLimiter = new RateLimiter();
```

### 5. GEMINI API Kullanım Örnekleri

```typescript
// ConsultantPage.tsx içinde kullanım
import { aiService } from '../services/aiService';

const handleAIConsultation = async (question: string) => {
  try {
    const response = await aiService.generateResponse(question);
    return response;
  } catch (error) {
    console.error('AI consultation error:', error);
    throw error;
  }
};

// Dashboard.tsx içinde kullanım
const analyzeProgress = async () => {
  const latestRecord = dailyRecords[dailyRecords.length - 1];
  if (latestRecord) {
    const analysis = await aiService.analyzeBodyComposition(latestRecord);
    return analysis;
  }
};
```

---

## 💳 Ödeme Sistemi Kurulumu

### 1. Stripe Entegrasyonu

#### Stripe Hesabı Oluşturma

1. [Stripe Dashboard](https://dashboard.stripe.com/) adresine gidin
2. Yeni hesap oluşturun veya mevcut hesabınıza giriş yapın
3. Test modunda çalışmaya başlayın

#### Stripe Kurulumu

```bash
npm install @stripe/stripe-js stripe
```

#### Environment Variables

```bash
# .env dosyasına ekleyin
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### 2. Stripe Frontend Entegrasyonu

```typescript
// src/services/paymentService.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export class PaymentService {
  async createPaymentIntent(amount: number, currency: string = 'try') {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
        }),
      });

      const data = await response.json();
      return data.clientSecret;
    } catch (error) {
      console.error('Payment intent creation failed:', error);
      throw error;
    }
  }

  async processPayment(amount: number, paymentMethod: any) {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    const { error } = await stripe.confirmCardPayment(paymentMethod, {
      payment_method: paymentMethod,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  }
}

export const paymentService = new PaymentService();
```

### 3. Ödeme Bileşenleri

```typescript
// src/components/PaymentForm.tsx
import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentService } from '../services/paymentService';

interface PaymentFormProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        onError(error.message || 'Ödeme işlemi başarısız');
        return;
      }

      const result = await paymentService.processPayment(amount, paymentMethod);
      
      if (result.success) {
        onSuccess(paymentMethod.id);
      }
    } catch (error) {
      onError('Ödeme işlemi sırasında hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kart Bilgileri
        </label>
        <div className="border border-gray-300 rounded-md p-3">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'İşleniyor...' : `${amount} TL Öde`}
      </button>
    </form>
  );
};
```

### 4. Backend API (Node.js/Express)

```javascript
// server/routes/payment.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'try' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe kuruş cinsinden çalışır
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Ödeme işlemi başlatılamadı' });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      // Veritabanında sipariş durumunu güncelle
      break;
    
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      // Kullanıcıya hata bildirimi gönder
      break;
  }

  res.json({ received: true });
});

module.exports = router;
```

### 5. Sipariş Yönetimi

```typescript
// src/services/orderService.ts
export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export class OrderService {
  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order: Omit<Order, 'id'> = {
      userId,
      items,
      totalAmount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await firebaseService.addOrder(order);
    return result.data;
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    return await firebaseService.updateOrder(orderId, { 
      status, 
      updatedAt: new Date() 
    });
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    return await firebaseService.getUserOrders(userId);
  }
}

export const orderService = new OrderService();
```

---

## 🔒 Güvenlik ve En İyi Uygulamalar

### 1. API Anahtarı Güvenliği

```typescript
// src/config/security.ts
export const securityConfig = {
  // API anahtarlarını sadece server-side'da kullan
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY,
    stripe: process.env.STRIPE_SECRET_KEY,
  },
  
  // Rate limiting ayarları
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
  },
  
  // CORS ayarları
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
};
```

### 2. Input Validation

```typescript
// src/utils/validation.ts
import { z } from 'zod';

export const paymentSchema = z.object({
  amount: z.number().positive().max(10000),
  currency: z.enum(['try', 'usd', 'eur']),
  paymentMethod: z.string().min(1),
});

export const aiPromptSchema = z.object({
  prompt: z.string().min(1).max(1000),
  context: z.string().optional(),
});

export const validateInput = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  return schema.parse(data);
};
```

### 3. Error Handling

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError('Bilinmeyen hata oluştu');
};
```

---

## 🧪 Test ve Doğrulama

### 1. GEMINI API Testleri

```typescript
// tests/aiService.test.ts
import { aiService } from '../src/services/aiService';

describe('AIService', () => {
  test('should generate response for valid prompt', async () => {
    const prompt = 'Merhaba, nasılsın?';
    const response = await aiService.generateResponse(prompt);
    
    expect(response).toBeDefined();
    expect(typeof response).toBe('string');
    expect(response.length).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async () => {
    // Invalid API key test
    const originalKey = import.meta.env.VITE_GEMINI_API_KEY;
    import.meta.env.VITE_GEMINI_API_KEY = 'invalid_key';
    
    await expect(aiService.generateResponse('test')).rejects.toThrow();
    
    import.meta.env.VITE_GEMINI_API_KEY = originalKey;
  });
});
```

### 2. Ödeme Sistemi Testleri

```typescript
// tests/paymentService.test.ts
import { paymentService } from '../src/services/paymentService';

describe('PaymentService', () => {
  test('should create payment intent', async () => {
    const amount = 100;
    const clientSecret = await paymentService.createPaymentIntent(amount);
    
    expect(clientSecret).toBeDefined();
    expect(typeof clientSecret).toBe('string');
  });

  test('should handle payment processing', async () => {
    const mockPaymentMethod = {
      id: 'pm_test_123',
      type: 'card',
    };

    const result = await paymentService.processPayment(100, mockPaymentMethod);
    expect(result.success).toBe(true);
  });
});
```

### 3. Integration Tests

```typescript
// tests/integration.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentForm } from '../src/components/PaymentForm';

describe('Payment Integration', () => {
  test('should process payment successfully', async () => {
    const mockOnSuccess = jest.fn();
    const mockOnError = jest.fn();

    render(
      <PaymentForm
        amount={100}
        onSuccess={mockOnSuccess}
        onError={mockOnError}
      />
    );

    // Test payment flow
    const submitButton = screen.getByText('100 TL Öde');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
```

---

## 🔧 Sorun Giderme

### GEMINI API Sorunları

| Sorun | Çözüm |
|-------|-------|
| API anahtarı geçersiz | Google AI Studio'dan yeni anahtar oluşturun |
| Rate limit aşıldı | Rate limiting uygulayın ve istekleri sınırlayın |
| Model yanıt vermiyor | Prompt'u optimize edin ve context ekleyin |
| CORS hatası | Backend proxy kullanın veya CORS ayarlarını kontrol edin |

### Ödeme Sistemi Sorunları

| Sorun | Çözüm |
|-------|-------|
| Stripe anahtarı geçersiz | Stripe Dashboard'dan doğru anahtarları alın |
| Webhook çalışmıyor | Webhook endpoint'ini kontrol edin ve test edin |
| Ödeme başarısız | Test kartları kullanın ve hata mesajlarını kontrol edin |
| SSL sertifikası | HTTPS kullanın ve sertifikayı doğrulayın |

### Debug ve Logging

```typescript
// src/utils/debug.ts
export const debugPayment = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[PAYMENT DEBUG] ${message}`, data);
  }
};

export const debugAI = (message: string, data?: any) => {
  if (import.meta.env.DEV) {
    console.log(`[AI DEBUG] ${message}`, data);
  }
};
```

---

## 📚 Ek Kaynaklar

- [Google AI Studio Documentation](https://ai.google.dev/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## 🚀 Deployment Checklist

- [ ] Environment variables ayarlandı
- [ ] API anahtarları güvenli şekilde saklandı
- [ ] CORS ayarları yapılandırıldı
- [ ] Rate limiting uygulandı
- [ ] Error handling test edildi
- [ ] Webhook endpoint'leri doğrulandı
- [ ] SSL sertifikası yüklendi
- [ ] Test kartları ile ödeme test edildi
- [ ] AI yanıtları test edildi
- [ ] Security rules deploy edildi

Bu rehber ile GEMINI API ve ödeme sistemi entegrasyonunu güvenli ve etkili bir şekilde tamamlayabilirsiniz.