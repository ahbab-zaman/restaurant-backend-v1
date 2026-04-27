import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { createRoom, getRoomById, listRooms, removeRoom, updateRoom } from './rooms.service';

export async function postRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await createRoom(req.body);
    sendSuccess(res, data, 201, 'Room created');
  } catch (error) {
    next(error);
  }
}

export async function getRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listRooms(req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Rooms fetched');
  } catch (error) {
    next(error);
  }
}

export async function getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await getRoomById(String(req.params.id));
    sendSuccess(res, data, 200, 'Room fetched');
  } catch (error) {
    next(error);
  }
}

export async function patchRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await updateRoom(String(req.params.id), req.body);
    sendSuccess(res, data, 200, 'Room updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeRoom(String(req.params.id));
    sendSuccess(res, null, 200, 'Room deleted');
  } catch (error) {
    next(error);
  }
}
