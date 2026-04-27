import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Role } from '@prisma/client';
import { AppError } from '../utils/app-error';

export const authorize = (...roles: Role[]): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required. Please log in to continue.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires one of the following roles: ${roles.join(', ')}`,
          403,
        ),
      );
    }

    next();
  };
};
