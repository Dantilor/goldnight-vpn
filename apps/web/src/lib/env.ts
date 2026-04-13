import { parseWebEnv } from '@goldnight/config';

export const env = parseWebEnv(import.meta.env as unknown as Record<string, string | undefined>);
