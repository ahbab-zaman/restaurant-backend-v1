import { NextFunction, Request, Response } from 'express';
import { PaymentStatus } from '@prisma/client';
import { config } from '../../config/env';
import { AppError } from '../../shared/utils/app-error';
import { sendSuccess } from '../../shared/utils/api-response';
import { createPaymentIntent, processWebhook, updatePaymentStatusByAdmin } from './payments.service';

export async function postPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      throw new AppError('Unauthorized', 401);
    }

    const data = await createPaymentIntent(req.body.bookingId as string, req.user.id);
    sendSuccess(res, data, 201, 'Payment intent created');
  } catch (error) {
    next(error);
  }
}

export async function stripeWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await processWebhook(
      req.body as Buffer,
      req.headers['stripe-signature'] as string | undefined,
      config.stripeWebhookSecret,
    );
    sendSuccess(res, data, 200, 'Webhook processed');
  } catch (error) {
    next(error);
  }
}

export async function patchPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await updatePaymentStatusByAdmin(String(req.params.bookingId), req.body.status as PaymentStatus);
    sendSuccess(res, data, 200, 'Payment status updated');
  } catch (error) {
    next(error);
  }
}
