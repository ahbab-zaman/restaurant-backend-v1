import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/app-error';

export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const payload = req.body ?? {};
    const result = schema.safeParse(payload);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      return next(new AppError(errors, 422));
    }

    req.body = result.data;
    next();
  };
};

function formatZodErrors(error: ZodError): string {
  return error.issues
    .map((err) => {
      const field = err.path.join('.');
      return field ? `${field}: ${err.message}` : err.message;
    })
    .join(', ');
}
