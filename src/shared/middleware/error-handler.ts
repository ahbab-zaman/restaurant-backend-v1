import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { AppError } from '../utils/app-error';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, _next: NextFunction): void => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    console.error('--- ERROR -----------------------------------');
    console.error(`${req.method} ${req.originalUrl}`);
    console.error(err.stack);
    console.error('---------------------------------------------');
  }

  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      ...(isDevelopment && { stack: err.stack }),
    });
    return;
  }

  if (err instanceof ZodError) {
    const message = err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    res.status(422).json({
      success: false,
      message,
      data: null,
    });
    return;
  }

  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Image size exceeds the maximum limit of 5MB.'
        : err.message;
    res.status(422).json({
      success: false,
      message,
      data: null,
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        const fields = (err.meta?.target as string[])?.join(', ') ?? 'field';
        res.status(409).json({
          success: false,
          message: `A record with this ${fields} already exists.`,
          data: null,
        });
        return;
      }
      case 'P2025': {
        res.status(404).json({
          success: false,
          message: 'The requested record was not found.',
          data: null,
        });
        return;
      }
      case 'P2003': {
        res.status(400).json({
          success: false,
          message: 'Invalid reference. The related record does not exist.',
          data: null,
        });
        return;
      }
      case 'P2014': {
        res.status(400).json({
          success: false,
          message: 'This operation violates a required relationship constraint.',
          data: null,
        });
        return;
      }
      default: {
        res.status(500).json({
          success: false,
          message: isDevelopment ? `Database error: ${err.message}` : 'A database error occurred.',
          data: null,
        });
        return;
      }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: isDevelopment ? err.message : 'Invalid data provided to the database.',
      data: null,
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
      data: null,
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Your session has expired. Please log in again.',
      data: null,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: isDevelopment ? err.message : 'An unexpected error occurred. Please try again later.',
    data: null,
    ...(isDevelopment && { stack: err.stack }),
  });
};
