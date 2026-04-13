export type DevicePlatform = 'ios' | 'android' | 'macos' | 'windows' | 'linux';

/** Значение поля `client` в POST /me/vpn/connect-payload (legacy enum на API). В UI используйте VpnAppClientId из `config/vpn-client-apps`. */
export type VpnClient = 'wireguard' | 'openvpn' | 'outline';
