import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { z } from 'zod';
import { getMe, getUsers, patchMe, patchRole } from './users.controller';
import { updateMyProfileSchema } from './users.schema';

const roleUpdateSchema = z.object({
  role: z.nativeEnum(Role),
});

export const usersRouter = Router();

usersRouter.get('/', authenticate, authorize([Role.SUPER_ADMIN]), getUsers);
usersRouter.get('/me', authenticate, getMe);
usersRouter.patch('/me', authenticate, validate(updateMyProfileSchema), patchMe);
usersRouter.patch('/:id/role', authenticate, authorize([Role.SUPER_ADMIN]), validate(roleUpdateSchema), patchRole);