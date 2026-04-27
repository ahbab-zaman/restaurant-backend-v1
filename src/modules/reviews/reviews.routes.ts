import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { getReviewsByRoom, postReview } from './reviews.controller';
import { createReviewSchema } from './reviews.schema';

export const reviewsRouter = Router();

reviewsRouter.post('/', authenticate, validate(createReviewSchema), postReview);
reviewsRouter.get('/room/:roomId', getReviewsByRoom);