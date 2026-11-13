import { CategoryId } from '../types';
import { CATEGORIES } from './products';

/**
 * Editable storefront content defaults. The admin panel reads and writes the
 * same shapes through /api/admin/content/:kind, so every built-in banner,
 * deal, brand, category and fabric can be edited or removed without code.
 */

export interface SiteBanner {
  id: string;
  brand: string;
  title: string;
  offerTag: string;
  subtitle: string;
  bankOffer: string;
  bgGradient: string;
  accentColor: string;
  image: string;
  localAsset?: string;
  targetProductId?: string;
  categoryId?: CategoryId;
}

export const DEFAULT_BANNERS: SiteBanner[] = [
  {
    id: 'slide-1-safari',
    brand: 'Safari, Aristocrat..',
    title: 'Safari, Aristocrat...',
    offerTag: 'Min. 80% Off',
    subtitle: 'Trolley bags & travel luggage',
    bankOffer: '10% Instant Discount* on SBI Debit/Credit Cards & EMI',
    bgGradient: 'from-[#e11d48] via-[#ea580c] to-[#f59e0b]',
    accentColor: '#fbbf24',
    image: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=1200&q=85',
    localAsset: '/assets/aistudio/Screenshot_2026_1103_082600_2840b9c7.png',
    targetProductId: 'acc-001',
    categoryId: 'accessories',
  },
  {
    id: 'slide-2-action',
    brand: 'ACTION',
    title: 'Step out sharp',
    offerTag: 'Min. 75% Off',
    subtitle: 'Made for all your plans',
    bankOffer: '10% Instant Discount* on SBI Debit/Credit Cards & EMI',
    bgGradient: 'from-[#090d16] via-[#1a2233] to-[#2d3748]',
    accentColor: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85',
    localAsset: '/assets/aistudio/Screenshot_2026_1103_082608_9bba3c93.png',
    targetProductId: 'ftw-002',
    categoryId: 'footwear',
  },
  {
    id: 'slide-3-adidas',
    brand: 'adidas',
    title: 'Power every step',
    offerTag: 'Min. 50% Off',
    subtitle: 'Limited-time deal on performance running',
    bankOffer: '10% Instant Discount* on SBI Debit/Credit Cards & EMI',
    bgGradient: 'from-[#064e3b] via-[#047857] to-[#10b981]',
    accentColor: '#84cc16',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=1200&q=85',
    localAsset: '/assets/aistudio/Screenshot_2026_1103_082613_0737f95d.png',
    targetProductId: 'ftw-001',
    categoryId: 'footwear',
  },
  {
    id: 'slide-4-bear-house',
    brand: 'The Bear House, Snitch..',
    title: 'The Bear House, Snitch..',
    offerTag: 'Under ₹599',
    subtitle: 'Shirts, jeans & casual wear',
    bankOffer: '10% Instant Discount* on SBI Debit/Credit Cards & EMI',
    bgGradient: 'from-[#c2410c] via-[#ea580c] to-[#f59e0b]',
    accentColor: '#fbbf24',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',
    localAsset: '/assets/aistudio/Screenshot_2026_1103_082622_9516b5a4.png',
    targetProductId: 'fsh-002',
    categoryId: 'fashion',
  },
  {
    id: 'slide-5-banarasi',
    brand: 'Varanasi Royal Silks',
    title: 'Royal Banarasi Silk Sarees',
    offerTag: 'Flat 62% Off',
    subtitle: 'Handcrafted zari pallu with unstitched blouse',
    bankOffer: '10% Savings* Apna Bazar Plus Member Privilege',
    bgGradient: 'from-[#831843] via-[#9d174d] to-[#be185d]',
    accentColor: '#f43f5e',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85',
    targetProductId: 'sar-001',
    categoryId: 'sarees',
  },
  {
    id: 'slide-6-puma',
    brand: 'PUMA',
    title: 'High-Impact Street Kicks',
    offerTag: 'Min. 65% Off',
    subtitle: 'Shock absorbing air cushion & responsive grip',
    bankOffer: '10% Instant Discount* on SBI Debit/Credit Cards & EMI',
    bgGradient: 'from-[#1e1b4b] via-[#312e81] to-[#4338ca]',
    accentColor: '#a5b4fc',
    image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=85',
    targetProductId: 'ftw-003',
    categoryId: 'footwear',
  },
  {
    id: 'slide-7-velvet',
    brand: 'Libas, Biba',
    title: 'Winter Velvet Kurta Sets',
    offerTag: 'Min. 70% Off',
    subtitle: 'Royal embroidered sets with organza dupattas',
    bankOffer: '10% Instant Discount* on All Cards',
    bgGradient: 'from-[#172554] via-[#1e3a8a] to-[#2563eb]',
    accentColor: '#60a5fa',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=85',
    targetProductId: 'fsh-004',
    categoryId: 'fashion',
  },
  {
    id: 'slide-8-watches',
    brand: 'Fastrack, Timex',
    title: 'Chronograph Luxury Watches',
    offerTag: 'Under ₹999',
    subtitle: 'Waterproof 5ATM steel bezel & smart health monitoring',
    bankOffer: '1-Year Warranty & Free Gift Case Included',
    bgGradient: 'from-[#0f172a] via-[#1e293b] to-[#334155]',
    accentColor: '#38bdf8',
    image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=85',
    targetProductId: 'acc-002',
    categoryId: 'accessories',
  },
  {
    id: 'slide-9-kids',
    brand: 'Little Champs',
    title: "Fit for the Lil' Ones",
    offerTag: 'Under ₹299',
    subtitle: 'Character t-shirts, trackpants & cozy innerwear',
    bankOffer: '100% Cash on Delivery & 5-Day Hassle-Free Returns',
    bgGradient: 'from-[#b91c1c] via-[#dc2626] to-[#ef4444]',
    accentColor: '#fca5a5',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=1200&q=85',
    targetProductId: 'toy-001',
    categoryId: 'toys',
  },
  {
    id: 'slide-10-streetwear',
    brand: 'Apna Trends',
    title: 'Urban Heavyweight Drop',
    offerTag: 'From ₹149',
    subtitle: '240 GSM French terry oversized streetwear',
    bankOffer: 'Doorstep Delivery with 6-Digit OTP Verification',
    bgGradient: 'from-[#7c2d12] via-[#9a3412] to-[#c2410c]',
    accentColor: '#fdba74',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=85',
    targetProductId: 'fsh-001',
    categoryId: 'fashion',
  },
];

export interface SiteDeal {
  id: string;
  name: string;
  categoryTag: string;
  categoryIcon: string;
  originalPrice: number;
  dealPrice: number;
  image: string;
  silkGradient: string;
  targetProductId: string;
  categoryId: string;
}

export const DEFAULT_DEALS: SiteDeal[] = [
  {
    id: 'diwali-1-brooklyn',
    name: 'Brooklyn Fleece Streetwear Hoodie',
    categoryTag: "Men's Wear",
    categoryIcon: '👑',
    originalPrice: 499,
    dealPrice: 299,
    image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#0284c7] via-[#0369a1] to-[#1e3a8a]',
    targetProductId: 'fsh-001',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-2-polo',
    name: 'Classic White Tipped Collar Polo',
    categoryTag: "Men's Wear",
    categoryIcon: '👑',
    originalPrice: 399,
    dealPrice: 299,
    image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#16a34a] via-[#15803d] to-[#14532d]',
    targetProductId: 'fsh-002',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-3-flannel',
    name: 'Buffalo Plaid Check Casual Shirt',
    categoryTag: "Men's Wear",
    categoryIcon: '👑',
    originalPrice: 449,
    dealPrice: 349,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#9333ea] via-[#7e22ce] to-[#581c87]',
    targetProductId: 'fsh-004',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-4-jeans',
    name: 'Classic Indigo Blue Denim Jeans',
    categoryTag: 'Jeans',
    categoryIcon: '👑',
    originalPrice: 799,
    dealPrice: 599,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#eab308] via-[#ca8a04] to-[#854d0e]',
    targetProductId: 'fsh-003',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-5-pinkdress',
    name: 'Pink Floral Flared Puff-Sleeve Dress',
    categoryTag: "Women's Wear",
    categoryIcon: '👑',
    originalPrice: 699,
    dealPrice: 499,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#ec4899] via-[#db2777] to-[#9d174d]',
    targetProductId: 'fsh-003',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-6-kurti',
    name: 'Royal Maroon Zari Embroidered Kurti',
    categoryTag: "Women's Wear",
    categoryIcon: '👑',
    originalPrice: 499,
    dealPrice: 349,
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#7c3aed] via-[#6d28d9] to-[#4c1d95]',
    targetProductId: 'fsh-004',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-7-whitefrock',
    name: 'Sweetheart White Floral Summer Frock',
    categoryTag: "Women's Wear",
    categoryIcon: '👑',
    originalPrice: 599,
    dealPrice: 399,
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#22c55e] via-[#16a34a] to-[#15803d]',
    targetProductId: 'fsh-003',
    categoryId: 'fashion',
  },
  {
    id: 'diwali-8-handbag',
    name: 'Blush Pink Golden Heart Sling Bag',
    categoryTag: 'Handbag',
    categoryIcon: '👑',
    originalPrice: 499,
    dealPrice: 249,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
    silkGradient: 'from-[#f59e0b] via-[#d97706] to-[#b45309]',
    targetProductId: 'acc-003',
    categoryId: 'accessories',
  },
];

export interface SiteBrand {
  id: string;
  name: string;
  category: string;
  logoUrl: string;
}

export const DEFAULT_BRANDS: SiteBrand[] = [
  { id: 'hm', name: 'H&M', category: 'Up to 50% Off', logoUrl: '' },
  { id: 'nike', name: 'Nike', category: 'Up to 50% Off', logoUrl: '' },
  { id: 'cider', name: 'Cider', category: 'Up to 70% Off', logoUrl: '' },
  { id: 'puma', name: 'Puma', category: '40-60% Off', logoUrl: '' },
  { id: 'us-polo', name: 'U.S. Polo Assn.', category: 'Min 40% Off', logoUrl: '' },
  { id: 'snitch', name: 'Snitch', category: 'Fashion', logoUrl: '' },
  { id: 'campus', name: 'Campus', category: 'Footwear', logoUrl: '' },
  { id: 'bear-house', name: 'The Bear House', category: 'Casuals', logoUrl: '' },
  { id: 'adidas', name: 'Adidas', category: 'Sneakers', logoUrl: '' },
  { id: 'tokyo-talkies', name: 'Tokyo Talkies', category: 'Western', logoUrl: '' },
  { id: 'safari', name: 'Safari', category: 'Luggage', logoUrl: '' },
  { id: 'cantabil', name: 'Cantabil', category: 'Formal', logoUrl: '' },
  { id: 'libas', name: 'Libas', category: 'Ethnic', logoUrl: '' },
  { id: 'biba', name: 'Biba', category: 'Festive', logoUrl: '' },
];

export interface SiteCategory {
  id: string;
  name: string;
  hindiName?: string;
  icon: string;
  description: string;
  image: string;
}

export const DEFAULT_CATEGORIES: SiteCategory[] = CATEGORIES.filter((category) => category.id !== 'all').map(
  (category) => ({
    id: category.id,
    name: category.name,
    hindiName: category.hindiName,
    icon: category.icon,
    description: category.description,
    image: category.image,
  }),
);

export interface SiteFabric {
  id: string;
  name: string;
  hindi: string;
  icon: string;
  image: string;
  keywords: string[];
}

export const DEFAULT_FABRICS: SiteFabric[] = [
  {
    id: 'all',
    name: 'All Fabrics',
    hindi: 'सभी फैब्रिक',
    icon: '✨',
    image: '/assets/aistudio/Screenshot_2026_1106_205708_8a333b8c.png',
    keywords: [],
  },
  {
    id: 'cotton',
    name: 'Cotton',
    hindi: 'कॉटन / सूती',
    icon: '☁️',
    image: '/assets/aistudio/Screenshot_2026_1106_205750_2f8b4a8b.png',
    keywords: ['cotton', 'mulmul', 'oxford', 'khadi', 'twill', 'pique', 'combed'],
  },
  {
    id: 'silk',
    name: 'Silk',
    hindi: 'सिल्क / रेशम',
    icon: '🧵',
    image: '/assets/aistudio/Screenshot_2026_1106_210033_52aac3d0.png',
    keywords: ['silk', 'banarasi', 'katan', 'tussar', 'pattu', 'chanderi', 'zari', 'jacquard'],
  },
  {
    id: 'wool',
    name: 'Wool & Fleece',
    hindi: 'ऊन / फ्लीस',
    icon: '🧶',
    image: '/assets/aistudio/Screenshot_2026_1106_210111_cc73a541.png',
    keywords: ['wool', 'fleece', 'terry', 'knit', 'sweater', 'hoodie', 'winter', 'jacket', 'puffer', 'sweatshirt'],
  },
  {
    id: 'polyester',
    name: 'Polyester',
    hindi: 'पॉलिएस्टर / जॉर्जेट',
    icon: '⚡',
    image: '/assets/aistudio/Screenshot_2026_1106_210152_55383cbe.png',
    keywords: ['polyester', 'poly', 'georgette', 'chiffon', 'organza', 'drycell', 'dri-fit', 'lycra', 'spandex', 'nylon'],
  },
  {
    id: 'denim',
    name: 'Denim',
    hindi: 'डेनिम / जींस',
    icon: '👖',
    image: '/assets/aistudio/Screenshot_2026_1106_210218_95587bac.png',
    keywords: ['denim', 'jeans', 'trucker', 'chambray', 'wide leg'],
  },
  {
    id: 'linen',
    name: 'Linen',
    hindi: 'लिनन / फ्लैक्स',
    icon: '🌿',
    image: '/assets/aistudio/Screenshot_2026_1106_210253_da7d626d.png',
    keywords: ['linen', 'flax', 'woven', 'slub'],
  },
  {
    id: 'velvet-satin',
    name: 'Velvet & Satin',
    hindi: 'वेलवेट / सैटिन',
    icon: '✨',
    image: '/assets/aistudio/Screenshot_2026_1106_210327_7e2a0625.png',
    keywords: ['velvet', 'satin', 'cowl', 'crepe'],
  },
  {
    id: 'rayon',
    name: 'Rayon & Viscose',
    hindi: 'रेयॉन / विस्कोस',
    icon: '🌸',
    image: '/assets/aistudio/Screenshot_2026_1106_210352_31dcf9b6.png',
    keywords: ['rayon', 'viscose', 'modal'],
  },
  {
    id: 'leather',
    name: 'Leather & EVA',
    hindi: 'लेदर / ईवा',
    icon: '👞',
    image: '/assets/aistudio/Screenshot_2026_1106_210417_36af62fb.png',
    keywords: ['leather', 'pu', 'suede', 'eva', 'rubber', 'canvas'],
  },
];

export interface SiteLook {
  id: string;
  name: string;
  subtitle: string;
  image: string;
  targetProductId?: string;
  categoryId?: string;
}

export const DEFAULT_LOOKS: SiteLook[] = [
  {
    id: 'blue',
    name: 'BLUE',
    subtitle: 'Cool blues for every mood',
    image: '/assets/aistudio/Screenshot_2026_1106_193236_878675a3.png',
  },
  {
    id: 'green',
    name: 'GREEN',
    subtitle: 'Fresh everyday greens',
    image: '/assets/aistudio/Screenshot_2026_1106_193250_e5234f97.png',
  },
  {
    id: 'pink',
    name: 'PINK',
    subtitle: 'Soft pink statements',
    image: '/assets/aistudio/Screenshot_2026_1106_193304_a72a30aa.png',
  },
  {
    id: 'gold',
    name: 'GOLD',
    subtitle: 'Festive gold glow',
    image: '/assets/aistudio/Screenshot_2026_1106_193323_1841ecb8.png',
  },
  {
    id: 'white',
    name: 'WHITE',
    subtitle: 'Clean ivory & white',
    image: '/assets/aistudio/Screenshot_2026_1106_193339_fb9f86c9.png',
  },
  {
    id: 'black',
    name: 'BLACK',
    subtitle: 'Sharp night blacks',
    image: '/assets/aistudio/Screenshot_2026_1106_193352_75987c0e.png',
  },
  {
    id: 'red',
    name: 'RED',
    subtitle: 'Bold red energy',
    image: '/assets/aistudio/Screenshot_2026_1106_193400_e9c57b25.png',
  },
];

export const CONTENT_KINDS = ['banners', 'deals', 'coupons', 'brands', 'categories', 'fabrics', 'looks'] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const DEFAULT_CONTENT: Record<ContentKind, unknown[]> = {
  banners: DEFAULT_BANNERS,
  deals: DEFAULT_DEALS,
  coupons: [],
  brands: DEFAULT_BRANDS,
  categories: DEFAULT_CATEGORIES,
  fabrics: DEFAULT_FABRICS,
  looks: DEFAULT_LOOKS,
};

export interface SiteSettings {
  logoUrl: string;
  adminLogoUrl: string;
  storeName: string;
  storePhone: string;
  storeEmail: string;
  storeAddress: string;
  freeDeliveryThreshold: number;
  returnWindowDays: number;
  coinValueRupees: number;
  heroProductId: string;
  featuredProductIds: string[];
  announcement: string;
  maintenanceMode: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  logoUrl: '/assets/aistudio/IMG_20261102_120048_b98f504b.png',
  adminLogoUrl: '/assets/aistudio/IMG_20261102_120048_b98f504b.png',
  storeName: 'Apna Bazar',
  storePhone: '+91 9999999999',
  storeEmail: 'support@apnabazar.in',
  storeAddress: 'Apna Bazar Express Hub, Dadu Complex, Near Shitla Mandir, Baharagora, Jharkhand - 832101',
  freeDeliveryThreshold: 499,
  returnWindowDays: 5,
  coinValueRupees: 2,
  heroProductId: 'fsh-001',
  featuredProductIds: [],
  announcement: '',
  maintenanceMode: false,
};
