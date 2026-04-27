import { NextFunction, Request, Response } from 'express';
import { sendSuccess } from '../../shared/utils/api-response';
import { getCurrentUser } from './auth.service';

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await getCurrentUser(req.user);
    sendSuccess(res, result, 200, 'Authenticated user fetched');
  } catch (error) {
    next(error);
  }
}