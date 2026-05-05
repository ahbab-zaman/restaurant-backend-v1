import { CorsOptions } from 'cors';
import { config } from './env';

const allowedOrigins = Array.from(
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

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and approved browser origins.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Access-Token'],
};
