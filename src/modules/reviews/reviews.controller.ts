import { NextFunction, Request, Response } from 'express';
import { AppError } from '../../shared/utils/app-error';
import { sendSuccess } from '../../shared/utils/api-response';
import { createReview, listRoomReviews } from './reviews.service';

export async function postReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    const data = await createReview(req.user.id, req.body);
    sendSuccess(res, data, 201, 'Review created');
  } catch (error) {
    next(error);
  }
}

export async function getReviewsByRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await listRoomReviews(String(req.params.roomId), req.query as Record<string, unknown>);
    sendSuccess(res, data, 200, 'Room reviews fetched');
  } catch (error) {
    next(error);
  }
}