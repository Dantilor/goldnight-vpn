import { useMemo, useState } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ConnectPayload, VpnAccess, VpnDevicesSummary } from '../../types/api';
import type { DevicePlatform } from '../../types/domain';
import {
  VPN_PLATFORM_CLIENTS,
  VPN_APP_LABEL,
  appClientToApiClient,
  availableAppClientsForPlatform,
  clientGuideMatchesApp,
  getVpnPlatformConfig,
  type VpnAppClientId
} from '../../config/vpn-client-apps';
import { useVpnProvisionMutation, useVpnRevokeMutation } from '../../lib/query-hooks';
import { copyTextToClipboard } from '../../lib/copy-to-clipboard';
import { ErrorBlock, LoadingBlock } from '../ui/feedback';
import { deriveAccessFields, deriveFullConnectionRaw } from './vpn-access-derive';
import { VpnDeviceCabinet } from './vpn-device-cabinet';
import { VpnQrFlowSheet } from './vpn-qr-flow-sheet';
import { VpnCopyToast } from './vpn-copy-toast';

export type VpnActiveAccessSectionProps = {
  payload: ConnectPayload | null;
  access: VpnAccess | null;
  deviceFingerprint: string;
  vpnDevices: UseQueryResult<VpnDevicesSummary, Error>;
  /** Лимит из активной подписки (приоритет над снимком /me/vpn/devices при рассинхроне после оплаты). */
  deviceLimitFromSubscription?: number;
  platform: DevicePlatform;
  onPlatformChange: (p: DevicePlatform) => void;
  appClient: VpnAppClientId;
  onAppClientChange: (c: VpnAppClientId) => void;
  payloadPending: boolean;
  payloadError: Error | null;
  onRefreshPayload: () => void;
  onRevokeSuccess: () => void;
};

export function VpnActiveAccessSection({
  payload,
  access,
  deviceFingerprint,
  vpnDevices,
  deviceLimitFromSubscription,
  platform,
  onPlatformChange,
  appClient,
  onAppClientChange,
  payloadPending,
  payloadError,
  onRefreshPayload,
  onRevokeSuccess
}: VpnActiveAccessSectionProps) {
  const [rawOpen, setRawOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  const revokeMutation = useVpnRevokeMutation();
  const provisionMutation = useVpnProvisionMutation();

  const apiClient = useMemo(() => appClientToApiClient(appClient), [appClient]);

  const fields = useMemo(
    () => deriveAccessFields(payload, access, { platform, client: apiClient }),
    [payload, access, platform, apiClient]
  );

  const fullRaw = useMemo(() => deriveFullConnectionRaw(payload, access, fields), [payload, access, fields]);

  const platformConfig = useMemo(() => getVpnPlatformConfig(platform), [platform]);

  const appChoices = useMemo(() => availableAppClientsForPlatform(platform), [platform]);

  const filteredGuides = useMemo(
    () => platformConfig.clients.filter((g) => clientGuideMatchesApp(g, appClient)),
    [platformConfig.clients, appClient]
  );

  const displayDeviceLimit =
    deviceLimitFromSubscription !== undefined
      ? deviceLimitFromSubscription
      : (vpnDevices.data?.deviceLimit ?? 0);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ message, variant });
  };

  const copyLink = async () => {
    if (!fields.hasCopyLink) {
      showToast('Нечего копировать', 'error');
      return;
    }
    const ok = await copyTextToClipboard(fields.copyLinkText);
    showToast(ok ? 'Ссылка скопирована' : 'Не удалось скопировать', ok ? 'success' : 'error');
  };

  const copyFullRaw = async () => {
    const text = fullRaw.trim();
    if (!text) {
      showToast('Строка недоступна', 'error');
      return;
    }
    const ok = await copyTextToClipboard(text);
    showToast(ok ? 'Скопировано полностью' : 'Не удалось скопировать', ok ? 'success' : 'error');
  };

  const scrollToInstructions = () => {
    document.getElementById('vpn-client-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleRevoke = () => {
    revokeMutation.mutate(
      { deviceFingerprint },
      {
        onSuccess: () => {
          setRevokeOpen(false);
          onRevokeSuccess();
        }
      }
    );
  };

  const handleReissue = () => {
    provisionMutation.mutate(
      { deviceFingerprint, platform, label: null },
      {
        onSuccess: () => {
          setReissueOpen(false);
          onRefreshPayload();
        }
      }
    );
  };

  const handleRevokeOther = (fp: string) => {
    revokeMutation.mutate(
      { deviceFingerprint: fp },
      {
        onSuccess: () => {
          onRevokeSuccess();
        }
      }
    );
  };

  return (
    <>
      <section className="mb-8" aria-labelledby="vpn-devices-heading">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Устройства</p>
          <h2 id="vpn-devices-heading" className="mt-1 font-headline text-lg font-bold text-white">
            Управляйте активными подключениями и настройкой доступа.
          </h2>
        </div>

        {vpnDevices.data && displayDeviceLimit > 0 ? (
          <div className="mb-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/80 p-4 text-sm text-on-surface-variant">
            <p>
              <span className="font-semibold text-white">Лимит устройств:</span> {displayDeviceLimit}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-white">Подключено:</span> {vpnDevices.data.activeCount} из{' '}
              {displayDeviceLimit}
            </p>
            {vpnDevices.data.activeCount >= displayDeviceLimit && access?.status !== 'active' ? (
              <p className="mt-2 text-xs text-error">Лимит устройств достигнут. Освободите слот на другом устройстве.</p>
            ) : null}
            {vpnDevices.data.devices.filter((d) => d.accessStatus === 'active' && d.deviceFingerprint !== deviceFingerprint)
              .length > 0 ? (
              <div className="mt-3 space-y-2 border-t border-outline-variant/10 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">Другие активные</p>
                {vpnDevices.data.devices
                  .filter((d) => d.accessStatus === 'active' && d.deviceFingerprint !== deviceFingerprint)
                  .map((d) => (
                    <div
                      key={d.deviceFingerprint}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/10 bg-black/20 px-3 py-2"
                    >
                      <div className="min-w-0 text-xs">
                        <p className="truncate font-medium text-white">{d.platform ?? 'Устройство'}</p>
                        <p className="truncate font-mono text-[10px] text-on-surface-variant/80">
                          {d.deviceFingerprint.slice(0, 10)}…{d.deviceFingerprint.slice(-6)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={revokeMutation.isPending}
                        onClick={() => handleRevokeOther(d.deviceFingerprint)}
                        className="shrink-0 rounded-lg border border-error/35 bg-error-container/15 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-error transition active:scale-[0.98] disabled:opacity-50"
                      >
                        Отключить
                      </button>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {payloadPending ? (
          <div className="mb-4 rounded-2xl border border-outline-variant/15 bg-surface-container-low/80 p-4">
            <LoadingBlock text="Готовим способы подключения..." />
          </div>
        ) : null}

        {payloadError ? (
          <div className="mb-4 rounded-2xl border border-error/25 bg-error-container/10 p-4">
            <ErrorBlock text={payloadError.message} />
            <button
              type="button"
              onClick={onRefreshPayload}
              className="mt-3 w-full rounded-xl border border-primary/30 bg-primary/10 py-3 text-sm font-semibold text-primary transition active:scale-[0.99]"
            >
              Повторить
            </button>
          </div>
        ) : null}

        {!payloadError ? (
          <VpnDeviceCabinet
            platform={platform}
            appClient={appClient}
            access={access}
            payload={payload}
            fields={fields}
            payloadPending={payloadPending}
            provisionPending={provisionMutation.isPending}
            onCopyLink={() => void copyLink()}
            onShowQr={() => fields.hasQr && setQrOpen(true)}
            onReissue={() => setReissueOpen(true)}
            onRevoke={() => setRevokeOpen(true)}
            onScrollInstructions={scrollToInstructions}
          />
        ) : null}
      </section>

      {!payloadPending && !payloadError && fields.hasConfig && fields.configFileUrl ? (
        <a
          href={fields.configFileUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-4 flex min-h-[72px] items-center gap-3 rounded-2xl border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm font-semibold text-white transition hover:bg-surface-bright"
        >
          <span className="material-symbols-outlined text-2xl text-primary">download</span>
          <span>Скачать конфигурацию</span>
        </a>
      ) : null}

      {!payloadPending && !payloadError && fields.hasDeepLink && fields.deepLink ? (
        <a
          href={fields.deepLink}
          target="_blank"
          rel="noreferrer"
          className="mb-6 flex min-h-[72px] items-center gap-3 rounded-2xl border border-primary/25 bg-primary/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/[0.12]"
        >
          <span className="material-symbols-outlined text-2xl text-primary">open_in_new</span>
          <span>Открыть в приложении</span>
        </a>
      ) : null}

      {fullRaw.trim().length > 0 ? (
        <section className="mb-8 rounded-2xl border border-outline-variant/15 bg-[#121212]/90 overflow-hidden">
          <button
            type="button"
            onClick={() => setRawOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/[0.03]"
            aria-expanded={rawOpen}
          >
            <div>
              <p className="font-headline text-sm font-bold text-white">Полная строка подключения</p>
              <p className="mt-0.5 text-[11px] text-on-surface-variant">
                {rawOpen ? 'Для опытных пользователей' : 'Нажмите, чтобы показать строку'}
              </p>
            </div>
            <span className={`material-symbols-outlined text-on-surface-variant transition ${rawOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
          {rawOpen ? (
            <div className="space-y-3 border-t border-outline-variant/10 px-4 py-4">
              <p className="max-h-28 overflow-y-auto break-all rounded-xl bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-on-surface-variant">
                {fullRaw}
              </p>
              <button
                type="button"
                onClick={() => void copyFullRaw()}
                className="w-full rounded-xl border border-outline-variant/25 bg-surface-container-highest py-3.5 text-sm font-semibold text-white transition active:scale-[0.99]"
              >
                Скопировать полностью
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section id="vpn-client-guide" className="mb-10 scroll-mt-6">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/80">Устройство</p>
          <h3 className="mt-1 font-headline text-lg font-bold text-white">Платформа и приложение</h3>
          <p className="mt-1 text-xs text-on-surface-variant">
            Доступ по VLESS — выберите ОС и совместимое приложение из списка ниже.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2.5">
          {VPN_PLATFORM_CLIENTS.map(({ id, osLabel, icon }) => {
            const selected = platform === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onPlatformChange(id)}
                className={`flex min-h-[76px] flex-col items-start justify-center gap-1 rounded-xl border px-3 py-3 text-left transition active:scale-[0.98] ${
                  selected
                    ? 'border-primary/40 bg-primary/[0.1] shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
                    : 'border-outline-variant/15 bg-surface-container-low hover:border-primary/25'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-xl ${selected ? 'text-primary' : 'text-on-surface-variant'}`}
                >
                  {icon}
                </span>
                <span className="text-sm font-bold leading-tight text-white">{osLabel}</span>
              </button>
            );
          })}
        </div>

        {appChoices.length > 1 ? (
          <div className="mb-5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/75">
              Рекомендуемые приложения
            </p>
            <p className="mb-2.5 text-[11px] leading-snug text-on-surface-variant">
              Поддерживаемые клиенты для выбранной системы — тот же список, что и в инструкции ниже.
            </p>
            <div
              className={`grid gap-2.5 ${appChoices.length >= 3 ? 'grid-cols-1' : 'grid-cols-2'}`}
              role="list"
            >
              {appChoices.map((id) => {
                const selected = appClient === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="listitem"
                    onClick={() => onAppClientChange(id)}
                    className={`min-h-[48px] rounded-xl border px-3.5 py-3 text-left text-sm font-bold transition active:scale-[0.98] ${
                      selected
                        ? 'border-primary/40 bg-primary/[0.1] text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]'
                        : 'border-outline-variant/15 bg-surface-container-low text-on-surface-variant hover:border-primary/25'
                    }`}
                  >
                    {VPN_APP_LABEL[id]}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="mb-5 rounded-xl border border-outline-variant/10 bg-black/20 px-3 py-2.5 text-[12px] text-on-surface-variant">
            Рекомендуемое приложение: <span className="font-semibold text-white">{VPN_APP_LABEL[appChoices[0]!]}</span>
          </p>
        )}

        <div className="rounded-2xl border border-outline-variant/12 bg-surface-container-low/90 p-4">
          {filteredGuides.map((clientGuide, blockIdx) => (
            <div
              key={`${clientGuide.appName}-${blockIdx}`}
              className={blockIdx > 0 ? 'mt-6 border-t border-outline-variant/10 pt-6' : ''}
            >
              <p className="text-xs font-semibold text-primary/90">{clientGuide.appName}</p>
              <ol className="mt-3 space-y-2.5">
                {clientGuide.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-[13px] leading-snug text-on-surface-variant">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <VpnQrFlowSheet
        open={qrOpen && fields.hasQr}
        onClose={() => setQrOpen(false)}
        qrData={fields.qrData}
        hasCopyLink={fields.hasCopyLink}
        copyLinkText={fields.copyLinkText}
        fullRaw={fullRaw}
        onCopyResult={(ok, kind) => {
          if (kind === 'link') {
            showToast(ok ? 'Ссылка скопирована' : 'Не удалось скопировать', ok ? 'success' : 'error');
          } else {
            showToast(ok ? 'Скопировано полностью' : 'Не удалось скопировать', ok ? 'success' : 'error');
          }
        }}
      />

      {reissueOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom,12px))] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reissue-title"
          onClick={() => !provisionMutation.isPending && setReissueOpen(false)}
        >
          <div
            className="gn-animate-sheet w-full max-w-sm rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="reissue-title" className="font-headline text-lg font-bold text-white">
              Переиздать доступ?
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Мы запросим новый профиль у сервера. Текущая строка подключения перестанет действовать после выдачи новой.
            </p>
            {provisionMutation.isError ? (
              <p className="mt-2 text-xs text-error">{(provisionMutation.error as Error).message}</p>
            ) : null}
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={provisionMutation.isPending}
                onClick={handleReissue}
                className="w-full rounded-xl bg-primary/90 py-3.5 text-sm font-bold text-[#1a1508] transition active:scale-[0.99] disabled:opacity-60"
              >
                {provisionMutation.isPending ? 'Переиздаём…' : 'Переиздать доступ'}
              </button>
              <button
                type="button"
                disabled={provisionMutation.isPending}
                onClick={() => setReissueOpen(false)}
                className="w-full rounded-xl border border-outline-variant/25 py-3.5 text-sm font-semibold text-white"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {revokeOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/65 p-4 pb-[max(1rem,env(safe-area-inset-bottom,12px))] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-title"
          onClick={() => !revokeMutation.isPending && setRevokeOpen(false)}
        >
          <div
            className="gn-animate-sheet w-full max-w-sm rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 id="revoke-title" className="font-headline text-lg font-bold text-white">
              Отключить доступ?
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              VPN-профиль на этом устройстве будет деактивирован. Другие устройства не затронуты.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                disabled={revokeMutation.isPending}
                onClick={handleRevoke}
                className="w-full rounded-xl bg-error/90 py-3.5 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
              >
                {revokeMutation.isPending ? 'Отзываем…' : 'Отозвать доступ'}
              </button>
              <button
                type="button"
                disabled={revokeMutation.isPending}
                onClick={() => setRevokeOpen(false)}
                className="w-full rounded-xl border border-outline-variant/25 py-3.5 text-sm font-semibold text-white"
              >
                Отмена
              </button>
            </div>
            {revokeMutation.isError ? (
              <p className="mt-3 text-center text-xs text-error">{(revokeMutation.error as Error).message}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {toast ? (
        <VpnCopyToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </>
  );
}
