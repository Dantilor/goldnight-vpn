import { z } from 'zod';

export const listPlansQuerySchema = z.object({
  onlyActive: z.coerce.boolean().optional().default(true)
});
