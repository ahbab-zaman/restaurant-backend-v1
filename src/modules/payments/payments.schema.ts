import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().min(1),
});