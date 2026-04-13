import { z } from 'zod';

const accessTypeSchema = z.enum([
  'subscription_url',
  'plain_text_key',
  'config_download',
  'deep_link',
  'qr_only'
]);

export const createManualAccessSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1).optional(),
  provider: z.literal('manual').default('manual'),
  accessType: accessTypeSchema,
  value: z.string().optional(),
  qrValue: z.string().optional(),
  configFileUrl: z.string().url().optional(),
  deepLinkTemplate: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const updateManualAccessSchema = z.object({
  planId: z.string().min(1).optional(),
  accessType: accessTypeSchema.optional(),
  value: z.string().nullable().optional(),
  qrValue: z.string().nullable().optional(),
  configFileUrl: z.string().url().nullable().optional(),
  deepLinkTemplate: z.string().nullable().optional(),
  status: z.enum(['active', 'expired', 'revoked']).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const renewAccessSchema = z.object({
  expiresAt: z.string().datetime()
});

export const accessIdParamsSchema = z.object({
  accessId: z.string().min(1)
});

export const userIdParamsSchema = z.object({
  userId: z.string().min(1)
});
