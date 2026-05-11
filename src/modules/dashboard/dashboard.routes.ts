import { Role } from '@prisma/client';
import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { getOverview } from './dashboard.controller';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/overview',
  authenticate,
  authorize(Role.HOTEL_ADMIN, Role.SUPER_ADMIN),
  getOverview,
);
