import { NextFunction, Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../shared/utils/api-response';
import { AppError } from '../../shared/utils/app-error';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, accessToken, setCookie } = await authService.registerUser(req.body);

    if (setCookie) {
      res.append('Set-Cookie', setCookie);
    }

    sendSuccess(res, { user, accessToken }, 201, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user, accessToken, setCookie } = await authService.loginUser(req.body);

    if (setCookie) {
      res.append('Set-Cookie', setCookie);
    }

    sendSuccess(res, { user, accessToken }, 200, 'Login successful');
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
    if (!req.user?.id) {
      return next(new AppError('Unauthorized', 401));
    }

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
    if (!req.user?.id) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await authService.updateCurrentUser(req.user.id, req.body);
    sendSuccess(res, user, 200, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));
    const result = await authService.listAllUsers(page, limit);
    sendSuccess(res, result, 200, 'Users fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const user = await authService.getUserById(userId);
    sendSuccess(res, user, 200, 'User fetched successfully');
  } catch (error) {
    next(error);
  }
};

export const adminUpdateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      return next(new AppError('Unauthorized', 401));
    }

    const userId = req.params.userId as string;

    // Prevent a super-admin from changing their own role
    if (req.user.id === userId && req.body.role !== undefined && req.body.role !== req.user.role) {
      return next(new AppError('You cannot change your own role', 403));
    }

    const user = await authService.adminUpdateUser(userId, req.body);
    sendSuccess(res, user, 200, 'User updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user?.id) {
      return next(new AppError('Unauthorized', 401));
    }

    const userId = req.params.userId as string;

    // Prevent a super-admin from deleting their own account
    if (req.user.id === userId) {
      return next(new AppError('You cannot delete your own account', 403));
    }

    await authService.deleteUser(userId);
    sendSuccess(res, null, 200, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};
