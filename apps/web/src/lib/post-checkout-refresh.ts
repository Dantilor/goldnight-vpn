import { useEffect, useRef } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { authStore } from './auth-store';
import { apiClient } from './api-client';

const STORAGE_KEY = 'gn_pending_checkout_refresh';

/** Срок жизни маркера оплаты (мс): webhook может задержаться. */
const PENDING_MAX_MS = 180_000;

/** Интервал опроса, пока маркер активен (мс). */
const POLL_INTERVAL_MS = 3_500;

export type PendingCheckoutPayload = {
  at: number;
  planId: string;
};

export function markPendingCheckoutRefresh(planId: string): void {
  try {
    const payload: PendingCheckoutPayload = { at: Date.now(), planId };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage может быть недоступен
  }
}

function readPending(): PendingCheckoutPayload | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<PendingCheckoutPayload>;
    if (typeof o.at !== 'number' || typeof o.planId !== 'string') return null;
    return { at: o.at, planId: o.planId };
  } catch {
    return null;
  }
}

function removePending(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function invalidatePostPaymentQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
  void queryClient.invalidateQueries({ queryKey: ['vpn', 'devices'] });
  void queryClient.invalidateQueries({
    predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'vpn-access'
  });
  void queryClient.invalidateQueries({ queryKey: ['plans'] });
  void queryClient.invalidateQueries({ queryKey: ['me'] });
}

async function refreshAndMaybeClear(queryClient: QueryClient, pending: PendingCheckoutPayload): Promise<void> {
  if (Date.now() - pending.at > PENDING_MAX_MS) {
    removePending();
    return;
  }
  if (!authStore.getToken()) {
    return;
  }

  invalidatePostPaymentQueries(queryClient);

  try {
    const sub = await queryClient.fetchQuery({
      queryKey: ['subscription', 'current'],
      queryFn: () => apiClient.getCurrentSubscription()
    });
    if (sub?.status === 'active' && sub.plan.id === pending.planId) {
      removePending();
      invalidatePostPaymentQueries(queryClient);
    }
  } catch {
    /* сеть / 401 — следующий poll или visibility */
  }
}

/**
 * После возврата из YooKassa (внешняя вкладка / браузер): обновляет подписку, VPN-слоты и доступ.
 * Ранний выход: активная подписка с тем же planId, что и при открытии оплаты.
 */
export function usePostCheckoutQueryRefresh(enabled: boolean, queryClient: QueryClient): void {
  const clientRef = useRef(queryClient);
  clientRef.current = queryClient;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const pending = readPending();
      if (!pending) return;
      void refreshAndMaybeClear(clientRef.current, pending);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    tick();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', tick);
    window.addEventListener('pageshow', tick);

    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', tick);
      window.removeEventListener('pageshow', tick);
      window.clearInterval(intervalId);
    };
  }, [enabled]);
}
