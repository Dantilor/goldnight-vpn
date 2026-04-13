import type { ApiEnv } from '@goldnight/config';
import type { ConnectPayload, DevicePlatform, UserVpnAccess, VpnClient } from '@goldnight/types';
import type { VpnProvider } from './vpn-provider.js';
import type { DataLayer, VpnDeviceSlotRow } from '../../lib/data-layer.js';
import { vpnProviderIdFromEnv } from './provider-id.js';

function accessToMetadata(
  access: UserVpnAccess,
  ctx: { deviceFingerprint: string; platform?: string; label?: string | null }
): unknown {
  const base = JSON.parse(JSON.stringify(access)) as Record<string, unknown>;
  if (ctx.platform) base.devicePlatform = ctx.platform;
  if (ctx.label !== undefined && ctx.label !== null && ctx.label !== '') {
    base.deviceLabel = ctx.label;
  }
  return base;
}

/** Thrown when provisioning VPN without an active subscription (HTTP 403). */
export class SubscriptionRequiredError extends Error {
  readonly statusCode = 403 as const;
  constructor() {
    super('ACTIVE_SUBSCRIPTION_REQUIRED');
    this.name = 'SubscriptionRequiredError';
  }
}

/** Thrown when the plan's active device slots are full (HTTP 409). */
export class DeviceLimitReachedError extends Error {
  readonly statusCode = 409 as const;
  constructor() {
    super('DEVICE_LIMIT_REACHED');
    this.name = 'DeviceLimitReachedError';
  }
}

export class VpnService {
  constructor(
    private readonly env: ApiEnv,
    private readonly provider: VpnProvider,
    private readonly dataLayer: DataLayer
  ) {}

  private providerId(): string {
    return vpnProviderIdFromEnv(this.env);
  }

  async issueAccess(
    userId: string,
    planId: string,
    ctx: { deviceFingerprint: string; platform?: string; label?: string | null }
  ) {
    const access = await this.provider.issueAccess(userId, planId, { deviceFingerprint: ctx.deviceFingerprint });
    await this.dataLayer.upsertVpnAccessRecord({
      userId,
      planId: access.planId ?? planId,
      provider: access.provider,
      deviceFingerprint: ctx.deviceFingerprint,
      accessType: access.accessType,
      status: access.status,
      externalAccessId: access.externalAccessId ?? null,
      value: access.value ?? null,
      qrValue: access.qrValue ?? null,
      configFileUrl: access.configFileUrl ?? null,
      deepLinkTemplate: access.deepLinkTemplate ?? null,
      expiresAt: access.expiresAt ? new Date(access.expiresAt) : null,
      metadata: accessToMetadata(access, ctx)
    });
    return access;
  }

  async renewAccess(
    userId: string,
    planId: string,
    ctx: { deviceFingerprint: string; platform?: string; label?: string | null }
  ) {
    const access = await this.provider.renewAccess(userId, planId, { deviceFingerprint: ctx.deviceFingerprint });
    await this.dataLayer.upsertVpnAccessRecord({
      userId,
      planId: access.planId ?? planId,
      provider: access.provider,
      deviceFingerprint: ctx.deviceFingerprint,
      accessType: access.accessType,
      status: access.status,
      externalAccessId: access.externalAccessId ?? null,
      value: access.value ?? null,
      qrValue: access.qrValue ?? null,
      configFileUrl: access.configFileUrl ?? null,
      deepLinkTemplate: access.deepLinkTemplate ?? null,
      expiresAt: access.expiresAt ? new Date(access.expiresAt) : null,
      metadata: accessToMetadata(access, ctx)
    });
    return access;
  }

  async revokeAccess(userId: string, target?: { deviceFingerprint?: string }) {
    const pid = this.providerId();
    if (target?.deviceFingerprint) {
      await this.provider.revokeAccess(userId, { deviceFingerprint: target.deviceFingerprint });
      await this.dataLayer.revokeVpnAccessByUserProviderDevice(userId, pid, target.deviceFingerprint);
      return;
    }
    await this.provider.revokeAccess(userId);
    await this.dataLayer.revokeAllVpnAccessForUser(userId);
  }

  async getConnectPayload(input: {
    userId: string;
    platform: DevicePlatform;
    client: VpnClient;
    deviceFingerprint: string;
  }): Promise<ConnectPayload> {
    if (this.env.DATA_LAYER === 'supabase') {
      const pid = this.providerId();
      const access = await this.dataLayer.getVpnAccessByUserProviderDevice(
        input.userId,
        pid,
        input.deviceFingerprint
      );
      if (!access) {
        throw new Error('VPN access has not been assigned yet.');
      }
      if (access.status !== 'active') {
        throw new Error(`VPN access is ${access.status}.`);
      }
      const deepLink =
        access.deepLinkTemplate?.replaceAll('{platform}', input.platform).replaceAll('{client}', input.client);
      return {
        provider: access.provider,
        accessType: access.accessType as UserVpnAccess['accessType'],
        ...(access.value ? { value: access.value } : {}),
        ...(access.qrValue ? { qrValue: access.qrValue } : {}),
        ...(access.configFileUrl ? { configFileUrl: access.configFileUrl } : {}),
        ...(deepLink ? { deepLink } : {}),
        expiresAt: access.expiresAt ? access.expiresAt.toISOString() : new Date().toISOString()
      };
    }
    return this.provider.getConnectPayload(input);
  }

  async getUserAccess(userId: string, deviceFingerprint: string): Promise<UserVpnAccess | null> {
    if (this.env.DATA_LAYER === 'supabase') {
      const pid = this.providerId();
      const access = await this.dataLayer.getVpnAccessByUserProviderDevice(userId, pid, deviceFingerprint);
      if (!access) return null;
      return {
        userId,
        provider: access.provider,
        deviceFingerprint: access.deviceFingerprint,
        accessType: access.accessType as UserVpnAccess['accessType'],
        ...(access.value ? { value: access.value } : {}),
        ...(access.qrValue ? { qrValue: access.qrValue } : {}),
        ...(access.configFileUrl ? { configFileUrl: access.configFileUrl } : {}),
        ...(access.deepLinkTemplate ? { deepLinkTemplate: access.deepLinkTemplate } : {}),
        ...(access.externalAccessId ? { externalAccessId: access.externalAccessId } : {}),
        ...(access.planId ? { planId: access.planId } : {}),
        ...(access.expiresAt ? { expiresAt: access.expiresAt.toISOString() } : {}),
        status: access.status as UserVpnAccess['status']
      };
    }
    return this.provider.getUserAccess(userId, { deviceFingerprint });
  }

  async listDeviceSlots(userId: string) {
    const sub = await this.dataLayer.getActiveSubscriptionByUserId(userId);
    if (!sub) {
      return { deviceLimit: 0, activeCount: 0, devices: [] as VpnDeviceSlotRow[] };
    }
    const pid = this.providerId();
    const [devices, activeCount] = await Promise.all([
      this.dataLayer.listVpnDeviceSlots(userId, pid),
      this.dataLayer.countActiveVpnAccessByUserAndProvider(userId, pid)
    ]);
    return {
      deviceLimit: sub.plan.deviceLimit,
      activeCount,
      devices
    };
  }

  /**
   * Create or refresh VPN access for the current device.
   * Requires an active subscription and a free slot unless this device already has active access.
   *
   * Slot counting uses one active DB row per `(user, provider, deviceFingerprint)` — each provision
   * for xui gets a unique VLESS UUID. Manual reuse of one link on multiple devices is constrained
   * at the panel via `limitIp` on new clients (`XUI_CLIENT_LIMIT_IP`, default 1); see API README.
   */
  async provisionMyVpn(
    userId: string,
    ctx: { deviceFingerprint: string; platform: string; label?: string | null }
  ): Promise<UserVpnAccess> {
    const sub = await this.dataLayer.getActiveSubscriptionByUserId(userId);
    if (!sub) {
      throw new SubscriptionRequiredError();
    }
    const pid = this.providerId();
    const existing = await this.dataLayer.getVpnAccessByUserProviderDevice(userId, pid, ctx.deviceFingerprint);

    await this.dataLayer.upsertUserVpnDevice({
      userId,
      deviceFingerprint: ctx.deviceFingerprint,
      platform: ctx.platform,
      label: ctx.label ?? null
    });

    if (existing?.status === 'active') {
      return this.renewAccess(userId, sub.plan.id, ctx);
    }

    const activeCount = await this.dataLayer.countActiveVpnAccessByUserAndProvider(userId, pid);
    if (activeCount >= sub.plan.deviceLimit) {
      throw new DeviceLimitReachedError();
    }

    return this.issueAccess(userId, sub.plan.id, ctx);
  }

  async revokeMyVpn(userId: string, target?: { deviceFingerprint?: string }): Promise<void> {
    await this.revokeAccess(userId, target);
  }
}
