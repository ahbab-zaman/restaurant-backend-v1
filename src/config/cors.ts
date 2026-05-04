import { CorsOptions } from 'cors';
import { config } from './env';

const allowedOrigins = [
  config.clientUrl,
  'https://restaurant-frontend-seven-mu.vercel.app',
];

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Access-Token'],
};
