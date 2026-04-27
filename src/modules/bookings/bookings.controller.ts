import { BookingStatus } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/utils/app-error';
import { sendSuccess } from '../../shared/utils/api-response';
import {
  createBooking,
  listAllBookings,
  listMyBookings,
  updateBookingStatus,
} from './bookings.service';

export async function postBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const data = await createBooking(req.user.id, req.body);
    sendSuccess(res, data, 201, 'Booking created');
  } catch (error) {
    next(error);
  }
}

export async function getMyBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const data = await listMyBookings(req.user.id, req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'My bookings fetched');
  } catch (error) {
    next(error);
  }
}

export async function getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listAllBookings(req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Bookings fetched');
  } catch (error) {
    next(error);
  }
}

export async function patchBookingStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await updateBookingStatus(String(req.params.id), req.body.status as BookingStatus);
    sendSuccess(res, data, 200, 'Booking status updated');
  } catch (error) {
    next(error);
  }
}