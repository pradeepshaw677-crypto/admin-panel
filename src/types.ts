export type CategoryId = 
  | 'all'
  | 'fashion'
  | 'footwear'
  | 'toys'
  | 'accessories'
  | string;

export interface Category {
  id: CategoryId;
  name: string;
  hindiName?: string;
  icon: string;
  description: string;
  image: string;
  itemCount?: number;
  featuredSubcategories?: string[];
}

export interface ColorOption {
  name: string;
  hex: string;
  imageUrl?: string;
  imageIndex?: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  hindiName?: string;
  category: 'fashion' | 'footwear' | 'toys' | 'accessories' | string;
  subcategory?: string;
  brand?: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  image: string; // Primary Cloudinary CDN URL
  images?: string[]; // Multi-angle gallery Cloudinary CDN URLs
  sizes?: string[]; // e.g. S, M, L, XL, XXL or UK 7, UK 8
  colors?: ColorOption[];
  rating: number;
  reviewsCount: number;
  inStock: boolean;
  stockCount?: number;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isFlashDeal?: boolean;
  dealEndsAt?: number;
  description: string;
  highlights?: string[];
  specifications?: ProductSpecification[];
  deliveryDays?: number;
  isPlusFreeDelivery?: boolean;
  unit?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  unitPrice?: number;
  originalUnitPrice?: number;
}

export interface DeliveryAddress {
  id?: string;
  fullName: string;
  phoneNumber: string;
  streetAddress: string;
  landmark?: string;
  area: string;
  pincode: string;
  city: string;
  state?: string;
  addressType: 'home' | 'work' | 'other' | string;
  isDefault?: boolean;
}

export interface Coupon {
  code: string;
  title?: string;
  image?: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderValue: number;
  description: string;
  expiryText?: string;
}

export type OrderStatus = 
  | 'placed' 
  | 'confirmed' 
  | 'packing' 
  | 'shipped' 
  | 'out_for_delivery' 
  | 'delivered'
  | 'return_requested'
  | 'return_pickup_scheduled'
  | 'returned'
  | 'cancelled';

export interface TrackingStep {
  title: string;
  description: string;
  timestamp?: number;
  completed: boolean;
  active: boolean;
}

export interface Order {
  id: string;
  createdAt: number;
  items: CartItem[];
  itemTotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  tipAmount: number;
  totalAmount: number;
  address: DeliveryAddress;
  paymentMethod: 'cod' | 'upi' | 'card' | string;
  paymentStatus: 'pending' | 'completed' | 'failed' | string;
  orderStatus: OrderStatus;
  estimatedDeliveryDate?: string;
  estimatedDeliveryTime?: number;
  appliedCoupon?: string;
  otp?: string; // 6-digit delivery confirmation OTP
  cancellationAllowed?: boolean;
  trackingSteps?: TrackingStep[];
  userId?: string;
  // AB Coin Wallet & Return system
  abCoinsUsed?: number;
  coinsDiscount?: number;
  walletRefundAmount?: number;
  returnApprovedAt?: number;
  returnStatus?: 'not_requested' | 'requested' | 'approved' | 'rejected';
  // 5-Day Return & Live Rider system
  deliveredAt?: number;
  returnEligibleUntil?: number;
  returnRequested?: boolean;
  returnOtp?: string; // 6-digit return pickup OTP
  returnReason?: string;
  returnComments?: string;
  returnRequestedAt?: number;
  deliveryRider?: {
    name: string;
    phone: string;
    rating: number;
    vehicle: string;
    photo: string;
  };
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number; // in AB Coins (1 AB Coin = ₹1)
  title: string;
  description?: string;
  date: string;
  orderId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  isLoggedIn: boolean;
  role: 'customer' | 'admin' | string;
  membership?: string;
  referralCode?: string;
  walletBalance?: number; // In AB Coins
  walletTransactions?: WalletTransaction[];
  totalOrders?: number;
  totalSpent?: number;
  savedAddresses?: DeliveryAddress[];
  wishlistIds?: string[];
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: number;
  verifiedBuyer: boolean;
  helpfulCount: number;
  images?: string[];
}
