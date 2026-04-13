import { z } from 'zod';

export const botTelegramUserParamsSchema = z.object({
  telegramUserId: z.string().min(1)
});
