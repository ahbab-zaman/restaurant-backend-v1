import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { createRoomSchema, updateRoomSchema } from './rooms.schema';
import { deleteRoom, getRoom, getRooms, patchRoom, postRoom } from './rooms.controller';

export const roomsRouter = Router();

roomsRouter.get('/', getRooms);
roomsRouter.get('/:id', getRoom);
roomsRouter.post('/', authenticate, authorize([Role.HOTEL_ADMIN, Role.SUPER_ADMIN]), validate(createRoomSchema), postRoom);
roomsRouter.patch('/:id', authenticate, authorize([Role.HOTEL_ADMIN, Role.SUPER_ADMIN]), validate(updateRoomSchema), patchRoom);
roomsRouter.delete('/:id', authenticate, authorize([Role.HOTEL_ADMIN, Role.SUPER_ADMIN]), deleteRoom);