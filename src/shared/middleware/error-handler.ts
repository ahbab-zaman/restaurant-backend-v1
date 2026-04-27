import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction): Response {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      data: null,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Duplicate value', data: null });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Resource not found', data: null });
    }
  }

  const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : (error as Error)?.message;

  return res.status(500).json({
    success: false,
    message: message || 'Internal Server Error',
    data: null,
  });
}