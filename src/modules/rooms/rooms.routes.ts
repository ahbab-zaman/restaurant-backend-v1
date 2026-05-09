import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { hotelImageUpload } from '../../shared/middleware/hotel-image-upload';
import { validate } from '../../shared/middleware/validate';
import { createRoomSchema, updateRoomSchema } from './rooms.schema';
import { deleteRoom, getBulkRooms, getRooms, patchRoom, postRooms } from './rooms.controller';

export const roomsRouter = Router({ mergeParams: true });
export const bulkRoomsRouter = Router();

// Bulk endpoint: GET /api/v1/rooms?hotelIds=id1,id2,...
bulkRoomsRouter.get('/', getBulkRooms);


roomsRouter.get('/', getRooms);
roomsRouter.post(
  '/',
  authenticate,
  authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN),
  hotelImageUpload.single('image'),
  validate(createRoomSchema),
  postRooms,
);
roomsRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN),
  hotelImageUpload.single('image'),
  validate(updateRoomSchema),
  patchRoom,
);
roomsRouter.delete('/:id', authenticate, authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN), deleteRoom);
