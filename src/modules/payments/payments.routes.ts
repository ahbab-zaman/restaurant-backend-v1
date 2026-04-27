import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { stripeLimiter } from '../../shared/middleware/rate-limiter';
import { validate } from '../../shared/middleware/validate';
import { postPaymentIntent, stripeWebhook } from './payments.controller';
import { createPaymentIntentSchema } from './payments.schema';

export const paymentsRouter = Router();
export const webhookRouter = Router();

paymentsRouter.post('/intent', stripeLimiter, authenticate, validate(createPaymentIntentSchema), postPaymentIntent);
webhookRouter.post('/', stripeLimiter, stripeWebhook);