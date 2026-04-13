export type DevicePlatform = 'ios' | 'android' | 'macos' | 'windows' | 'linux';

export type VpnClient = 'wireguard' | 'openvpn' | 'outline';

export type VpnAccessType =
  | 'subscription_url'
  | 'plain_text_key'
  | 'config_download'
  | 'deep_link'
  | 'qr_only';

export interface ConnectPayload {
  provider: string;
  accessType: VpnAccessType;
  value?: string;
  qrValue?: string;
  configFileUrl?: string;
  deepLink?: string;
  expiresAt: string;
}

export interface UserVpnAccess {
  userId: string;
  provider: string;
  accessType: VpnAccessType;
  value?: string;
  qrValue?: string;
  configFileUrl?: string;
  deepLinkTemplate?: string;
  externalAccessId?: string;
  planId?: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
  deviceFingerprint?: string;
}

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  priceUsd: number;
  priceRub: number;
  deviceLimit: number;
  subtitle: string | null;
  durationDays: number;
  active: boolean;
  sortOrder: number;
}

export interface SubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  startedAt: string;
  endsAt: string;
}
