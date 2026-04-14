import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useConnectPayloadMutation,
  useCurrentSubscriptionQuery,
  useVpnAccessQuery,
  useVpnDevicesQuery,
  useVpnProvisionMutation,
  useVpnRevokeMutation
} from '../lib/query-hooks';
import { getOrCreateDeviceFingerprint } from '../lib/device-fingerprint';
import type { DevicePlatform, VpnClient } from '../types/domain';
import type { ConnectPayload, VpnAccess } from '../types/api';
import { ErrorBlock, LoadingBlock } from '../components/ui/feedback';
import { useMiniAppContext } from '../lib/mini-app-context';
import { useAuthToken } from '../lib/use-auth-token';
import { VpnActiveAccessSection } from '../components/connect/vpn-active-access-section';

import {
  appClientToApiClient,
  defaultAppClientForPlatform,
  availableAppClientsForPlatform,
  VPN_PLATFORM_CLIENTS,
  VPN_APP_LABEL,
  type VpnAppClientId
} from '../config/vpn-client-apps';

const platforms: DevicePlatform[] = ['ios', 'android', 'macos', 'windows', 'linux'];
const SUPPORT_TELEGRAM = 'https://t.me/GameNightHelp';

function platformDisplayName(item: DevicePlatform): string {
  return VPN_PLATFORM_CLIENTS.find((p) => p.id === item)?.osLabel ?? item;
}

function renderAccessContent(
  payload: ConnectPayload | null,
  access: VpnAccess | null,
  selected: { platform: DevicePlatform; apiClient: VpnClient }
) {
  const accessType = payload?.accessType ?? access?.accessType;
  const value = payload?.value ?? access?.value;
  const qrValue = payload?.qrValue ?? access?.qrValue;
  const configFileUrl = payload?.configFileUrl ?? access?.configFileUrl;
  const deepLink =
    payload?.deepLink ??
    access?.deepLinkTemplate
      ?.replaceAll('{platform}', selected.platform)
      .replaceAll('{client}', selected.apiClient);

  return (
    <div className="space-y-2">
      {(accessType === 'subscription_url' || accessType === 'plain_text_key') && value ? (
        <button
          type="button"
          className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-surface-bright"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          {accessType === 'subscription_url' ? 'Скопировать URL подписки' : 'Скопировать ключ доступа'}
        </button>
      ) : null}

      {(accessType === 'qr_only' || qrValue) && qrValue ? (
        <div className="rounded-xl border border-outline-variant/25 bg-surface-container-highest/30 p-3">
          <p className="text-xs text-on-surface-variant">Значение QR</p>
          <p className="mt-1 break-all text-xs text-slate-200">{qrValue}</p>
        </div>
      ) : null}

      {(accessType === 'config_download' || configFileUrl) && configFileUrl ? (
        <a
          className="block w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm font-semibold text-white transition hover:bg-surface-bright"
          href={configFileUrl}
          target="_blank"
          rel="noreferrer"
        >
          Скачать конфиг
        </a>
      ) : null}

      {(accessType === 'deep_link' || deepLink) && deepLink ? (
        <a
          className="block w-full rounded-lg border border-outline-variant/20 bg-surface-container-highest px-4 py-3 text-sm font-semibold text-white transition hover:bg-surface-bright"
          href={deepLink}
          target="_blank"
          rel="noreferrer"
        >
          Открыть клиент
        </a>
      ) : null}
    </div>
  );
}

export function ConnectScreen() {
  const navigate = useNavigate();
  const { isTelegramMiniApp } = useMiniAppContext();
  const token = useAuthToken();
  const awaitingTelegramSession = isTelegramMiniApp && !token;
  const [platform, setPlatform] = useState<DevicePlatform>('ios');
  const [appClient, setAppClient] = useState<VpnAppClientId>(() => defaultAppClientForPlatform('ios'));
  const deviceFingerprint = useMemo(() => getOrCreateDeviceFingerprint(), []);
  const subscription = useCurrentSubscriptionQuery();
  const access = useVpnAccessQuery(deviceFingerprint);
  const vpnDevices = useVpnDevicesQuery();
  const payloadMutation = useConnectPayloadMutation();
  const provisionMutation = useVpnProvisionMutation();
  const revokeSlotMutation = useVpnRevokeMutation();

  const payload = payloadMutation.data ?? null;

  const hasActiveSubscription = subscription.data?.status === 'active';
  const hasActiveVpnAccess = access.data?.status === 'active';

  const subscriptionDeviceLimit =
    subscription.data?.status === 'active' ? subscription.data.plan.deviceLimit : undefined;

  const effectiveDeviceLimit = useMemo(() => {
    if (subscription.data?.status === 'active') {
      return subscription.data.plan.deviceLimit;
    }
    return vpnDevices.data?.deviceLimit ?? 0;
  }, [subscription.data, vpnDevices.data?.deviceLimit]);

  const activeDevicesCount = vpnDevices.data?.activeCount ?? 0;

  const atLimitNoAccess =
    hasActiveSubscription &&
    Boolean(vpnDevices.data) &&
    effectiveDeviceLimit > 0 &&
    activeDevicesCount >= effectiveDeviceLimit &&
    access.data?.status !== 'active';

  const handlePlatformChange = (p: DevicePlatform) => {
    setPlatform(p);
    setAppClient(defaultAppClientForPlatform(p));
  };

  useEffect(() => {
    if (!hasActiveVpnAccess) return;
    payloadMutation.mutate({
      platform,
      client: appClientToApiClient(appClient),
      deviceFingerprint
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch payload when access/platform/app change
  }, [hasActiveVpnAccess, platform, appClient, deviceFingerprint]);
  const heroLoading =
    awaitingTelegramSession ||
    subscription.isPending ||
    (hasActiveSubscription && (access.isPending || vpnDevices.isPending));
  const vpnAccessLoadError =
    !awaitingTelegramSession && access.isError && hasActiveSubscription && !access.isPending;

  const onboardingSteps = [
    {
      n: '01',
      title: 'Клиент',
      text: 'Установите VPN-приложение под вашу систему — ниже выберите платформу.'
    },
    {
      n: '02',
      title: 'Данные',
      text: 'После выдачи доступа скопируйте ссылку или отсканируйте QR в выбранном приложении — блок появится ниже.'
    },
    {
      n: '03',
      title: 'Импорт',
      text: 'Откройте клиент и добавьте профиль: по URL, из файла или вставкой ключа.'
    },
    {
      n: '04',
      title: 'Подключение',
      text: 'Сохраните профиль и включите VPN. При сбое проверьте сеть и перезапустите клиент.'
    }
  ] as const;

  return (
    <div className="gn-page-stack mx-auto max-w-md px-1 sm:px-0">
      <section className="text-left">
        {subscription.isError ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
            <ErrorBlock text={(subscription.error as Error).message} />
          </div>
        ) : vpnAccessLoadError ? (
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-5">
            <ErrorBlock text={(access.error as Error).message} />
          </div>
        ) : heroLoading ? (
          <div className="rounded-2xl border border-outline-variant/15 bg-surface-container-low p-5">
            <LoadingBlock text="Загрузка статуса..." />
          </div>
        ) : hasActiveVpnAccess ? (
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-surface-container-low to-[#141414] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-primary/[0.08] blur-2xl" />
            <div className="relative flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/85">Статус</p>
                <h2 className="mt-1 font-headline text-xl font-bold tracking-tight text-white">Доступ активен</h2>
                <p className="mt-2 text-sm leading-snug text-on-surface-variant">
                  VPN-профиль готов. Выберите удобный способ подключения.
                </p>
              </div>
            </div>
          </div>
        ) : hasActiveSubscription && atLimitNoAccess ? (
          <div className="relative overflow-hidden rounded-2xl border border-error/30 bg-gradient-to-br from-[#1a1414] via-surface-container-low to-[#101010] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="relative flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-error/35 bg-error-container/15">
                <span className="material-symbols-outlined text-2xl text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                  devices
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-error/90">Лимит устройств</p>
                <h2 className="mt-1 font-headline text-xl font-bold tracking-tight text-white">Слоты заняты</h2>
                <p className="mt-2 text-sm leading-snug text-on-surface-variant">
                  Подключено {activeDevicesCount} из {effectiveDeviceLimit}. Отключите другое устройство, чтобы выдать
                  доступ на этом.
                </p>
                <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                  {(vpnDevices.data?.devices ?? [])
                    .filter((d) => d.accessStatus === 'active')
                    .map((d) => (
                      <div
                        key={d.deviceFingerprint}
                        className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/15 bg-black/25 px-3 py-2"
                      >
                        <div className="min-w-0 text-xs">
                          <p className="font-medium text-white">{d.platform ?? 'Устройство'}</p>
                          <p className="truncate font-mono text-[10px] text-on-surface-variant">
                            {d.deviceFingerprint.slice(0, 8)}…{d.deviceFingerprint.slice(-4)}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={revokeSlotMutation.isPending}
                          onClick={() =>
                            revokeSlotMutation.mutate(
                              { deviceFingerprint: d.deviceFingerprint },
                              { onSuccess: () => void vpnDevices.refetch() }
                            )
                          }
                          className="shrink-0 rounded-lg border border-error/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-error"
                        >
                          Отключить
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        ) : hasActiveSubscription ? (
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1a1814] via-surface-container-low to-[#101010] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(242,202,80,0.09),transparent_55%)]" />
            <div className="relative flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/35 bg-primary/[0.12] shadow-[0_0_24px_rgba(242,202,80,0.12)]">
                <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  vpn_key
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/90">Подписка активна</p>
                <h2 className="mt-1 font-headline text-xl font-bold tracking-tight text-white">Доступ готов к активации</h2>
                <p className="mt-2 text-sm leading-snug text-on-surface-variant">
                  Нажмите кнопку ниже — мы выдадим ключи и узлы для вашего аккаунта.
                </p>
                <button
                  type="button"
                  className="gn-gold-gradient mt-4 w-full rounded-xl px-5 py-3.5 font-headline text-sm font-bold text-[#3c2f00] shadow-[0_12px_28px_rgba(242,202,80,0.18)] transition-transform active:scale-[0.98] disabled:opacity-60"
                  disabled={provisionMutation.isPending}
                  onClick={() =>
                    provisionMutation.mutate(
                      { deviceFingerprint, platform, label: null },
                      {
                        onSuccess: () => {
                          payloadMutation.reset();
                          void vpnDevices.refetch();
                        }
                      }
                    )
                  }
                >
                  {provisionMutation.isPending ? 'Выдаём доступ...' : 'Получить доступ'}
                </button>
                {provisionMutation.isError ? (
                  <p className="mt-2 text-xs text-error">{(provisionMutation.error as Error).message}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-[#1a1814] via-surface-container-low to-[#101010] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(242,202,80,0.09),transparent_55%)]" />
            <div className="relative flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/35 bg-primary/[0.12] shadow-[0_0_24px_rgba(242,202,80,0.12)]">
                <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lock_person
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/90">Закрытый доступ</p>
                <h2 className="mt-1 font-headline text-xl font-bold tracking-tight text-white">Оформите подписку</h2>
                <p className="mt-2 text-sm leading-snug text-on-surface-variant">
                  Ключи и узлы выдаются после активации тарифа — одним шагом ниже.
                </p>
                <button
                  type="button"
                  className="gn-gold-gradient mt-4 w-full rounded-xl px-5 py-3.5 font-headline text-sm font-bold text-[#3c2f00] shadow-[0_12px_28px_rgba(242,202,80,0.18)] transition-transform active:scale-[0.98]"
                  onClick={() => navigate('/plans')}
                >
                  Выбрать тариф
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {hasActiveVpnAccess ? (
        <VpnActiveAccessSection
          payload={payload}
          access={access.data ?? null}
          deviceFingerprint={deviceFingerprint}
          vpnDevices={vpnDevices}
          {...(subscriptionDeviceLimit !== undefined
            ? { deviceLimitFromSubscription: subscriptionDeviceLimit }
            : {})}
          platform={platform}
          onPlatformChange={handlePlatformChange}
          appClient={appClient}
          onAppClientChange={setAppClient}
          payloadPending={payloadMutation.isPending}
          payloadError={payloadMutation.isError ? (payloadMutation.error as Error) : null}
          onRefreshPayload={() =>
            payloadMutation.mutate({
              platform,
              client: appClientToApiClient(appClient),
              deviceFingerprint
            })
          }
          onRevokeSuccess={() => {
            payloadMutation.reset();
            void vpnDevices.refetch();
          }}
        />
      ) : (
        <>
          <section className="rounded-2xl border border-outline-variant/10 bg-surface-container-low/90 p-4 shadow-inner">
            <div className="mb-4 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/75">Инструкция</p>
              <h3 className="mt-1 font-headline text-xl font-bold text-white">Как подключить VPN</h3>
              <p className="mt-2 text-xs text-on-surface-variant">
                Выберите устройство и выполните несколько простых шагов.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {onboardingSteps.map((step) => (
                <div
                  key={step.n}
                  className="rounded-xl border border-outline-variant/10 bg-[#161616]/90 px-4 py-3.5"
                >
                  <span className="font-mono text-[11px] font-bold text-primary">{step.n}</span>
                  <p className="mt-2 font-headline text-sm font-bold text-white">{step.title}</p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-on-surface-variant">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary/15 bg-primary/[0.06] px-4 py-3 text-center">
              <span className="material-symbols-outlined text-lg text-primary/90">support_agent</span>
              <p className="text-xs leading-snug text-on-surface-variant">
                Вопросы по шагам —{' '}
                <a
                  href={SUPPORT_TELEGRAM}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-primary underline decoration-primary/40 underline-offset-2"
                >
                  @GameNightHelp
                </a>
              </p>
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-end justify-between">
              <h3 className="font-headline text-lg font-bold tracking-tight text-white">Выбор платформы</h3>
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline-variant">VLESS</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {platforms.map((item) => {
                const icon =
                  item === 'ios'
                    ? 'phone_iphone'
                    : item === 'android'
                      ? 'android'
                      : item === 'windows'
                        ? 'laptop_windows'
                        : item === 'macos'
                          ? 'laptop_mac'
                          : 'computer';
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handlePlatformChange(item)}
                    className={`group rounded-xl border p-5 text-left transition-all duration-300 ${
                      platform === item
                        ? 'border-primary/35 bg-surface-container-high shadow-[0_20px_40px_rgba(0,0,0,0.3)]'
                        : 'border-outline-variant/5 bg-surface-container-low hover:border-primary/20'
                    }`}
                  >
                    <span className="material-symbols-outlined mb-3 block text-2xl text-on-surface-variant group-hover:text-primary">
                      {icon}
                    </span>
                    <p className="text-sm font-semibold text-white">{platformDisplayName(item)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low/50 px-4 py-4">
            <h3 className="font-headline text-sm font-bold tracking-tight text-white">Дальше по экрану</h3>
            <p className="mt-2 text-[12px] leading-relaxed text-on-surface-variant">
              Выберите ОС и приложение из поддерживаемого списка, затем нажмите «Загрузить действия».
            </p>
          </section>

          <div className="mt-4 rounded-xl border border-outline-variant/5 bg-[#0e0e0e] p-4">
            {access.isPending && !heroLoading ? <LoadingBlock text="Загрузка VPN-доступа..." /> : null}
            {access.isError && !vpnAccessLoadError ? <ErrorBlock text={(access.error as Error).message} /> : null}
            {!access.isPending && !access.isError && !heroLoading ? (
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
                  <span className="material-symbols-outlined text-lg text-outline-variant">info</span>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-on-surface-variant">Статус сети</p>
                  <p className="text-sm font-bold text-white">
                    {hasActiveSubscription ? 'Доступ готов к активации' : 'Ожидает активации'}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Приложение</p>
            <div className="space-y-2">
              {availableAppClientsForPlatform(platform).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAppClient(id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-bold transition ${
                    appClient === id
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-outline-variant/20 bg-surface-container-highest text-white hover:bg-surface-bright'
                  }`}
                >
                  {VPN_APP_LABEL[id]}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="gn-gold-gradient w-full rounded-lg px-4 py-3 text-sm font-bold text-[#3c2f00] transition-transform active:scale-95"
              onClick={() =>
                payloadMutation.mutate({
                  platform,
                  client: appClientToApiClient(appClient),
                  deviceFingerprint
                })
              }
              disabled={payloadMutation.isPending}
            >
              {payloadMutation.isPending ? 'Загрузка настроек...' : 'Загрузить действия для настройки'}
            </button>
          </div>

          {payloadMutation.isError ? (
            <div className="mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-highest/30 p-3">
              <ErrorBlock text={(payloadMutation.error as Error).message} />
            </div>
          ) : null}

          <div className="mt-3">
            {renderAccessContent(payload, access.data ?? null, {
              platform,
              apiClient: appClientToApiClient(appClient)
            })}
          </div>
        </>
      )}
    </div>
  );
}
