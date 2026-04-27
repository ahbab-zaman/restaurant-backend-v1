import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../modules/auth/auth.js";

const optionalAuthorize = () => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const session = await auth?.api.getSession({
        headers: req.headers as any,
      });

      if (!session) {
        return next();
      }

      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role as Role,
        isEmailVerified: session.user.emailVerified,
        isBlocked: (session.user as any).isBlocked ?? false,
      };

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default optionalAuthorize;
