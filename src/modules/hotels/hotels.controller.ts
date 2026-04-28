import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/utils/app-error';
import { sendSuccess } from '../../shared/utils/api-response';
import {
  createHotel,
  getHotelById,
  listHotels,
  removeHotel,
  updateHotel,
} from './hotels.service';

export async function postHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    const data = await createHotel(req.user.id, req.body);
    sendSuccess(res, data, 201, 'Hotel created');
  } catch (error) {
    next(error);
  }
}

export async function getHotels(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listHotels(req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Hotels fetched');
  } catch (error) {
    next(error);
  }
}

export async function getHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getHotelById(String(req.params.id));
    sendSuccess(res, data, 200, 'Hotel fetched');
  } catch (error) {
    next(error);
  }
}

export async function patchHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    const data = await updateHotel(String(req.params.id), req.body, req.user);
    sendSuccess(res, data, 200, 'Hotel updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteHotel(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    await removeHotel(String(req.params.id), req.user);
    sendSuccess(res, null, 200, 'Hotel deleted');
  } catch (error) {
    next(error);
  }
}
