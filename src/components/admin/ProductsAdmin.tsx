import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  TrendingUp,
  Percent,
  PackageSearch,
  Sparkles,
  Loader2,
  Upload,
} from 'lucide-react';
import type { Product } from '../../types';
import { adminApi, type AiProductCopy, type AiStatus } from './adminApi';
import { getSizePriceDelta, formatINR } from '../../utils/pricing';
import { uploadToCloudinary } from '../../utils/cloudinary';
import {
  Btn,
  ConfirmDialog,
  EmptyState,
  Field,
  ImageUploader,
  Modal,
  MultiImageUploader,
  StatusPill,
  Toggle,
  inputClass,
  useLiveRefresh,
  useToast,
  ToastView,
} from './AdminUI';

const CATEGORY_OPTIONS = ['fashion', 'footwear', 'toys', 'accessories', 'sarees', 'general'];

interface ProductDraft {
  id: string;
  name: string;
  hindiName: string;
  brand: string;
  category: string;
  subcategory: string;
  price: string;
  originalPrice: string;
  discountPercent: string;
  stock: string;
  unit: string;
  image: string;
  images: string[];
  sizes: string;
  colors: Array<{ name: string; hex: string; imageUrl: string }>;
  description: string;
  highlights: string;
  specifications: Array<{ label: string; value: string }>;
  isBestSeller: boolean;
  isTrending: boolean;
  isFlashDeal: boolean;
  isPlusFreeDelivery: boolean;
  rating: string;
  reviewsCount: string;
  deliveryDays: string;
  dealEndsAt: string;
}

const emptyDraft = (): ProductDraft => ({
  id: '',
  name: '',
  hindiName: '',
  brand: '',
  category: 'fashion',
  subcategory: '',
  price: '',
  originalPrice: '',
  discountPercent: '0',
  stock: '25',
  unit: 'piece',
  image: '',
  images: [],
  sizes: '',
  colors: [],
  description: '',
  highlights: '',
  specifications: [],
  isBestSeller: false,
  isTrending: false,
  isFlashDeal: false,
  isPlusFreeDelivery: false,
  rating: '4.5',
  reviewsCount: '0',
  deliveryDays: '3',
  dealEndsAt: '',
});

function toDraft(product: Product): ProductDraft {
  return {
    id: product.id,
    name: product.name,
    hindiName: product.hindiName || '',
    brand: product.brand || '',
    category: String(product.category || 'fashion'),
    subcategory: product.subcategory || '',
    price: String(product.price),
    originalPrice: String(product.originalPrice || product.price),
    discountPercent: String(product.discountPercent || 0),
    stock: String(product.stockCount ?? 0),
    unit: product.unit || 'piece',
    image: product.image,
    images: product.images || [],
    sizes: (product.sizes || []).join(', '),
    colors: (product.colors || []).map((color) => ({
      name: color.name,
      hex: color.hex,
      imageUrl: color.imageUrl || '',
    })),
    description: product.description || '',
    highlights: (product.highlights || []).join('\n'),
    specifications: (product.specifications || []).map((spec) => ({ label: spec.label, value: spec.value })),
    isBestSeller: Boolean(product.isBestSeller),
    isTrending: Boolean(product.isTrending),
    isFlashDeal: Boolean(product.isFlashDeal),
    isPlusFreeDelivery: Boolean(product.isPlusFreeDelivery),
    rating: String(product.rating || 4.5),
    reviewsCount: String(product.reviewsCount || 0),
    deliveryDays: String(product.deliveryDays ?? 3),
    dealEndsAt: product.dealEndsAt ? new Date(product.dealEndsAt).toISOString().slice(0, 16) : '',
  };
}

function fromDraft(draft: ProductDraft): Record<string, unknown> {
  return {
    id: draft.id.trim() || undefined,
    name: draft.name.trim(),
    hindiName: draft.hindiName.trim(),
    brand: draft.brand.trim(),
    category: draft.category,
    subcategory: draft.subcategory.trim(),
    price: Number(draft.price),
    originalPrice: Number(draft.originalPrice) || Number(draft.price),
    discountPercent: Number(draft.discountPercent) || 0,
    stock: Number(draft.stock) || 0,
    unit: draft.unit.trim(),
    image: draft.image.trim(),
    images: draft.images.filter(Boolean),
    sizes: draft.sizes.split(',').map((size) => size.trim()).filter(Boolean),
    colors: draft.colors.filter((color) => color.name.trim()),
    description: draft.description.trim(),
    highlights: draft.highlights.split('\n').map((line) => line.trim()).filter(Boolean),
    specifications: draft.specifications.filter((spec) => spec.label.trim() && spec.value.trim()),
    isBestSeller: draft.isBestSeller,
    isTrending: draft.isTrending,
    isFlashDeal: draft.isFlashDeal,
    isPlusFreeDelivery: draft.isPlusFreeDelivery,
    rating: Number(draft.rating) || 4.5,
    reviewsCount: Number(draft.reviewsCount) || 0,
    deliveryDays: Number(draft.deliveryDays) || 3,
    dealEndsAt: draft.dealEndsAt ? new Date(draft.dealEndsAt).getTime() : 0,
  };
}

export const ProductsAdmin: React.FC = () => {
  const { toast, notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [busy, setBusy] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft());

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [stockBusyId, setStockBusyId] = useState<string | null>(null);

  const [bulkOpen, setBulkOpen] = useState<'price' | 'offer' | null>(null);
  const [bulkMode, setBulkMode] = useState('percent');
  const [bulkValue, setBulkValue] = useState('10');
  const [bulkDirection, setBulkDirection] = useState<'1' | '-1'>('1');
  const [bulkCategory, setBulkCategory] = useState('');
  const [bulkBrand, setBulkBrand] = useState('');

  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiResult, setAiResult] = useState<AiProductCopy | null>(null);
  const [colorBusy, setColorBusy] = useState<number | null>(null);

  const load = async (options: { search?: string; lowStock?: boolean; silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await adminApi.products({
        search: options.search ?? search,
        lowStock: options.lowStock ?? lowStockOnly,
      });
      setProducts(data.products || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load products.', 'error');
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    adminApi
      .aiStatus()
      .then(setAiStatus)
      .catch(() => setAiStatus({ configured: false, provider: null, model: null }));
  }, []);

  useLiveRefresh(() => load({ silent: true }));

  const adjustStock = async (product: Product, delta: number) => {
    const nextStock = Math.max(0, (product.stockCount ?? 0) + delta);
    setStockBusyId(product.id);
    try {
      await adminApi.updateProduct(product.id, { stock: nextStock });
      setProducts((prev) =>
        prev.map((entry) =>
          entry.id === product.id ? { ...entry, stockCount: nextStock, inStock: nextStock > 0 } : entry,
        ),
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update stock.', 'error');
    } finally {
      setStockBusyId(null);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
    setAiResult(null);
    setEditorOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setDraft(toDraft(product));
    setAiResult(null);
    setEditorOpen(true);
  };

  const runAiCopy = async () => {
    if (!draft.name.trim()) {
      notify('Pehle product name likho, phir AI chalega.', 'error');
      return;
    }
    setAiBusy(true);
    try {
      const data = await adminApi.generateProductCopy({
        name: draft.name.trim(),
        category: draft.category,
        brand: draft.brand.trim(),
        price: Number(draft.price) || 0,
        sizes: draft.sizes.split(',').map((size) => size.trim()).filter(Boolean),
        colors: draft.colors.filter((color) => color.name.trim()).map((color) => ({ name: color.name.trim() })),
        notes: draft.description.trim().slice(0, 300),
      });
      setAiResult(data.copy);
      setDraft((current) => ({
        ...current,
        hindiName: current.hindiName.trim() ? current.hindiName : data.copy.hindiName,
        description: data.copy.description || current.description,
        highlights: data.copy.highlights.length ? data.copy.highlights.join('\n') : current.highlights,
        discountPercent:
          Number(current.discountPercent) > 0
            ? current.discountPercent
            : String(data.copy.suggestedDiscountPercent || 0),
      }));
      notify('AI ne draft bhar diya. Check karke Save dabao.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'AI request failed.', 'error');
    } finally {
      setAiBusy(false);
    }
  };

  const saveProduct = async () => {
    if (!draft.name.trim()) return notify('Product name is required.', 'error');
    if (!draft.price || Number(draft.price) <= 0) return notify('Enter a valid selling price.', 'error');
    if (!draft.image.trim()) return notify('Add a product image.', 'error');
    setBusy(true);
    try {
      const payload = fromDraft(draft);
      if (editingId) {
        await adminApi.updateProduct(editingId, payload);
        notify('Product updated.');
      } else {
        await adminApi.createProduct(payload);
        notify('Product added.');
      }
      setEditorOpen(false);
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save product.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.deleteProduct(deleteTarget.id);
      setProducts((prev) => prev.filter((product) => product.id !== deleteTarget.id));
      notify('Product deleted.');
      setDeleteTarget(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete product.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    setBusy(true);
    try {
      const data = await adminApi.deleteAllProducts();
      setProducts([]);
      notify(`${data.deleted} products deleted.`);
      setConfirmDeleteAll(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete products.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const restoreCatalog = async () => {
    setBusy(true);
    try {
      const data = await adminApi.restoreProducts();
      notify(`${data.restored} default products restored.`);
      setConfirmRestore(false);
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not restore catalog.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async () => {
    if (!bulkOpen) return;
    setBusy(true);
    try {
      const payload =
        bulkOpen === 'price'
          ? {
              mode: bulkMode,
              value: Number(bulkValue),
              direction: Number(bulkDirection),
              category: bulkCategory,
              brand: bulkBrand,
            }
          : { mode: bulkMode, value: Number(bulkValue), category: bulkCategory, brand: bulkBrand };
      const data = bulkOpen === 'price' ? await adminApi.bulkPrice(payload) : await adminApi.bulkOffer(payload);
      notify(`${data.updated} products updated.`);
      setBulkOpen(null);
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Bulk update failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(
    () => ({
      total: products.length,
      low: products.filter((product) => (product.stockCount ?? 0) > 0 && (product.stockCount ?? 0) <= 5).length,
      out: products.filter((product) => (product.stockCount ?? 0) === 0).length,
    }),
    [products],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && load()}
            placeholder="Search products, brand, category or ID"
            className={`${inputClass} pl-9`}
          />
        </div>
        <Btn variant="outline" size="sm" onClick={() => load()} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
        <Btn
          variant={lowStockOnly ? 'dark' : 'outline'}
          size="sm"
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            load({ lowStock: !lowStockOnly });
          }}
        >
          Low stock ({stats.low + stats.out})
        </Btn>
        <Btn size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> Add product
        </Btn>
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn variant="outline" size="sm" onClick={() => { setBulkOpen('price'); setBulkMode('percent'); setBulkValue('10'); }}>
          <TrendingUp className="w-3.5 h-3.5" /> Increase all prices
        </Btn>
        <Btn variant="outline" size="sm" onClick={() => { setBulkOpen('offer'); setBulkMode('discount-add'); setBulkValue('5'); }}>
          <Percent className="w-3.5 h-3.5" /> Increase all offers
        </Btn>
        <Btn variant="outline" size="sm" onClick={() => setConfirmRestore(true)}>
          <PackageSearch className="w-3.5 h-3.5" /> Restore demo catalog
        </Btn>
        <Btn variant="danger" size="sm" onClick={() => setConfirmDeleteAll(true)}>
          <Trash2 className="w-3.5 h-3.5" /> Delete all products
        </Btn>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading products…</div>
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          hint="Add a new product or restore the demo catalog."
          action={<Btn onClick={openCreate}><Plus className="w-3.5 h-3.5" /> Add product</Btn>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 md:grid">
            <span className="col-span-5">Product</span>
            <span className="col-span-2">Price</span>
            <span className="col-span-2">Stock</span>
            <span className="col-span-2">Flags</span>
            <span className="col-span-1 text-right">Actions</span>
          </div>
          {products.map((product) => (
            <div
              key={product.id}
              className="grid grid-cols-1 items-center gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 md:grid-cols-12 md:gap-3"
            >
              <div className="col-span-5 flex items-center gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-900">{product.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {product.id} · {product.brand} · {product.category}
                  </p>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-2 md:block">
                <span className="text-sm font-black text-slate-900">₹{product.price}</span>
                {product.originalPrice > product.price && (
                  <span className="ml-1 text-[11px] text-slate-400 line-through">₹{product.originalPrice}</span>
                )}
                <p className="text-[11px] font-bold text-emerald-600">{product.discountPercent}% OFF</p>
              </div>
              <div className="col-span-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustStock(product, -1)}
                    disabled={stockBusyId === product.id || (product.stockCount ?? 0) === 0}
                    className="h-6 w-6 rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    aria-label="Decrease stock"
                  >
                    −
                  </button>
                  <span
                    className={`min-w-[42px] text-center text-sm font-black ${
                      (product.stockCount ?? 0) === 0 ? 'text-rose-600' : (product.stockCount ?? 0) <= 5 ? 'text-amber-600' : 'text-slate-900'
                    }`}
                  >
                    {product.stockCount ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustStock(product, 1)}
                    disabled={stockBusyId === product.id}
                    className="h-6 w-6 rounded-full border border-slate-200 bg-white text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    aria-label="Increase stock"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="col-span-2 flex flex-wrap gap-1">
                {product.isBestSeller && <StatusPill label="Bestseller" tone="amber" />}
                {product.isFlashDeal && <StatusPill label="Hot" tone="rose" />}
                {product.isTrending && <StatusPill label="Trending" tone="blue" />}
                {product.isPlusFreeDelivery && <StatusPill label="Free" tone="green" />}
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Btn variant="outline" size="sm" onClick={() => openEdit(product)} aria-label="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </Btn>
                <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(product)} aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={editorOpen}
        wide
        title={editingId ? 'Edit product' : 'Add new product'}
        subtitle="Preview every field before saving. Changes go live instantly."
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditorOpen(false)} disabled={busy}>
              Cancel
            </Btn>
            <Btn onClick={saveProduct} loading={busy}>
              {editingId ? 'Save changes' : 'Add product'}
            </Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product name" className="sm:col-span-2">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Hindi name">
            <input value={draft.hindiName} onChange={(e) => setDraft({ ...draft, hindiName: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Brand">
            <input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Category">
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className={inputClass}>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory">
            <input value={draft.subcategory} onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Selling price (₹)">
            <input type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Original price (₹)">
            <input type="number" value={draft.originalPrice} onChange={(e) => setDraft({ ...draft, originalPrice: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Discount %">
            <input type="number" value={draft.discountPercent} onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Stock quantity">
            <input type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Unit">
            <input value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Delivery days">
            <input type="number" value={draft.deliveryDays} onChange={(e) => setDraft({ ...draft, deliveryDays: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Rating (0-5)">
            <input type="number" step="0.1" value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Review count">
            <input type="number" value={draft.reviewsCount} onChange={(e) => setDraft({ ...draft, reviewsCount: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Product ID (optional)" hint="Leave blank to auto-generate. Letters, numbers, - and _ only." className="sm:col-span-2">
            <input value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} className={inputClass} disabled={Boolean(editingId)} />
          </Field>

          <div className="sm:col-span-2">
            <Field
              label="Sizes"
              hint="Comma separated, e.g. S, M, L, XL. Bigger sizes add a charge on the storefront automatically."
            >
              <input value={draft.sizes} onChange={(e) => setDraft({ ...draft, sizes: e.target.value })} className={inputClass} />
            </Field>
            {draft.sizes.trim() && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.sizes
                  .split(',')
                  .map((size) => size.trim())
                  .filter(Boolean)
                  .map((size) => {
                    const delta = getSizePriceDelta(size);
                    const base = Number(draft.price) || 0;
                    return (
                      <span
                        key={size}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                      >
                        {size}: {delta > 0 ? `${formatINR(base)} + ${formatINR(delta)}` : formatINR(base)}
                      </span>
                    );
                  })}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                  <Sparkles className="h-3.5 w-3.5" /> AI product assistant
                </p>
                <p className="text-[11px] text-indigo-800/80">
                  {aiStatus?.provider || 'built-in'} · {aiStatus?.model || 'apna-bazar-copy-v1'} — description,
                  highlights, Hindi name aur SEO bhar dega. Koi key nahi chahiye.
                </p>
              </div>
              <Btn variant="dark" size="sm" onClick={runAiCopy} loading={aiBusy}>
                <Sparkles className="h-3.5 w-3.5" /> AI se likho
              </Btn>
            </div>
            {aiResult && (
              <div className="mt-3 space-y-2 rounded-xl bg-white/80 p-3 text-[11px] text-slate-600">
                {aiResult.seoTitle && (
                  <p>
                    <span className="font-black text-slate-800">SEO title:</span> {aiResult.seoTitle}
                  </p>
                )}
                {aiResult.metaDescription && (
                  <p>
                    <span className="font-black text-slate-800">Meta:</span> {aiResult.metaDescription}
                  </p>
                )}
                {aiResult.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiResult.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-indigo-100 px-2 py-0.5 font-bold text-indigo-800">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
            <ImageUploader value={draft.image} onChange={(url) => setDraft({ ...draft, image: url })} folder="products" label="Main image" />
            <div className="space-y-2">
              <Field label="Flash deal ends at">
                <input
                  type="datetime-local"
                  value={draft.dealEndsAt}
                  onChange={(e) => setDraft({ ...draft, dealEndsAt: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Toggle checked={draft.isBestSeller} onChange={(value) => setDraft({ ...draft, isBestSeller: value })} label="Bestseller" />
                <Toggle checked={draft.isFlashDeal} onChange={(value) => setDraft({ ...draft, isFlashDeal: value })} label="Flash deal" />
                <Toggle checked={draft.isTrending} onChange={(value) => setDraft({ ...draft, isTrending: value })} label="Trending" />
                <Toggle checked={draft.isPlusFreeDelivery} onChange={(value) => setDraft({ ...draft, isPlusFreeDelivery: value })} label="Free delivery" />
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <MultiImageUploader values={draft.images} onChange={(images) => setDraft({ ...draft, images })} folder="products" />
          </div>

          <Field label="Description" className="sm:col-span-2">
            <textarea
              rows={4}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              className={inputClass}
            />
          </Field>

          <Field label="Highlights (one per line)" className="sm:col-span-2">
            <textarea
              rows={3}
              value={draft.highlights}
              onChange={(e) => setDraft({ ...draft, highlights: e.target.value })}
              className={inputClass}
            />
          </Field>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Colours</span>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setDraft({ ...draft, colors: [...draft.colors, { name: '', hex: '#111827', imageUrl: '' }] })}
              >
                <Plus className="w-3 h-3" /> Add colour
              </Btn>
            </div>
            {draft.colors.map((color, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <input
                  value={color.name}
                  placeholder="Name"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      colors: draft.colors.map((item, position) =>
                        position === index ? { ...item, name: e.target.value } : item,
                      ),
                    })
                  }
                  className={`${inputClass} col-span-3`}
                />
                <input
                  type="color"
                  value={color.hex}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      colors: draft.colors.map((item, position) =>
                        position === index ? { ...item, hex: e.target.value } : item,
                      ),
                    })
                  }
                  className="col-span-2 h-9 w-full rounded-lg border border-slate-300"
                />
                <input
                  value={color.imageUrl}
                  placeholder="Colour image URL"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      colors: draft.colors.map((item, position) =>
                        position === index ? { ...item, imageUrl: e.target.value } : item,
                      ),
                    })
                  }
                  className={`${inputClass} col-span-4`}
                />
                <label
                  className="col-span-2 flex h-9 cursor-pointer items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                  title="Upload this colour's photo"
                >
                  {colorBusy === index ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (!file) return;
                      setColorBusy(index);
                      try {
                        const result = await uploadToCloudinary(file, 'products');
                        setDraft((current) => ({
                          ...current,
                          colors: current.colors.map((item, position) =>
                            position === index ? { ...item, imageUrl: result.url } : item,
                          ),
                        }));
                        notify(`Colour photo uploaded (${color.name || 'colour'}).`);
                      } catch (error) {
                        notify(error instanceof Error ? error.message : 'Upload failed.', 'error');
                      } finally {
                        setColorBusy(null);
                      }
                    }}
                  />
                </label>
                <Btn
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() => setDraft({ ...draft, colors: draft.colors.filter((_, position) => position !== index) })}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </Btn>
              </div>
            ))}
          </div>

          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Specifications</span>
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setDraft({ ...draft, specifications: [...draft.specifications, { label: '', value: '' }] })}
              >
                <Plus className="w-3 h-3" /> Add spec
              </Btn>
            </div>
            {draft.specifications.map((spec, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2">
                <input
                  value={spec.label}
                  placeholder="Label"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      specifications: draft.specifications.map((item, position) =>
                        position === index ? { ...item, label: e.target.value } : item,
                      ),
                    })
                  }
                  className={`${inputClass} col-span-5`}
                />
                <input
                  value={spec.value}
                  placeholder="Value"
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      specifications: draft.specifications.map((item, position) =>
                        position === index ? { ...item, value: e.target.value } : item,
                      ),
                    })
                  }
                  className={`${inputClass} col-span-6`}
                />
                <Btn
                  variant="ghost"
                  size="sm"
                  className="col-span-1"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      specifications: draft.specifications.filter((_, position) => position !== index),
                    })
                  }
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={bulkOpen !== null}
        title={bulkOpen === 'price' ? 'Bulk update prices' : 'Bulk update offers'}
        subtitle="Applies to matching products instantly. Leave category and brand blank for all products."
        onClose={() => setBulkOpen(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setBulkOpen(null)} disabled={busy}>Cancel</Btn>
            <Btn onClick={runBulk} loading={busy}>Apply to all matching</Btn>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Action">
            <select value={bulkMode} onChange={(e) => setBulkMode(e.target.value)} className={inputClass}>
              {bulkOpen === 'price' ? (
                <>
                  <option value="percent">Change price by %</option>
                  <option value="amount">Change price by ₹</option>
                  <option value="set">Set exact price</option>
                </>
              ) : (
                <>
                  <option value="discount-add">Increase discount %</option>
                  <option value="discount-set">Set discount %</option>
                  <option value="original-add">Increase MRP by %</option>
                </>
              )}
            </select>
          </Field>
          <Field label="Value">
            <input type="number" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className={inputClass} />
          </Field>
          {bulkOpen === 'price' && bulkMode !== 'set' && (
            <Field label="Direction">
              <select value={bulkDirection} onChange={(e) => setBulkDirection(e.target.value as '1' | '-1')} className={inputClass}>
                <option value="1">Increase</option>
                <option value="-1">Decrease</option>
              </select>
            </Field>
          )}
          <Field label="Category filter">
            <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className={inputClass}>
              <option value="">All categories</option>
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </Field>
          <Field label="Brand filter">
            <input value={bulkBrand} onChange={(e) => setBulkBrand(e.target.value)} placeholder="All brands" className={inputClass} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this product?"
        message={`${deleteTarget?.name || 'This product'} will be removed from the catalogue. This cannot be undone.`}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeProduct}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        title="Delete ALL products?"
        message="Every product in the catalogue will be permanently deleted and the storefront will show an empty catalogue. Type DELETE ALL to confirm."
        confirmText="Delete everything"
        confirmWord="DELETE ALL"
        busy={busy}
        onCancel={() => setConfirmDeleteAll(false)}
        onConfirm={deleteAll}
      />

      <ConfirmDialog
        open={confirmRestore}
        title="Restore demo catalog?"
        message="Default products will be inserted again. Existing products with the same ID are kept."
        confirmText="Restore"
        danger={false}
        busy={busy}
        onCancel={() => setConfirmRestore(false)}
        onConfirm={restoreCatalog}
      />
      <ToastView toast={toast} />
    </div>
  );
};
