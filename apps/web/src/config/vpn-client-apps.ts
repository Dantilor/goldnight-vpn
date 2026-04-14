import type { DevicePlatform, VpnClient } from '../types/domain';

/** Реальные клиенты для VLESS/Xray в UI (не путать с legacy wireguard/openvpn/outline в API). */
export type VpnAppClientId =
  | 'hiddify'
  | 'streisand'
  | 'shadowrocket'
  | 'stash'
  | 'v2rayng'
  | 'flclashx'
  | 'clash_meta'
  | 'happ'
  | 'vpn4tv'
  | 'koala_clash'
  | 'prizrak_box';

export type VpnAppDisplayName =
  | 'Hiddify'
  | 'Streisand'
  | 'Shadowrocket'
  | 'Stash'
  | 'v2rayNG'
  | 'FlClashX'
  | 'Clash Meta'
  | 'HApp'
  | 'vpn4tv'
  | 'Koala Clash'
  | 'Prizrak-Box';

export type AppFallbackMode = 'copy_link' | 'qr' | 'manual_steps';
export type InstructionPlatformId = DevicePlatform | 'apple_tv' | 'android_tv';

export type VpnAppDefinition = {
  id: VpnAppClientId;
  displayName: VpnAppDisplayName;
  platforms: InstructionPlatformId[];
  storeUrl: string;
  installTitle: string;
  installDescription: string;
  connectInstructions: string[];
  supportsQuickImport: boolean;
  fallbackMode: AppFallbackMode;
};

export type InstructionPlatform = {
  id: InstructionPlatformId;
  osLabel: string;
  icon: string;
};

export const VPN_APP_DEFINITIONS: Record<VpnAppClientId, VpnAppDefinition> = {
  hiddify: {
    id: 'hiddify',
    displayName: 'Hiddify',
    platforms: ['ios', 'android'],
    storeUrl: 'https://hiddify.com/download',
    installTitle: 'Установка Hiddify',
    installDescription: 'Установите официальный клиент Hiddify из магазина приложений.',
    connectInstructions: [
      'Установите приложение из магазина.',
      'Добавьте подписку по ссылке или через QR.',
      'Сохраните профиль.',
      'Включите подключение.'
    ],
    supportsQuickImport: true,
    fallbackMode: 'copy_link'
  },
  streisand: {
    id: 'streisand',
    displayName: 'Streisand',
    platforms: ['ios'],
    storeUrl: 'https://apps.apple.com/app/streisand/id6450534064',
    installTitle: 'Установка Streisand',
    installDescription: 'Установите Streisand из App Store.',
    connectInstructions: [
      'Откройте приложение Streisand.',
      'Добавьте профиль по ссылке или через QR.',
      'Сохраните импорт.',
      'Активируйте VPN.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'qr'
  },
  shadowrocket: {
    id: 'shadowrocket',
    displayName: 'Shadowrocket',
    platforms: ['ios', 'apple_tv'],
    storeUrl: 'https://apps.apple.com/app/shadowrocket/id932747118',
    installTitle: 'Установка Shadowrocket',
    installDescription: 'Установите Shadowrocket из App Store.',
    connectInstructions: [
      'Откройте Shadowrocket.',
      'Добавьте подписку по ссылке из буфера или QR.',
      'Проверьте, что профиль обновился.',
      'Включите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'copy_link'
  },
  stash: {
    id: 'stash',
    displayName: 'Stash',
    platforms: ['ios', 'apple_tv'],
    storeUrl: 'https://apps.apple.com/app/stash-rule-based-proxy/id1596063349',
    installTitle: 'Установка Stash',
    installDescription: 'Установите Stash из App Store.',
    connectInstructions: [
      'Запустите Stash.',
      'Импортируйте профиль по ссылке или QR.',
      'Сохраните конфигурацию.',
      'Включите туннель.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'manual_steps'
  },
  v2rayng: {
    id: 'v2rayng',
    displayName: 'v2rayNG',
    platforms: ['android'],
    storeUrl: 'https://github.com/2dust/v2rayNG/releases',
    installTitle: 'Установка v2rayNG',
    installDescription: 'Скачайте v2rayNG из официального репозитория.',
    connectInstructions: [
      'Установите v2rayNG.',
      'Импортируйте подписку через URL или QR.',
      'Обновите список узлов.',
      'Выберите узел и включите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'copy_link'
  },
  flclashx: {
    id: 'flclashx',
    displayName: 'FlClashX',
    platforms: ['android', 'windows', 'macos', 'linux'],
    storeUrl: 'https://github.com/chen08209/FlClash/releases',
    installTitle: 'Установка FlClashX',
    installDescription: 'Скачайте FlClashX для вашей системы.',
    connectInstructions: [
      'Установите FlClashX.',
      'Добавьте подписку по URL или QR.',
      'Обновите профиль.',
      'Включите режим Proxy/VPN.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'manual_steps'
  },
  clash_meta: {
    id: 'clash_meta',
    displayName: 'Clash Meta',
    platforms: ['android'],
    storeUrl: 'https://github.com/MetaCubeX/ClashMetaForAndroid/releases',
    installTitle: 'Установка Clash Meta',
    installDescription: 'Скачайте Clash Meta for Android из официального релиза.',
    connectInstructions: [
      'Установите Clash Meta.',
      'Добавьте подписку по URL или QR.',
      'Обновите конфигурацию.',
      'Включите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'manual_steps'
  },
  happ: {
    id: 'happ',
    displayName: 'HApp',
    platforms: ['apple_tv', 'android_tv', 'windows', 'macos'],
    storeUrl: 'https://happ.su',
    installTitle: 'Установка HApp',
    installDescription: 'Откройте официальный сайт и установите HApp для вашей платформы.',
    connectInstructions: [
      'Установите HApp.',
      'Добавьте подписку по ссылке или через QR.',
      'Сохраните профиль.',
      'Включите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'copy_link'
  },
  vpn4tv: {
    id: 'vpn4tv',
    displayName: 'vpn4tv',
    platforms: ['android_tv'],
    storeUrl: 'https://play.google.com/store/search?q=vpn4tv&c=apps',
    installTitle: 'Установка vpn4tv',
    installDescription: 'Установите vpn4tv из Google Play для Android TV.',
    connectInstructions: [
      'Установите vpn4tv на Android TV.',
      'Добавьте подписку через URL или QR.',
      'Сохраните профиль.',
      'Запустите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'manual_steps'
  },
  koala_clash: {
    id: 'koala_clash',
    displayName: 'Koala Clash',
    platforms: ['windows', 'macos', 'linux'],
    storeUrl: 'https://github.com/Koala-clash/koala/releases',
    installTitle: 'Установка Koala Clash',
    installDescription: 'Скачайте Koala Clash с официальной страницы релизов.',
    connectInstructions: [
      'Установите Koala Clash.',
      'Добавьте подписку по URL или QR.',
      'Обновите правила/узлы.',
      'Включите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'manual_steps'
  },
  prizrak_box: {
    id: 'prizrak_box',
    displayName: 'Prizrak-Box',
    platforms: ['windows', 'macos', 'linux'],
    storeUrl: 'https://github.com/PrizrakVPN/prizrak-box/releases',
    installTitle: 'Установка Prizrak-Box',
    installDescription: 'Скачайте Prizrak-Box для вашей ОС.',
    connectInstructions: [
      'Установите Prizrak-Box.',
      'Импортируйте подписку по ссылке или QR.',
      'Проверьте, что профиль активен.',
      'Включите подключение.'
    ],
    supportsQuickImport: false,
    fallbackMode: 'manual_steps'
  }
};

export const VPN_APP_LABEL: Record<VpnAppClientId, string> = Object.fromEntries(
  Object.entries(VPN_APP_DEFINITIONS).map(([key, val]) => [key, val.displayName])
) as Record<VpnAppClientId, string>;

/** POST /me/vpn/connect-payload пока принимает только legacy enum — см. apps/api schemas. */
export function appClientToApiClient(app: VpnAppClientId): VpnClient {
  if (app === 'v2rayng') return 'wireguard';
  return 'outline';
}

export function defaultAppClientForPlatform(platform: DevicePlatform): VpnAppClientId {
  if (platform === 'windows') return 'happ';
  if (platform === 'macos') return 'happ';
  if (platform === 'linux') return 'flclashx';
  if (platform === 'android') return 'hiddify';
  return 'hiddify';
}

export function availableAppClientsForPlatform(platform: DevicePlatform): VpnAppClientId[] {
  switch (platform) {
    case 'ios':
      return ['hiddify', 'streisand', 'shadowrocket', 'stash'];
    case 'android':
      return ['hiddify', 'v2rayng', 'flclashx', 'clash_meta'];
    case 'windows':
      return ['happ', 'flclashx', 'koala_clash', 'prizrak_box'];
    case 'macos':
      return ['happ', 'flclashx', 'koala_clash', 'prizrak_box'];
    case 'linux':
      return ['flclashx', 'koala_clash', 'prizrak_box'];
    default:
      return ['hiddify'];
  }
}

export const VPN_INSTRUCTION_PLATFORMS: InstructionPlatform[] = [
  { id: 'ios', osLabel: 'iOS', icon: 'phone_iphone' },
  { id: 'android', osLabel: 'Android', icon: 'android' },
  { id: 'apple_tv', osLabel: 'Apple TV', icon: 'tv' },
  { id: 'android_tv', osLabel: 'Android TV', icon: 'tv_options_edit_channels' },
  { id: 'windows', osLabel: 'Windows', icon: 'laptop_windows' },
  { id: 'macos', osLabel: 'macOS', icon: 'laptop_mac' },
  { id: 'linux', osLabel: 'Linux', icon: 'computer' }
];

export function availableInstructionAppClientsForPlatform(platform: InstructionPlatformId): VpnAppClientId[] {
  switch (platform) {
    case 'ios':
      return ['hiddify', 'streisand', 'shadowrocket', 'stash'];
    case 'android':
      return ['hiddify', 'v2rayng', 'flclashx', 'clash_meta'];
    case 'apple_tv':
      return ['happ', 'shadowrocket', 'stash'];
    case 'android_tv':
      return ['happ', 'vpn4tv'];
    case 'windows':
      return ['happ', 'flclashx', 'koala_clash', 'prizrak_box'];
    case 'macos':
      return ['happ', 'flclashx', 'koala_clash', 'prizrak_box'];
    case 'linux':
      return ['flclashx', 'koala_clash', 'prizrak_box'];
    default:
      return ['hiddify'];
  }
}
