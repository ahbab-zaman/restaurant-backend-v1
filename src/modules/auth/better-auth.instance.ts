import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { config } from '../../config/env';
import { prisma } from '../../shared/prisma/client';

const trustedOrigins = Array.from(
  new Set(
    [
      config.clientUrl,
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://restaurant-frontend-seven-mu.vercel.app',
    ].filter((origin): origin is string => Boolean(origin)),
  ),
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: config.betterAuthSecret,
  baseURL: config.betterAuthUrl,
  trustedOrigins,
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 60 * 24 * 7 },
  },
});