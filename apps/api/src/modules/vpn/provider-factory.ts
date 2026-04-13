import type { ApiEnv } from '@goldnight/config';
import type { PrismaClient } from '@prisma/client';
import type { DataLayer } from '../../lib/data-layer.js';
import type { VpnProvider } from './vpn-provider.js';
import { MockVpnProvider } from './mock-vpn-provider.js';
import { ManualVpnProvider } from './manual-vpn-provider.js';
import { RealVpnProvider } from './real-vpn-provider.js';
import { XuiVpnProvider } from './xui-vpn-provider.js';
import { createXuiClientFromEnv } from './xui/xui-client.js';

export function createVpnProvider(env: ApiEnv, db: PrismaClient, dataLayer: DataLayer): VpnProvider {
  if (env.VPN_PROVIDER === 'manual') {
    return new ManualVpnProvider(db);
  }
  if (env.VPN_PROVIDER === 'xui') {
    const client = createXuiClientFromEnv({
      XUI_HOST: env.XUI_HOST!,
      XUI_BASE_PATH: env.XUI_BASE_PATH,
      XUI_USER: env.XUI_USER!,
      XUI_PASS: env.XUI_PASS!,
      XUI_INBOUND_ID: env.XUI_INBOUND_ID!,
      XUI_DOMAIN: env.XUI_DOMAIN!,
      XUI_PORT: env.XUI_PORT!,
      ...(env.XUI_CLIENT_LIMIT_IP !== undefined ? { XUI_CLIENT_LIMIT_IP: env.XUI_CLIENT_LIMIT_IP } : {}),
      ...(env.XUI_VLESS_FLOW !== undefined && env.XUI_VLESS_FLOW !== ''
        ? { XUI_VLESS_FLOW: env.XUI_VLESS_FLOW }
        : {}),
      ...(env.XUI_VLESS_EXTRA_QUERY !== undefined && env.XUI_VLESS_EXTRA_QUERY !== ''
        ? { XUI_VLESS_EXTRA_QUERY: env.XUI_VLESS_EXTRA_QUERY }
        : {})
    });
    return env.XUI_VLESS_FLOW && env.XUI_VLESS_FLOW !== ''
      ? new XuiVpnProvider(dataLayer, client, env.XUI_VLESS_FLOW)
      : new XuiVpnProvider(dataLayer, client);
  }
  if (env.VPN_PROVIDER === 'real') {
    return new RealVpnProvider();
  }
  return new MockVpnProvider();
}
