import { z } from 'zod';
import { PaymentStatus } from '@prisma/client';

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().min(1),
});

export const updatePaymentStatusSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
});
