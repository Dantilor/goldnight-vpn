import { z } from 'zod';

export const telegramAuthBodySchema = z.object({
  initData: z.string().min(1)
});

export const patchMeEmailBodySchema = z.object({
  email: z.string().trim().email().max(320)
});
