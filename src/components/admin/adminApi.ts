import type { Order, Product, UserProfile } from '../../types';

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

async function adminRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }
  if (!response.ok) {
    throw new AdminApiError(data?.error || 'Request failed. Please try again.', response.status);
  }
  return data as T;
}

export type ContentKind = 'banners' | 'deals' | 'coupons' | 'brands' | 'categories' | 'fabrics' | 'looks';

export interface ContentItem {
  id: string;
  isActive: boolean;
  sortOrder: number;
  [key: string]: unknown;
}

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

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isBlocked: boolean;
  walletBalance: number;
  hasGoogle: boolean;
  avatar: string;
  createdAt: number;
}

export interface AdminReturn {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  comments: string;
  status: string;
  otp: string;
  adminNote: string;
  refundAmount: number;
  decidedAt: number | null;
  createdAt: number;
  order: (Order & { userId?: string }) | null;
  customer: AdminUser | null;
}

export interface AdminOrder extends Order {
  customer?: AdminUser | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  price: number;
  stock: number;
  stockValue: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface AdminMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingReturns: number;
  coinsInCirculation: number;
}

export interface AuditEntry {
  id: string;
  admin_id: string | null;
  action: string;
  detail: string | null;
  ip_hash: string | null;
  created_at: number;
}

export const adminApi = {
  login(email: string, password: string) {
    return adminRequest<{ success: boolean; user: UserProfile }>('/api/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return adminRequest<{ user: UserProfile; configured: boolean }>('/api/admin/auth/me');
  },
  logout() {
    return adminRequest<{ success: boolean }>('/api/admin/auth/logout', { method: 'POST' });
  },
  metrics() {
    return adminRequest<AdminMetrics>('/api/admin/metrics');
  },

  products(params: { search?: string; lowStock?: boolean } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.lowStock) query.set('lowStock', '1');
    return adminRequest<{ products: Product[]; total: number }>(`/api/admin/products?${query.toString()}`);
  },
  createProduct(payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean; id: string }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateProduct(id: string, payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  deleteProduct(id: string) {
    return adminRequest<{ success: boolean }>(`/api/admin/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  deleteAllProducts() {
    return adminRequest<{ success: boolean; deleted: number }>('/api/admin/products', {
      method: 'DELETE',
      body: JSON.stringify({ confirm: 'DELETE ALL' }),
    });
  },
  restoreProducts() {
    return adminRequest<{ success: boolean; restored: number }>('/api/admin/products/restore', {
      method: 'POST',
    });
  },
  bulkPrice(payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean; updated: number }>('/api/admin/products/bulk-price', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  bulkOffer(payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean; updated: number }>('/api/admin/products/bulk-offer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  inventory() {
    return adminRequest<{ inventory: InventoryItem[]; totals: Record<string, number> }>('/api/admin/inventory');
  },

  content() {
    return adminRequest<{ content: Record<ContentKind, ContentItem[]>; settings: SiteSettings }>(
      '/api/admin/content',
    );
  },
  createContent(kind: ContentKind, payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean; item: ContentItem }>(`/api/admin/content/${kind}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateContent(kind: ContentKind, id: string, payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean; item: ContentItem }>(
      `/api/admin/content/${kind}/${encodeURIComponent(id)}`,
      { method: 'PATCH', body: JSON.stringify(payload) },
    );
  },
  deleteContent(kind: ContentKind, id: string) {
    return adminRequest<{ success: boolean }>(`/api/admin/content/${kind}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
  deleteAllContent(kind: ContentKind) {
    return adminRequest<{ success: boolean; deleted: number }>(`/api/admin/content/${kind}`, {
      method: 'DELETE',
      body: JSON.stringify({ confirm: 'DELETE ALL' }),
    });
  },
  restoreContent(kind: ContentKind) {
    return adminRequest<{ success: boolean; items: ContentItem[] }>(`/api/admin/content/${kind}/restore`, {
      method: 'POST',
    });
  },
  restoreAllContent() {
    return adminRequest<{ success: boolean }>('/api/admin/content/restore-all', { method: 'POST' });
  },

  users(search = '') {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    return adminRequest<{ users: AdminUser[]; total: number }>(`/api/admin/users?${query.toString()}`);
  },
  updateUser(id: string, payload: Record<string, unknown>) {
    return adminRequest<{ success: boolean; user: AdminUser }>(`/api/admin/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  adjustCoins(id: string, payload: { amount: number; type: 'credit' | 'debit'; note?: string }) {
    return adminRequest<{ success: boolean; walletBalance: number }>(
      `/api/admin/users/${encodeURIComponent(id)}/coins`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  },
  userLedger(id: string) {
    return adminRequest<{ entries: Array<Record<string, unknown>> }>(
      `/api/admin/users/${encodeURIComponent(id)}/ledger`,
    );
  },
  transferCoins(payload: { fromUserId: string; toUserId: string; amount: number; note?: string }) {
    return adminRequest<{ success: boolean }>('/api/admin/coins/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  broadcastCoins(payload: { amount: number; note?: string }) {
    return adminRequest<{ success: boolean; credited: number; amount: number }>('/api/admin/coins/broadcast', {
      method: 'POST',
      body: JSON.stringify({ ...payload, confirm: 'SEND ALL' }),
    });
  },
  coinLedger(userId?: string) {
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return adminRequest<{ entries: Array<Record<string, unknown>> }>(`/api/admin/coins/ledger${query}`);
  },

  orders(params: { status?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return adminRequest<{ orders: AdminOrder[]; total: number }>(`/api/admin/orders?${query.toString()}`);
  },
  updateOrderStatus(id: string, status: string) {
    return adminRequest<{ success: boolean; order: Order }>(
      `/api/admin/orders/${encodeURIComponent(id)}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
    );
  },
  refundOrder(id: string, payload: { amount?: number; restock?: boolean }) {
    return adminRequest<{ success: boolean; refunded: number; order: Order }>(
      `/api/admin/orders/${encodeURIComponent(id)}/refund`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  },

  returns() {
    return adminRequest<{ returns: AdminReturn[] }>('/api/admin/returns');
  },
  updateReturn(
    id: string,
    payload: { status: string; adminNote?: string; refundAmount?: number; refundCoins?: number },
  ) {
    return adminRequest<{ success: boolean }>(`/api/admin/returns/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  settings() {
    return adminRequest<{ settings: SiteSettings }>('/api/admin/settings');
  },
  updateSettings(payload: Partial<SiteSettings>) {
    return adminRequest<{ success: boolean; settings: SiteSettings }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  audit(limit = 100) {
    return adminRequest<{ entries: AuditEntry[] }>(`/api/admin/audit?limit=${limit}`);
  },
};
