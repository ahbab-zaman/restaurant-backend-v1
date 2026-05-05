import { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../shared/utils/api-response';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authResult = await authService.registerUser(req.body, res);

    sendSuccess(res, authResult, 201, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authResult = await authService.loginUser(req.body, res);
    sendSuccess(res, authResult, 200, 'Login successful');
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

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshed = await authService.refreshAccessToken(req);
    sendSuccess(res, refreshed, 200, 'Access token refreshed successfully');
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await authService.updateCurrentUser(req.user.id, req.body);
    sendSuccess(res, user, 200, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};
