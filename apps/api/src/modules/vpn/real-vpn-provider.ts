import type { ConnectPayload, DevicePlatform, UserVpnAccess, VpnClient } from '@goldnight/types';
import type { VpnDeviceContext, VpnProvider } from './vpn-provider.js';

export class RealVpnProvider implements VpnProvider {
  async getUserAccess(_userId: string, _ctx: VpnDeviceContext): Promise<UserVpnAccess | null> {
    throw new Error('RealVpnProvider.getUserAccess is not implemented yet.');
  }

  async issueAccess(_userId: string, _planId: string, _ctx: VpnDeviceContext): Promise<UserVpnAccess> {
    throw new Error('RealVpnProvider.issueAccess is not implemented yet.');
  }

  async renewAccess(_userId: string, _planId: string, _ctx: VpnDeviceContext): Promise<UserVpnAccess> {
    throw new Error('RealVpnProvider.renewAccess is not implemented yet.');
  }

  async revokeAccess(_userId: string, _ctx?: { deviceFingerprint: string }): Promise<void> {
    throw new Error('RealVpnProvider.revokeAccess is not implemented yet.');
  }

  async getConnectPayload(_input: {
    userId: string;
    platform: DevicePlatform;
    client: VpnClient;
    deviceFingerprint: string;
  }): Promise<ConnectPayload> {
    throw new Error('RealVpnProvider.getConnectPayload is not implemented yet.');
  }
}
