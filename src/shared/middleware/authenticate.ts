import { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../modules/auth/better-auth.instance';
import { AppError } from '../utils/app-error';
import { Role } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AccessTokenExpiredError, createAccessToken, verifyAccessToken } from '../utils/access-token';

const authenticateWithRefreshSession = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session || !session.user || !session.session) {
    throw new AppError('Authentication required. Please log in to continue.', 401);
  }

  if (session.session.expiresAt < new Date()) {
    throw new AppError('Your session has expired. Please log in again.', 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!dbUser) {
    throw new AppError('Authentication failed. Please log in again.', 401);
  }

  req.user = {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role as Role,
  };

  const refreshedAccessToken = createAccessToken({
    userId: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
  });

  res.setHeader('X-Access-Token', refreshedAccessToken);
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();

      if (!token) {
        throw new AppError('Access token is missing.', 401);
      }

      try {
        const payload = verifyAccessToken(token);
        req.user = {
          id: payload.sub,
          email: payload.email,
          role: payload.role,
        };

        return next();
      } catch (error) {
        if (error instanceof AccessTokenExpiredError) {
          await authenticateWithRefreshSession(req, res);
          return next();
        }

        throw error;
      }
    }

    await authenticateWithRefreshSession(req, res);

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Authentication failed. Please log in again.', 401));
  }
};
