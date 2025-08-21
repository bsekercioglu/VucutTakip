export interface AdminUser {
  id: string;
  userId: string;
  role: 'admin' | 'sponsor' | 'user';
  permissions: string[];
  sponsorCode?: string;
  parentSponsorId?: string | null;
  teamLevel: number; // 0: admin, 1: sponsor, 2+: alt sponsor
  teamPath: string[]; // Hiyerarşik yol: ['adminId', 'sponsor1Id', 'sponsor2Id']
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  canCreateInvitations: boolean;
  canViewTeamData: boolean;
  maxTeamLevel: number; // 0: sınırsız (admin), 1: sponsor, 2: alt sponsor
  createdAt: string;
  updatedAt: string;
}

export interface SponsorTeam {
  id: string;
  sponsorId: string;
  memberId: string;
  joinedAt: string;
  status: 'active' | 'inactive';
}

export interface Order {
  id: string;
  userId: string;
  sponsorId?: string;
  products: OrderProduct[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: ShippingAddress;
  contactInfo: ContactInfo;
  orderDate: string;
  notes?: string;
}

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  alternativePhone?: string;
}

export interface ProductRecommendation {
  id: string;
  sponsorId: string;
  userId: string;
  productId: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'viewed' | 'ordered';
}

export interface SponsorMessage {
  id: string;
  sponsorId: string;
  userId: string;
  message: string;
  timestamp: string;
  type: 'question' | 'recommendation' | 'motivation';
  response?: string;
  responseTimestamp?: string;
}