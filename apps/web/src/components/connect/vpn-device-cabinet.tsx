import type { ConnectPayload, VpnAccess } from '../../types/api';
import type { DevicePlatform } from '../../types/domain';
import { VPN_APP_LABEL, VPN_PLATFORM_CLIENTS, type VpnAppClientId } from '../../config/vpn-client-apps';
import type { DerivedVpnAccessFields } from './vpn-access-derive';

function platformLabel(id: DevicePlatform): string {
  return VPN_PLATFORM_CLIENTS.find((r) => r.id === id)?.osLabel ?? id;
}

function accessMetaLine(payload: ConnectPayload | null, access: VpnAccess | null): string {
  const exp = payload?.expiresAt ?? access?.expiresAt;
  if (!exp) return 'Выдано недавно';
  const d = new Date(exp);
  if (Number.isNaN(d.getTime())) return 'Выдано недавно';
  return `Параметры действительны до ${d.toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}`;
}

export type VpnDeviceCabinetProps = {
  platform: DevicePlatform;
  appClient: VpnAppClientId;
  access: VpnAccess | null;
  payload: ConnectPayload | null;
  fields: DerivedVpnAccessFields;
  payloadPending: boolean;
  provisionPending: boolean;
  onCopyLink: () => void;
  onShowQr: () => void;
  onReissue: () => void;
  onRevoke: () => void;
  onScrollInstructions: () => void;
};

export function VpnDeviceCabinet({
  platform,
  appClient,
  access,
  payload,
  fields,
  payloadPending,
  provisionPending,
  onCopyLink,
  onShowQr,
  onReissue,
  onRevoke,
  onScrollInstructions
}: VpnDeviceCabinetProps) {
  const meta = accessMetaLine(payload, access);
  const active = access?.status === 'active';

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-primary/18 bg-gradient-to-br from-[#1c1b18] via-[#141312] to-[#0e0e0d] p-[1px] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
      <div
        className="pointer-events-none absolute -right-10 top-0 h-44 w-44 rounded-full bg-primary/[0.09] blur-3xl"
        aria-hidden
      />
      <div className="relative rounded-[1.2rem] bg-[#121110]/95 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/[0.1] shadow-[0_0_28px_rgba(242,202,80,0.1)]">
              <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                devices
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-headline text-base font-bold tracking-tight text-white">Текущее подключение</p>
                <span className="rounded-full border border-primary/25 bg-primary/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  Это устройство
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-on-surface-variant">{meta}</p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              active
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                : 'border-outline-variant/30 bg-black/30 text-on-surface-variant'
            }`}
          >
            {active ? 'Активно' : access?.status === 'expired' ? 'Истекло' : 'Отозвано'}
          </span>
        </div>

        <div className="mt-4 grid gap-2.5 rounded-xl border border-outline-variant/12 bg-black/22 p-3.5">
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-on-surface-variant">Платформа</span>
            <span className="truncate font-semibold text-white">{platformLabel(platform)}</span>
          </div>
          <div className="h-px bg-outline-variant/10" />
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="text-on-surface-variant">Приложение</span>
            <span className="truncate font-semibold text-white">{VPN_APP_LABEL[appClient]}</span>
          </div>
          {payloadPending ? (
            <>
              <div className="h-px bg-outline-variant/10" />
              <p className="text-center text-[12px] text-primary/90">Обновляем параметры подключения…</p>
            </>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!fields.hasCopyLink || payloadPending}
            onClick={onCopyLink}
            className="flex min-h-[76px] flex-col items-start justify-center gap-1 rounded-xl border border-primary/28 bg-gradient-to-b from-primary/[0.14] to-transparent px-3.5 py-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.28)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              content_copy
            </span>
            <span className="font-headline text-[13px] font-bold text-white">Скопировать ссылку</span>
          </button>
          <button
            type="button"
            disabled={!fields.hasQr || payloadPending}
            onClick={onShowQr}
            className="flex min-h-[76px] flex-col items-start justify-center gap-1 rounded-xl border border-outline-variant/22 bg-surface-container-highest/40 px-3.5 py-3 text-left transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-xl text-primary/90" style={{ fontVariationSettings: "'FILL' 1" }}>
              qr_code_2
            </span>
            <span className="font-headline text-[13px] font-bold text-white">Показать QR</span>
          </button>
        </div>

        <div className="mt-2.5 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={provisionPending || payloadPending}
            onClick={onReissue}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-outline-variant/22 bg-black/25 py-3.5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-45"
          >
            <span className="material-symbols-outlined text-xl text-primary/85">autorenew</span>
            {provisionPending ? 'Переиздаём…' : 'Переиздать доступ'}
          </button>
          <button
            type="button"
            onClick={onRevoke}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-error/30 bg-error-container/[0.12] py-3.5 text-sm font-bold text-error transition active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-xl">phonelink_erase</span>
            Отключить / отозвать доступ
          </button>
        </div>

        <button
          type="button"
          onClick={onScrollInstructions}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/15 py-3 text-[12px] font-semibold text-on-surface-variant transition hover:border-primary/25 hover:text-white"
        >
          <span className="material-symbols-outlined text-lg text-primary/80">menu_book</span>
          Инструкция по клиенту
        </button>
      </div>
    </div>
  );
}
