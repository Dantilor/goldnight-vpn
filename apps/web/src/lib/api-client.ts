import { env } from './env';
import { authStore } from './auth-store';
import type {
  AuthResponse,
  ConnectPayload,
  Plan,
  SubscriptionSummary,
  VpnAccess,
  VpnDevicesSummary
} from '../types/api';
import type { DevicePlatform, VpnClient } from '../types/domain';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = authStore.getToken();
  const method = (init?.method ?? 'GET').toUpperCase();
  const headers = new Headers(init?.headers);

  const usesJsonBody = method === 'POST' || method === 'PUT' || method === 'PATCH';
  const { body: initBody, ...initRest } = init ?? {};

  let bodyForFetch: BodyInit | null = null;
  if (usesJsonBody) {
    bodyForFetch =
      initBody === undefined || initBody === null || initBody === '' ? '{}' : initBody;
  } else if (initBody !== undefined && initBody !== null) {
    bodyForFetch = initBody;
  }

  if (bodyForFetch !== null && bodyForFetch !== '') {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const requestInit: RequestInit = { ...initRest, headers };
  if (bodyForFetch !== null) {
    requestInit.body = bodyForFetch;
  }

  const response = await fetch(`${env.VITE_API_BASE_URL}${path}`, requestInit);

  if (!response.ok) {
    if (response.status === 401 && path.startsWith('/me')) {
      authStore.clear();
      throw new Error(`SESSION_EXPIRED: Session is invalid or expired (${path}, 401)`);
    }
    const fallback = `Request failed (${response.status}) at ${path}`;
    let message = fallback;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ? `${body.message} (${path}, ${response.status})` : fallback;
    } catch {
      message = fallback;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  authWithTelegram(initData: string) {
    return request<AuthResponse>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData })
    });
  },
  getPlans() {
    return request<Plan[]>('/plans');
  },
  createYookassaCheckout(planId: string, receiptEmail?: string) {
    return request<{ confirmationUrl: string }>('/me/payments/yookassa/checkout', {
      method: 'POST',
      body: JSON.stringify(
        receiptEmail ? { planId, receiptEmail } : { planId }
      )
    });
  },
  patchMeEmail(email: string) {
    return request<{ email: string }>('/me/email', {
      method: 'PATCH',
      body: JSON.stringify({ email })
    });
  },
  getCurrentSubscription() {
    return request<SubscriptionSummary | null>('/me/subscription');
  },
  getVpnAccess(deviceFingerprint: string) {
    const q = new URLSearchParams({ deviceFingerprint });
    return request<VpnAccess | null>(`/me/vpn-access?${q.toString()}`);
  },
  getVpnDevices() {
    return request<VpnDevicesSummary>('/me/vpn/devices');
  },
  provisionVpn(input: { deviceFingerprint: string; platform: DevicePlatform; label?: string | null }) {
    return request<VpnAccess>('/me/vpn/provision', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },
  revokeVpn(input?: { deviceFingerprint?: string }) {
    return request<void>('/me/vpn/revoke', {
      method: 'POST',
      body: JSON.stringify(input ?? {})
    });
  },
  getConnectPayload(input: { platform: DevicePlatform; client: VpnClient; deviceFingerprint: string }) {
    return request<ConnectPayload>('/me/vpn/connect-payload', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  },
  getReferrals() {
    return request<Array<{ id: string; invitedUserId: string; rewardGranted: boolean }>>('/me/referrals');
  },
  getSupportRequests() {
    return request<Array<{ id: string; subject: string; status: string; createdAt: string }>>('/me/support');
  },
  getMe() {
    return request<{
      id: string;
      telegramUserId: string;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      referralCode: string;
    } | null>('/me');
  }
};
