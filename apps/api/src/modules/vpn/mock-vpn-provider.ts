import type { ConnectPayload, DevicePlatform, UserVpnAccess, VpnClient } from '@goldnight/types';
import type { VpnDeviceContext, VpnProvider } from './vpn-provider.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function plusDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString();
}

function storeKey(userId: string, deviceFingerprint: string) {
  return `${userId}::${deviceFingerprint}`;
}

export class MockVpnProvider implements VpnProvider {
  private readonly accessStore = new Map<string, UserVpnAccess>();

  async getUserAccess(userId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess | null> {
    return this.accessStore.get(storeKey(userId, ctx.deviceFingerprint)) ?? null;
  }

  async issueAccess(userId: string, planId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess> {
    const key = storeKey(userId, ctx.deviceFingerprint);
    const access: UserVpnAccess = {
      userId,
      provider: 'mock',
      planId,
      deviceFingerprint: ctx.deviceFingerprint,
      externalAccessId: `mock_${userId}_${ctx.deviceFingerprint}_${Date.now()}`,
      accessType: 'subscription_url',
      value: `https://mock-vpn.goldnight.local/sub/${encodeURIComponent(userId)}/${encodeURIComponent(ctx.deviceFingerprint)}`,
      qrValue: `mock://qr/${encodeURIComponent(userId)}/${encodeURIComponent(ctx.deviceFingerprint)}`,
      deepLinkTemplate: 'mock://{client}/import?platform={platform}&user=' + userId,
      configFileUrl: `https://mock-vpn.goldnight.local/config/${encodeURIComponent(userId)}.conf`,
      expiresAt: plusDays(30),
      status: 'active'
    };
    this.accessStore.set(key, access);
    return access;
  }

  async renewAccess(userId: string, planId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess> {
    const key = storeKey(userId, ctx.deviceFingerprint);
    const existing = await this.getUserAccess(userId, ctx);
    const renewed: UserVpnAccess = {
      userId,
      provider: 'mock',
      planId,
      deviceFingerprint: ctx.deviceFingerprint,
      externalAccessId: existing?.externalAccessId ?? `mock_${userId}_${ctx.deviceFingerprint}_${Date.now()}`,
      accessType: existing?.accessType ?? 'subscription_url',
      value: existing?.value ?? `https://mock-vpn.goldnight.local/sub/${userId}`,
      qrValue: existing?.qrValue ?? `mock://qr/${userId}`,
      deepLinkTemplate:
        existing?.deepLinkTemplate ?? 'mock://{client}/import?platform={platform}&user=' + userId,
      configFileUrl: existing?.configFileUrl ?? `https://mock-vpn.goldnight.local/config/${userId}.conf`,
      expiresAt: plusDays(30),
      status: 'active'
    };
    this.accessStore.set(key, renewed);
    return renewed;
  }

  async revokeAccess(userId: string, ctx?: { deviceFingerprint: string }): Promise<void> {
    if (ctx?.deviceFingerprint) {
      this.accessStore.delete(storeKey(userId, ctx.deviceFingerprint));
      return;
    }
    for (const key of [...this.accessStore.keys()]) {
      if (key.startsWith(`${userId}::`)) {
        this.accessStore.delete(key);
      }
    }
  }

  async getConnectPayload(input: {
    platform: DevicePlatform;
    client: VpnClient;
    userId: string;
    deviceFingerprint: string;
  }): Promise<ConnectPayload> {
    const access = await this.getUserAccess(input.userId, { deviceFingerprint: input.deviceFingerprint });
    return {
      provider: 'mock',
      accessType: access?.accessType ?? 'subscription_url',
      value: access?.value ?? `https://mock-vpn.goldnight.local/sub/${input.userId}`,
      qrValue: access?.qrValue ?? `mock://qr/${input.userId}`,
      configFileUrl: access?.configFileUrl ?? `https://mock-vpn.goldnight.local/config/${input.userId}.conf`,
      deepLink:
        access?.deepLinkTemplate
          ?.replaceAll('{platform}', input.platform)
          .replaceAll('{client}', input.client) ??
        `mock://${input.client}/import?platform=${input.platform}&user=${input.userId}`,
      expiresAt: access?.expiresAt ?? plusDays(1)
    };
  }
}
