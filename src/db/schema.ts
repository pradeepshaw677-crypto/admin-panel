import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  googleSub: text('google_sub'),
  role: text('role', { enum: ['CUSTOMER', 'ADMIN', 'DELIVERY_AGENT'] }).default('CUSTOMER').notNull(),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).default(false).notNull(),
  tokenVersion: integer('token_version').default(1).notNull(),
  walletBalance: integer('wallet_balance').default(0).notNull(),
  createdAt: integer('created_at').notNull(),
});

export const otpChallenges = sqliteTable('otp_challenges', {
  id: text('id').primaryKey(),
  phone: text('phone').notNull(),
  otpHash: text('otp_hash').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  expiresAt: integer('expires_at').notNull(),
  verified: integer('verified', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  stock: integer('stock').notNull(),
  imageUrl: text('image_url'),
  category: text('category'),
  brand: text('brand'),
  description: text('description'),
  originalPrice: real('original_price'),
  rating: real('rating'),
  reviewsCount: integer('reviews_count'),
  isBestSeller: integer('is_best_seller', { mode: 'boolean' }).default(false),
  isFlashDeal: integer('is_flash_deal', { mode: 'boolean' }).default(false),
  discountPercent: integer('discount_percent').default(0),
  unit: text('unit'),
  sizesJson: text('sizes_json'),
  colorsJson: text('colors_json'),
  createdAt: integer('created_at').notNull(),
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull(),
  totalAmount: real('total_amount').notNull(),
  status: text('status').notNull(),
  itemsJson: text('items_json'),
  addressJson: text('address_json'),
  paymentMethod: text('payment_method'),
  abCoinsUsed: integer('ab_coins_used').default(0),
  coinsDiscount: real('coins_discount').default(0),
  deliveryOtp: text('delivery_otp'),
  createdAt: integer('created_at').notNull(),
});
