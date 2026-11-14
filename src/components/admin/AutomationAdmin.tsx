import React, { useEffect, useState } from 'react';
import { Bot, Percent, RefreshCw, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import {
  adminApi,
  type AiStatus,
  type AutoDiscountRules,
  type DiscountSuggestion,
  type SecurityStatus,
} from './adminApi';
import {
  Btn,
  ConfirmDialog,
  EmptyState,
  Field,
  StatusPill,
  Toggle,
  inputClass,
  useLiveRefresh,
  useToast,
  ToastView,
} from './AdminUI';
import { formatINR } from '../../utils/pricing';

export const AutomationAdmin: React.FC = () => {
  const { toast, notify } = useToast();
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [security, setSecurity] = useState<SecurityStatus | null>(null);
  const [rules, setRules] = useState<AutoDiscountRules | null>(null);
  const [suggestions, setSuggestions] = useState<DiscountSuggestion[]>([]);
  const [scanned, setScanned] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [confirmApply, setConfirmApply] = useState(false);

  const loadRules = async () => {
    try {
      const data = await adminApi.discountRules();
      setRules(data.rules);
      setDirty(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load discount rules.', 'error');
    }
  };

  const loadPreview = async (silent = false) => {
    if (!silent) setPreviewBusy(true);
    try {
      const data = await adminApi.discountPreview();
      setSuggestions(data.suggestions || []);
      setScanned(data.scanned || 0);
    } catch (error) {
      if (!silent) notify(error instanceof Error ? error.message : 'Could not build a discount preview.', 'error');
    } finally {
      if (!silent) setPreviewBusy(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const [aiData, securityData] = await Promise.all([
        adminApi.aiStatus().catch(() => null),
        adminApi.securityStatus().catch(() => null),
      ]);
      if (mounted) {
        if (aiData) setAi(aiData);
        if (securityData) setSecurity(securityData);
      }
      await Promise.all([loadRules(), loadPreview(true)]);
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => loadPreview(true));

  const updateRule = <Key extends keyof AutoDiscountRules>(key: Key, value: AutoDiscountRules[Key]) => {
    if (!rules) return;
    setRules({ ...rules, [key]: value });
    setDirty(true);
  };

  const saveRules = async () => {
    if (!rules) return;
    setSaving(true);
    try {
      const data = await adminApi.saveDiscountRules(rules);
      setRules(data.rules);
      setDirty(false);
      notify('Discount rules saved.');
      await loadPreview();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not save rules.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const applyNow = async () => {
    setApplying(true);
    try {
      const data = await adminApi.applyDiscounts();
      notify(`${data.updated} products ka price kam ho gaya.`);
      setConfirmApply(false);
      await loadPreview(true);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not apply discounts.', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (loading && !rules) {
    return <div className="py-16 text-center text-sm font-bold text-slate-400">Loading automation…</div>;
  }

  const securityChecks = security
    ? [
        { label: 'Production mode (Secure cookie + HTTPS)', ok: security.production },
        {
          label: 'Password stored as scrypt hash',
          ok: security.passwordHashed,
          hint: security.passwordHashed ? undefined : 'ADMIN_PASSWORD ki jagah ADMIN_PASSWORD_HASH use karo',
        },
        { label: 'Admin email allowlist', ok: security.emailAllowlist },
        { label: 'Turso cloud database', ok: security.database === 'turso' },
        { label: 'Cloudinary signed uploads', ok: security.cloudinary },
        { label: 'AI writer (built-in, no key)', ok: security.ai },
        { label: 'Live updates stream', ok: security.liveUpdates },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-900">AI product assistant</p>
                <p className="text-[11px] font-bold text-slate-500">Description, highlights, Hindi name, SEO aur discount suggestion</p>
              </div>
            </div>
            <StatusPill label="Always on" tone="green" />
          </div>
          <div className="mt-3 space-y-1 rounded-xl bg-white/80 p-3 text-[11px] leading-relaxed text-slate-600">
            <p>
              <span className="font-black text-slate-800">Engine:</span> {ai?.provider || 'built-in'} ·{' '}
              {ai?.model || 'apna-bazar-copy-v1'}
            </p>
            <p className="pt-1 text-slate-500">
              Koi API key nahi chahiye, koi extra charge nahi. Products tab → product add/edit karo →{' '}
              <span className="font-bold">AI se likho</span> dabao.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">Security check</p>
              <p className="text-[11px] font-bold text-slate-500">Live status of every protection layer</p>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {securityChecks.map((check) => (
              <div key={check.label} className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                <div>
                  <p className="text-[11px] font-bold text-slate-700">{check.label}</p>
                  {check.hint && <p className="text-[10px] text-amber-700">{check.hint}</p>}
                </div>
                <StatusPill label={check.ok ? 'OK' : 'Fix'} tone={check.ok ? 'green' : 'amber'} />
              </div>
            ))}
            {!security && <p className="text-[11px] font-bold text-slate-400">Status load nahi hua.</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
              <Percent className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-black text-slate-900">Auto discount engine</p>
              <p className="text-[11px] font-bold text-slate-500">
                Slow-moving aur high-stock products par price apne aap kam karo
              </p>
            </div>
          </div>
          <Toggle checked={Boolean(rules?.enabled)} onChange={(value) => updateRule('enabled', value)} label={rules?.enabled ? 'On' : 'Off'} />
        </div>

        {rules && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Max discount %" hint="Isse zyada kabhi nahi jayega">
                <input
                  type="number"
                  value={rules.maxDiscountPercent}
                  onChange={(event) => updateRule('maxDiscountPercent', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Slow-moving days" hint="Itne din se no sale">
                <input
                  type="number"
                  value={rules.slowMovingDays}
                  onChange={(event) => updateRule('slowMovingDays', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="High stock threshold" hint="Itna stock = heavy stock">
                <input
                  type="number"
                  value={rules.stockThreshold}
                  onChange={(event) => updateRule('stockThreshold', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Discount step %" hint="Rounding step">
                <input
                  type="number"
                  value={rules.step}
                  onChange={(event) => updateRule('step', Number(event.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Btn size="sm" onClick={saveRules} loading={saving} disabled={!dirty}>
                Save rules
              </Btn>
              <Btn variant="outline" size="sm" onClick={() => loadPreview()} loading={previewBusy}>
                <RefreshCw className="h-3.5 w-3.5" /> Refresh preview
              </Btn>
              <Btn
                variant="success"
                size="sm"
                onClick={() => setConfirmApply(true)}
                disabled={!rules.enabled || suggestions.length === 0 || previewBusy}
              >
                <Zap className="h-3.5 w-3.5" /> Apply {suggestions.length > 0 ? `${suggestions.length} discounts` : ''}
              </Btn>
              <span className="text-[11px] font-bold text-slate-500">
                {scanned} products scanned · preview saved rules par based hai
              </span>
            </div>

            {dirty && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                Rules change hue hain — pehle Save rules dabao, phir Refresh preview.
              </p>
            )}
            {!rules.enabled && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600">
                Engine off hai. Apply karne ke liye On karke Save rules dabao.
              </p>
            )}

            <div className="mt-3">
              {previewBusy ? (
                <div className="py-8 text-center text-xs font-bold text-slate-400">Suggestions ban rahi hain…</div>
              ) : suggestions.length === 0 ? (
                <EmptyState
                  title="Abhi koi discount suggestion nahi"
                  hint="Jab koi product slow-moving ya overstocked hoga, yahan dikhega."
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="hidden grid-cols-12 gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 md:grid">
                    <span className="col-span-4">Product</span>
                    <span className="col-span-2">Stock</span>
                    <span className="col-span-3">Price</span>
                    <span className="col-span-3">Discount</span>
                  </div>
                  {suggestions.map((item) => (
                    <div key={item.id} className="grid grid-cols-1 gap-1 border-b border-slate-100 px-3 py-2 text-[11px] last:border-b-0 md:grid-cols-12 md:items-center md:gap-2">
                      <div className="col-span-4 min-w-0">
                        <p className="truncate font-black text-slate-800">{item.name}</p>
                        <p className="truncate text-[10px] text-slate-500">{item.reason}</p>
                      </div>
                      <span className="col-span-2 font-bold text-slate-600">{item.stock}</span>
                      <span className="col-span-3 font-bold text-slate-700">
                        {formatINR(item.currentPrice)} → {formatINR(item.newPrice)}
                      </span>
                      <span className="col-span-3 font-black text-emerald-700">
                        {item.currentDiscountPercent}% → {item.projectedDiscountPercent}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[11px] leading-relaxed text-slate-600">
        <p className="flex items-center gap-1.5 font-black text-slate-800">
          <Bot className="h-3.5 w-3.5" /> Ye kaise kaam karta hai
        </p>
        <p>
          Engine pichhle 30 din ki sales, product ki age aur current stock dekhta hai. Jo product bik nahi raha, uska
          price step-by-step kam karta hai — kabhi bhi aapke set kiye max discount se zyada nahi. Apply dabaane par hi
          price change hota hai aur storefront turant naya price dikhata hai.
        </p>
      </div>

      <ConfirmDialog
        open={confirmApply}
        title="Apply auto discounts?"
        message={`${suggestions.length} products ka selling price kam hoga (max ${rules?.maxDiscountPercent ?? 0}% discount tak). Storefront par turant live ho jayega.`}
        confirmText="Apply discounts"
        danger={false}
        busy={applying}
        onCancel={() => setConfirmApply(false)}
        onConfirm={applyNow}
      />
      <ToastView toast={toast} />
    </div>
  );
};
