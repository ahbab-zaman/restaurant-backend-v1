import { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../modules/auth/better-auth.instance';
import { AppError } from '../utils/app-error';
import { Role } from '@prisma/client';
import { prisma } from '../prisma/client';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      throw new AppError('Authentication required. Please log in to continue.', 401);
    }

    if (session.session.expiresAt < new Date()) {
      throw new AppError('Your session has expired. Please log in again.', 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!dbUser) {
      throw new AppError('Authentication failed. Please log in again.', 401);
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: dbUser.role as Role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Authentication failed. Please log in again.', 401));
  }
};
