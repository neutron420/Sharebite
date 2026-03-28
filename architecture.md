# ShareBite Architecture

This document explains how ShareBite is put together today, using the current codebase as the source of truth.

## 1. Architectural Goals

ShareBite is designed to support a fairly broad operational surface inside one repository:

- a public marketing and onboarding site
- role-based dashboards for four actor types
- API-driven operational workflows
- real-time notifications and chat
- location-aware discovery and rider tracking
- moderation, reporting, and support tooling
- deployment paths for both local Compose and AWS ECS

The architecture favors a single Next.js application for most UI and API work, with a separate websocket process for real-time fan-out.

## 2. High-Level Topology

```text
Client Browser
  |
  +--> Next.js App Router UI
  |      |
  |      +--> route handlers in app/api/*
  |              |
  |              +--> Prisma -> PostgreSQL
  |              +--> Redis
  |              +--> Cloudflare R2
  |              +--> Groq / AI SDK
  |              +--> Resend
  |              +--> Translation provider
  |
  +--> websocket bootstrap via /api/auth/token
         |
         v
      ws://... -> server/ws.ts
                  |
                  +--> Redis pub/sub for cross-instance delivery
```

## 3. Primary Building Blocks

### 3.1 App Router application

The main application lives under `app/` and uses Next.js App Router conventions:

- `app/page.tsx` renders the public landing experience
- `app/(auth)` contains registration, login, and recovery screens
- `app/(dashboard)` splits the private UI into donor, NGO, rider, and admin areas
- `app/api` holds the backend route handlers for the product

This keeps page rendering, server handlers, and route-specific UI close together, which is a good fit for a single-product operational app.

### 3.2 Shared component layer

The `components/` directory contains:

- shared UI primitives and wrappers
- chat UI
- map widgets
- floating AI support UI
- socket provider and notification helpers
- support surfaces like the bug report modal

`SocketProvider` is mounted globally in `app/layout.tsx`, which means most pages can subscribe to live events without repeating connection logic.

### 3.3 Shared library layer

The `lib/` directory is the main service layer. Important modules include:

- `lib/auth.ts`: JWT signing, verification, role-aware session resolution
- `lib/api-handler.ts`: route wrapper that adds rate limiting and security headers
- `lib/prisma.ts`: Prisma singleton creation with the PostgreSQL adapter
- `lib/redis.ts`: Redis connection with fail-open behavior for degraded modes
- `lib/notifications.ts`: persistent notification creation plus websocket relay trigger
- `lib/achievements.ts`: donor karma and badge logic
- `lib/s3.ts`: Cloudflare R2 client configuration
- `lib/validations/*`: Zod validation schemas

This is where most shared backend behavior is centralized.

### 3.4 Standalone websocket server

Real-time delivery is intentionally separated from the main Next.js process.

`server/ws.ts` is responsible for:

- authenticating websocket clients with JWTs
- keeping an in-memory map of connected users on the current instance
- persisting chat messages
- broadcasting notifications and typing events
- relaying rider location updates
- using Redis pub/sub so multiple instances can still deliver events correctly

It also exposes a small internal HTTP endpoint on port `8081` so API handlers can trigger websocket delivery without holding direct websocket state themselves.

### 3.5 Background worker

`server/watchtower.ts` is a lightweight background worker that scans for soon-to-expire donations and notifies nearby verified NGOs. It is not currently wired into the default startup scripts, so it is best thought of as an optional worker process rather than a guaranteed always-on service.

## 4. Route Organization

### Public and auth routes

- public landing page
- auth pages
- terms pages
- demo pages

### Dashboard routes

- donor dashboard routes
- NGO dashboard routes
- rider dashboard routes
- admin dashboard routes

### API routes

The API surface is grouped by domain rather than by strict CRUD resource families. Key clusters include:

- `auth`
- `donations`
- `requests`
- `chat`
- `admin`
- `notifications`
- `reports`
- `upload`
- `translate`
- `public stats`

This is practical for a product app with strong role-based workflows, even if it is not a pure REST-only structure.

## 5. Security And Session Model

### 5.1 Session cookies

Sessions are JWT-based and role-aware. The code recognizes:

- `session`
- `admin_session`
- `donor_session`
- `ngo_session`
- `rider_session`

`getSession()` attempts to resolve the best token for the current request by checking request context and role-specific cookies.

### 5.2 API protection

There are two main protection layers:

- `proxy.ts` performs API-level CORS handling and blocks protected API paths without a valid session
- `withSecurity()` wraps route handlers with rate limiting and standard headers

For admin routes, there is an extra hard role check in `proxy.ts` before the request even reaches the handler.

### 5.3 Identity and verification

Authentication uses:

- email and password
- bcrypt password hashing
- JWT cookies
- Turnstile verification on login and forgot-password

Password recovery uses:

- Resend for email delivery
- Redis for short-lived OTP storage
- a verify-and-reset sequence across `/api/auth/forgot-password`, `/api/auth/verify-otp`, and `/api/auth/reset-password`

### 5.4 Operational moderation

The data model includes:

- audit logs
- strike counts
- suspension windows
- permanent license suspension flags
- reports and donor reports
- bug reports and admin responses

That makes moderation part of the core architecture rather than an afterthought.

## 6. Data Layer

### 6.1 Primary store

PostgreSQL is the source of truth for durable business data. Prisma models include:

- `User`
- `FoodDonation`
- `PickupRequest`
- `Review`
- `Notification`
- `Conversation`
- `Message`
- `AuditLog`
- `Report`
- `DonorReport`
- `Violation`
- `Badge`
- `UserBadge`
- `BugReport`
- `BugResponse`

### 6.2 Domain relationships

At a high level:

- a donor creates many `FoodDonation` records
- an NGO creates many `PickupRequest` records
- a donation can receive multiple requests, but approval chooses the active fulfillment path
- a rider may be attached to a request
- notifications point to users
- conversations and messages are tied to a donation and two participants
- reviews connect a donation, reviewer, and reviewee

### 6.3 Query style

The code leans on Prisma `include` queries to hydrate operational views in a single round trip. This is visible in stats endpoints, requests endpoints, donation listings, admin pages, and chat handlers.

That keeps the route layer straightforward, though it does mean some handlers are fairly query-heavy.

## 7. Redis Responsibilities

Redis is not just a cache here. It supports several distinct behaviors:

- request rate limiting
- OTP storage for password reset
- geospatial donation indexing for proximity search
- rider live location with TTL
- karma leaderboard sorted set
- websocket pub/sub between instances

A notable architectural decision is that many Redis-dependent features are designed to degrade gracefully:

- rate limiting fails open if Redis is unavailable
- donation geo search falls back to unfiltered results
- leaderboard returns an empty list rather than crashing

This improves availability, but it also means some protective or enhancement features become soft guarantees when Redis is down.

## 8. Realtime Architecture

### 8.1 Connection bootstrap

The browser gets a JWT from `/api/auth/token`, then opens a websocket connection using `NEXT_PUBLIC_WS_URL`.

### 8.2 Event types

Observed real-time behaviors include:

- notifications
- new chat messages
- typing indicators
- rider location broadcasts
- role-targeted admin or rider alerts

### 8.3 Delivery path

The general path looks like this:

1. A route handler creates durable data in PostgreSQL.
2. The handler either calls `createNotification()` or posts directly to the internal websocket relay endpoint.
3. The websocket server publishes or consumes events through Redis pub/sub.
4. Connected clients subscribed through `SocketProvider` receive the event.

This keeps the database as the durable record and websockets as the low-latency delivery layer.

## 9. Fulfillment Architecture

The most important business process is the donation fulfillment lifecycle.

### 9.1 Donation creation

When a donor creates a donation:

1. the donation is stored in PostgreSQL
2. admins and nearby NGOs receive persistent notifications
3. the donation is indexed in Redis GEO if coordinates are present
4. donor karma and badges may be updated

### 9.2 NGO request path

When an NGO requests food:

1. the route confirms the NGO is verified and not suspended
2. a `PickupRequest` is created
3. the donor receives a notification

### 9.3 Approval path

When the donor or an admin approves:

1. the selected request becomes `APPROVED`
2. a handover PIN is generated
3. the donation moves to `APPROVED`
4. competing pending requests are rejected
5. riders can be notified that a delivery opportunity exists

### 9.4 Two fulfillment variants

The system currently supports two variants:

- direct NGO handover, where the NGO verifies the PIN and completes the request
- rider-assisted fulfillment, where a rider is assigned or claims the mission, collects the food from the donor, then delivers it to the NGO

That hybrid model is a key architectural feature because it lets the platform operate with or without rider capacity.

## 10. AI And External Services

### 10.1 AI support

`/api/chat` uses Groq through the AI SDK for a ShareBite-specific support assistant. The prompt is intentionally product-aware and pulls live counts from the database to ground certain answers.

### 10.2 Voice transcription

`/api/chat/voice` sends uploaded audio to Groq Whisper transcription.

### 10.3 Translation

`/api/translate` proxies a third-party translation API using RapidAPI credentials.

### 10.4 Email

Forgot-password email delivery goes through Resend.

### 10.5 Storage

Uploads use Cloudflare R2 via presigned S3-compatible URLs, which keeps large file transfer out of the main app server.

## 11. Deployment Architecture

### 11.1 Local

Local development can run in a split-process shape:

- Next.js app on port `3000`
- websocket server on `8080`
- internal relay on `8081`
- PostgreSQL
- Redis

Docker Compose also provides this shape with named services for `web`, `ws`, `db`, and `redis`.

### 11.2 Container image

The `Dockerfile` builds:

- dependencies
- Prisma client
- standalone Next.js output
- runtime image with server files and Prisma client included

### 11.3 AWS deployment

Terraform defines an AWS ECS/Fargate deployment with:

- cluster and service resources
- ALB integration
- security groups
- ECR image source
- environment variable injection
- domain and networking resources

The ECS service maps both HTTP and websocket traffic through separate target groups.

## 12. Architectural Strengths

- clear separation between primary web app and real-time delivery path
- strong role-based route and data organization
- durable notifications backed by database records
- Redis used thoughtfully for both performance and user experience
- Prisma schema captures operations, moderation, trust, and gamification in one domain model
- deployment story exists for both local multi-service use and cloud infrastructure

## 13. Current Constraints And Observations

- the committed startup script launches the Next.js dev server inside the container, even though the image is built for standalone output
- `server/watchtower.ts` exists but is not part of the default runtime orchestration
- admin registration is currently open in the registration route and should usually be gated in production
- the donation enum includes `REQUESTED`, but the current implementation primarily tracks intermediate fulfillment progress on `PickupRequest.status`
- some Redis-backed safeguards intentionally fail open, which is good for uptime but weaker for strict enforcement

## 14. Recommended Reading After This

- [Workflow Guide](./workflow.md) for step-by-step platform and engineering flows
- [README](./README.md) for setup and day-to-day repo usage
