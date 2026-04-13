import { randomBytes, randomUUID } from 'node:crypto';
import type { ConnectPayload, DevicePlatform, UserVpnAccess, VpnClient } from '@goldnight/types';
import type { DataLayer, VpnAccessPersistentRow } from '../../lib/data-layer.js';
import type { VpnDeviceContext, VpnProvider } from './vpn-provider.js';
import type { ThreeXUiClient } from './xui/xui-client.js';

function makeDeepLink(template: string | null, input: { platform: DevicePlatform; client: VpnClient }) {
  if (!template) {
    return undefined;
  }
  return template.replaceAll('{platform}', input.platform).replaceAll('{client}', input.client);
}

function stableClientEmail(userId: string, deviceFingerprint: string): string {
  const s1 = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const s2 = deviceFingerprint.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
  return `goldnight_${s1}_${s2}`.slice(0, 128);
}

function randomSubId(): string {
  return randomBytes(8).toString('hex');
}

function mapRow(row: VpnAccessPersistentRow): UserVpnAccess {
  return {
    userId: row.userId,
    provider: row.provider,
    deviceFingerprint: row.deviceFingerprint,
    accessType: row.accessType as UserVpnAccess['accessType'],
    ...(row.value !== null ? { value: row.value } : {}),
    ...(row.qrValue !== null ? { qrValue: row.qrValue } : {}),
    ...(row.configFileUrl !== null ? { configFileUrl: row.configFileUrl } : {}),
    ...(row.deepLinkTemplate !== null ? { deepLinkTemplate: row.deepLinkTemplate } : {}),
    ...(row.externalAccessId !== null ? { externalAccessId: row.externalAccessId } : {}),
    ...(row.planId !== null ? { planId: row.planId } : {}),
    ...(row.expiresAt ? { expiresAt: row.expiresAt.toISOString() } : {}),
    status: row.status as UserVpnAccess['status']
  };
}

/**
 * 3x-ui / Xray VLESS via panel API. Persistence is handled by VpnService + DataLayer.
 */
export class XuiVpnProvider implements VpnProvider {
  constructor(
    private readonly dataLayer: DataLayer,
    private readonly xui: ThreeXUiClient,
    private readonly vlessFlow?: string
  ) {}

  async getUserAccess(userId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess | null> {
    const row = await this.dataLayer.getVpnAccessByUserProviderDevice(userId, 'xui', ctx.deviceFingerprint);
    if (!row) {
      return null;
    }
    return mapRow(row);
  }

  async issueAccess(userId: string, planId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess> {
    const existing = await this.dataLayer.getVpnAccessByUserProviderDevice(userId, 'xui', ctx.deviceFingerprint);
    if (existing?.status === 'active' && existing.externalAccessId && existing.value) {
      const inPanel = await this.xui.clientExistsInInbound(existing.externalAccessId);
      if (inPanel) {
        return mapRow(existing);
      }
      // DB says active but panel has no such client — re-provision so external_access_id matches panel.
    }

    if (existing?.externalAccessId) {
      try {
        await this.xui.deleteClient(existing.externalAccessId);
      } catch (err) {
        const stillThere = await this.xui.clientExistsInInbound(existing.externalAccessId);
        if (stillThere) {
          throw err;
        }
        // Already removed in panel; safe to add a new client without duplicating UUIDs.
      }
    }

    const sub = await this.dataLayer.getActiveSubscriptionByUserId(userId);
    const endsAtIso = sub?.endsAt.toISOString() ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const uuid = randomUUID();
    const email = stableClientEmail(userId, ctx.deviceFingerprint);
    const subId = randomSubId();

    await this.xui.addClient({
      uuid,
      email,
      subId,
      ...(this.vlessFlow !== undefined && this.vlessFlow !== '' ? { flow: this.vlessFlow } : {})
    });

    const vless = this.xui.buildVlessLink(uuid);

    return {
      userId,
      provider: 'xui',
      planId,
      deviceFingerprint: ctx.deviceFingerprint,
      externalAccessId: uuid,
      accessType: 'plain_text_key',
      value: vless,
      qrValue: vless,
      expiresAt: endsAtIso,
      status: 'active'
    };
  }

  async renewAccess(userId: string, planId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess> {
    const existing = await this.getUserAccess(userId, ctx);
    const sub = await this.dataLayer.getActiveSubscriptionByUserId(userId);
    const endsAtIso = sub?.endsAt.toISOString() ?? existing?.expiresAt ?? new Date().toISOString();
    if (!existing) {
      return this.issueAccess(userId, planId, ctx);
    }
    if (existing.externalAccessId) {
      const inPanel = await this.xui.clientExistsInInbound(existing.externalAccessId);
      if (!inPanel) {
        return this.issueAccess(userId, planId, ctx);
      }
    }
    return {
      ...existing,
      planId,
      expiresAt: endsAtIso,
      status: 'active'
    };
  }

  async revokeAccess(userId: string, ctx?: { deviceFingerprint: string }): Promise<void> {
    if (ctx?.deviceFingerprint) {
      const row = await this.dataLayer.getVpnAccessByUserProviderDevice(userId, 'xui', ctx.deviceFingerprint);
      if (!row?.externalAccessId) {
        return;
      }
      try {
        await this.xui.deleteClient(row.externalAccessId);
      } catch {
        // ignore
      }
      return;
    }
    const rows = await this.dataLayer.listVpnAccessPersistentByUserAndProvider(userId, 'xui');
    for (const r of rows) {
      if (!r.externalAccessId) continue;
      try {
        await this.xui.deleteClient(r.externalAccessId);
      } catch {
        // ignore
      }
    }
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
