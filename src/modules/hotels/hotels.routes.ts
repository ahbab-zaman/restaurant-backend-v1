import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { hotelImageUpload } from '../../shared/middleware/hotel-image-upload';
import { validate } from '../../shared/middleware/validate';
import {
  deleteHotel,
  getHotel,
  getHotels,
  patchHotel,
  postHotel,
} from './hotels.controller';
import { createHotelSchema, updateHotelSchema } from './hotels.schema';

export const hotelsRouter = Router();

hotelsRouter.get('/', authenticate, authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN), getHotels);
hotelsRouter.get('/:id', getHotel);
hotelsRouter.post(
  '/',
  authenticate,
  authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN),
  hotelImageUpload.single('image'),
  validate(createHotelSchema),
  postHotel,
);
hotelsRouter.patch(
  '/:id',
  authenticate,
  authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN),
  hotelImageUpload.single('image'),
  validate(updateHotelSchema),
  patchHotel,
);
hotelsRouter.delete(
  '/:id',
  authenticate,
  authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN),
  deleteHotel,
);
