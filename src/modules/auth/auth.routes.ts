import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { me } from './auth.controller';

export const authRouter = Router();

authRouter.get('/me', authenticate, me);