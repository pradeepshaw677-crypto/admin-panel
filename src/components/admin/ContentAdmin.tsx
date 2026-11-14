import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, RotateCcw } from 'lucide-react';
import { adminApi, type ContentItem, type ContentKind } from './adminApi';
import {
  Btn,
  ConfirmDialog,
  EmptyState,
  Field,
  ImageUploader,
  Modal,
  StatusPill,
  Toggle,
  inputClass,
  useLiveRefresh,
  useToast,
  ToastView,
} from './AdminUI';

type FieldType = 'text' | 'number' | 'textarea' | 'image' | 'color' | 'select' | 'list';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  hint?: string;
  options?: string[];
  half?: boolean;
}

interface KindSchema {
  label: string;
  addLabel: string;
  titleKey: string;
  imageKey?: string;
  fields: FieldDef[];
}

const GRADIENTS = [
  'from-[#e11d48] via-[#ea580c] to-[#f59e0b]',
  'from-[#090d16] via-[#1a2233] to-[#2d3748]',
  'from-[#064e3b] via-[#047857] to-[#10b981]',
  'from-[#831843] via-[#9d174d] to-[#be185d]',
  'from-[#1e1b4b] via-[#312e81] to-[#4338ca]',
  'from-[#172554] via-[#1e3a8a] to-[#2563eb]',
  'from-[#7c2d12] via-[#9a3412] to-[#c2410c]',
  'from-[#0f172a] via-[#1e293b] to-[#334155]',
];

const SCHEMAS: Record<ContentKind, KindSchema> = {
  banners: {
    label: 'Hero banners & carousel',
    addLabel: 'Add banner',
    titleKey: 'title',
    imageKey: 'image',
    fields: [
      { key: 'id', label: 'Slide ID', type: 'text', hint: 'Letters, numbers, - and _ only' },
      { key: 'brand', label: 'Brand line', type: 'text' },
      { key: 'title', label: 'Headline', type: 'text' },
      { key: 'offerTag', label: 'Offer tag', type: 'text' },
      { key: 'subtitle', label: 'Subtitle', type: 'text' },
      { key: 'bankOffer', label: 'Bank offer line', type: 'text' },
      { key: 'bgGradient', label: 'Background gradient (Tailwind)', type: 'select', options: GRADIENTS },
      { key: 'accentColor', label: 'Accent colour', type: 'color' },
      { key: 'image', label: 'Banner image', type: 'image' },
      { key: 'localAsset', label: 'Local asset path (optional)', type: 'text' },
      { key: 'targetProductId', label: 'Target product ID', type: 'text' },
      { key: 'categoryId', label: 'Category ID', type: 'text' },
    ],
  },
  deals: {
    label: 'Festive deals',
    addLabel: 'Add deal',
    titleKey: 'name',
    imageKey: 'image',
    fields: [
      { key: 'id', label: 'Deal ID', type: 'text' },
      { key: 'name', label: 'Deal name', type: 'text' },
      { key: 'categoryTag', label: 'Category tag', type: 'text' },
      { key: 'categoryIcon', label: 'Category icon', type: 'text' },
      { key: 'originalPrice', label: 'Original price (₹)', type: 'number' },
      { key: 'dealPrice', label: 'Deal price (₹)', type: 'number' },
      { key: 'image', label: 'Deal image', type: 'image' },
      { key: 'silkGradient', label: 'Gradient', type: 'select', options: GRADIENTS },
      { key: 'targetProductId', label: 'Target product ID', type: 'text' },
      { key: 'categoryId', label: 'Category ID', type: 'text' },
    ],
  },
  coupons: {
    label: 'Offers & coupons',
    addLabel: 'Add offer',
    titleKey: 'code',
    imageKey: 'image',
    fields: [
      { key: 'code', label: 'Coupon code', type: 'text' },
      { key: 'title', label: 'Offer name', type: 'text', hint: 'Shown on the floating offer card' },
      { key: 'discountType', label: 'Discount type', type: 'select', options: ['percentage', 'fixed'] },
      { key: 'discountValue', label: 'Discount value', type: 'number' },
      { key: 'minOrderValue', label: 'Minimum order (₹)', type: 'number' },
      { key: 'description', label: 'Offer text', type: 'text' },
      { key: 'image', label: 'Offer image', type: 'image' },
      { key: 'expiryText', label: 'Expiry text', type: 'text' },
    ],
  },
  brands: {
    label: 'Brands',
    addLabel: 'Add brand',
    titleKey: 'name',
    imageKey: 'logoUrl',
    fields: [
      { key: 'id', label: 'Brand ID', type: 'text' },
      { key: 'name', label: 'Brand name', type: 'text' },
      { key: 'category', label: 'Offer text', type: 'text' },
      { key: 'logoUrl', label: 'Brand logo', type: 'image' },
    ],
  },
  categories: {
    label: 'Categories',
    addLabel: 'Add category',
    titleKey: 'name',
    imageKey: 'image',
    fields: [
      { key: 'id', label: 'Category ID', type: 'text' },
      { key: 'name', label: 'Category name', type: 'text' },
      { key: 'hindiName', label: 'Hindi name', type: 'text' },
      { key: 'icon', label: 'Icon name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Category image', type: 'image' },
    ],
  },
  fabrics: {
    label: 'Fabrics & materials',
    addLabel: 'Add fabric',
    titleKey: 'name',
    imageKey: 'image',
    fields: [
      { key: 'id', label: 'Fabric ID', type: 'text' },
      { key: 'name', label: 'Fabric name', type: 'text' },
      { key: 'hindi', label: 'Hindi name', type: 'text' },
      { key: 'icon', label: 'Icon emoji', type: 'text' },
      { key: 'image', label: 'Fabric swatch image', type: 'image' },
      { key: 'keywords', label: 'Match keywords (comma separated)', type: 'list' },
    ],
  },
  looks: {
    label: 'Store looks',
    addLabel: 'Add look',
    titleKey: 'name',
    imageKey: 'image',
    fields: [
      { key: 'id', label: 'Look ID', type: 'text', hint: 'Letters, numbers, - and _ only' },
      { key: 'name', label: 'Look name', type: 'text', hint: 'e.g. BLUE, PINK, FESTIVE' },
      { key: 'subtitle', label: 'Look caption', type: 'text' },
      { key: 'image', label: 'Look image (PNG/JPG)', type: 'image' },
      { key: 'targetProductId', label: 'Open product ID (optional)', type: 'text' },
      { key: 'categoryId', label: 'Fallback category ID', type: 'text' },
    ],
  },
};

const FOLDER_BY_KIND: Record<ContentKind, string> = {
  banners: 'banners',
  deals: 'deals',
  coupons: 'settings',
  brands: 'brands',
  categories: 'categories',
  fabrics: 'fabrics',
  looks: 'looks',
};

const emptyDraft = (kind: ContentKind): Record<string, unknown> => {
  if (kind === 'coupons') {
    return {
      code: '',
      title: '',
      discountType: 'percentage',
      discountValue: 10,
      minOrderValue: 499,
      description: '',
      image: '',
      expiryText: '',
    };
  }
  if (kind === 'looks') {
    return {
      id: '',
      name: '',
      subtitle: '',
      image: '',
      targetProductId: '',
      categoryId: '',
    };
  }
  if (kind === 'banners') {
    return {
      id: '',
      brand: '',
      title: '',
      offerTag: '',
      subtitle: '',
      bankOffer: '',
      bgGradient: GRADIENTS[0],
      accentColor: '#fbbf24',
      image: '',
      targetProductId: '',
      categoryId: '',
    };
  }
  if (kind === 'deals') {
    return {
      id: '',
      name: '',
      categoryTag: '',
      categoryIcon: '👑',
      originalPrice: 499,
      dealPrice: 299,
      image: '',
      silkGradient: GRADIENTS[0],
      targetProductId: '',
      categoryId: '',
    };
  }
  return { id: '', name: '', image: '' };
};

const titleOf = (kind: ContentKind, item: ContentItem): string => {
  const schema = SCHEMAS[kind];
  if (kind === 'coupons' && item.title) return `${item.title} · ${item.code}`;
  const value = item[schema.titleKey];
  const fallback = kind === 'banners' ? item.brand : item.id;
  return String(value || fallback || item.id || 'Untitled');
};

export const ContentAdmin: React.FC = () => {
  const { toast, notify } = useToast();
  const [activeKind, setActiveKind] = useState<ContentKind>('banners');
  const [items, setItems] = useState<Record<ContentKind, ContentItem[]>>({
    banners: [],
    deals: [],
    coupons: [],
    brands: [],
    categories: [],
    fabrics: [],
    looks: [],
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState('');
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [draftActive, setDraftActive] = useState(true);
  const [draftOrder, setDraftOrder] = useState('0');
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const schema = SCHEMAS[activeKind];

  const load = async (kind: ContentKind = activeKind, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.content();
      setItems({
        banners: data.content.banners || [],
        deals: data.content.deals || [],
        coupons: data.content.coupons || [],
        brands: data.content.brands || [],
        categories: data.content.categories || [],
        fabrics: data.content.fabrics || [],
        looks: data.content.looks || [],
      });
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes('401')) {
        notify(error instanceof Error ? error.message : 'Could not load content.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => load(activeKind, true));

  const currentItems = useMemo(() => items[activeKind] || [], [items, activeKind]);

  const openCreate = () => {
    setEditingId(null);
    setOriginalImage('');
    setDraft(emptyDraft(activeKind));
    setDraftActive(true);
    setDraftOrder(String(currentItems.length));
    setEditorOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setOriginalImage(String(item.image || ''));
    setDraft({ ...item });
    setDraftActive(item.isActive !== false);
    setDraftOrder(String(item.sortOrder || 0));
    setEditorOpen(true);
  };

  const saveItem = async () => {
    if (activeKind === 'coupons' && !String(draft.code || '').trim()) {
      return notify('Coupon code is required.', 'error');
    }
    if (activeKind !== 'coupons' && !String(draft[schema.titleKey] || draft.id || '').trim()) {
      return notify(`${schema.label} needs a title.`, 'error');
    }
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { ...draft };
      if (activeKind === 'coupons') {
        const code = String(draft.code || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
        if (!code) throw new Error('Offer code may only contain letters, numbers, - and _.');
        payload.code = code;
        if (!editingId) payload.id = code;
      }
      if (activeKind === 'banners' && String(payload.image || '') !== originalImage) {
        payload.localAsset = '';
      }
      if (Array.isArray(payload.keywords)) {
        payload.keywords = (payload.keywords as unknown[])
          .map((entry) => String(entry).trim())
          .filter(Boolean);
      }
      const body = { data: payload, isActive: draftActive, sortOrder: Number(draftOrder) || 0 };
      if (editingId) {
        await adminApi.updateContent(activeKind, editingId, body);
        notify('Content updated.');
      } else {
        await adminApi.createContent(activeKind, body);
        notify('Content added.');
      }
      setEditorOpen(false);
      await load(activeKind);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save content.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeItem = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await adminApi.deleteContent(activeKind, deleteTarget.id);
      setItems((prev) => ({
        ...prev,
        [activeKind]: prev[activeKind].filter((item) => item.id !== deleteTarget.id),
      }));
      notify('Deleted.');
      setDeleteTarget(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    setBusy(true);
    try {
      const data = await adminApi.deleteAllContent(activeKind);
      setItems((prev) => ({ ...prev, [activeKind]: [] }));
      notify(`${data.deleted} items deleted.`);
      setConfirmDeleteAll(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not delete.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const restoreDefaults = async () => {
    setBusy(true);
    try {
      const data = await adminApi.restoreContent(activeKind);
      setItems((prev) => ({ ...prev, [activeKind]: data.items || [] }));
      notify('Defaults restored.');
      setConfirmRestore(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not restore.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const setField = (key: string, value: unknown) => setDraft((prev) => ({ ...prev, [key]: value }));

  const renderField = (field: FieldDef) => {
    const value = draft[field.key];
    if (field.type === 'image') {
      return (
        <div className={field.half ? '' : 'sm:col-span-2'} key={field.key}>
          <ImageUploader
            value={String(value || '')}
            onChange={(url) => setField(field.key, url)}
            folder={FOLDER_BY_KIND[activeKind]}
            label={field.label}
          />
        </div>
      );
    }
    return (
      <Field key={field.key} label={field.label} hint={field.hint} className={field.half ? '' : 'sm:col-span-2'}>
        {field.key === 'code' && editingId ? (
          <input value={String(value ?? '')} className={inputClass} disabled />
        ) : field.type === 'select' ? (
          <select value={String(value || '')} onChange={(e) => setField(field.key, e.target.value)} className={inputClass}>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <textarea rows={3} value={String(value || '')} onChange={(e) => setField(field.key, e.target.value)} className={inputClass} />
        ) : field.type === 'color' ? (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={String(value || '#fbbf24')}
              onChange={(e) => setField(field.key, e.target.value)}
              className="h-9 w-14 rounded-lg border border-slate-300"
            />
            <input value={String(value || '')} onChange={(e) => setField(field.key, e.target.value)} className={inputClass} />
          </div>
        ) : field.type === 'list' ? (
          <input
            value={Array.isArray(value) ? (value as string[]).join(', ') : String(value || '')}
            onChange={(e) => setField(field.key, e.target.value.split(',').map((part) => part.trim()).filter(Boolean))}
            className={inputClass}
          />
        ) : field.type === 'number' ? (
          <input
            type="number"
            value={String(value ?? '')}
            onChange={(e) => setField(field.key, Number(e.target.value))}
            className={inputClass}
          />
        ) : (
          <input value={String(value ?? '')} onChange={(e) => setField(field.key, e.target.value)} className={inputClass} />
        )}
      </Field>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(SCHEMAS) as ContentKind[]).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => {
              setActiveKind(kind);
              load(kind, true);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-black transition cursor-pointer ${
              activeKind === kind
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {SCHEMAS[kind].label}
            <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px]">
              {items[kind]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Btn size="sm" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5" /> {schema.addLabel}
        </Btn>
        <Btn variant="outline" size="sm" onClick={() => load(activeKind)} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
        <Btn variant="outline" size="sm" onClick={() => setConfirmRestore(true)}>
          <RotateCcw className="w-3.5 h-3.5" /> Restore defaults
        </Btn>
        <Btn variant="danger" size="sm" onClick={() => setConfirmDeleteAll(true)}>
          <Trash2 className="w-3.5 h-3.5" /> Delete all {activeKind}
        </Btn>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading content…</div>
      ) : currentItems.length === 0 ? (
        <EmptyState
          title={`No ${schema.label.toLowerCase()} yet`}
          hint="Add your first item or restore the defaults."
          action={<Btn size="sm" onClick={openCreate}><Plus className="w-3.5 h-3.5" /> {schema.addLabel}</Btn>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currentItems.map((item) => {
            const imageKey = schema.imageKey;
            const image = imageKey ? String(item[imageKey] || item.image || '') : '';
            return (
              <div
                key={item.id}
                className={`flex flex-col gap-2 rounded-2xl border bg-white p-3 ${
                  item.isActive === false ? 'border-slate-200 opacity-60' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {image ? (
                    <img src={image} alt={titleOf(activeKind, item)} className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-bold text-slate-400">
                      No image
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-900">{titleOf(activeKind, item)}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {activeKind === 'coupons'
                        ? `${item.discountType === 'fixed' ? '₹' : ''}${item.discountValue}${item.discountType === 'fixed' ? '' : '%'} off · min ₹${item.minOrderValue}`
                        : item.id}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <StatusPill label={item.isActive === false ? 'Hidden' : 'Live'} tone={item.isActive === false ? 'slate' : 'green'} />
                      <span className="text-[10px] font-bold text-slate-400">#{item.sortOrder ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-1">
                  <Btn variant="outline" size="sm" onClick={() => openEdit(item)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Btn>
                  <Btn variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={editorOpen}
        wide
        title={editingId ? `Edit ${schema.label.toLowerCase()}` : schema.addLabel}
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setEditorOpen(false)} disabled={busy}>Cancel</Btn>
            <Btn onClick={saveItem} loading={busy}>{editingId ? 'Save changes' : 'Add'}</Btn>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {schema.fields.map(renderField)}
          <div className="flex items-center gap-4 sm:col-span-2 rounded-xl bg-slate-50 px-3 py-2">
            <Toggle checked={draftActive} onChange={setDraftActive} label="Visible on storefront" />
            <Field label="Sort order">
              <input
                type="number"
                value={draftOrder}
                onChange={(e) => setDraftOrder(e.target.value)}
                className={`${inputClass} w-24`}
              />
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this item?"
        message={`"${deleteTarget ? titleOf(activeKind, deleteTarget) : ''}" will be removed from the storefront immediately.`}
        busy={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={removeItem}
      />

      <ConfirmDialog
        open={confirmDeleteAll}
        title={`Delete all ${activeKind}?`}
        message={`Every ${schema.label.toLowerCase()} item will be permanently removed. Type DELETE ALL to confirm.`}
        confirmText="Delete everything"
        confirmWord="DELETE ALL"
        busy={busy}
        onCancel={() => setConfirmDeleteAll(false)}
        onConfirm={deleteAll}
      />

      <ConfirmDialog
        open={confirmRestore}
        title="Restore default content?"
        message="Current items of this type will be replaced with the built-in defaults. Type RESTORE to confirm."
        confirmText="Restore defaults"
        confirmWord="RESTORE"
        danger={false}
        busy={busy}
        onCancel={() => setConfirmRestore(false)}
        onConfirm={restoreDefaults}
      />
      <ToastView toast={toast} />
    </div>
  );
};
