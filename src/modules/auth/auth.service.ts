import { Request, Response as ExpressResponse } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { Role } from '@prisma/client';
import { prisma } from '../../shared/prisma/client';
import { auth } from './better-auth.instance';
import { AppError } from '../../shared/utils/app-error';
import { LoginInput, RegisterInput } from './auth.schema';
import { createAccessToken } from '../../shared/utils/access-token';

type BetterAuthUserPayload = {
  id?: string;
  name?: string;
  email?: string;
};

type BetterAuthPayload = {
  message?: string;
  error?: string;
  user?: BetterAuthUserPayload;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type AuthResponse = {
  user: AuthUser;
  accessToken: string;
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
): Promise<AuthResponse> => {
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

  const user = await prisma.user.findUnique({
    where: resolvedUserId ? { id: resolvedUserId } : { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  const setCookie = authResponse.headers.get('set-cookie');

  if (setCookie) {
    res.append('Set-Cookie', setCookie);
  }

  if (!user) {
    if (payload.user?.id && payload.user?.email) {
      return {
        user: {
          id: payload.user.id,
          name: payload.user.name ?? data.name,
          email: payload.user.email,
          role: Role.GUEST,
        },
        accessToken: createAccessToken({
          userId: payload.user.id,
          email: payload.user.email,
          role: Role.GUEST,
        }),
      };
    }

    throw new AppError('Registration succeeded but user lookup failed. Please try logging in.', 500);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken: createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
  };
};

export const loginUser = async (
  data: LoginInput,
  res: ExpressResponse,
): Promise<AuthResponse> => {
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
      return {
        user: {
          id: payload.user.id,
          name: payload.user.name ?? '',
          email: payload.user.email,
          role: Role.GUEST,
        },
        accessToken: createAccessToken({
          userId: payload.user.id,
          email: payload.user.email,
          role: Role.GUEST,
        }),
      };
    }

    throw new AppError('Login succeeded but user lookup failed. Please try again.', 500);
  }

  const setCookie = authResponse.headers.get('set-cookie');
  if (setCookie) {
    res.append('Set-Cookie', setCookie);
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    accessToken: createAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
  };
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

export const refreshAccessToken = async (req: Request): Promise<{ accessToken: string }> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user || !session.session) {
    throw new AppError('Refresh session not found. Please log in again.', 401);
  }

  if (session.session.expiresAt < new Date()) {
    throw new AppError('Refresh session expired. Please log in again.', 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });

  if (!dbUser) {
    throw new AppError('User not found for refresh. Please log in again.', 401);
  }

  return {
    accessToken: createAccessToken({
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
    }),
  };
};
