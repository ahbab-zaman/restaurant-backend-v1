import { z } from 'zod';

export const createHotelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(255),
  description: z.string().trim().max(1000).optional(),
});

export const updateHotelSchema = createHotelSchema.partial();
