import { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from '../../shared/prisma/client';
import { auth } from './better-auth.instance';
import { AppError } from '../../shared/utils/app-error';
import { LoginInput, RegisterInput } from './auth.schema';

export const registerUser = async (
  data: RegisterInput,
  res: Response,
): Promise<{ id: string; name: string; email: string; role: string; createdAt: Date }> => {
  const authResponse = await auth.api.signUpEmail({
    body: {
      name: data.name,
      email: data.email,
      password: data.password,
    },
    asResponse: true,
  });

  if (!authResponse.ok) {
    if (authResponse.status === 409) {
      throw new AppError(
        'An account with this email already exists. Please log in or use a different email.',
        409,
      );
    }

    throw new AppError('Authentication failed. Please try again.', 500);
  }

  await authResponse.json();

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AppError('Authentication failed. Please try again.', 500);
  }

  res.set('Set-Cookie', authResponse.headers.get('set-cookie') ?? '');

  return user;
};

export const loginUser = async (
  data: LoginInput,
  res: Response,
): Promise<Response> => {
  const authResponse = await auth.api.signInEmail({
    body: { email: data.email, password: data.password },
    asResponse: true,
  });

  if (!authResponse.ok) {
    throw new AppError('Invalid email or password', 401);
  }

  await authResponse.json();

  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    throw new AppError('Authentication failed. Please try again.', 500);
  }

  return res
    .status(200)
    .set('Set-Cookie', authResponse.headers.get('set-cookie') ?? '')
    .json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
};

export const logoutUser = async (req: Request): Promise<void> => {
  await auth.api.signOut({
    headers: fromNodeHeaders(req.headers),
  });
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};
