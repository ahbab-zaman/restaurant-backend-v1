import { config } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { toNodeHandler } from 'better-auth/node';
import { corsOptions } from './config/cors';
import { auth } from './modules/auth/better-auth.instance';
import { bulkRoomsRouter, roomsRouter } from './modules/rooms/rooms.routes';
import { bookingsRouter } from './modules/bookings/bookings.routes';
import { paymentsRouter, webhookRouter } from './modules/payments/payments.routes';
import { reviewsRouter } from './modules/reviews/reviews.routes';
import { hotelsRouter } from './modules/hotels/hotels.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import authRouter from './modules/auth/auth.routes';
import { errorHandler } from './shared/middleware/error-handler';
import { generalLimiter } from './shared/middleware/rate-limiter';

void config;

const app = express();

app.use('/api/auth', toNodeHandler(auth.handler));

app.use(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  webhookRouter,
);

app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/hotels', hotelsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/rooms', bulkRoomsRouter);
app.use('/api/hotels/:hotelId/rooms', roomsRouter);
app.use('/api/v1/hotels/:hotelId/rooms', roomsRouter);

app.use((_req, res) => res.status(404).json({ message: 'Route not found' }));

app.use(errorHandler);

export default app;
