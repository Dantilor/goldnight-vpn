import { z } from 'zod';

const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

const apiEnvSchema = baseEnvSchema.extend({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  DATA_LAYER: z.enum(['prisma', 'supabase']).default('prisma'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  VPN_PROVIDER: z.enum(['mock', 'manual', 'real', 'xui']).default('manual'),
  /** 3x-ui panel origin, e.g. https://vpn.example.com (no trailing slash) */
  XUI_HOST: z.string().url().optional(),
  /** Panel base path, e.g. /pw123 or empty if panel is at host root */
  XUI_BASE_PATH: z.string().default(''),
  XUI_USER: z.string().min(1).optional(),
  XUI_PASS: z.string().min(1).optional(),
  XUI_INBOUND_ID: z.coerce.number().int().positive().optional(),
  /** Public hostname clients use in vless:// (SNI / connect host) */
  XUI_DOMAIN: z.string().min(1).optional(),
  /** Public port in vless:// (often 443) */
  XUI_PORT: z.coerce.number().int().positive().optional(),
  /** Optional VLESS flow, e.g. xtls-rprx-vision for REALITY */
  XUI_VLESS_FLOW: z.string().optional(),
  /**
   * Extra URI query for vless:// (without leading ?), e.g. type=tcp&security=reality&sni=...&pbk=...&fp=chrome&sid=...
   */
  XUI_VLESS_EXTRA_QUERY: z.string().optional(),
  /**
   * 3x-ui / Xray client `limitIp`: max distinct source IPs allowed per VLESS client UUID.
   * Code defaults to 0 (unlimited). Set 1+ to cap concurrent source IPs per link.
   */
  XUI_CLIENT_LIMIT_IP: z.coerce.number().int().min(0).max(64).optional(),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_WEBAPP_URL: z.string().url(),
  AUTH_JWT_SECRET: z.string().min(32),
  AUTH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
  TELEGRAM_INITDATA_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  ADMIN_API_KEY: z.string().min(16),
  BOT_API_KEY: z.string().min(16),
  /** YooKassa REST (optional until payments are configured) */
  YOOKASSA_SHOP_ID: z.string().min(1).optional(),
  YOOKASSA_SECRET_KEY: z.string().min(1).optional(),
  /** Where user returns after paying (Mini App URL is a good default). */
  YOOKASSA_RETURN_URL: z.string().url().optional(),
  /** If set, webhook must send header `x-yookassa-webhook-secret` with this value. */
  YOOKASSA_WEBHOOK_SECRET: z.string().min(8).optional(),
  /** Код НДС для позиций чека YooKassa (1–6). Если не задан — используется значение по умолчанию в API. */
  YOOKASSA_RECEIPT_VAT_CODE: z.coerce.number().int().min(1).max(6).optional(),
  /** How often the API runs subscription expiry reminder scan (ms). Default 6 hours. */
  SUBSCRIPTION_REMINDER_INTERVAL_MS: z.coerce.number().int().positive().optional()
});

const botEnvSchema = baseEnvSchema.extend({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  API_BASE_URL: z.string().url(),
  MINI_APP_URL: z.string().url(),
  BOT_API_KEY: z.string().min(16)
});

const webEnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_TELEGRAM_BOT_USERNAME: z.string().min(1)
});

const apiEnvSchemaRefined = apiEnvSchema.superRefine((data, ctx) => {
  const hasYkShop = Boolean(data.YOOKASSA_SHOP_ID);
  const hasYkSecret = Boolean(data.YOOKASSA_SECRET_KEY);
  if (hasYkShop !== hasYkSecret) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['YOOKASSA_SHOP_ID'],
      message: 'YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY must both be set or both omitted'
    });
  }
  if (data.VPN_PROVIDER !== 'xui') {
    return;
  }
  const need = (ok: boolean, path: (string | number)[], message: string) => {
    if (!ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    }
  };
  need(!!data.XUI_HOST, ['XUI_HOST'], 'Required when VPN_PROVIDER=xui');
  need(!!data.XUI_USER, ['XUI_USER'], 'Required when VPN_PROVIDER=xui');
  need(!!data.XUI_PASS, ['XUI_PASS'], 'Required when VPN_PROVIDER=xui');
  need(data.XUI_INBOUND_ID !== undefined, ['XUI_INBOUND_ID'], 'Required when VPN_PROVIDER=xui');
  need(!!data.XUI_DOMAIN, ['XUI_DOMAIN'], 'Required when VPN_PROVIDER=xui');
  need(data.XUI_PORT !== undefined, ['XUI_PORT'], 'Required when VPN_PROVIDER=xui');
});

export type ApiEnv = z.infer<typeof apiEnvSchemaRefined>;
export type BotEnv = z.infer<typeof botEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseApiEnv(raw: Record<string, string | undefined>): ApiEnv {
  return apiEnvSchemaRefined.parse(raw);
}

export function parseBotEnv(raw: Record<string, string | undefined>): BotEnv {
  return botEnvSchema.parse(raw);
}

export function parseWebEnv(raw: Record<string, string | undefined>): WebEnv {
  return webEnvSchema.parse(raw);
}
