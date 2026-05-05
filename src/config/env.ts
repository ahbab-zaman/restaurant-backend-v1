const required = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLIENT_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
] as const;

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const parsedAccessTokenExpiresMinutes = Number(process.env.ACCESS_TOKEN_EXPIRES_MINUTES ?? 15);

if (!Number.isFinite(parsedAccessTokenExpiresMinutes) || parsedAccessTokenExpiresMinutes <= 0) {
  throw new Error('ACCESS_TOKEN_EXPIRES_MINUTES must be a positive number.');
}

export const config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV as 'development' | 'production' | 'test',
  databaseUrl: process.env.DATABASE_URL as string,
  betterAuthSecret: process.env.BETTER_AUTH_SECRET as string,
  betterAuthUrl: process.env.BETTER_AUTH_URL as string,
  accessTokenSecret: (process.env.ACCESS_TOKEN_SECRET ?? process.env.BETTER_AUTH_SECRET) as string,
  accessTokenExpiresInMinutes: parsedAccessTokenExpiresMinutes,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET as string,
  clientUrl: process.env.CLIENT_URL as string,
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME as string,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY as string,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET as string,
};
