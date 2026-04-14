import type { ConnectPayload, VpnAccess } from '../../types/api';
import type { DevicePlatform, VpnClient } from '../../types/domain';

/**
 * One canonical raw string for copy / QR / "full connection" (must match admin panel share link).
 *
 * Previously:
 * - `copyLinkText` was empty for `deep_link` even when `value` held the working vless/sub URL.
 * - `qrData` preferred `qrValue` over `value`, so QR could encode a different string than the admin "link".
 */
export function derivePrimaryAccessRaw(payload: ConnectPayload | null, access: VpnAccess | null): string {
  const accessType = payload?.accessType ?? access?.accessType;
  const rawValue = (payload?.value ?? access?.value ?? '').trim();
  const rawQr = (payload?.qrValue ?? access?.qrValue ?? '').trim();

  if (accessType === 'qr_only') {
    return rawQr || rawValue;
  }
  // subscription_url, plain_text_key, deep_link, config_download: panel/DB "value" is the usual share URI/key.
  return rawValue || rawQr;
}

export function deriveAccessFields(
  payload: ConnectPayload | null,
  access: VpnAccess | null,
  selected: { platform: DevicePlatform; client: VpnClient }
) {
  const accessType = payload?.accessType ?? access?.accessType;
  const value = payload?.value ?? access?.value;
  const qrValue = payload?.qrValue ?? access?.qrValue;
  const configFileUrl = payload?.configFileUrl ?? access?.configFileUrl;
  const deepLink =
    payload?.deepLink ??
    access?.deepLinkTemplate
      ?.replaceAll('{platform}', selected.platform)
      .replaceAll('{client}', selected.client);

  const primaryRaw = derivePrimaryAccessRaw(payload, access);
  const copyLinkText = primaryRaw;
  const qrData = primaryRaw;

  return {
    accessType,
    value: value?.trim() ?? '',
    primaryRaw,
    qrData,
    configFileUrl,
    deepLink,
    copyLinkText,
    hasCopyLink: copyLinkText.length > 0,
    hasQr: qrData.length > 0,
    hasConfig: Boolean(configFileUrl),
    hasDeepLink: Boolean(deepLink)
  };
}

export type DerivedVpnAccessFields = ReturnType<typeof deriveAccessFields>;

/** Full connection material for advanced users (vless://, keys, subscription URL, etc.). */
export function deriveFullConnectionRaw(
  payload: ConnectPayload | null,
  access: VpnAccess | null,
  fields: ReturnType<typeof deriveAccessFields>
): string {
  if (fields.primaryRaw.length > 0) return fields.primaryRaw;
  return derivePrimaryAccessRaw(payload, access);
}
