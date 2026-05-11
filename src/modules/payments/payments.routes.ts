import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { stripeLimiter } from '../../shared/middleware/rate-limiter';
import { validate } from '../../shared/middleware/validate';
import { patchPaymentStatus, postPaymentIntent, stripeWebhook } from './payments.controller';
import { createPaymentIntentSchema, updatePaymentStatusSchema } from './payments.schema';

export const paymentsRouter = Router();
export const webhookRouter = Router();

paymentsRouter.post('/intent', stripeLimiter, authenticate, validate(createPaymentIntentSchema), postPaymentIntent);
paymentsRouter.patch(
  '/:bookingId/status',
  stripeLimiter,
  authenticate,
  authorize(Role.SUPER_ADMIN),
  validate(updatePaymentStatusSchema),
  patchPaymentStatus,
);
webhookRouter.post('/', stripeLimiter, stripeWebhook);
