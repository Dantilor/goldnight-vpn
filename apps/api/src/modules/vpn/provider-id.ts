import type { ApiEnv } from '@goldnight/config';

/** Provider string stored in `vpn_access` / `app_vpn_access_records`. */
export function vpnProviderIdFromEnv(env: ApiEnv): string {
  switch (env.VPN_PROVIDER) {
    case 'manual':
      return 'manual';
    case 'xui':
      return 'xui';
    case 'real':
      return 'real';
    default:
      return 'mock';
  }
}
