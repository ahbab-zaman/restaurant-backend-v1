import { NextFunction, Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../modules/auth/better-auth.instance';
import { Role } from '@prisma/client';
import { prisma } from '../prisma/client';
import { AccessTokenExpiredError, verifyAccessToken } from '../utils/access-token';

/**
 * Optional authentication middleware.
 * Sets req.user if a valid token is present; continues silently without error if not.
 * Use on public routes that need user context for role-based data filtering.
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token) {
        try {
          const payload = verifyAccessToken(token);
          req.user = { id: payload.sub, email: payload.email, role: payload.role };
          return next();
        } catch (error) {
          if (error instanceof AccessTokenExpiredError) {
            // Token expired — attempt session-based fallback
            try {
              const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
              });
              if (session?.user && session?.session && session.session.expiresAt >= new Date()) {
                const dbUser = await prisma.user.findUnique({
                  where: { id: session.user.id },
                  select: { id: true, email: true, role: true },
                });
                if (dbUser) {
                  req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role as Role };
                }
              }
            } catch {
              // Ignore — proceed without user
            }
            return next();
          }
          // Invalid token — proceed without user
          return next();
        }
      }
    }

    // No Authorization header — try session cookie silently
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user && session?.session && session.session.expiresAt >= new Date()) {
        const dbUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, email: true, role: true },
        });
        if (dbUser) {
          req.user = { id: dbUser.id, email: dbUser.email, role: dbUser.role as Role };
        }
      }
    } catch {
      // Ignore — proceed without user
    }

    next();
  } catch {
    // Always continue — this middleware is non-blocking
    next();
  }
};
