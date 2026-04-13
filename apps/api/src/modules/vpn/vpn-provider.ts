import type { ConnectPayload, DevicePlatform, UserVpnAccess, VpnClient } from '@goldnight/types';

export type VpnDeviceContext = {
  deviceFingerprint: string;
};

export interface VpnProvider {
  getUserAccess(userId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess | null>;
  issueAccess(userId: string, planId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess>;
  renewAccess(userId: string, planId: string, ctx: VpnDeviceContext): Promise<UserVpnAccess>;
  revokeAccess(userId: string, ctx?: { deviceFingerprint: string }): Promise<void>;
  getConnectPayload(input: {
    userId: string;
    platform: DevicePlatform;
    client: VpnClient;
    deviceFingerprint: string;
  }): Promise<ConnectPayload>;
}
