import { Response } from 'express';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = 'Success',
): Response<ApiResponse<T>> {
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
): Response<ApiResponse<null>> {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}