import type { ConnectPayload, VpnAccess } from '../../types/api';
import type { DevicePlatform, VpnClient } from '../../types/domain';

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

  const copyLinkText =
    accessType === 'subscription_url' || accessType === 'plain_text_key'
      ? (value ?? '').trim()
      : accessType === 'qr_only'
        ? (qrValue ?? '').trim()
        : '';

  /** Prefer dedicated QR payload; otherwise encode the same string many clients accept (e.g. vless://…). */
  const qrData = (qrValue ?? value ?? '').trim();

  return {
    accessType,
    value: value?.trim() ?? '',
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
  const v = fields.value.length > 0 ? fields.value : fields.copyLinkText;
  return v.trim();
}
