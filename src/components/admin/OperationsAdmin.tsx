import React, { useEffect, useState } from 'react';
import { RefreshCw, Search, PackageCheck, RotateCcw, IndianRupee, Boxes } from 'lucide-react';
import { adminApi, type AdminOrder, type AdminReturn, type InventoryItem } from './adminApi';
import {
  Btn,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  StatusPill,
  inputClass,
  useLiveRefresh,
  useToast,
} from './AdminUI';

const ORDER_STATUSES: Array<{ value: string; label: string; tone: 'slate' | 'amber' | 'blue' | 'green' | 'rose' }> = [
  { value: 'placed', label: 'Placed', tone: 'slate' },
  { value: 'confirmed', label: 'Confirmed', tone: 'blue' },
  { value: 'packing', label: 'Packing', tone: 'amber' },
  { value: 'shipped', label: 'Shipped', tone: 'blue' },
  { value: 'out_for_delivery', label: 'Out for delivery', tone: 'amber' },
  { value: 'delivered', label: 'Delivered', tone: 'green' },
  { value: 'return_pickup_scheduled', label: 'Return pickup', tone: 'rose' },
  { value: 'returned', label: 'Returned', tone: 'rose' },
  { value: 'cancelled', label: 'Cancelled', tone: 'slate' },
];

const statusTone = (status: string) =>
  ORDER_STATUSES.find((entry) => entry.value === status)?.tone || 'slate';

const statusLabel = (status: string) =>
  ORDER_STATUSES.find((entry) => entry.value === status)?.label || status;

export const OrdersAdmin: React.FC = () => {
  const { notify } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [restock, setRestock] = useState(true);

  const load = async (options: { search?: string; status?: string; silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await adminApi.orders({
        search: options.search ?? search,
        status: options.status ?? statusFilter,
      });
      setOrders(data.orders || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load orders.', 'error');
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => load({ silent: true }));

  const changeStatus = async (order: AdminOrder, status: string) => {
    setBusyId(order.id);
    try {
      const data = await adminApi.updateOrderStatus(order.id, status);
      setOrders((prev) => prev.map((item) => (item.id === order.id ? { ...item, ...data.order } : item)));
      notify(`Order ${order.id} marked ${statusLabel(status)}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update order.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const openRefund = (order: AdminOrder) => {
    setRefundTarget(order);
    setRefundAmount(String(order.totalAmount));
    setRestock(true);
  };

  const submitRefund = async () => {
    if (!refundTarget) return;
    setBusyId(refundTarget.id);
    try {
      const data = await adminApi.refundOrder(refundTarget.id, {
        amount: Number(refundAmount) || undefined,
        restock,
      });
      setOrders((prev) =>
        prev.map((item) => (item.id === refundTarget.id ? { ...item, ...data.order } : item)),
      );
      notify(`₹${data.refunded} refunded.`);
      setRefundTarget(null);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Refund failed.', 'error');
    } finally {
      setBusyId(null);
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
            placeholder="Search order ID, customer email or mobile"
            className={`${inputClass} pl-9`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            load({ status: event.target.value });
          }}
          className={`${inputClass} max-w-[190px]`}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
        <Btn variant="outline" size="sm" onClick={() => load()} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading orders…</div>
      ) : orders.length === 0 ? (
        <EmptyState title="No orders found" hint="New customer orders appear here instantly." />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {order.id}
                    <span className="ml-2 text-[11px] font-bold text-slate-400">
                      {new Date(order.createdAt).toLocaleString('en-IN')}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {order.customer?.name || order.address.fullName} · {order.customer?.email || 'no email'} ·{' '}
                    {order.customer?.phone || order.address.phoneNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-slate-900">₹{order.totalAmount}</p>
                  <div className="flex items-center justify-end gap-1">
                    <StatusPill label={statusLabel(order.orderStatus)} tone={statusTone(order.orderStatus)} />
                    <StatusPill label={order.paymentMethod.toUpperCase()} tone="slate" />
                  </div>
                </div>
              </div>

              <p className="mt-2 line-clamp-2 text-[11px] text-slate-500">
                {order.items.map((item) => `${item.product?.name} × ${item.quantity}`).join(', ')}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <select
                  value={order.orderStatus}
                  onChange={(event) => changeStatus(order, event.target.value)}
                  disabled={busyId === order.id}
                  className={`${inputClass} max-w-[190px] py-1.5 text-xs`}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <Btn
                  variant="success"
                  size="sm"
                  loading={busyId === order.id}
                  onClick={() => changeStatus(order, 'confirmed')}
                >
                  <PackageCheck className="w-3.5 h-3.5" /> Confirm
                </Btn>
                <Btn variant="outline" size="sm" onClick={() => openRefund(order)}>
                  <IndianRupee className="w-3.5 h-3.5" /> Refund
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(refundTarget)}
        title="Refund order"
        subtitle={refundTarget ? `Order ${refundTarget.id} · paid ₹${refundTarget.totalAmount}` : ''}
        onClose={() => setRefundTarget(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setRefundTarget(null)} disabled={Boolean(busyId)}>Cancel</Btn>
            <Btn variant="danger" onClick={submitRefund} loading={Boolean(busyId)}>Refund now</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Refund amount (₹)">
            <input
              type="number"
              value={refundAmount}
              onChange={(event) => setRefundAmount(event.target.value)}
              className={inputClass}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <input type="checkbox" checked={restock} onChange={(event) => setRestock(event.target.checked)} />
            Return items to stock
          </label>
        </div>
      </Modal>
    </div>
  );
};

const RETURN_STATUSES = ['requested', 'approved', 'pickup_scheduled', 'rejected', 'completed'];

export const ReturnsAdmin: React.FC = () => {
  const { notify } = useToast();
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<{ record: AdminReturn; status: string } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundCoins, setRefundCoins] = useState('');

  const load = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await adminApi.returns();
      setReturns(data.returns || []);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load returns.', 'error');
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => load({ silent: true }));

  const openAction = (record: AdminReturn, status: string) => {
    setActionTarget({ record, status });
    setAdminNote('');
    setRefundAmount(String(record.order?.totalAmount || 0));
    setRefundCoins(String(record.order?.abCoinsUsed || 0));
  };

  const submitAction = async () => {
    if (!actionTarget) return;
    setBusyId(actionTarget.record.id);
    try {
      await adminApi.updateReturn(actionTarget.record.id, {
        status: actionTarget.status,
        adminNote,
        refundAmount: Number(refundAmount) || 0,
        refundCoins: Number(refundCoins) || 0,
      });
      notify(`Return marked ${actionTarget.status}.`);
      setActionTarget(null);
      await load();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update return.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-600">{returns.length} return requests</p>
        <Btn variant="outline" size="sm" onClick={() => load()} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading returns…</div>
      ) : returns.length === 0 ? (
        <EmptyState title="No return requests" hint="Customer return requests will appear here." />
      ) : (
        <div className="space-y-3">
          {returns.map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    {record.id}
                    <span className="ml-2 text-[11px] font-bold text-slate-400">Order {record.orderId}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {record.customer?.name || 'Customer'} · {record.customer?.email || 'no email'} ·{' '}
                    {record.customer?.phone || 'no phone'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">₹{record.order?.totalAmount ?? 0}</p>
                  <StatusPill
                    label={record.status.replace('_', ' ')}
                    tone={
                      record.status === 'completed'
                        ? 'green'
                        : record.status === 'rejected'
                        ? 'rose'
                        : record.status === 'requested'
                        ? 'amber'
                        : 'blue'
                    }
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                <strong>Reason:</strong> {record.reason}
                {record.comments ? ` — ${record.comments}` : ''}
              </p>
              {record.adminNote && (
                <p className="mt-1 text-[11px] text-slate-500">Admin note: {record.adminNote}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Btn variant="outline" size="sm" onClick={() => openAction(record, 'approved')}>
                  Approve
                </Btn>
                <Btn variant="outline" size="sm" onClick={() => openAction(record, 'pickup_scheduled')}>
                  Pickup scheduled
                </Btn>
                <Btn variant="success" size="sm" onClick={() => openAction(record, 'completed')}>
                  <RotateCcw className="w-3.5 h-3.5" /> Complete & refund
                </Btn>
                <Btn variant="danger" size="sm" onClick={() => openAction(record, 'rejected')}>
                  Reject
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(actionTarget)}
        title={actionTarget ? `Mark return ${actionTarget.status.replace('_', ' ')}` : ''}
        subtitle={actionTarget ? `Order ${actionTarget.record.orderId}` : ''}
        onClose={() => setActionTarget(null)}
        footer={
          <>
            <Btn variant="outline" onClick={() => setActionTarget(null)} disabled={Boolean(busyId)}>Cancel</Btn>
            <Btn onClick={submitAction} loading={Boolean(busyId)}>Save</Btn>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Admin note">
            <textarea rows={2} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className={inputClass} />
          </Field>
          {actionTarget?.status === 'completed' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Refund amount (₹)">
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Refund AB Coins">
                <input
                  type="number"
                  value={refundCoins}
                  onChange={(event) => setRefundCoins(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
          <p className="text-[11px] text-slate-500">
            Completing a return restores stock, marks the order returned and credits the refunded coins to the member wallet.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export const InventoryAdmin: React.FC = () => {
  const { notify } = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async (options: { silent?: boolean } = {}) => {
    if (!options.silent) setLoading(true);
    try {
      const data = await adminApi.inventory();
      setItems(data.inventory || []);
      setTotals(data.totals || {});
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not load inventory.', 'error');
    } finally {
      if (!options.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLiveRefresh(() => load({ silent: true }));

  const setStock = async (item: InventoryItem, nextStock: number) => {
    const stock = Math.max(0, Math.round(nextStock));
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, stock } : entry)));
    setSavingId(item.id);
    try {
      await adminApi.updateProduct(item.id, { stock });
      notify(`Stock for ${item.name} set to ${stock}.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not update stock.', 'error');
      await load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Products', value: totals.products ?? 0, icon: Boxes },
          { label: 'Units in stock', value: totals.units ?? 0, icon: PackageCheck },
          { label: 'Stock value', value: `₹${totals.stockValue ?? 0}`, icon: IndianRupee },
          { label: 'Low / out', value: `${totals.lowStock ?? 0} / ${totals.outOfStock ?? 0}`, icon: RotateCcw },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-3">
            <stat.icon className="h-4 w-4 text-amber-500" />
            <p className="mt-1 text-lg font-black text-slate-900">{stat.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Btn variant="outline" size="sm" onClick={() => load()} loading={loading}>
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Btn>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm font-bold text-slate-400">Loading inventory…</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-b-0"
            >
              <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                <p className="text-[11px] text-slate-500">{item.id} · ₹{item.price} · value ₹{item.stockValue}</p>
              </div>
              <StatusPill
                label={item.status.replace('_', ' ')}
                tone={item.status === 'out_of_stock' ? 'rose' : item.status === 'low_stock' ? 'amber' : 'green'}
              />
              <div className="flex items-center gap-1">
                <Btn variant="outline" size="sm" disabled={savingId === item.id} onClick={() => setStock(item, item.stock - 1)}>
                  −
                </Btn>
                <input
                  type="number"
                  value={item.stock}
                  onChange={(event) => setStock(item, Number(event.target.value))}
                  className={`${inputClass} w-20 py-1 text-center text-xs`}
                  disabled={savingId === item.id}
                />
                <Btn variant="outline" size="sm" disabled={savingId === item.id} onClick={() => setStock(item, item.stock + 1)}>
                  +
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
