import { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { copyTextToClipboard } from '../../lib/copy-to-clipboard';

export type VpnQrFlowSheetProps = {
  open: boolean;
  onClose: () => void;
  /** Encoded QR value; falls back to connection string on client when backend omits qrValue. */
  qrData: string;
  hasCopyLink: boolean;
  copyLinkText: string;
  /** Full raw line for "copy all" / expandable (vless://, key, etc.). */
  fullRaw: string;
  onCopyResult: (ok: boolean, kind: 'link' | 'full') => void;
};

export function VpnQrFlowSheet({
  open,
  onClose,
  qrData,
  hasCopyLink,
  copyLinkText,
  fullRaw,
  onCopyResult
}: VpnQrFlowSheetProps) {
  const [rawExpanded, setRawExpanded] = useState(false);

  useEffect(() => {
    if (!open) setRawExpanded(false);
  }, [open]);

  if (!open) return null;

  const handleCopyLink = async () => {
    if (!hasCopyLink || !copyLinkText) {
      onCopyResult(false, 'link');
      return;
    }
    const ok = await copyTextToClipboard(copyLinkText);
    onCopyResult(ok, 'link');
  };

  const handleCopyFull = async () => {
    const text = fullRaw.trim();
    if (!text) {
      onCopyResult(false, 'full');
      return;
    }
    const ok = await copyTextToClipboard(text);
    onCopyResult(ok, 'full');
  };

  const canShowQr = qrData.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))] pt-10 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vpn-qr-title"
      onClick={() => onClose()}
    >
      <div
        className="gn-animate-sheet relative w-full max-w-[min(100%,22rem)] overflow-hidden rounded-[1.35rem] border border-primary/20 bg-gradient-to-b from-[#1a1916] via-[#121211] to-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(242,202,80,0.06)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(ellipse_at_50%_0%,rgba(242,202,80,0.14),transparent_65%)]"
          aria-hidden
        />
        <div className="relative px-5 pb-5 pt-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 id="vpn-qr-title" className="font-headline text-lg font-bold tracking-tight text-white">
                QR для подключения
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-on-surface-variant">
                Откройте совместимый клиент и отсканируйте код.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onClose()}
              className="shrink-0 rounded-xl border border-outline-variant/20 bg-black/25 p-2 text-on-surface-variant transition hover:bg-white/[0.06] hover:text-white"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {canShowQr ? (
            <div className="mx-auto flex max-w-[260px] justify-center rounded-2xl border border-white/12 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <QRCode value={qrData} size={228} bgColor="#ffffff" fgColor="#0a0a0a" level="M" />
            </div>
          ) : (
            <div className="rounded-2xl border border-outline-variant/20 bg-black/30 px-4 py-8 text-center">
              <p className="text-sm text-on-surface-variant">Нет данных для QR. Используйте копирование ниже.</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={!hasCopyLink || !copyLinkText}
              onClick={() => void handleCopyLink()}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-primary/35 bg-primary/[0.12] py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                link
              </span>
              Скопировать ссылку
            </button>
            <button
              type="button"
              disabled={!fullRaw.trim()}
              onClick={() => void handleCopyFull()}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-highest/80 py-3.5 text-sm font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-xl text-primary/90" style={{ fontVariationSettings: "'FILL' 1" }}>
                content_copy
              </span>
              Скопировать полностью
            </button>
            <button
              type="button"
              onClick={() => onClose()}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-outline-variant/20 py-3 text-sm font-semibold text-on-surface-variant transition hover:border-outline-variant/35 hover:text-white"
            >
              Закрыть
            </button>
          </div>

          <div className="mt-5 rounded-2xl border border-outline-variant/15 bg-black/25 px-4 py-4">
            <p className="font-headline text-sm font-bold text-white">Полная строка подключения</p>
            <p className="mt-1 text-[11px] leading-snug text-on-surface-variant">Только если клиент просит вставить строку вручную.</p>
            {!rawExpanded ? (
              <button
                type="button"
                onClick={() => setRawExpanded(true)}
                className="mt-3 w-full rounded-xl border border-outline-variant/25 bg-surface-container-highest/80 py-3.5 text-sm font-bold text-white transition active:scale-[0.99]"
              >
                Показать строку
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <p className="max-h-36 overflow-y-auto break-all rounded-xl bg-black/45 p-3 font-mono text-[10px] leading-relaxed text-on-surface-variant">
                  {fullRaw.trim() || '—'}
                </p>
                <button
                  type="button"
                  disabled={!fullRaw.trim()}
                  onClick={() => void handleCopyFull()}
                  className="w-full rounded-xl border border-outline-variant/25 bg-surface-container-highest py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-40"
                >
                  Скопировать полностью
                </button>
                <button
                  type="button"
                  onClick={() => setRawExpanded(false)}
                  className="w-full py-2 text-[12px] font-semibold text-on-surface-variant transition hover:text-white"
                >
                  Скрыть
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
