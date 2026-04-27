import { z } from 'zod';

export const createBookingSchema = z.object({
  roomId: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  guestCount: z.number().int().positive().max(20).default(1),
  notes: z.string().trim().max(500).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED']),
});