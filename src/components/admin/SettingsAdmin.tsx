import React, { useEffect, useState } from 'react';
import { Save, Store, ShieldAlert } from 'lucide-react';
import type { Product } from '../../types';
import { adminApi, type SiteSettings } from './adminApi';
import { Btn, Field, ImageUploader, ToastView, Toggle, inputClass, useToast } from './AdminUI';

const DEFAULT_FORM: SiteSettings = {
  logoUrl: '',
  adminLogoUrl: '',
  storeName: 'Apna Bazar',
  storePhone: '',
  storeEmail: '',
  storeAddress: '',
  freeDeliveryThreshold: 499,
  returnWindowDays: 5,
  coinValueRupees: 2,
  heroProductId: '',
  featuredProductIds: [],
  announcement: '',
  maintenanceMode: false,
};

export const SettingsAdmin: React.FC = () => {
  const { toast, notify } = useToast();
  const [form, setForm] = useState<SiteSettings>(DEFAULT_FORM);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [settings, productData] = await Promise.all([adminApi.settings(), adminApi.products()]);
      setForm({ ...DEFAULT_FORM, ...settings.settings });
      setProducts(productData.products || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const data = await adminApi.updateSettings(form);
      setForm({ ...DEFAULT_FORM, ...data.settings });
      notify('Store settings saved.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-sm font-bold text-slate-400">Loading settings…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
          <Store className="h-4 w-4 text-amber-500" /> Branding &amp; logos
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Upload the admin panel logo and the product image shown right below it.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <ImageUploader
            value={form.adminLogoUrl}
            onChange={(url) => set('adminLogoUrl', url)}
            folder="settings"
            label="Admin logo (PNG/SVG)"
            hint="Shown at the top of this admin panel."
          />
          <ImageUploader
            value={form.logoUrl}
            onChange={(url) => set('logoUrl', url)}
            folder="settings"
            label="Storefront logo"
            hint="Shown in the website header."
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Field label="Hero product (shown under logo)">
            <select
              value={form.heroProductId}
              onChange={(event) => set('heroProductId', event.target.value)}
              className={inputClass}
            >
              <option value="">None</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · ₹{product.price}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Announcement bar text">
            <input value={form.announcement} onChange={(event) => set('announcement', event.target.value)} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-900">Store details</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Store name">
            <input value={form.storeName} onChange={(event) => set('storeName', event.target.value)} className={inputClass} />
          </Field>
          <Field label="Support phone">
            <input value={form.storePhone} onChange={(event) => set('storePhone', event.target.value)} className={inputClass} />
          </Field>
          <Field label="Support email">
            <input value={form.storeEmail} onChange={(event) => set('storeEmail', event.target.value)} className={inputClass} />
          </Field>
          <Field label="Free delivery above (₹)">
            <input
              type="number"
              value={form.freeDeliveryThreshold}
              onChange={(event) => set('freeDeliveryThreshold', Number(event.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Return window (days)">
            <input
              type="number"
              value={form.returnWindowDays}
              onChange={(event) => set('returnWindowDays', Number(event.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="AB Coins per ₹1">
            <input
              type="number"
              value={form.coinValueRupees}
              onChange={(event) => set('coinValueRupees', Number(event.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Store address" className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.storeAddress}
              onChange={(event) => set('storeAddress', event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="flex items-center gap-1.5 text-sm font-black text-amber-900">
          <ShieldAlert className="h-4 w-4" /> Maintenance mode
        </p>
        <p className="mt-1 text-[11px] text-amber-800">
          When enabled, storefront ordering is paused. The admin panel keeps working.
        </p>
        <div className="mt-2">
          <Toggle checked={form.maintenanceMode} onChange={(value) => set('maintenanceMode', value)} label="Pause storefront ordering" />
        </div>
      </div>

      <div className="flex justify-end">
        <Btn onClick={save} loading={saving}>
          <Save className="w-4 h-4" /> Save settings
        </Btn>
      </div>

      <ToastView toast={toast} />
    </div>
  );
};
