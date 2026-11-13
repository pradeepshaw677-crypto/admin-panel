import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Upload, X } from 'lucide-react';
import { uploadToCloudinary } from '../../utils/cloudinary';

export const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:bg-slate-100 disabled:text-slate-400';

type BtnVariant = 'primary' | 'dark' | 'ghost' | 'danger' | 'outline' | 'success';

export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: BtnVariant;
    size?: 'sm' | 'md';
    loading?: boolean;
  }
> = ({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...rest }) => {
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-amber-400 text-slate-950 hover:bg-amber-300 border border-amber-500',
    dark: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border border-rose-600',
    outline: 'bg-white text-slate-800 hover:bg-slate-50 border border-slate-300',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600',
  };
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'
      } ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode; className?: string }> = ({
  label,
  hint,
  children,
  className = '',
}) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
  </label>
);

export const Toggle: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label?: string }> = ({
  checked,
  onChange,
  label,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2 cursor-pointer select-none"
  >
    <span
      className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </span>
    {label && <span className="text-xs font-bold text-slate-700">{label}</span>}
  </button>
);

export const Modal: React.FC<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}> = ({ open, title, subtitle, onClose, children, footer, wide }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4">
      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl ${
          wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-base font-black text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-200 px-5 py-3 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const ConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  confirmWord?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (typed?: string) => void;
}> = ({ open, title, message, confirmText = 'Yes, delete', confirmWord, danger = true, busy, onCancel, onConfirm }) => {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);
  const canConfirm = !confirmWord || typed.trim().toUpperCase() === confirmWord.toUpperCase();
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Btn variant="outline" onClick={onCancel} disabled={busy}>
            No, cancel
          </Btn>
          <Btn
            variant={danger ? 'danger' : 'primary'}
            onClick={() => onConfirm(typed)}
            disabled={!canConfirm}
            loading={busy}
          >
            {confirmText}
          </Btn>
        </>
      }
    >
      <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      {confirmWord && (
        <div className="mt-4 space-y-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
            Type <span className="font-mono text-rose-600">{confirmWord}</span> to confirm
          </p>
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className={inputClass}
            placeholder={confirmWord}
            autoFocus
          />
        </div>
      )}
    </Modal>
  );
};

export type ToastState = { message: string; kind: 'success' | 'error' } | null;

export function useToast(): {
  toast: ToastState;
  notify: (message: string, kind?: 'success' | 'error') => void;
} {
  const [toast, setToast] = useState<ToastState>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  return {
    toast,
    notify: (message, kind = 'success') => setToast({ message, kind }),
  };
}

export const ToastView: React.FC<{ toast: ToastState }> = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[200] -translate-x-1/2 px-4">
      <div
        className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white shadow-xl ${
          toast.kind === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      >
        {toast.kind === 'success' ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <AlertCircle className="w-4 h-4" />
        )}
        {toast.message}
      </div>
    </div>
  );
};

export const ImageUploader: React.FC<{
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  hint?: string;
}> = ({ value, onChange, folder = 'settings', label = 'Image', hint }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [size, setSize] = useState('');

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    setBusy(true);
    setSize(`${(file.size / 1024).toFixed(1)} KB`);
    try {
      const result = await uploadToCloudinary(file, folder);
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {value ? (
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="https://... or /assets/..."
            className={inputClass}
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Upload from device
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          {size && <span className="ml-2 text-[10px] text-slate-400">Selected size: {size}</span>}
          {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
          {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
      </div>
    </div>
  );
};

export const MultiImageUploader: React.FC<{
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  max?: number;
}> = ({ values, onChange, folder = 'products', max = 8 }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, max - values.length)) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`${file.name} is larger than 5 MB.`);
        const result = await uploadToCloudinary(file, folder);
        uploaded.push(result.url);
      }
      onChange([...values, ...uploaded].slice(0, max));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Gallery images</span>
      <div className="flex flex-wrap gap-2">
        {values.map((url, index) => (
          <div key={`${url}-${index}`} className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200">
            <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, position) => position !== index))}
              className="absolute right-0.5 top-0.5 rounded-full bg-rose-600 p-0.5 text-white cursor-pointer"
              aria-label="Remove image"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        ))}
        {values.length < max && (
          <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-amber-400 hover:text-amber-500">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="text-[9px] font-bold">Add</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </label>
        )}
      </div>
      {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
    </div>
  );
};

export const StatusPill: React.FC<{ label: string; tone?: 'green' | 'amber' | 'rose' | 'slate' | 'blue' }> = ({
  label,
  tone = 'slate',
}) => {
  const tones = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-100 text-amber-900 border-amber-200',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-sky-100 text-sky-800 border-sky-200',
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${tones[tone]}`}>
      {label}
    </span>
  );
};

export const EmptyState: React.FC<{ title: string; hint?: string; action?: React.ReactNode }> = ({
  title,
  hint,
  action,
}) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
    <p className="text-sm font-black text-slate-700">{title}</p>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
