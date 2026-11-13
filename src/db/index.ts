import 'dotenv/config';
import { createClient } from '@libsql/client';
import { PRODUCTS, SAMPLE_REVIEWS } from '../data/products';
import {
  HIGGS_MODELS_SPRITE,
  HIGGS_PIECES_SPRITE,
  RUNWAY_LOOKS,
  RUNWAY_ALL_PIECES,
} from '../data/runway3dData';
import {
  CLOUDINARY_MEDIA_READY,
  CLOUDINARY_UPLOAD_READY,
  canonicalCatalogImage,
  uploadRemoteImageToCloudinary,
} from '../../server/media';
import { CONTENT_KINDS, ContentKind, DEFAULT_CONTENT } from '../data/siteContent';

/*
 * Turso in production, embedded SQLite in development. The previous /web
 * client could not open file: URLs, which made the documented local fallback
 * crash every auth request when TURSO_DATABASE_URL was absent.
 */
const url =
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'file:apnabazar.db';
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

if (!process.env.TURSO_DATABASE_URL && !process.env.DATABASE_URL) {
  const message =
    '[db] No TURSO_DATABASE_URL configured. Using local file:apnabazar.db (data is lost on redeploy).';
  if (process.env.NODE_ENV === 'production') {
    console.error(`${message} Configure TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before going live.`);
  } else {
    console.warn(message);
  }
}

export const client = createClient({
  url,
  authToken,
});

async function tableColumns(table: string): Promise<Set<string>> {
  const result = await client.execute(`PRAGMA table_info(${table});`);
  return new Set(result.rows.map((row) => String(row.name)));
}

async function ensureColumn(table: string, column: string, definition: string): Promise<void> {
  const columns = await tableColumns(table);
  if (!columns.has(column)) {
    await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition};`);
  }
}

/**
 * Creates tables idempotently and seeds the catalog. Every statement is
 * parameterised and safe to run on each boot.
 */
export async function initDatabase(): Promise<void> {
  if (url.startsWith('file:')) {
    for (const pragma of ['PRAGMA journal_mode=WAL;', 'PRAGMA synchronous=NORMAL;', 'PRAGMA busy_timeout=5000;']) {
      try {
        await client.execute(pragma);
      } catch {
        /* pragmas are best-effort on the local fallback */
      }
    }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      google_sub TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      is_blocked INTEGER NOT NULL DEFAULT 0,
      token_version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS otp_challenges (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      image_url TEXT,
      category TEXT,
      brand TEXT,
      description TEXT,
      original_price REAL,
      rating REAL,
      reviews_count INTEGER,
      is_best_seller INTEGER DEFAULT 0,
      is_flash_deal INTEGER DEFAULT 0,
      discount_percent INTEGER DEFAULT 0,
      unit TEXT,
      sizes_json TEXT,
      colors_json TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL,
      items_json TEXT,
      address_json TEXT,
      payment_method TEXT,
      ab_coins_used INTEGER DEFAULT 0,
      coins_discount REAL DEFAULT 0,
      delivery_otp TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      street_address TEXT NOT NULL,
      landmark TEXT,
      area TEXT,
      city TEXT NOT NULL,
      state TEXT,
      pincode TEXT NOT NULL,
      address_type TEXT DEFAULT 'home',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT,
      images_json TEXT,
      verified_buyer INTEGER NOT NULL DEFAULT 0,
      helpful_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      order_id TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE(user_id, code)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS otp_send_log (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS auth_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event TEXT NOT NULL,
      ip_hash TEXT,
      user_agent TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS site_content (
      kind TEXT NOT NULL,
      item_id TEXT NOT NULL,
      data_json TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (kind, item_id)
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS admin_audit (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      action TEXT NOT NULL,
      detail TEXT,
      ip_hash TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS wallet_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      note TEXT,
      ref_id TEXT,
      admin_id TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_site_content_kind ON site_content(kind, sort_order);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit(created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON wallet_ledger(user_id, created_at);`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      reason TEXT,
      comments TEXT,
      otp TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'requested',
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS runway_3d_assets (
      asset_key TEXT PRIMARY KEY,
      asset_type TEXT NOT NULL,
      look_number INTEGER NOT NULL,
      piece_id INTEGER,
      name TEXT NOT NULL,
      original_url TEXT NOT NULL,
      cloudinary_url TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  await ensureColumn('users', 'google_sub', 'TEXT');
  await ensureColumn('users', 'avatar', 'TEXT');
  await ensureColumn('users', 'token_version', 'INTEGER NOT NULL DEFAULT 1');
  await ensureColumn('users', 'is_blocked', 'INTEGER NOT NULL DEFAULT 0');
  await ensureColumn('users', 'wallet_balance', 'INTEGER NOT NULL DEFAULT 200');

  await ensureColumn('products', 'hindi_name', 'TEXT');
  await ensureColumn('products', 'subcategory', 'TEXT');
  await ensureColumn('products', 'images_json', 'TEXT');
  await ensureColumn('products', 'highlights_json', 'TEXT');
  await ensureColumn('products', 'specifications_json', 'TEXT');
  await ensureColumn('products', 'is_trending', 'INTEGER DEFAULT 0');
  await ensureColumn('products', 'is_plus_free_delivery', 'INTEGER DEFAULT 0');
  await ensureColumn('products', 'delivery_days', 'INTEGER DEFAULT 3');
  await ensureColumn('products', 'deal_ends_at', 'INTEGER');
  await ensureColumn('orders', 'refunded_amount', 'REAL DEFAULT 0');
  await ensureColumn('orders', 'refunded_at', 'INTEGER');
  await ensureColumn('returns', 'admin_note', 'TEXT');
  await ensureColumn('returns', 'refund_amount', 'REAL DEFAULT 0');
  await ensureColumn('returns', 'decided_at', 'INTEGER');

  await client.execute(`CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_challenges(phone);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_challenges(expires_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_otp_log_phone ON otp_send_log(phone, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_otp_log_ip ON otp_send_log(ip_hash, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category, created_at);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, created_at);`);
  await client.execute(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_product ON reviews(product_id, user_id);`,
  );
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_returns_user ON returns(user_id);`);
  await client.execute(`CREATE INDEX IF NOT EXISTS idx_auth_events_created ON auth_events(created_at);`);

  const countRes = await client.execute(`SELECT count(*) AS total FROM products;`);
  const total = Number(countRes.rows[0]?.total ?? 0);
  const now = Date.now();

  if (total < PRODUCTS.length) {
    console.log('Seeding catalog products into the database...');
    await client.batch(
      PRODUCTS.map((prod) => ({
        sql: `INSERT OR IGNORE INTO products (
          id, name, hindi_name, price, stock, image_url, category, subcategory, brand, description,
          original_price, rating, reviews_count, is_best_seller, is_trending, is_flash_deal,
          discount_percent, unit, sizes_json, colors_json, images_json, highlights_json,
          specifications_json, is_plus_free_delivery, delivery_days, deal_ends_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          prod.id,
          prod.name,
          prod.hindiName || null,
          prod.price,
          prod.stockCount ?? 50,
          prod.image || '',
          prod.category || 'general',
          prod.subcategory || null,
          prod.brand || 'Apna Bazar',
          prod.description || '',
          prod.originalPrice || prod.price,
          prod.rating || 4.5,
          prod.reviewsCount || 10,
          prod.isBestSeller ? 1 : 0,
          prod.isTrending ? 1 : 0,
          prod.isFlashDeal ? 1 : 0,
          prod.discountPercent || 0,
          prod.unit || 'piece',
          JSON.stringify(prod.sizes || []),
          JSON.stringify(prod.colors || []),
          JSON.stringify(prod.images?.length ? prod.images : prod.image ? [prod.image] : []),
          JSON.stringify(prod.highlights || []),
          JSON.stringify(prod.specifications || []),
          prod.isPlusFreeDelivery ? 1 : 0,
          prod.deliveryDays || 3,
          prod.dealEndsAt || null,
          now,
        ],
      })),
    );
  }

  // Backfill rich product metadata for databases created by older revisions.
  const incompleteRes = await client.execute(
    `SELECT count(*) AS total FROM products WHERE images_json IS NULL OR highlights_json IS NULL OR specifications_json IS NULL;`,
  );
  if (Number(incompleteRes.rows[0]?.total ?? 0) > 0) {
    await client.batch(
      PRODUCTS.map((prod) => ({
        sql: `UPDATE products SET
          subcategory = COALESCE(subcategory, ?),
          hindi_name = COALESCE(hindi_name, ?),
          images_json = COALESCE(images_json, ?),
          highlights_json = COALESCE(highlights_json, ?),
          specifications_json = COALESCE(specifications_json, ?),
          is_trending = COALESCE(is_trending, ?),
          is_plus_free_delivery = COALESCE(is_plus_free_delivery, ?),
          delivery_days = COALESCE(delivery_days, ?),
          deal_ends_at = COALESCE(deal_ends_at, ?)
          WHERE id = ?`,
        args: [
          prod.subcategory || null,
          prod.hindiName || null,
          JSON.stringify(prod.images?.length ? prod.images : prod.image ? [prod.image] : []),
          JSON.stringify(prod.highlights || []),
          JSON.stringify(prod.specifications || []),
          prod.isTrending ? 1 : 0,
          prod.isPlusFreeDelivery ? 1 : 0,
          prod.deliveryDays || 3,
          prod.dealEndsAt || null,
          prod.id,
        ],
      })),
    );
    console.log('Backfilled product media and catalogue metadata.');
  }

  for (const review of SAMPLE_REVIEWS) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO reviews
        (id, product_id, user_id, user_name, rating, title, comment, images_json, verified_buyer, helpful_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        review.id,
        review.productId,
        review.userId,
        review.userName,
        review.rating,
        review.title,
        review.comment,
        JSON.stringify(review.images || []),
        review.verifiedBuyer ? 1 : 0,
        review.helpfulCount || 0,
        review.createdAt,
      ],
    });
  }

  await seedAndSyncRunway3DAssets();
  await persistCloudinaryMediaUrls();
  await seedSiteContent();
}

/**
 * Copies the built-in banners, deals, brands, categories and fabrics into
 * `site_content` once so every default storefront component becomes editable
 * from the admin panel. Existing rows are never overwritten.
 */
async function seedSiteContent(): Promise<void> {
  const marker = await client.execute({
    sql: "SELECT value FROM site_settings WHERE key = 'content_initialized' LIMIT 1",
    args: [],
  });
  if (marker.rows.length > 0) return;

  const now = Date.now();
  for (const kind of CONTENT_KINDS) {
    const items = DEFAULT_CONTENT[kind as ContentKind] as Array<Record<string, unknown>>;
    if (!items.length) continue;
    await client.batch(
      items.map((item, index) => ({
        sql: `INSERT OR IGNORE INTO site_content
          (kind, item_id, data_json, is_active, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, 1, ?, ?, ?)`,
        args: [
          kind,
          String(item.id || `${kind}-${index + 1}`),
          JSON.stringify(item),
          index,
          now,
          now,
        ],
      })),
    );
  }

  await client.execute({
    sql: "INSERT OR REPLACE INTO site_settings (key, value, updated_at) VALUES ('content_initialized', '1', ?)",
    args: [now],
  });
  console.log("Seeded editable site content defaults.");
}

/**
 * Seeds all 3D Runway models and 40 Couture pieces into `runway_3d_assets` and `products` tables,
 * and uploads/syncs their PNGs to Cloudinary in the background so the database serves Cloudinary URLs.
 */
async function seedAndSyncRunway3DAssets(): Promise<void> {
  const now = Date.now();
  const assetRows: {
    key: string;
    type: string;
    lookNumber: number;
    pieceId: number | null;
    name: string;
    url: string;
  }[] = [
    {
      key: 'sprite_models',
      type: 'sprite',
      lookNumber: 0,
      pieceId: null,
      name: 'Higgs 3D Runway Models Sprite',
      url: HIGGS_MODELS_SPRITE,
    },
    {
      key: 'sprite_pieces',
      type: 'sprite',
      lookNumber: 0,
      pieceId: null,
      name: 'Higgs 3D Runway Pieces Sprite',
      url: HIGGS_PIECES_SPRITE,
    },
  ];

  for (const look of RUNWAY_LOOKS as any[]) {
    const srcUrl =
      look.sourceType === 'higgs_models' ? HIGGS_MODELS_SPRITE : String(look.soloImageUrl || '');
    assetRows.push({
      key: `look_${look.lookNumber}`,
      type: 'model',
      lookNumber: Number(look.lookNumber),
      pieceId: null,
      name: String(look.title || `Look ${look.lookNumber}`),
      url: srcUrl,
    });
  }

  for (const piece of RUNWAY_ALL_PIECES as any[]) {
    const srcUrl =
      piece.sourceType === 'higgs_pieces' ? HIGGS_PIECES_SPRITE : String(piece.soloImageUrl || '');
    assetRows.push({
      key: `piece_${piece.id}`,
      type: 'piece',
      lookNumber: Number(piece.lookNumber),
      pieceId: Number(piece.id),
      name: String(piece.name),
      url: srcUrl,
    });
  }

  await client.batch(
    assetRows.map((a) => ({
      sql: `INSERT OR IGNORE INTO runway_3d_assets
        (asset_key, asset_type, look_number, piece_id, name, original_url, cloudinary_url, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        a.key,
        a.type,
        a.lookNumber,
        a.pieceId,
        a.name,
        a.url,
        canonicalCatalogImage(a.url),
        now,
      ],
    }))
  );

  // Also ensure all 40 3D Runway pieces exist in `products` table for Cart / Orders / Reviews
  await client.batch(
    (RUNWAY_ALL_PIECES as any[]).map((piece) => {
      const prodId = `runway-3d-piece-${piece.id}`;
      const rawUrl =
        piece.sourceType === 'higgs_pieces' ? HIGGS_PIECES_SPRITE : String(piece.soloImageUrl || '');
      const cloudUrl = canonicalCatalogImage(rawUrl);
      const discount =
        piece.mrpNumeric > piece.priceNumeric
          ? Math.round(((piece.mrpNumeric - piece.priceNumeric) / piece.mrpNumeric) * 100)
          : 40;
      return {
        sql: `INSERT OR IGNORE INTO products (
          id, name, hindi_name, price, stock, image_url, category, subcategory, brand, description,
          original_price, rating, reviews_count, is_best_seller, is_trending, is_flash_deal,
          discount_percent, unit, sizes_json, colors_json, images_json, highlights_json,
          specifications_json, is_plus_free_delivery, delivery_days, deal_ends_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          prodId,
          String(piece.name),
          `${piece.category} • Look ${String(piece.lookNumber).padStart(2, '0')}`,
          Number(piece.priceNumeric),
          20,
          cloudUrl,
          'fashion',
          String(piece.category || 'Luxury Couture'),
          'Apna Bazar 3D Couture',
          String(piece.description || piece.subtitle || ''),
          Number(piece.mrpNumeric || piece.priceNumeric),
          Number(piece.rating || 4.8),
          Number(piece.reviewsCount || 160),
          1,
          1,
          0,
          discount,
          'piece',
          JSON.stringify(piece.sizes || ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
          JSON.stringify(piece.colors || []),
          JSON.stringify([cloudUrl]),
          JSON.stringify([
            `Fabric: ${piece.fabric}`,
            `Fit: ${piece.fit}`,
            `Occasion: ${piece.occasion}`,
            `Care: ${piece.care}`,
          ]),
          JSON.stringify([
            { label: 'Fabric', value: String(piece.fabric || 'Pure Silk') },
            { label: 'Fit', value: String(piece.fit || 'Tailored') },
            { label: 'Occasion', value: String(piece.occasion || 'Festive & Wedding') },
          ]),
          1,
          2,
          null,
          now,
        ],
      };
    })
  );

  // If Cloudinary Upload API credentials are set, upload each unique PNG to Cloudinary in the background
  // and update `runway_3d_assets.cloudinary_url` & `products.image_url` in the database.
  if (CLOUDINARY_UPLOAD_READY || CLOUDINARY_MEDIA_READY) {
    void (async () => {
      try {
        const existing = await client.execute(
          `SELECT asset_key, original_url, cloudinary_url FROM runway_3d_assets;`
        );
        const uniqueUrls = new Map<string, string>();
        for (const row of existing.rows) {
          const orig = String(row.original_url || '');
          const curr = String(row.cloudinary_url || '');
          if (orig && !curr.includes('/image/upload/')) {
            uniqueUrls.set(orig, String(row.asset_key));
          }
        }

        for (const [origUrl, sampleKey] of uniqueUrls.entries()) {
          const uploadedUrl = await uploadRemoteImageToCloudinary(
            origUrl,
            `runway_${sampleKey}`,
            'apnabazar_runway_3d'
          );
          if (uploadedUrl && uploadedUrl !== origUrl) {
            await client.execute({
              sql: `UPDATE runway_3d_assets SET cloudinary_url = ?, updated_at = ? WHERE original_url = ?;`,
              args: [uploadedUrl, Date.now(), origUrl],
            });
            await client.execute({
              sql: `UPDATE products SET image_url = ?, images_json = ? WHERE image_url = ? AND id LIKE 'runway-3d-piece-%';`,
              args: [uploadedUrl, JSON.stringify([uploadedUrl]), origUrl],
            });
          }
        }
      } catch (err) {
        console.warn('[db] Runway 3D Cloudinary background sync skipped:', err);
      }
    })();
  }
}

function parseJsonArray<T>(raw: unknown): T[] {
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Stores the Cloudinary delivery URL in the database so every product row is
 * backed by Cloudinary rather than a third-party origin. Runs only when a cloud
 * name is configured and only rewrites rows that are not already using it.
 */
async function persistCloudinaryMediaUrls(): Promise<void> {
  if (!CLOUDINARY_MEDIA_READY) return;

  const result = await client.execute(
    `SELECT id, image_url, images_json, colors_json FROM products;`,
  );
  if (result.rows.length === 0) return;

  const updates: { sql: string; args: (string | number | null)[] }[] = [];
  for (const row of result.rows) {
    const id = String(row.id);
    const image = canonicalCatalogImage(String(row.image_url || ''));
    const rawImages = parseJsonArray<string>(row.images_json).filter((item) => typeof item === 'string');
    const images = (rawImages.length > 0 ? rawImages : image ? [image] : []).map((item) =>
      canonicalCatalogImage(item),
    );
    const colors = parseJsonArray<Record<string, unknown>>(row.colors_json).map((color) => ({
      ...color,
      imageUrl:
        typeof color.imageUrl === 'string' ? canonicalCatalogImage(color.imageUrl) : color.imageUrl,
    }));

    const nextImages = JSON.stringify(images);
    const nextColors = JSON.stringify(colors);
    if (
      image === (row.image_url || '') &&
      nextImages === (row.images_json || '[]') &&
      nextColors === (row.colors_json || '[]')
    ) {
      continue;
    }

    updates.push({
      sql: `UPDATE products SET image_url = ?, images_json = ?, colors_json = ? WHERE id = ?;`,
      args: [image, nextImages, nextColors, id],
    });
  }

  if (updates.length === 0) return;
  for (let i = 0; i < updates.length; i += 50) {
    await client.batch(updates.slice(i, i + 50));
  }
  console.log(`Stored Cloudinary media URLs for ${updates.length} products.`);
}
