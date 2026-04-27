import { NextFunction, Request, Response } from 'express';
import { config } from '../../config/env';
import { sendSuccess } from '../../shared/utils/api-response';
import { createPaymentIntent, processWebhook } from './payments.service';

export async function postPaymentIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await createPaymentIntent(req.body.bookingId as string);
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