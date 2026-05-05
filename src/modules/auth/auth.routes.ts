import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { authLimiter } from '../../shared/middleware/rate-limiter';
import { loginSchema, registerSchema, updateUserSchema } from './auth.schema';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(updateUserSchema), authController.updateMe);

export default router;
