export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled';

export interface AuthUser {
  id: string;
  telegramUserId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  referralCode: string;
}

export interface SubscriptionSummary {
  id: string;
  status: SubscriptionStatus;
  endsAt: string;
  plan: {
    id: string;
    name: string;
    durationDays: number;
    deviceLimit: number;
  };
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  subscription: SubscriptionSummary | null;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  /** Legacy field; catalog is priced in RUB. */
  priceUsd: number;
  priceRub: number;
  deviceLimit: number;
  subtitle: string | null;
  durationDays: number;
  active: boolean;
  sortOrder: number;
}

export type VpnAccessType =
  | 'subscription_url'
  | 'plain_text_key'
  | 'config_download'
  | 'deep_link'
  | 'qr_only';

export interface VpnAccess {
  userId: string;
  provider: string;
  accessType: VpnAccessType;
  value?: string;
  qrValue?: string;
  configFileUrl?: string;
  deepLinkTemplate?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  deviceFingerprint?: string;
}

export interface VpnDeviceSlot {
  deviceFingerprint: string;
  platform: string | null;
  label: string | null;
  accessStatus: string;
  expiresAt: string | null;
}

export interface VpnDevicesSummary {
  deviceLimit: number;
  activeCount: number;
  devices: VpnDeviceSlot[];
}

export interface ConnectPayload {
  provider: string;
  accessType: VpnAccessType;
  value?: string;
  qrValue?: string;
  configFileUrl?: string;
  deepLink?: string;
  expiresAt: string;
}
