# Course Marketplace Backend Conversion Execution Plan

## Summary

This file is the implementation source of truth for converting the current modular e-commerce backend into a course marketplace backend. It is organized as a sequential execution checklist so each phase can be completed, verified, and marked before moving to the next one.

### Goal

Convert the current store/product/cart backend into a course marketplace backend while preserving the existing TypeScript, Express, Prisma, versioned routing, modular architecture, and shared middleware foundation.

### Chosen Defaults

- Better Auth is the single authentication and authorization standard.
- Auth supports manual email/password registration and login through Better Auth.
- Google login remains supported through Better Auth.
- Protected routes use Better Auth session-based authorization.
- `SELLER` is replaced with `INSTRUCTOR`.
- `CUSTOMER` is replaced with `STUDENT`.
- This is a hard cutover from the commerce domain to the course domain.
- Stripe is the only payment provider in v1.
- Course publishing uses admin moderation in v1.
- Video delivery uses provider-backed playback access, not raw permanent file URLs.

### Completion Tracking Convention

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed

### Execution Rule

Implement phases in order unless a later phase is blocked on a dependency that must be handled earlier. Update each section status as work progresses.

---

## 1. Baseline Audit And Freeze

**Status:** `[x]`

**Completed work:**

- Reviewed the mounted API modules in `src/routes/index.ts`.
- Confirmed the mixed auth runtime:
  - custom JWT/cookie auth under `src/modules/auth`
  - Better Auth mounted in `src/app.ts`
  - separate authorization middleware paths
- Reviewed Prisma schema composition across `prisma/schema`.
- Reviewed startup behavior in `src/server.ts`, including automatic seed execution.
- Confirmed the commerce modules targeted for retirement:
  - `store`
  - `product`
  - `cart`
  - current `category`
- Confirmed the auth stacks targeted for consolidation:
  - custom JWT flow
  - Better Auth flow

**Objective:**
Document the current repo shape so all implementation work has a clear before-state.

**Changes required:**

- Record the active modules currently mounted in the API:
  - `auth`
  - `health`
  - `store`
  - `category`
  - `product`
  - `cart`
- Record current auth architecture:
  - custom JWT/cookie login flow under `src/modules/auth`
  - Better Auth runtime mounted in `src/app.ts`
  - mixed authorization middleware paths
- Record current Prisma schema composition:
  - auth-related models
  - commerce-related models
  - role enums and product/store/cart enums
- Record current route map in `src/routes/index.ts`.
- Record env surface from `.env.example` and `src/config/env.ts`.
- Record startup behavior in `src/server.ts`, including automatic seed execution.
- Confirm retired commerce modules:
  - `store`
  - `product`
  - `cart`
  - current product-attribute `category`
- Confirm auth modules to consolidate:
  - custom JWT flow
  - Better Auth flow

**Acceptance criteria:**

- The current repo structure is fully understood before implementation starts.
- Later phases can reference the baseline without re-discovery.

**Dependencies / blockers:**

- None.

---

## 2. Standardize Auth Foundation On Better Auth

**Status:** `[x]`

**Completed work:**

- Switched the currently mounted business routes to Better Auth-based authorization middleware.
- Updated `src/shared/middlewares/authorize.middleware.ts` to:
  - use Prisma `Role`
  - load the Better Auth session
  - reject blocked users
- Removed `/api/v1/auth` from the active route aggregator in `src/routes/index.ts`.
- Stopped using the custom JWT middleware in the mounted `store`, `category`, `product`, and `cart` routes.
- Restored dedicated OTP verification endpoints for signup under `/api/v1/auth` while keeping protected business routes on Better Auth session authorization.
- Added explicit signup verification routes:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/verify-email`
  - `POST /api/v1/auth/resend-verification`

**Objective:**
Remove mixed-auth behavior and make Better Auth the single auth standard for the platform.

**Changes required:**

- Keep Better Auth as the only active auth foundation for:
  - registration
  - login
  - email verification
  - session management
  - Google login
- Remove the custom JWT-based protected-route standard from business modules.
- Retire token-based route protection from `src/middlewares/auth.middleware.ts`.
- Upgrade or replace `src/shared/middlewares/authorize.middleware.ts` so it becomes the single protected-route middleware.
- Ensure protected route middleware:
  - loads the Better Auth session
  - resolves user identity
  - resolves role from the user record
  - blocks unverified or blocked users as required
- Replace legacy role assumptions:
  - `USER` -> remove
  - `SELLER` -> `INSTRUCTOR`
  - `CUSTOMER` -> `STUDENT`
- Ensure Better Auth user additional fields use the final role set.
- Remove custom `/api/v1/auth` ownership from the target business API surface.
- Keep auth mounted under `/api/auth/*`.
- Ensure manual login/register and Google login both use the same Better Auth session model.
- Decide whether any custom auth service/repository code should be removed immediately or retired after migration completion.

**Acceptance criteria:**

- There is one auth standard in the codebase.
- Protected routes resolve session and role through Better Auth only.
- Google login and manual auth flows are aligned on the same auth platform.

**Dependencies / blockers:**

- Baseline understanding from Phase 1.

---

## 3. Rename Platform Language And Defaults

**Status:** `[~]`

**Completed work so far:**

- Updated root API metadata in `src/app.ts` to identify the service as a course marketplace backend.
- Rewrote `README.md` around the course-platform direction.
- Rewrote `docs/backend-handbook.md` around the course platform architecture and rules.
- Updated `.env.example` comments and examples toward Better Auth, Stripe, and video provider usage.
- Replaced the old storefront OTP email markup with a course-platform verification OTP template using the shared email-template system.

**Remaining work in this phase:**

- Replace runtime role naming from `SELLER`/`CUSTOMER` to `INSTRUCTOR`/`STUDENT`.
- Update seed logic and remaining storefront wording in code comments and runtime messages.
- Remove or rewrite any remaining storefront-specific dashboard/success messaging.

**Objective:**
Replace all active storefront terminology with course marketplace terminology.

**Changes required:**

- Replace role language across code, schema, docs, and seed logic:
  - `SELLER` -> `INSTRUCTOR`
  - `CUSTOMER` -> `STUDENT`
- Replace storefront/grocery/template branding in:
  - root API metadata in `src/app.ts`
  - `README.md`
  - `docs/backend-handbook.md`
  - `.env.example` comments
  - seed banners/messages
- Update self-registration defaults so new users become `STUDENT`.
- Update naming in controller/service/repository comments where still business-facing.
- Remove storefront-specific success page and dashboard wording if still used.

**Acceptance criteria:**

- No active business-facing naming refers to the old marketplace/storefront model.
- Docs and metadata identify the backend as a course marketplace.

**Dependencies / blockers:**

- Auth role decisions from Phase 2.

---

## 4. Clean Startup And Config Conventions

**Status:** `[~]`

**Completed work so far:**

- Removed automatic database seeding from `src/server.ts`.
- Updated `.env.example` with Stripe and video provider placeholders.

**Remaining work in this phase:**

- Align `src/config/env.ts` with the final Better Auth-only and course-platform config surface.
- Remove JWT-only config once the legacy JWT flow is fully retired.
- Add final env validation for Stripe and video provider settings when those modules land.

**Objective:**
Make startup deterministic and align configuration with the target platform.

**Changes required:**

- Remove automatic seed execution from `src/server.ts`.
- Keep seeding available only through explicit script execution.
- Review `src/config/env.ts` and `.env.example`.
- Remove config values that only exist for retired JWT auth if no longer needed.
- Keep only config needed for:
  - Better Auth
  - Google login
  - database
  - email
  - Stripe
  - video provider
  - CORS/security
- Add missing env keys required by:
  - Stripe checkout
  - Stripe webhook verification
  - video provider signing/access
- Ensure config naming is consistent with the course platform.

**Acceptance criteria:**

- Server startup does not mutate database state automatically.
- Env schema matches the target architecture.

**Dependencies / blockers:**

- Auth architecture finalized in Phase 2.

---

## 5. Replace Prisma Enums And User Relations

**Status:** `[~]`

**Completed work so far:**

- Updated Prisma role enum in `prisma/schema/enums.prisma` to the target course roles:
  - `ADMIN`
  - `INSTRUCTOR`
  - `STUDENT`
- Replaced commerce enums in `prisma/schema/enums.prisma` with course-domain enums:
  - `CourseStatus`
  - `EnrollmentStatus`
  - `PaymentStatus`
  - `VideoProvider`
- Updated `prisma/schema/user.prisma` so `User` now defaults to `STUDENT`.
- Reworked `User` relations in `prisma/schema/user.prisma` toward:
  - `authoredCourses`
  - `enrollments`
  - `lessonProgress`
  - `reviews`
  - `payments`
- Replaced the active commerce schema files with course-domain schema definitions in:
  - `prisma/schema/store.prisma`
  - `prisma/schema/product.prisma`
  - `prisma/schema/cart.prisma`
- Regenerated Prisma Client against the new course-domain schema.
- Replaced active runtime role references in mounted/auth paths to use:
  - `Role.INSTRUCTOR`
  - `Role.STUDENT`
- Updated seed env naming and seed defaults toward `INSTRUCTOR`.

**Remaining work in this phase:**

- Complete leftover legacy comments and retired-code references that still mention `SELLER` and `CUSTOMER`.

**Objective:**
Move Prisma types from the commerce domain to the course domain while preserving Better Auth compatibility.

**Changes required:**

- Replace `Role` enum values with:
  - `ADMIN`
  - `INSTRUCTOR`
  - `STUDENT`
- Remove commerce-specific enums and add course-specific enums:
  - `CourseStatus`
  - `EnrollmentStatus`
  - `PaymentStatus`
  - `VideoProvider`
- Review whether auth provider and verification enums remain necessary.
- Update `User` model relations to point to:
  - authored courses
  - enrollments
  - lesson progress
  - reviews
  - payments
- Preserve auth-related user fields required by Better Auth and social login.
- Preserve Better Auth-compatible auth models and relation integrity.

**Acceptance criteria:**

- Prisma enums reflect the course domain.
- The `User` relation graph no longer points to stores, carts, or products.

**Dependencies / blockers:**

- Role decisions from Phases 2 and 3.

---

## 6. Replace Active Domain Schema With Course Models

**Status:** `[~]`

**Completed work so far:**

- Replaced the commerce Prisma models with course-domain models in the schema files.
- Retired cart schema definitions from the active datamodel.
- Unmounted the legacy commerce routes from `src/routes/index.ts` so the active API surface no longer exposes them.
- Removed the legacy commerce module source files from `src/modules/store`, `src/modules/product`, `src/modules/cart`, and `src/modules/category`.
- Added the first replacement course-platform routes:
  - `users`
  - `categories`

**Remaining work in this phase:**

- Introduce the new course-platform modules and routes to replace the retired commerce modules.
- Align the remaining app code to the new course-domain data model.

**Objective:**
Replace store/product/cart schema with course marketplace schema.

**Changes required:**

- Remove retired commerce models from the active target schema:
  - `Store`
  - `Product`
  - `ProductVariation`
  - `ProductSpecification`
  - `Cart`
  - `CartItem`
  - product attribute engine
  - current category model if not reused
- Add `Course` model with:
  - instructor ownership
  - title
  - slug
  - short description
  - full description
  - thumbnail
  - price
  - status
  - publish/moderation metadata
  - rating cache
  - enrollment count
  - timestamps
- Add `Lesson` model with:
  - course relation
  - title
  - summary
  - `orderIndex`
  - video provider
  - provider asset reference
  - playback metadata
  - preview flag
  - duration
  - timestamps
- Add `Enrollment` model with:
  - user relation
  - course relation
  - payment relation
  - access status
  - granted timestamp
  - completion percentage
  - last accessed lesson
  - last accessed timestamp
- Add `LessonProgress` model with:
  - user relation
  - lesson relation
  - watched seconds
  - completion flag
  - completion timestamp
  - last watched timestamp
- Add `Payment` model with:
  - user relation
  - course relation
  - amount
  - currency
  - payment status
  - Stripe checkout session ID
  - payment intent ID
  - reconciliation metadata
  - timestamps
- Add `Review` model with:
  - user relation
  - course relation
  - rating
  - comment
  - timestamps
- Add `CourseCategory` model as a simple course taxonomy.
- Add indexes for:
  - course slug
  - course instructor lookup
  - course status
  - enrollment uniqueness and lookup
  - review by course
  - payment by Stripe identifiers
  - progress by user and lesson
- Add uniqueness constraints where required.

**Acceptance criteria:**

- Prisma schema supports the complete purchase-to-watch flow.
- Old commerce tables are no longer part of the final target schema.

**Dependencies / blockers:**

- Phase 5 enums and relations.

---

## 7. Create And Validate Migration Strategy

**Status:** `[~]`

**Completed work so far:**

- `npx prisma generate` succeeded after regenerating the Prisma client for the new schema.
- `npx prisma validate` succeeded and confirmed the schemas under `prisma/schema` are valid.

**Remaining work in this phase:**

- Create the first cutover migration file for the course marketplace schema.
- Resolve the role-enum data warning for existing `SELLER` and `CUSTOMER` values during migration.
- Apply or test migrations against the target database once database-level approval is granted.

**Objective:**
Generate a safe, executable Prisma migration path for the course-domain cutover.

**Changes required:**

- Create migration(s) for:
  - role changes
  - auth-compatible schema changes
  - commerce model removal
  - course model creation
- Verify migration ordering and dependency correctness.
- Verify Better Auth compatibility with the updated schema.
- Run Prisma generation successfully against the new schema.
- Ensure migration naming is clear and reflects the cutover.

**Acceptance criteria:**

- Migrations execute successfully.
- Prisma client generates cleanly.

**Dependencies / blockers:**

- Phase 6 schema completion.

---

## 8. Build Shared Course-Domain Conventions

**Status:** `[~]`

**Completed work so far:**

- Fixed the shared error middleware so `ApiError.statusCode` is now respected.
- Added the first live course-domain modules:
  - `user`
  - `course-category`
- Wired the active API surface to the new routes in `src/routes/index.ts`.
- Kept the shared pagination and response helpers in use for the first replacement modules.

**Remaining work in this phase:**

- Add shared course-domain helpers for ownership checks, course queries, and public/protected selects.
- Standardize more query parsing and response shaping as additional modules are introduced.

**Objective:**
Create shared conventions so all new modules behave consistently.

**Changes required:**

- Establish shared patterns for:
  - pagination
  - search
  - filtering
  - sorting
  - ownership checks
  - public vs protected selects/response shapes
- Standardize course-domain DTO and query parsing conventions with Zod.
- Normalize service/repository layering conventions for new modules.
- Align error handling:
  - ensure `ApiError` status is read correctly by the global error middleware
  - ensure new modules return consistent error payloads
- Keep response envelope consistent across all modules.

**Acceptance criteria:**

- New modules follow one query/validation/response/error pattern.
- Domain errors map correctly in the global error middleware.

**Dependencies / blockers:**

- Schema available from Phase 6.

---

## 9. Implement User Module

**Status:** `[~]`

**Completed work so far:**

- Added `GET /api/v1/users/me`.
- Added `PATCH /api/v1/users/me`.
- Added `GET /api/v1/users/me/learning`.
- Protected all user routes with Better Auth authorization middleware.
- Added repository/service/controller/validator/types/routes structure for the `user` module.

**Remaining work in this phase:**

- Expand the learning summary once course, lesson, and playback modules are implemented.
- Add any extra account endpoints that are needed after the main course flow lands.

**Objective:**
Add authenticated account endpoints needed for the course platform.

**Changes required:**

- Create `user` module using controller/service/repository/validator/types/routes pattern.
- Add `GET /api/v1/users/me`.
- Add `PATCH /api/v1/users/me`.
- Add learning/account helper endpoint such as `GET /api/v1/users/me/learning` if needed.
- Protect all user routes with Better Auth authorization middleware.
- Ensure response shaping avoids exposing sensitive auth fields.

**Acceptance criteria:**

- Authenticated users can view and update their profile.
- Student learning summary is available.

**Dependencies / blockers:**

- Better Auth route protection from Phase 2.
- Shared conventions from Phase 8.

---

## 10. Implement Course Category Module

**Status:** `[~]`

**Completed work so far:**

- Added a simple `course-category` module.
- Added public list/detail endpoints for course categories.
- Added admin list/create/update endpoints for course categories.
- Added repository/service/controller/validator/types/routes structure for the `course-category` module.

**Remaining work in this phase:**

- Expand category management if moderation or richer taxonomy rules are needed later.
- Integrate category filtering into the upcoming course module.

**Objective:**
Add a simple category taxonomy for courses.

**Changes required:**

- Create course category module in the standard layered pattern.
- Add public endpoints for active categories.
- Add admin endpoints for category create/update/activation state.
- Remove reliance on the existing product-attribute category model.
- Ensure course list filtering can use this category relation.

**Acceptance criteria:**

- Courses can be categorized with a simple admin-managed taxonomy.
- The old product-category engine is retired from active use.

**Dependencies / blockers:**

- `CourseCategory` schema from Phase 6.

---

## 11. Implement Course Module

**Status:** `[~]`

**Completed work so far:**

- Added a full `course` module in the standard layered pattern:
  - repository
  - service
  - controller
  - validator
  - types
  - routes
- Added public course endpoints:
  - `GET /api/v1/courses`
  - `GET /api/v1/courses/:slugOrId`
- Added instructor/admin-managed course endpoints:
  - `POST /api/v1/courses`
  - `GET /api/v1/courses/me`
  - `PATCH /api/v1/courses/:id`
  - `DELETE /api/v1/courses/:id`
  - `POST /api/v1/courses/:id/submit`
- Implemented course query features:
  - pagination
  - search
  - category filter
  - instructor filter
  - price range filter
  - sorting
- Implemented slug generation with uniqueness handling in the service layer.
- Enforced public visibility rules so public course endpoints return only published, non-deleted courses.
- Enforced ownership rules so instructors can only mutate their own courses.
- Added mutation restrictions so non-admin instructors can update or delete only draft/rejected courses.
- Added submit-for-review transition from `DRAFT`/`REJECTED` to `PENDING_REVIEW`.

**Remaining work in this phase:**

- Add admin moderation actions for publish, reject, and archive in the upcoming admin phase.
- Expand course detail shaping with lessons/review context after the lesson and review modules land.
- Revisit course submission completeness rules after lesson creation is available.

**Objective:**
Build the core course catalog and instructor course management flow.

**Changes required:**

- Create `course` module in the standard layered pattern.
- Add instructor endpoints for:
  - create course
  - update own course
  - delete own course
  - list own courses
  - submit course for review
- Add public endpoints for:
  - course list
  - course detail
- Implement slug generation and uniqueness handling.
- Implement list features:
  - search
  - category filter
  - instructor filter if needed
  - price filter
  - sorting
  - pagination
- Implement moderation state transitions:
  - `DRAFT`
  - `PENDING_REVIEW`
  - `PUBLISHED`
  - `REJECTED`
  - `ARCHIVED`
- Ensure public endpoints only expose published courses.
- Ensure instructors can mutate only their own courses.

**Acceptance criteria:**

- Instructors can manage draft courses.
- Public users can browse published courses only.

**Dependencies / blockers:**

- Shared conventions from Phase 8.
- Category module from Phase 10 if category filter is included.

---

## 12. Implement Lesson Module

**Status:** `[~]`

**Completed work so far:**

- Added a full `lesson` module in the standard layered pattern:
  - repository
  - service
  - controller
  - validator
  - types
  - routes
- Added lesson endpoints:
  - `GET /api/v1/courses/:courseId/lessons`
  - `POST /api/v1/courses/:courseId/lessons`
  - `PATCH /api/v1/lessons/:id`
  - `DELETE /api/v1/lessons/:id`
  - `GET /api/v1/lessons/:lessonId/playback`
- Implemented lesson ordering with unique `orderIndex` per course.
- Enforced course ownership checks for instructor/admin lesson management.
- Restricted instructor lesson mutations to draft or rejected courses.
- Added preview lesson behavior:
  - public lesson list returns preview lessons only for published courses
  - playback allows preview access without enrollment only when `isPreview` is true
- Added playback access checks for:
  - course owner
  - admin
  - enrolled student
  - public preview access
- Kept playback responses safe by returning `providerPlaybackRef` only and never exposing `providerAssetId`.

**Remaining work in this phase:**

- Add provider-specific signed playback integration once the concrete video provider service is implemented.
- Add lesson reordering helper endpoints if the product needs batch reorder operations later.
- Expand student curriculum access behavior further when the enrollment module lands.

**Objective:**
Add lesson management and protected playback access.

**Changes required:**

- Create `lesson` module in the standard layered pattern.
- Add instructor lesson CRUD under course ownership.
- Add lesson ordering support through `orderIndex`.
- Add lesson reordering logic if needed.
- Add preview lesson support.
- Store provider-based video references instead of local private media URLs.
- Add student playback endpoint that:
  - checks enrollment
  - allows preview access only when configured
  - returns signed provider playback info
- Ensure provider secrets are never exposed in responses.

**Acceptance criteria:**

- Lessons can be managed and ordered by instructors.
- Protected playback access is role-safe and enrollment-aware.

**Dependencies / blockers:**

- Course module from Phase 11.
- Video provider env/config from Phase 4.

---

## 13. Implement Payment Module

**Status:** `[ ]`

**Objective:**
Add Stripe payment initiation and webhook reconciliation.

**Changes required:**

- Create `payment` module in the standard layered pattern.
- Add `POST /api/v1/payments/checkout`.
- Build Stripe Checkout session creation for a one-course purchase.
- Persist payment records with Stripe identifiers.
- Add `POST /api/v1/payments/webhook`.
- Mount webhook handling with raw body parsing before JSON parsing if required.
- Verify Stripe signatures strictly.
- Make webhook processing idempotent.
- Prevent users from creating checkout for courses they already own.

**Acceptance criteria:**

- Checkout session creation works with correct course/user metadata.
- Duplicate webhook deliveries do not create duplicate payment effects.

**Dependencies / blockers:**

- Payment schema from Phase 6.
- Stripe env/config from Phase 4.

---

## 14. Implement Enrollment Module

**Status:** `[ ]`

**Objective:**
Grant course access only after trusted payment confirmation and expose learning access APIs.

**Changes required:**

- Create `enrollment` module in the standard layered pattern.
- Create enrollment only from verified successful Stripe webhook flow.
- Add endpoints for:
  - `GET /api/v1/enrollments/me`
  - `GET /api/v1/enrollments/me/:courseId`
- Track:
  - granted access
  - last accessed lesson
  - last accessed time
  - completion summary
- Use transactions for:
  - payment success persistence
  - enrollment creation
  - course enrollment count update

**Acceptance criteria:**

- Paid students receive access exactly once.
- Unpaid or failed payments never create enrollments.

**Dependencies / blockers:**

- Payment webhook handling from Phase 13.
- Course schema from Phase 6.

---

## 15. Implement Lesson Progress Behavior

**Status:** `[ ]`

**Objective:**
Track lesson watch progress and course completion state.

**Changes required:**

- Add lesson progress update endpoint:
  - `PATCH /api/v1/lessons/:lessonId/progress`
- Persist:
  - watched seconds
  - completion flag
  - completion timestamp
  - last watched timestamp
- Allow progress updates only for enrolled students.
- Recompute enrollment-level completion percentage.
- Update resume-learning metadata:
  - last lesson
  - last access time

**Acceptance criteria:**

- Only enrolled students can update progress.
- Completion aggregation and resume state are correct.

**Dependencies / blockers:**

- Enrollment module from Phase 14.
- Lesson schema from Phase 6.

---

## 16. Implement Review Module

**Status:** `[ ]`

**Objective:**
Allow students to review enrolled courses and maintain cached rating aggregates.

**Changes required:**

- Create `review` module in the standard layered pattern.
- Add endpoints for:
  - create review
  - update review
  - list reviews by course
- Enforce:
  - one review per student per course
  - active enrollment required
- Recompute and persist course aggregate fields:
  - average rating
  - total review count
- Ensure public review listing does not expose sensitive user data.

**Acceptance criteria:**

- Review integrity rules are enforced.
- Course review aggregates remain accurate after changes.

**Dependencies / blockers:**

- Enrollment logic from Phase 14.
- Course schema from Phase 6.

---

## 17. Implement Admin Module

**Status:** `[ ]`

**Objective:**
Add admin moderation and platform reporting endpoints.

**Changes required:**

- Create `admin` module in the standard layered pattern.
- Add admin dashboard summary endpoints for:
  - users
  - instructors
  - courses
  - payments
  - enrollments
- Add moderation endpoints for:
  - approve course
  - reject course
  - archive course
- Add admin visibility/reporting endpoints needed for v1 operations.
- Enforce strict admin-only access.

**Acceptance criteria:**

- Admin can moderate courses.
- Admin can inspect core platform activity and aggregates.

**Dependencies / blockers:**

- Course module from Phase 11.
- Payment and enrollment data from Phases 13 and 14.

---

## 18. Replace Route Aggregator

**Status:** `[~]`

**Completed work so far:**

- Removed the old commerce route registrations from `src/routes/index.ts`.
- Added the first course-platform route registrations:
  - `auth`
  - `user`
  - `course-category`
  - `course`
  - `lesson`
- Kept `/api/v1` as the active business API namespace.
- Better Auth remains mounted under `/api/auth/*`.

**Remaining work in this phase:**

- Add the remaining course-platform routes as their modules are built:
  - `course`
  - `lesson`
  - `enrollment`
  - `payment`
  - `review`
  - `admin`

**Objective:**
Switch the active business route surface from commerce routes to course-platform routes.

**Changes required:**

- Remove old route registrations from `src/routes/index.ts`:
  - `store`
  - `category`
  - `product`
  - `cart`
- Add new route registrations:
  - `user`
  - `course`
  - `lesson`
  - `enrollment`
  - `payment`
  - `review`
  - `admin`
  - `course-category`
- Keep `/api/v1` as the business API namespace.
- Keep Better Auth mounted under `/api/auth/*`.
- Ensure health route remains available.

**Acceptance criteria:**

- Active route map matches the course marketplace target.
- No retired commerce routes remain mounted.

**Dependencies / blockers:**

- Modules from Phases 9 through 17.

---

## 19. Update Seeds, Docs, And Examples

**Status:** `[ ]`

**Objective:**
Align onboarding artifacts with the new course-platform backend.

**Changes required:**

- Update `prisma/seed.ts` to create:
  - `ADMIN`
  - `INSTRUCTOR`
- Remove seed wording tied to storefront/store sellers.
- Update `.env.example` to reflect:
  - Better Auth
  - Google login
  - Stripe
  - video provider
  - course marketplace naming
- Update `README.md`.
- Update `docs/backend-handbook.md`.
- Update root API metadata and other contributor-facing descriptions.

**Acceptance criteria:**

- New contributors can configure and understand the backend as a course marketplace.
- Seed logic matches the final role model.

**Dependencies / blockers:**

- Auth and role decisions from earlier phases.

---

## 20. Security And Operational Hardening

**Status:** `[ ]`

**Objective:**
Harden validation, RBAC, sensitive data handling, and operational visibility.

**Changes required:**

- Apply Zod validation to all new routes:
  - body
  - params
  - query
- Enforce RBAC across:
  - admin routes
  - instructor routes
  - student-only learning routes
- Add or tune stricter rate limits for:
  - auth endpoints
  - payment checkout
  - payment webhook
  - review creation
- Add structured logs or audit events for:
  - payment success/failure handling
  - enrollment creation
  - moderation actions
- Ensure public APIs do not expose:
  - unpublished course data
  - protected lesson provider references
  - private payment details

**Acceptance criteria:**

- Security-sensitive routes are validated and protected.
- Money and access-critical flows are observable.

**Dependencies / blockers:**

- Core modules implemented.

---

## 21. Final Cleanup

**Status:** `[~]`

**Completed work so far:**

- Removed the retired commerce source files from the repo working tree.
- Eliminated the need for TypeScript to exclude the retired commerce modules.

**Remaining work in this phase:**

- Remove leftover storefront comments and wording in remaining auth/runtime files.
- Remove the old custom JWT implementation once it is no longer needed by any active code path.

**Objective:**
Remove dead commerce and legacy auth code so the codebase reflects one coherent platform.

**Changes required:**

- Remove dead code from:
  - custom JWT auth logic no longer used
  - old store logic
  - old product logic
  - old cart logic
  - old product-category attribute engine
- Remove unused utilities, types, comments, and imports tied to the retired domain.
- Remove stale route references.
- Ensure no active references remain to retired models or enums.
- Review for leftover storefront naming or template messaging.

**Acceptance criteria:**

- The repo reflects one course marketplace backend, not a partial conversion.

**Dependencies / blockers:**

- All major migration phases completed.

---

## 22. Verification And Completion Checklist

**Status:** `[ ]`

**Objective:**
Verify the final system end-to-end and use this file as the completion ledger.

**Changes required:**

- Run Prisma generate successfully.
- Run Prisma migrations successfully.
- Run TypeScript build successfully.
- Verify Better Auth flows:
  - manual register
  - manual login
  - email verification
  - Google login
  - protected session access
- Verify business flows:
  - instructor course creation
  - course moderation
  - public course listing
  - Stripe checkout
  - Stripe webhook enrollment
  - protected lesson playback
  - lesson progress updates
  - course reviews
  - admin reporting
- Update each phase status in this file as work is completed.

**Acceptance criteria:**

- End-to-end purchase-to-watch flow works.
- `plan.md` can be used as the definitive implementation checklist.

**Dependencies / blockers:**

- All previous phases.

---

## Cross-Cutting Cleanup Checklist

- [ ] Remove remaining storefront naming from active code paths.
- [ ] Remove retired commerce modules from route mounting.
- [ ] Remove retired commerce Prisma models and references.
- [ ] Remove mixed-auth assumptions from middleware and services.
- [ ] Ensure Better Auth is the only protected-route auth standard.
- [ ] Ensure all new routes use the shared response envelope.
- [ ] Ensure all new routes use Zod validation.
- [ ] Ensure all role checks use `ADMIN`, `INSTRUCTOR`, `STUDENT`.
- [ ] Ensure no public endpoint leaks unpublished content or protected playback data.

---

## Final Verification Checklist

- [ ] Prisma schema finalized for course domain.
- [ ] Prisma client generates successfully.
- [ ] Migrations apply successfully.
- [ ] TypeScript build passes.
- [ ] Better Auth manual registration works.
- [ ] Better Auth manual login works.
- [ ] Better Auth email verification works.
- [ ] Better Auth Google login works.
- [ ] Session-based protected routing works.
- [ ] Instructor can create and manage own courses.
- [ ] Public users can browse published courses only.
- [ ] Admin moderation flow works.
- [ ] Stripe checkout session creation works.
- [ ] Stripe webhook verification works.
- [ ] Enrollment is created only after successful trusted payment confirmation.
- [ ] Lesson playback is protected and signed correctly.
- [ ] Lesson progress persists and aggregates correctly.
- [ ] Reviews enforce enrollment and uniqueness rules.
- [ ] Admin summary/reporting endpoints return correct data.
- [ ] Dead commerce and legacy auth code is removed.
