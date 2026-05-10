import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import {
  getRoomAvailability,
  getBooking,
  getBookings,
  getMyBookings,
  patchBookingStatus,
  postBooking,
} from './bookings.controller';
import { createBookingSchema, updateBookingStatusSchema } from './bookings.schema';

export const bookingsRouter = Router();

bookingsRouter.post('/', authenticate, validate(createBookingSchema), postBooking);
bookingsRouter.get('/me', authenticate, getMyBookings);
bookingsRouter.get('/availability', authenticate, getRoomAvailability);
bookingsRouter.get('/:id', authenticate, getBooking);
bookingsRouter.get('/', authenticate, authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN), getBookings);
bookingsRouter.patch(
  '/:id/status',
  authenticate,
  authorize(Role.SUPER_ADMIN),
  validate(updateBookingStatusSchema),
  patchBookingStatus,
);
