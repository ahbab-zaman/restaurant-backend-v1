import { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../shared/utils/api-response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.registerUser(req.body, res);

    sendSuccess(res, user, 201, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.loginUser(req.body, res);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.logoutUser(req);

    res.clearCookie('better-auth.session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    sendSuccess(res, null, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, user, 200, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};
