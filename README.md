# Course Marketplace Backend

Express + TypeScript + Prisma backend for a course marketplace platform. The backend is being converted from a commerce template into a course-first system with Better Auth, Stripe payments, and provider-backed lesson delivery.

## Requirements

- Node.js 18+
- npm or pnpm
- PostgreSQL

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build TypeScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run Prisma migrations in development
- `npm run db:seed` - Seed bootstrap users

## Environment

Use a `.env` file or environment variables for configuration. See `.env.example` for the current keys and placeholders.

## Current Direction

- Better Auth is the target auth standard for manual login/register and Google login.
- The old store/product/cart domain is being replaced by course, lesson, enrollment, payment, and review modules.
- `plan.md` is the execution checklist for the conversion work.

## Architecture

- Express 5
- TypeScript
- Prisma with PostgreSQL
- Modular monolith structure
- Better Auth for auth/session flows
- Zod validation

## Implementation Tracking

The active conversion checklist lives in [`plan.md`](./plan.md).
