import { Request, Response as ExpressResponse } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from '../../shared/prisma/client';
import { auth } from './better-auth.instance';
import { AppError } from '../../shared/utils/app-error';
import { LoginInput, RegisterInput } from './auth.schema';

type BetterAuthUserPayload = {
  id?: string;
  name?: string;
  email?: string;
  createdAt?: string | Date;
};

type BetterAuthPayload = {
  message?: string;
  error?: string;
  user?: BetterAuthUserPayload;
};

const parseAuthPayload = async (
  response: { json: () => Promise<unknown> },
): Promise<BetterAuthPayload> => {
  try {
    return (await response.json()) as BetterAuthPayload;
  } catch {
    return {};
  }
};

const resolveAuthErrorMessage = (payload: BetterAuthPayload): string | null => {
  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
    return payload.error;
  }

  return null;
};

export const registerUser = async (
  data: RegisterInput,
  res: ExpressResponse,
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
    const payload = await parseAuthPayload(authResponse);
    const message = resolveAuthErrorMessage(payload);

    if (authResponse.status === 409) {
      throw new AppError(
        message ?? 'An account with this email already exists. Please log in or use a different email.',
        409,
      );
    }

    throw new AppError(message ?? `Registration failed (status ${authResponse.status}).`, authResponse.status);
  }

  const payload = await parseAuthPayload(authResponse);
  const resolvedUserId = payload.user?.id;
  const fallbackCreatedAt = payload.user?.createdAt ? new Date(payload.user.createdAt) : new Date();

  const user = await prisma.user.findUnique({
    where: resolvedUserId ? { id: resolvedUserId } : { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const setCookie = authResponse.headers.get('set-cookie');

  if (setCookie) {
    res.set('Set-Cookie', setCookie);
  }

  if (!user) {
    if (payload.user?.id && payload.user?.email) {
      return {
        id: payload.user.id,
        name: payload.user.name ?? data.name,
        email: payload.user.email,
        role: 'GUEST',
        createdAt: fallbackCreatedAt,
      };
    }

    throw new AppError('Registration succeeded but user lookup failed. Please try logging in.', 500);
  }

  return user;
};

export const loginUser = async (
  data: LoginInput,
  res: ExpressResponse,
): Promise<ExpressResponse> => {
  const authResponse = await auth.api.signInEmail({
    body: { email: data.email, password: data.password },
    asResponse: true,
  });

  if (!authResponse.ok) {
    const payload = await parseAuthPayload(authResponse);
    const message = resolveAuthErrorMessage(payload);
    throw new AppError(message ?? 'Invalid email or password', 401);
  }

  const payload = await parseAuthPayload(authResponse);
  const resolvedUserId = payload.user?.id;

  const user = await prisma.user.findUnique({
    where: resolvedUserId ? { id: resolvedUserId } : { email: data.email },
    select: {
      id: true,
      email: true,
      role: true,
      name: true,
    },
  });

  if (!user) {
    if (payload.user?.id && payload.user?.email) {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          role: 'GUEST',
        },
      });
    }

    throw new AppError('Login succeeded but user lookup failed. Please try again.', 500);
  }

  const setCookie = authResponse.headers.get('set-cookie');

  return res
    .status(200)
    .set('Set-Cookie', setCookie ?? '')
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
