import { z } from 'zod';

export const yookassaCheckoutBodySchema = z.object({
  planId: z.string().min(1),
  /** Сохраняется в профиль и используется в receipt.customer.email для 54-ФЗ. */
  receiptEmail: z.string().trim().email().max(320).optional()
});
