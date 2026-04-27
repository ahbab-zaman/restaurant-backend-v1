import { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../modules/auth/better-auth.instance';
import { AppError } from '../utils/app-error';
import { Role } from '@prisma/client';

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user) {
      throw new AppError('Unauthorized', 401);
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: (session.user as { role?: Role }).role ?? Role.GUEST,
    };

    next();
  } catch (error) {
    next(error);
  }
}