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
    VPN_PROVIDER: z.enum(['mock', 'manual', 'real']).default('manual'),
    TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
    TELEGRAM_WEBAPP_URL: z.string().url(),
    AUTH_JWT_SECRET: z.string().min(32),
    AUTH_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(604800),
    TELEGRAM_INITDATA_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
    ADMIN_API_KEY: z.string().min(16),
    BOT_API_KEY: z.string().min(16)
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
export function parseApiEnv(raw) {
    return apiEnvSchema.parse(raw);
}
export function parseBotEnv(raw) {
    return botEnvSchema.parse(raw);
}
export function parseWebEnv(raw) {
    return webEnvSchema.parse(raw);
}
