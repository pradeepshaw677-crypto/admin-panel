import React, { useEffect, useState } from 'react';
import { Coins, RefreshCw, Search, ShieldCheck, Ban, ArrowRightLeft, History } from 'lucide-react';
import { adminApi, type AdminUser, type AuditEntry } from './adminApi';
import {
  Btn,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  StatusPill,
  ToastView,
  inputClass,
  useLiveRefresh,
  useToast,
} from './AdminUI';

export const PeopleAdmin: React.FC = () => {
  const { toast, notify } = useToast();
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [coinTarget, setCoinTarget] = useState<AdminUser | null>(null);
  const [coinAmount, setCoinAmount] = useState('50');
  const [coinType, setCoinType] = useState<'credit' | 'debit'>('credit');
  const [coinNote, setCoinNote] = useState('');

  const [ledgerTarget, setLedgerTarget] = useState<AdminUser | null>(null);
  const [ledger, setLedger] = useState<Array<Record<string, unknown>>>([]);

  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('50');
  const [transferNote, setTransferNote] = useState('');
  const [transferBusy, setTransferBusy] = useState(false);

  const [broadcastAmount, setBroadcastAmount] = useState('50');
  const [broadcastNote, setBroadcastNote] = useState('Festival gift from Apna Bazar');
  const [broadcastBusy, setBroadcastBusy] = useState(false);
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  const load = async (term: string = search, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await adminApi.users(term);
      setMembers(data.users || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load members.', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => load(search, true));

  const toggleRole = async (member: AdminUser) => {
    setBusyId(member.id);
    try {
      const data = await adminApi.updateUser(member.id, { role: member.role === 'admin' ? 'customer' : 'admin' });
      setMembers((prev) => prev.map((entry) => (entry.id === member.id ? data.user : entry)));
      notify(data.user.role === 'admin' ? 'Admin access granted.' : 'Admin access removed.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update member.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const toggleBlock = async (member: AdminUser) => {
    setBusyId(member.id);
    try {
      const data = await adminApi.updateUser(member.id, { isBlocked: !member.isBlocked });
      setMembers((prev) => prev.map((entry) => (entry.id === member.id ? data.user : entry)));
      notify(data.user.isBlocked ? 'Member blocked.' : 'Member unblocked.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update member.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const submitCoins = async () => {
    if (!coinTarget) return;
    setBusyId(coinTarget.id);
    try {
      const data = await adminApi.adjustCoins(coinTarget.id, {
        amount: Number(coinAmount),
        type: coinType,
        note: coinNote,
      });
      setMembers((prev) =>
        prev.map((entry) => (entry.id === coinTarget.id ? { ...entry, walletBalance: data.walletBalance } : entry)),
      );
      notify(`${coinType === 'credit' ? 'Credited' : 'Debited'} ${coinAmount} AB Coins.`);
      setCoinTarget(null);
      setCoinNote('');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update coins.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openLedger = async (member: AdminUser) => {
    setLedgerTarget(member);
    setLedger([]);
    try {
      const data = await adminApi.userLedger(member.id);
      setLedger(data.entries || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load ledger.', 'error');
    }
  };

  const submitBroadcast = async () => {
    setBroadcastBusy(true);
    try {
      const data = await adminApi.broadcastCoins({
        amount: Number(broadcastAmount),
        note: broadcastNote,
      });
      notify(`${data.amount} AB Coins sent to ${data.credited} members.`);
      setConfirmBroadcast(false);
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not send coins.', 'error');
    } finally {
      setBroadcastBusy(false);
    }
  };

  const submitTransfer = async () => {
    if (!transferFrom || !transferTo) return notify('Choose both members.', 'error');
    setTransferBusy(true);
    try {
      await adminApi.transferCoins({
        fromUserId: transferFrom,
        toUserId: transferTo,
        amount: Number(transferAmount),
        note: transferNote,
      });
      notify('AB Coins transferred.');
      setTransferNote('');
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Transfer failed.', 'error');
    } finally {
      setTransferBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && load()}
            placeholder="Search members by name, email or mobile"
            className={`${inputClass} pl-9`}
          />
        </div>
        <Btn variant="outline" size="sm" onClick={() => load()} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
          <ArrowRightLeft className="h-4 w-4 text-amber-500" /> Transfer AB Coins between members
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <Field label="From">
            <select value={transferFrom} onChange={(event) => setTransferFrom(event.target.value)} className={inputClass}>
              <option value="">Select sender</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.walletBalance} coins)
                </option>
              ))}
            </select>
          </Field>
          <Field label="To">
            <select value={transferTo} onChange={(event) => setTransferTo(event.target.value)} className={inputClass}>
              <option value="">Select receiver</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.walletBalance} coins)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Coins">
            <input type="number" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Note">
            <input value={transferNote} onChange={(event) => setTransferNote(event.target.value)} className={inputClass} />
          </Field>
        </div>
        <div className="mt-2 flex justify-end">
          <Btn size="sm" onClick={submitTransfer} loading={transferBusy}>
            <Coins className="w-3.5 h-3.5" /> Transfer coins
          </Btn>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
        <p className="flex items-center gap-1.5 text-sm font-black text-slate-900">
          <Coins className="h-4 w-4 text-amber-600" /> Send AB Coins to all members
        </p>
        <p className="mt-1 text-[11px] font-semibold text-slate-500">
          One click se sabhi active members ko coins milenge. Ledger aur audit log me record hoga.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <Field label="Coins per member">
            <input
              type="number"
              min={1}
              value={broadcastAmount}
              onChange={(event) => setBroadcastAmount(event.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Gift message" className="sm:col-span-2">
            <input
              value={broadcastNote}
              onChange={(event) => setBroadcastNote(event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-2 flex justify-end">
          <Btn
            size="sm"
            onClick={() => {
              if (!Number(broadcastAmount) || Number(broadcastAmount) < 1) {
                return notify('Enter a coin amount of at least 1.', 'error');
              }
              setConfirmBroadcast(true);
            }}
          >
            <Coins className="w-3.5 h-3.5" /> Send to all members
          </Btn>
        </div>
      </div>

      <ConfirmDialog
        open={confirmBroadcast}
        danger={false}
        title="Send coins to every member?"
        message={`${broadcastAmount} AB Coins har active member ko milenge. Total members ka balance turant badh jayega aur yeh action audit log me record hoga.`}
        confirmWord="SEND ALL"
        confirmText="Yes, send to all"
        busy={broadcastBusy}
        onCancel={() => setConfirmBroadcast(false)}
        onConfirm={submitBroadcast}
      />

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading members…</div>
      ) : members.length === 0 ? (
        <EmptyState title="No members found" hint="Customers appear here after their first login." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {members.map((member) => (
            <div key={member.id} className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-amber-300">
                {member.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-900">
                  {member.name}
                  {member.role === 'admin' && <StatusPill label="Admin" tone="amber" />}
                  {member.isBlocked && <StatusPill label="Blocked" tone="rose" />}
                </p>
                <p className="truncate text-[11px] text-slate-500">
                  {member.email || 'no email'} · {member.phone || 'no mobile'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-amber-600">{member.walletBalance} AB</p>
                <p className="text-[10px] font-bold text-slate-400">
                  {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN') : ''}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-1">
                <Btn variant="outline" size="sm" onClick={() => openLedger(member)}>
                  <History className="w-3.5 h-3.5" />
                </Btn>
                <Btn variant="outline" size="sm" onClick={() => { setCoinTarget(member); setCoinType('credit'); setCoinAmount('50'); }}>
                  <Coins className="w-3.5 h-3.5" />
                </Btn>
                <Btn variant="outline" size="sm" loading={busyId === member.id} onClick={() => toggleRole(member)}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                </Btn>
                <Btn variant={member.isBlocked ? 'success' : 'danger'} size="sm" loading={busyId === member.id} onClick={() => toggleBlock(member)}>
                  <Ban className="w-3.5 h-3.5" />
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(coinTarget)}
        title="Adjust AB Coins"
        subtitle={coinTarget ? `${coinTarget.name} · current balance ${coinTarget.walletBalance} AB` : ''}
        onClose={() => setCoinTarget(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setCoinTarget(null)} disabled={Boolean(busyId)}>Cancel</Btn>
            <Btn onClick={submitCoins} loading={Boolean(busyId)}>Apply</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Action">
            <select value={coinType} onChange={(event) => setCoinType(event.target.value as 'credit' | 'debit')} className={inputClass}>
              <option value="credit">Credit coins</option>
              <option value="debit">Debit coins</option>
            </select>
          </Field>
          <Field label="Coins">
            <input type="number" value={coinAmount} onChange={(event) => setCoinAmount(event.target.value)} className={inputClass} />
          </Field>
          <Field label="Note">
            <input value={coinNote} onChange={(event) => setCoinNote(event.target.value)} className={inputClass} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(ledgerTarget)}
        wide
        title="Wallet ledger"
        subtitle={ledgerTarget ? `${ledgerTarget.name} · ${ledgerTarget.email || ledgerTarget.phone}` : ''}
        onClose={() => setLedgerTarget(null)}
      >
        {ledger.length === 0 ? (
          <EmptyState title="No wallet activity yet" />
        ) : (
          <div className="space-y-1.5">
            {ledger.map((entry) => (
              <div key={String(entry.id)} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                <div>
                  <p className="text-xs font-black text-slate-800">{String(entry.title || entry.type)}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(Number(entry.created_at)).toLocaleString('en-IN')}
                    {entry.note ? ` · ${String(entry.note)}` : ''}
                  </p>
                </div>
                <span className={`text-sm font-black ${entry.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {entry.type === 'credit' ? '+' : '−'}
                  {String(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ToastView toast={toast} />
    </div>
  );
};

export const AuditAdmin: React.FC = () => {
  const { toast, notify } = useToast();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await adminApi.audit(200);
      setEntries(data.entries || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load audit log.', 'error');
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => load({ silent: true }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600">{entries.length} recent admin actions</p>
        <Btn variant="outline" size="sm" onClick={() => load()} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
      </div>
      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading audit log…</div>
      ) : entries.length === 0 ? (
        <EmptyState title="No admin activity recorded yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {entries.map((entry) => (
            <div key={entry.id} className="border-b border-slate-100 px-4 py-2 last:border-b-0">
              <p className="text-xs font-black text-slate-800">{entry.action}</p>
              <p className="text-[10px] text-slate-500">
                {new Date(entry.created_at).toLocaleString('en-IN')}
                {entry.detail ? ` · ${entry.detail}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
      <ToastView toast={toast} />
    </div>
  );
};
