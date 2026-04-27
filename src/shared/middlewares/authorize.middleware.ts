import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

import { auth } from "../../modules/auth/auth.js";
import { verifyAccessToken } from "../../utils/token.js";
import { prisma } from "../../database/prisma.js";

const authorize = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth?.api.getSession({
        headers: req.headers as any,
      });

      if (session) {
        if (!session.user.emailVerified) {
          return res.status(403).json({
            success: false,
            message: "Email verification required. Please verify your email!",
          });
        }

        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: session.user.role as Role,
          isEmailVerified: session.user.emailVerified,
          isBlocked: (session.user as any).isBlocked ?? false,
        };
      } else {
        const token = req.cookies?.accessToken as string | undefined;
        const decoded = token ? verifyAccessToken(token) : null;
        if (!decoded) {
          return res.status(401).json({
            success: false,
            message: "You are not authorized!",
          });
        }

        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isEmailVerified: true,
            isBlocked: true,
          },
        });
        if (!user) {
          return res.status(401).json({
            success: false,
            message: "You are not authorized!",
          });
        }
        if (!user.isEmailVerified) {
          return res.status(403).json({
            success: false,
            message: "Email verification required. Please verify your email!",
          });
        }

        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
          isEmailVerified: user.isEmailVerified,
          isBlocked: user.isBlocked,
        };
      }

      if (req.user.isBlocked) {
        return res.status(403).json({
          success: false,
          message: "Your account has been blocked.",
        });
      }

      if (
        roles.length &&
        req.user &&
        !roles.includes(req.user.role)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden! You don't have permission to access this resources!",
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default authorize;
