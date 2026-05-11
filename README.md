# LumosStay — Backend

> A production-grade **Express.js 5** REST API built with **TypeScript**, **Prisma ORM**, and **PostgreSQL**. Provides all data and business logic for the LumosStay hotel booking platform including authentication, hotel & room management, bookings, Stripe payment processing, reviews, and role-based dashboards.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Modules](#api-modules)
- [Authentication & Authorisation](#authentication--authorisation)
- [Database](#database)
- [Payments — Stripe Integration](#payments--stripe-integration)
- [File Uploads — Cloudinary](#file-uploads--cloudinary)
- [Email — Nodemailer](#email--nodemailer)
- [Security & Middleware](#security--middleware)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [API Reference Summary](#api-reference-summary)

---

## Overview

The LumosStay backend is a RESTful API that serves the frontend application. It is structured around a **modular architecture** where each domain (auth, hotels, rooms, bookings, payments, reviews, dashboard) is an independent module with its own controller, service, routes, and schema.

Key responsibilities:
- Session-based authentication with **Better Auth** + custom JWT refresh tokens
- Role-based access control (`USER`, `HOTEL_MANAGER`, `SUPER_ADMIN`)
- Full CRUD for hotels, rooms, bookings, and reviews
- **Stripe** payment intent creation and webhook confirmation
- **Cloudinary** image uploads for hotel and room photos
- **Nodemailer** email notifications for booking confirmations
- Aggregated dashboard analytics with monthly revenue and guest trends

---

## Tech Stack

| Category | Library / Tool |
|---|---|
| Runtime | Node.js |
| Framework | [Express.js 5](https://expressjs.com) |
| Language | TypeScript 5 |
| ORM | [Prisma 7](https://www.prisma.io) |
| Database | PostgreSQL (via `pg` driver) |
| Auth | [Better Auth](https://www.better-auth.com) + custom JWT layer |
| Password Hashing | bcryptjs |
| Payments | [Stripe](https://stripe.com/docs/api) v18 |
| File Storage | [Cloudinary](https://cloudinary.com) v2 |
| Email | [Nodemailer](https://nodemailer.com) |
| Validation | [Zod](https://zod.dev) v4 |
| Logging | [Morgan](https://github.com/expressjs/morgan) |
| Security | [Helmet](https://helmetjs.github.io) |
| Rate Limiting | [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) |
| CORS | [cors](https://github.com/expressjs/cors) |
| Dev Server | [Nodemon](https://nodemon.io) |
| Linting | ESLint + TypeScript ESLint + Prettier |

---

## Project Structure

```
src/
├── app.ts                          # Express app setup — middleware, routers
├── server.ts                       # HTTP server bootstrap, graceful shutdown
│
├── config/
│   ├── env.ts                      # Validated environment config (startup guard)
│   └── cors.ts                     # CORS allowed origins configuration
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts      # register, login, logout, getMe, updateMe,
│   │   │                           # listUsers, getUser, adminUpdateUser, deleteUser
│   │   ├── auth.service.ts         # Business logic — token creation, session mgmt
│   │   ├── auth.routes.ts          # Route definitions + middleware guards
│   │   ├── auth.schema.ts          # Zod schemas for request validation
│   │   └── better-auth.instance.ts # Better Auth server instance
│   │
│   ├── hotels/
│   │   ├── hotels.controller.ts
│   │   ├── hotels.service.ts       # Hotel CRUD, image upload via Cloudinary
│   │   └── hotels.routes.ts
│   │
│   ├── rooms/
│   │   ├── rooms.controller.ts
│   │   ├── rooms.service.ts        # Room CRUD, filtering by hotel, availability
│   │   └── rooms.routes.ts         # /api/hotels/:hotelId/rooms + bulk routes
│   │
│   ├── bookings/
│   │   ├── bookings.controller.ts
│   │   ├── bookings.service.ts     # Create booking, payment intent, status updates
│   │   └── bookings.routes.ts
│   │
│   ├── payments/
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts     # Stripe Payment Intent creation
│   │   ├── payments.routes.ts
│   │   └── webhook.service.ts      # Stripe webhook → booking confirmation
│   │
│   ├── reviews/
│   │   ├── reviews.controller.ts
│   │   ├── reviews.service.ts      # Create and list reviews per hotel
│   │   └── reviews.routes.ts
│   │
│   └── dashboard/
│       ├── dashboard.controller.ts
│       ├── dashboard.service.ts    # Aggregated stats, monthly trends, recent bookings
│       └── dashboard.routes.ts
│
├── shared/
│   ├── middleware/
│   │   ├── authenticate.ts         # JWT + session validation middleware
│   │   ├── authorize.ts            # Role-based access guard factory
│   │   ├── error-handler.ts        # Centralised Express error handler
│   │   ├── rate-limiter.ts         # General + auth-specific rate limiters
│   │   └── validate.ts             # Zod schema validation middleware
│   │
│   ├── prisma/
│   │   └── client.ts               # Singleton Prisma client
│   │
│   └── utils/
│       ├── api-response.ts         # sendSuccess / sendError response helpers
│       ├── app-error.ts            # Custom AppError class (status + message)
│       └── token.ts                # JWT sign / verify utilities
│
└── routes/                         # (legacy / additional route stubs)

prisma/
├── schema.prisma                   # Full data model definition
└── seed.ts                         # Database seeder
```

---

## API Modules

### Base URL
```
http://localhost:<PORT>/api/v1
```

### Health Check
```
GET /health
```

### Auth — `/api/v1/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register a new user |
| POST | `/login` | Public | Authenticate and receive access token |
| POST | `/logout` | Authenticated | Clear session and cookie |
| GET | `/me` | Authenticated | Get current user profile |
| PATCH | `/me` | Authenticated | Update name / email |
| POST | `/refresh` | Authenticated | Refresh access token |
| GET | `/users` | Super Admin | List all users (paginated) |
| GET | `/users/:userId` | Super Admin | Get a specific user |
| PATCH | `/users/:userId` | Super Admin | Update user role or details |
| DELETE | `/users/:userId` | Super Admin | Delete a user and all related data |

> Better Auth session routes are mounted at `/api/auth` (separate from the custom auth routes).

---

### Hotels — `/api/v1/hotels`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List all hotels (with filters) |
| GET | `/:id` | Public | Get a hotel by ID |
| POST | `/` | Hotel Manager / Admin | Create a hotel |
| PATCH | `/:id` | Hotel Manager / Admin | Update hotel details |
| DELETE | `/:id` | Hotel Manager / Admin | Delete a hotel |

---

### Rooms — `/api/v1/hotels/:hotelId/rooms` and `/api/v1/rooms`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/hotels/:hotelId/rooms` | Public | List rooms for a specific hotel |
| POST | `/api/v1/hotels/:hotelId/rooms` | Hotel Manager / Admin | Create a room |
| PATCH | `/api/v1/hotels/:hotelId/rooms/:id` | Hotel Manager / Admin | Update a room |
| DELETE | `/api/v1/hotels/:hotelId/rooms/:id` | Hotel Manager / Admin | Delete a room |
| POST | `/api/v1/rooms/bulk` | Hotel Manager / Admin | Bulk create rooms |

---

### Bookings — `/api/v1/bookings`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Authenticated | List current user's bookings |
| GET | `/all` | Admin | List all platform bookings |
| GET | `/:id` | Authenticated | Get a booking by ID |
| POST | `/` | Authenticated | Create a new booking + Payment Intent |
| PATCH | `/:id/status` | Admin / Manager | Update booking status |
| DELETE | `/:id` | Admin | Delete a booking |

---

### Payments — `/api/v1/payments`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/create-intent` | Authenticated | Create a Stripe Payment Intent |
| POST | `/webhook` | Stripe (raw body) | Confirm booking on successful payment |

---

### Reviews — `/api/v1/reviews`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/hotel/:hotelId` | Public | List reviews for a hotel |
| POST | `/` | Authenticated | Submit a review |

---

### Dashboard — `/api/v1/dashboard`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/overview` | Hotel Manager / Admin | Aggregated stats, monthly trends, recent bookings |

---

## Authentication & Authorisation

The backend uses a **dual-layer auth** system:

### Better Auth (Session Layer)
- Handles sign-up, sign-in, session tokens, and secure cookie management
- Mounted at `/api/auth` via `toNodeHandler(auth.handler)`
- Session token stored as `better-auth.session_token` HttpOnly cookie

### Custom JWT Layer
- On login/register, the service also issues a signed **JWT access token** returned in the response body
- Access token is short-lived (configurable via `ACCESS_TOKEN_EXPIRES_MINUTES`, default: 15 minutes)
- The `authenticate` middleware validates the JWT and populates `req.user`

### Role-Based Access Control
Three roles are enforced via the `authorize(...roles)` middleware factory:

| Role | Capabilities |
|---|---|
| `USER` | Manage own bookings, profile, and reviews |
| `HOTEL_MANAGER` | All USER permissions + manage own hotels and rooms |
| `SUPER_ADMIN` | Full platform access including user management |

---

## Database

**PostgreSQL** is accessed via **Prisma ORM**.

### Key Models (schema.prisma)

```
User         — id, name, email, role, hashedPassword, sessions
Hotel        — id, name, location, description, images, managerId
Room         — id, hotelId, roomNumber, type, price, capacity, available
Booking      — id, userId, roomId, checkIn, checkOut, status, totalPrice
Payment      — id, bookingId, stripePaymentIntentId, status, amount
Review       — id, userId, hotelId, rating, comment
Session      — id, userId, token, expiresAt (Better Auth managed)
```

### Prisma Scripts

```bash
npx prisma generate        # Regenerate Prisma client after schema changes
npx prisma migrate dev      # Apply migrations in development
npx prisma studio           # Open Prisma Studio (DB GUI)
npm run db:seed             # Run the database seeder
```

---

## Payments — Stripe Integration

Payment flow:

1. **Client** calls `POST /api/v1/payments/create-intent` with `bookingId` and `amount`
2. **Backend** creates a Stripe `PaymentIntent` and returns the `client_secret`
3. **Client** uses `Stripe.js` Elements to collect card details and confirm the payment
4. **Stripe** sends a `payment_intent.succeeded` webhook event to `POST /api/v1/payments/webhook`
5. **Webhook handler** verifies the signature using `STRIPE_WEBHOOK_SECRET` and marks the booking as `CONFIRMED`

> The webhook endpoint uses `express.raw()` middleware to preserve the raw body required for signature verification.

---

## File Uploads — Cloudinary

Hotel and room images are uploaded to **Cloudinary**:

- `multer` handles `multipart/form-data` parsing in memory
- The Cloudinary SDK uploads the buffer and returns a secure URL
- The URL is stored in the `Hotel.images` or `Room.images` array in PostgreSQL

---

## Email — Nodemailer

Transactional emails (booking confirmations) are sent via **Nodemailer**:

- Configured with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_SECURE=true` enables TLS
- `MAIL_FROM` sets the sender address

Email sending is optional — if SMTP variables are absent, email dispatch is silently skipped.

---

## Security & Middleware

### Applied globally in `app.ts`

| Middleware | Purpose |
|---|---|
| `helmet()` | Sets secure HTTP headers (CSP, HSTS, etc.) |
| `cors(corsOptions)` | Restricts cross-origin requests to `CLIENT_URL` |
| `morgan('dev')` | HTTP request logging |
| `express.json()` | JSON body parsing |
| `express.urlencoded()` | Form URL-encoded body parsing |
| `generalLimiter` | Rate limiting — prevents brute force and DDoS |

### Route-Level Middleware

| Middleware | Purpose |
|---|---|
| `authenticate` | Validates JWT; attaches `req.user` |
| `authorize(...roles)` | Guards routes by role |
| `validate(schema)` | Validates `req.body` with Zod; rejects invalid payloads with 400 |

### Error Handling

All errors flow to the centralised `errorHandler` middleware:
- `AppError` instances produce structured JSON responses with the given status code
- Unhandled errors produce `500 Internal Server Error`
- Prisma `NotFoundError` is mapped to `404`

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lumosstay

# Better Auth
BETTER_AUTH_SECRET=your-32-char-secret
BETTER_AUTH_URL=http://localhost:5000

# JWT
ACCESS_TOKEN_SECRET=your-jwt-secret          # Defaults to BETTER_AUTH_SECRET
ACCESS_TOKEN_EXPIRES_MINUTES=15

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
CLIENT_URL=http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-password
SMTP_SECURE=false
MAIL_FROM="LumosStay <noreply@lumosstay.com>"
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database running
- Stripe account (for payments)
- Cloudinary account (for image uploads)

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed

# Start development server with hot reload
npm run dev
```

The API will be available at `http://localhost:5000`.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server with Nodemon (hot reload) |
| `npm run build` | Generate Prisma client and compile TypeScript to `dist/` |
| `npm run start` | Run the compiled production server (`dist/server.js`) |
| `npm run lint` | Run ESLint across `src/` |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:seed` | Seed the database with initial data |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## API Reference Summary

All successful responses follow this envelope:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

All error responses:

```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Paginated list responses include:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```
