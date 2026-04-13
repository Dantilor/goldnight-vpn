import type { DevicePlatform, VpnClient } from '../types/domain';

/** Реальные клиенты для VLESS/Xray в UI (не путать с legacy wireguard/openvpn/outline в API). */
export type VpnAppClientId = 'hiddify' | 'v2rayn' | 'streisand' | 'happ_plus';

export type VpnAppDisplayName = 'Hiddify' | 'v2rayN' | 'Streisand' | 'Happ Plus';

export const VPN_APP_LABEL: Record<VpnAppClientId, string> = {
  hiddify: 'Hiddify',
  v2rayn: 'v2rayN',
  streisand: 'Streisand',
  happ_plus: 'Happ Plus'
};

const APP_ID_TO_DISPLAY: Record<VpnAppClientId, VpnAppDisplayName> = {
  hiddify: 'Hiddify',
  v2rayn: 'v2rayN',
  streisand: 'Streisand',
  happ_plus: 'Happ Plus'
};

/** POST /me/vpn/connect-payload пока принимает только legacy enum — см. apps/api schemas. */
export function appClientToApiClient(app: VpnAppClientId): VpnClient {
  if (app === 'v2rayn') return 'wireguard';
  return 'outline';
}

export function defaultAppClientForPlatform(platform: DevicePlatform): VpnAppClientId {
  if (platform === 'windows') return 'v2rayn';
  return 'hiddify';
}

export function availableAppClientsForPlatform(platform: DevicePlatform): VpnAppClientId[] {
  switch (platform) {
    case 'ios':
      return ['hiddify', 'streisand', 'happ_plus'];
    case 'android':
      return ['hiddify'];
    case 'windows':
      return ['v2rayn', 'hiddify'];
    case 'macos':
      return ['hiddify', 'happ_plus'];
    case 'linux':
    default:
      return ['hiddify'];
  }
}

/** Recommended VPN apps per OS — single source for the VPN access instruction block. */
export type ClientAppGuide = {
  appName: VpnAppDisplayName;
  steps: string[];
};

export type PlatformClientRow = {
  id: DevicePlatform;
  osLabel: string;
  icon: string;
  clients: ClientAppGuide[];
};

export const VPN_PLATFORM_CLIENTS: PlatformClientRow[] = [
  {
    id: 'ios',
    osLabel: 'iPhone / iPad',
    icon: 'phone_iphone',
    clients: [
      {
        appName: 'Hiddify',
        steps: [
          'Установите Hiddify из App Store.',
          'Добавьте конфигурацию по ссылке или отсканируйте QR.',
          'Сохраните профиль и включите подключение.'
        ]
      },
      {
        appName: 'Streisand',
        steps: [
          'Установите Streisand из App Store.',
          'Импортируйте VLESS: вставьте ссылку из буфера или отсканируйте QR.',
          'Сохраните узел и включите VPN в приложении.'
        ]
      },
      {
        appName: 'Happ Plus',
        steps: [
          'Установите Happ Plus из App Store.',
          'Добавьте профиль по ссылке подключения или через QR.',
          'Подтвердите импорт и активируйте соединение.'
        ]
      }
    ]
  },
  {
    id: 'android',
    osLabel: 'Android',
    icon: 'android',
    clients: [
      {
        appName: 'Hiddify',
        steps: [
          'Установите Hiddify из Google Play.',
          'Импортируйте профиль по ссылке или через QR.',
          'Подтвердите и активируйте VPN.'
        ]
      }
    ]
  },
  {
    id: 'windows',
    osLabel: 'Windows',
    icon: 'laptop_windows',
    clients: [
      {
        appName: 'v2rayN',
        steps: [
          'Скачайте и установите v2rayN.',
          'Импортируйте профиль из буфера или вставьте ссылку.',
          'Запустите соединение в приложении.'
        ]
      },
      {
        appName: 'Hiddify',
        steps: [
          'Установите Hiddify для Windows.',
          'Добавьте конфигурацию по ссылке или QR.',
          'Включите подключение в интерфейсе приложения.'
        ]
      }
    ]
  },
  {
    id: 'macos',
    osLabel: 'macOS',
    icon: 'laptop_mac',
    clients: [
      {
        appName: 'Hiddify',
        steps: [
          'Установите Hiddify для macOS.',
          'Импортируйте профиль по ссылке или QR.',
          'Разрешите сеть в настройках системы при запросе.',
          'Включите VPN в приложении.'
        ]
      },
      {
        appName: 'Happ Plus',
        steps: [
          'Установите Happ Plus для macOS.',
          'Импортируйте VLESS-профиль по ссылке или QR.',
          'Разрешите VPN в системных настройках при необходимости.',
          'Запустите подключение в Happ Plus.'
        ]
      }
    ]
  },
  {
    id: 'linux',
    osLabel: 'Linux',
    icon: 'computer',
    clients: [
      {
        appName: 'Hiddify',
        steps: [
          'Установите Hiddify для вашего дистрибутива.',
          'Добавьте конфигурацию по ссылке или QR.',
          'Запустите и активируйте туннель.'
        ]
      }
    ]
  }
];

export function getVpnPlatformConfig(platform: DevicePlatform): PlatformClientRow {
  const row = VPN_PLATFORM_CLIENTS.find((p) => p.id === platform);
  return row ?? VPN_PLATFORM_CLIENTS[1]!;
}

export function clientGuideMatchesApp(guide: ClientAppGuide, app: VpnAppClientId): boolean {
  return guide.appName === APP_ID_TO_DISPLAY[app];
}
