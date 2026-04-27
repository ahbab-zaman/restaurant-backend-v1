import crypto from 'crypto';
import { Role } from '@prisma/client';
import { config } from '../../config/env';
import { AppError } from './app-error';

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
};

type AccessTokenInput = {
  userId: string;
  email: string;
  role: Role;
};

const base64UrlEncode = (value: string): string =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const base64UrlDecode = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const withPadding = padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;
  return Buffer.from(withPadding, 'base64').toString('utf8');
};

const sign = (value: string): string =>
  crypto
    .createHmac('sha256', config.accessTokenSecret)
    .update(value)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

export const createAccessToken = ({ userId, email, role }: AccessTokenInput): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    role,
    iat: now,
    exp: now + config.accessTokenExpiresInMinutes * 60,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const parsePayload = (token: string): AccessTokenPayload => {
  const parts = token.split('.');

  if (parts.length !== 3) {
    throw new AppError('Invalid access token format.', 401);
  }

  const [encodedHeader, encodedPayload, incomingSignature] = parts;
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`);
  const incomingBuffer = Buffer.from(incomingSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    incomingBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(incomingBuffer, expectedBuffer)
  ) {
    throw new AppError('Invalid access token signature.', 401);
  }

  let payload: unknown;

  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as unknown;
  } catch {
    throw new AppError('Invalid access token payload.', 401);
  }

  if (typeof payload !== 'object' || payload === null) {
    throw new AppError('Invalid access token payload.', 401);
  }

  const tokenPayload = payload as Partial<AccessTokenPayload>;

  if (
    typeof tokenPayload.sub !== 'string' ||
    typeof tokenPayload.email !== 'string' ||
    typeof tokenPayload.role !== 'string' ||
    typeof tokenPayload.iat !== 'number' ||
    typeof tokenPayload.exp !== 'number'
  ) {
    throw new AppError('Invalid access token payload.', 401);
  }

  if (!Object.values(Role).includes(tokenPayload.role as Role)) {
    throw new AppError('Invalid access token role.', 401);
  }

  if (tokenPayload.exp <= Math.floor(Date.now() / 1000)) {
    throw new AppError('Access token expired. Please refresh and try again.', 401);
  }

  return tokenPayload as AccessTokenPayload;
};

export const verifyAccessToken = (token: string): AccessTokenPayload => parsePayload(token);
