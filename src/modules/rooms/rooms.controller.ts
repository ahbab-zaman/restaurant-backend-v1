import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/utils/app-error';
import { sendSuccess } from '../../shared/utils/api-response';
import { createRooms, listRoomsByHotel, listRoomsByHotelIds, removeRoom, updateRoom } from './rooms.service';

export async function getBulkRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const raw = typeof req.query.hotelIds === 'string' ? req.query.hotelIds : '';
    const hotelIds = raw.split(',').map((id) => id.trim()).filter(Boolean);

    if (!hotelIds.length) {
      sendSuccess(res, { items: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }, 200, 'Rooms fetched');
      return;
    }

    const data = await listRoomsByHotelIds(hotelIds, req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Rooms fetched');
  } catch (error) {
    next(error);
  }
}


export async function postRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    const data = await createRooms(String(req.params.hotelId), req.body, req.user, req.file?.buffer);
    sendSuccess(res, data, 201, 'Rooms created');
  } catch (error) {
    next(error);
  }
}

export async function getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listRoomsByHotel(String(req.params.hotelId), req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Rooms fetched');
  } catch (error) {
    next(error);
  }
}

export async function patchRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    const data = await updateRoom(
      String(req.params.hotelId),
      String(req.params.id),
      req.body,
      req.user,
      req.file?.buffer,
    );

    sendSuccess(res, data, 200, 'Room updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    await removeRoom(String(req.params.hotelId), String(req.params.id), req.user);
    sendSuccess(res, null, 200, 'Room deleted');
  } catch (error) {
    next(error);
  }
}
