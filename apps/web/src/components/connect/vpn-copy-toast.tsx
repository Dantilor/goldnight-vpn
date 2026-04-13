import { useEffect } from 'react';

export type VpnCopyToastProps = {
  message: string;
  variant?: 'success' | 'error';
  onDismiss: () => void;
  durationMs?: number;
};

export function VpnCopyToast({ message, variant = 'success', onDismiss, durationMs = 2600 }: VpnCopyToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onDismiss]);

  const isError = variant === 'error';

  return (
    <div
      role="status"
      className={`pointer-events-none fixed left-1/2 z-[200] w-[min(100%-2rem,22rem)] -translate-x-1/2 animate-[gn-toast-in_0.35s_ease-out] rounded-2xl border px-4 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom,12px))] text-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${
        isError
          ? 'bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] border-error/35 bg-[#1f1212]/95 text-error'
          : 'bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] border-primary/30 bg-[#14180f]/95 text-primary'
      }`}
    >
      <p className="text-sm font-semibold leading-snug text-white">{message}</p>
      {!isError ? <p className="mt-0.5 text-[11px] text-on-surface-variant">Можно вставить в клиент</p> : null}
    </div>
  );
}
