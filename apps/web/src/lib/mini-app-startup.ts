import type { QueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';
import { authStore } from './auth-store';
import { env } from './env';
import { getTelegramInitData, hasTelegramWebAppInitData } from './telegram';
import { getOrCreateDeviceFingerprint } from './device-fingerprint';

let telegramStartupPromise: Promise<void> | null = null;

/**
 * Один проход авторизации + prefetch критичных запросов для Telegram Mini App.
 * Успешный результат кэшируется; при ошибке следующий вызов запускает новую попытку.
 */
export function runTelegramMiniAppStartup(queryClient: QueryClient): Promise<void> {
  if (telegramStartupPromise) return telegramStartupPromise;

  const run = async () => {
    try {
      if (!hasTelegramWebAppInitData()) {
        throw new Error('TELEGRAM_CONTEXT_REQUIRED: Telegram WebApp initData is unavailable');
      }
      const initData = getTelegramInitData();
      const payload = await apiClient.authWithTelegram(initData);
      authStore.setToken(payload.token);
      authStore.setUser(payload.user);

      queryClient.setQueryData(['subscription', 'current'], payload.subscription);

      const deviceFp = getOrCreateDeviceFingerprint();
      await Promise.allSettled([
        queryClient.prefetchQuery({
          queryKey: ['vpn-access', deviceFp],
          queryFn: () => apiClient.getVpnAccess(deviceFp),
          staleTime: 60_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['vpn', 'devices'],
          queryFn: () => apiClient.getVpnDevices(),
          staleTime: 30_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['me'],
          queryFn: () => apiClient.getMe(),
          staleTime: 60_000
        }),
        queryClient.prefetchQuery({
          queryKey: ['plans'],
          queryFn: () => apiClient.getPlans(),
          staleTime: 120_000
        })
      ]);
    } catch (error) {
      const isOutsideTelegram =
        error instanceof Error && error.message.includes('TELEGRAM_CONTEXT_REQUIRED');
      if (!isOutsideTelegram) {
        authStore.clear();
        console.error('Mini App auth bootstrap failed', {
          apiBaseUrl: env.VITE_API_BASE_URL,
          hasTelegramWebApp: Boolean(window.Telegram?.WebApp),
          error
        });
      }
      telegramStartupPromise = null;
      throw error;
    }
  };

  telegramStartupPromise = run();
  return telegramStartupPromise;
}
