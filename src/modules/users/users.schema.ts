import { z } from 'zod';

export const updateMyProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
});