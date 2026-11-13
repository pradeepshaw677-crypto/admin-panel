import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Image,
  Boxes,
  ShoppingBag,
  RotateCcw,
  Users,
  Settings,
  History,
  LogOut,
  ShieldCheck,
  Lock,
  Loader2,
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { adminApi, type AdminMetrics, type SiteSettings } from './adminApi';
import { Btn, ToastView, inputClass, useToast } from './AdminUI';
import { ProductsAdmin } from './ProductsAdmin';
import { ContentAdmin } from './ContentAdmin';
import { InventoryAdmin, OrdersAdmin, ReturnsAdmin } from './OperationsAdmin';
import { AuditAdmin, PeopleAdmin } from './PeopleAdmin';
import { SettingsAdmin } from './SettingsAdmin';

type Tab =
  | 'overview'
  | 'products'
  | 'content'
  | 'inventory'
  | 'orders'
  | 'returns'
  | 'members'
  | 'settings'
  | 'audit';

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'content', label: 'Banners & Content', icon: Image },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
  { id: 'members', label: 'Members & Coins', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'audit', label: 'Audit Log', icon: History },
];

const DEFAULT_ADMIN_LOGO = '/assets/aistudio/IMG_20261102_120048_b98f504b.png';

const LoginGate: React.FC<{ onSuccess: (user: UserProfile) => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await adminApi.login(email.trim(), password);
      onSuccess(data.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-slate-900 px-6 py-8 text-center">
          <img src={DEFAULT_ADMIN_LOGO} alt="Apna Bazar" className="mx-auto h-16 w-16 rounded-2xl bg-white/10 object-contain p-1" />
          <h1 className="mt-3 text-lg font-black text-white">Apna Bazar Admin</h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400">Secure control panel</p>
        </div>
        <form onSubmit={submit} className="space-y-3 px-6 py-6">
          <label className="block space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Admin email</span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="admin@apnabazar.in"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-700">{error}</p>}
          <Btn type="submit" className="w-full" loading={busy}>
            <Lock className="w-4 h-4" /> Sign in
          </Btn>
          <p className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400">
            <ShieldCheck className="w-3 h-3" /> HttpOnly session · rate limited · audit logged
          </p>
        </form>
      </div>
    </div>
  );
};

const Overview: React.FC<{ metrics: AdminMetrics | null; goTo: (tab: Tab) => void }> = ({ metrics, goTo }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: 'Total orders', value: metrics?.totalOrders ?? 0, tab: 'orders' as Tab },
        { label: 'Revenue', value: `₹${metrics?.totalRevenue ?? 0}`, tab: 'orders' as Tab },
        { label: 'Members', value: metrics?.totalUsers ?? 0, tab: 'members' as Tab },
        { label: 'Products', value: metrics?.totalProducts ?? 0, tab: 'products' as Tab },
        { label: 'Low stock', value: metrics?.lowStockProducts ?? 0, tab: 'inventory' as Tab },
        { label: 'Pending returns', value: metrics?.pendingReturns ?? 0, tab: 'returns' as Tab },
        { label: 'AB Coins in circulation', value: metrics?.coinsInCirculation ?? 0, tab: 'members' as Tab },
      ].map((card) => (
        <button
          key={card.label}
          type="button"
          onClick={() => goTo(card.tab)}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-400 hover:shadow-sm cursor-pointer"
        >
          <p className="text-xl font-black text-slate-900">{card.value}</p>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{card.label}</p>
        </button>
      ))}
    </div>

    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-black text-slate-900">Quick actions</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn size="sm" onClick={() => goTo('products')}>Add or edit products</Btn>
        <Btn variant="outline" size="sm" onClick={() => goTo('content')}>Edit banners &amp; deals</Btn>
        <Btn variant="outline" size="sm" onClick={() => goTo('content')}>Manage coupons</Btn>
        <Btn variant="outline" size="sm" onClick={() => goTo('orders')}>Confirm orders</Btn>
        <Btn variant="outline" size="sm" onClick={() => goTo('returns')}>Approve returns</Btn>
        <Btn variant="outline" size="sm" onClick={() => goTo('settings')}>Logo &amp; store settings</Btn>
      </div>
    </div>

    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-600">
      <p className="font-black text-slate-800">Every action is live — no page refresh needed.</p>
      <p>
        Products, banners, deals, coupons, brands, categories, fabrics, inventory, orders, returns, refunds, members,
        coins and settings all update instantly. Every change is written to the audit log.
      </p>
    </div>
  </div>
);

export const AdminPanel: React.FC = () => {
  const { toast, notify } = useToast();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [configured, setConfigured] = useState(true);

  const loadMetrics = async () => {
    try {
      setMetrics(await adminApi.metrics());
    } catch {
      /* metrics are non-critical */
    }
  };

  useEffect(() => {
    let mounted = true;
    adminApi
      .me()
      .then(async (data) => {
        if (!mounted) return;
        setUser(data.user);
        setConfigured(data.configured);
        if (data.user.role === 'admin') {
          await loadMetrics();
          try {
            const settingsData = await adminApi.settings();
            if (mounted) setSettings(settingsData.settings);
          } catch {
            /* settings are optional */
          }
        }
      })
      .catch(() => undefined)
      .finally(() => mounted && setChecking(false));
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (nextUser: UserProfile) => {
    setUser(nextUser);
    await loadMetrics();
    try {
      const settingsData = await adminApi.settings();
      setSettings(settingsData.settings);
    } catch {
      /* ignore */
    }
  };

  const logout = async () => {
    try {
      await adminApi.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    setTab('overview');
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <>
        <LoginGate onSuccess={handleLogin} />
        <ToastView toast={toast} />
      </>
    );
  }

  const adminLogo = settings?.adminLogoUrl || DEFAULT_ADMIN_LOGO;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <img src={adminLogo} alt="Admin logo" className="h-9 w-9 rounded-xl bg-white/10 object-contain p-0.5" />
            <div className="leading-tight">
              <p className="text-sm font-black">{settings?.storeName || 'Apna Bazar'} Admin</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{user.email || user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Btn variant="outline" size="sm" className="!border-slate-700 !bg-slate-900 !text-slate-100" onClick={logout}>
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Btn>
          </div>
        </div>
      </header>

      {!configured && (
        <div className="bg-amber-100 px-4 py-2 text-center text-[11px] font-bold text-amber-900">
          Set ADMIN_EMAIL and ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in .env before going live.
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-4 px-3 py-4 sm:px-4">
        <aside className="w-52 shrink-0">
          <nav className="sticky top-16 space-y-1">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold transition cursor-pointer ${
                  tab === entry.id ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-white'
                }`}
              >
                <entry.icon className={`h-4 w-4 ${tab === entry.id ? 'text-amber-400' : 'text-slate-400'}`} />
                {entry.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap gap-1.5 md:hidden">
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setTab(entry.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                  tab === entry.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            {tab === 'overview' && <Overview metrics={metrics} goTo={setTab} />}
            {tab === 'products' && <ProductsAdmin />}
            {tab === 'content' && <ContentAdmin />}
            {tab === 'inventory' && <InventoryAdmin />}
            {tab === 'orders' && <OrdersAdmin />}
            {tab === 'returns' && <ReturnsAdmin />}
            {tab === 'members' && <PeopleAdmin />}
            {tab === 'settings' && <SettingsAdmin />}
            {tab === 'audit' && <AuditAdmin />}
          </div>
        </main>
      </div>

      <ToastView toast={toast} />
    </div>
  );
};
