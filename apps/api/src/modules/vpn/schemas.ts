import { z } from 'zod';

export const deviceFingerprintSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/, 'deviceFingerprint must be alphanumeric with _ or -');

export const vpnAccessQuerySchema = z.object({
  deviceFingerprint: deviceFingerprintSchema
});

export const connectPayloadBodySchema = z.object({
  platform: z.enum(['ios', 'android', 'macos', 'windows', 'linux']),
  client: z.enum(['wireguard', 'openvpn', 'outline']),
  deviceFingerprint: deviceFingerprintSchema
});

export const provisionVpnBodySchema = z.object({
  deviceFingerprint: deviceFingerprintSchema,
  platform: z.enum(['ios', 'android', 'macos', 'windows', 'linux']),
  label: z.string().max(120).optional().nullable()
});

export const revokeVpnBodySchema = z.object({
  deviceFingerprint: deviceFingerprintSchema.optional()
});
