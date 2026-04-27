import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { prisma } from '../../shared/prisma/client';
import { auth } from './better-auth.instance';
import { AppError } from '../../shared/utils/app-error';
import { LoginInput, RegisterInput } from './auth.schema';

const SALT_ROUNDS = 12;
const BCRYPT_MAX_LENGTH = 72;
const DUMMY_BCRYPT_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO6E8f8S6P6j8M4N5g5w8Q7Z8l0x5QH6i';

export const registerUser = async (
  data: RegisterInput,
): Promise<{ id: string; name: string; email: string; role: string; createdAt: Date }> => {
  if (Buffer.byteLength(data.password, 'utf8') > BCRYPT_MAX_LENGTH) {
    throw new AppError('Password exceeds maximum allowed length', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError(
      'An account with this email already exists. Please log in or use a different email.',
      409,
    );
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return newUser;
};

export const loginUser = async (
  data: LoginInput,
  _req: Request,
  res: Response,
): Promise<Response> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      name: true,
    },
  });

  const passwordToCompare = user ? user.passwordHash : DUMMY_BCRYPT_HASH;
  const isPasswordValid = await bcrypt.compare(data.password, passwordToCompare);

  if (!user || !isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const authResponse = await auth.api.signInEmail({
    body: { email: data.email, password: data.password },
    asResponse: true,
  });

  if (!authResponse.ok) {
    throw new AppError('Authentication failed. Please try again.', 500);
  }

  await authResponse.json();

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
