import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { Role } from '@prisma/client';
import { AppError } from '../../shared/utils/app-error';
import { getMyProfile, listUsers, updateMyProfile, updateUserRole } from './users.service';

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listUsers(req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Users fetched');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const data = await getMyProfile(req.user.id);
    sendSuccess(res, data, 200, 'Profile fetched');
  } catch (error) {
    next(error);
  }
}

export async function patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }
    const data = await updateMyProfile(req.user.id, req.body as { name: string });
    sendSuccess(res, data, 200, 'Profile updated');
  } catch (error) {
    next(error);
  }
}

export async function patchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = req.body.role as Role;
    const data = await updateUserRole(String(req.params.id), role);
    sendSuccess(res, data, 200, 'User role updated');
  } catch (error) {
    next(error);
  }
}