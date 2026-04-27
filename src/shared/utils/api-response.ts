import { Response } from 'express';

interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: false;
  message: string;
  data: null;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = 'Success',
): Response<SuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
): Response<ErrorResponse> {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}
