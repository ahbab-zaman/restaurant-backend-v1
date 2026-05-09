import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../shared/middleware/validate';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { authLimiter } from '../../shared/middleware/rate-limiter';
import { loginSchema, registerSchema, updateUserSchema, adminUpdateUserSchema } from './auth.schema';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch('/me', authenticate, validate(updateUserSchema), authController.updateMe);

// Super-admin user management routes
router.get('/users', authenticate, authorize('SUPER_ADMIN'), authController.listUsers);
router.get('/users/:userId', authenticate, authorize('SUPER_ADMIN'), authController.getUser);
router.patch('/users/:userId', authenticate, authorize('SUPER_ADMIN'), validate(adminUpdateUserSchema), authController.adminUpdateUser);
router.delete('/users/:userId', authenticate, authorize('SUPER_ADMIN'), authController.deleteUser);

export default router;

