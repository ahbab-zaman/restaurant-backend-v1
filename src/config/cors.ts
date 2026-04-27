import { CorsOptions } from 'cors';
import { config } from './env';

export const corsOptions: CorsOptions = {
  origin: config.clientUrl,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
};