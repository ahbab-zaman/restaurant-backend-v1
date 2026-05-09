import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Raised from 100 — UI pages fire multiple parallel read requests
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again in 15 minutes.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again in 15 minutes.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const stripeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many payment requests. Please try again in 15 minutes.',
    data: null,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
