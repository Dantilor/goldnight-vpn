import type { ConnectPayload, DevicePlatform, UserVpnAccess, VpnClient } from '@goldnight/types';
import type { PrismaClient } from '@prisma/client';
import type { VpnDeviceContext, VpnProvider } from './vpn-provider.js';

function makeDeepLink(template: string | null, input: { platform: DevicePlatform; client: VpnClient }) {
  if (!template) {
    return undefined;
  }
  return template.replaceAll('{platform}', input.platform).replaceAll('{client}', input.client);
}

export class ManualVpnProvider implements VpnProvider {
  constructor(private readonly db: PrismaClient) {}

  async getUserAccess(userId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess | null> {
    const row = await this.db.vpnAccess.findFirst({
      where: { userId, provider: 'manual', deviceFingerprint: ctx.deviceFingerprint },
      orderBy: { updatedAt: 'desc' }
    });
    if (!row) {
      return null;
    }
    return {
      userId: row.userId,
      provider: row.provider,
      deviceFingerprint: row.deviceFingerprint,
      accessType: row.accessType,
      ...(row.value !== null ? { value: row.value } : {}),
      ...(row.qrValue !== null ? { qrValue: row.qrValue } : {}),
      ...(row.configFileUrl !== null ? { configFileUrl: row.configFileUrl } : {}),
      ...(row.deepLinkTemplate !== null ? { deepLinkTemplate: row.deepLinkTemplate } : {}),
      ...(row.externalAccessId !== null ? { externalAccessId: row.externalAccessId } : {}),
      ...(row.planId !== null ? { planId: row.planId } : {}),
      ...(row.expiresAt ? { expiresAt: row.expiresAt.toISOString() } : {}),
      status: row.status
    };
  }

  async issueAccess(): Promise<UserVpnAccess> {
    throw new Error('Manual provider requires operator-assigned records.');
  }

  async renewAccess(): Promise<UserVpnAccess> {
    throw new Error('Manual provider renewal is managed by admin endpoints.');
  }

  async revokeAccess(): Promise<void> {
    throw new Error('Manual provider revocation is managed by admin endpoints.');
  }

  async getConnectPayload(input: {
    userId: string;
    platform: DevicePlatform;
    client: VpnClient;
    deviceFingerprint: string;
  }): Promise<ConnectPayload> {
    const access = await this.getUserAccess(input.userId, { deviceFingerprint: input.deviceFingerprint });
    if (!access) {
      throw new Error('VPN access has not been assigned yet.');
    }
    if (access.status !== 'active') {
      throw new Error(`VPN access is ${access.status}.`);
    }

    const deepLink = makeDeepLink(access.deepLinkTemplate ?? null, input);

    return {
      provider: access.provider,
      accessType: access.accessType,
      ...(access.value !== undefined ? { value: access.value } : {}),
      ...(access.qrValue !== undefined ? { qrValue: access.qrValue } : {}),
      ...(access.configFileUrl !== undefined ? { configFileUrl: access.configFileUrl } : {}),
      ...(deepLink !== undefined ? { deepLink } : {}),
      expiresAt: access.expiresAt ?? new Date().toISOString()
    };
  }
}
