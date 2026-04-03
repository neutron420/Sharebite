# ShareBite

ShareBite is a full-stack food rescue platform built to move surplus food from donors to NGOs as quickly and transparently as possible. The application combines a polished public site, role-based dashboards, operational APIs, real-time notifications, map-driven discovery, and optional rider logistics into one system.

The codebase is organized around four main actors:

- `DONOR` users publish and manage food donations.
- `NGO` users discover food, request pickups, and complete collection.
- `RIDER` users handle optional last-mile pickup and delivery.
- `ADMIN` users verify organizations, review activity, moderate issues, and monitor platform health.

## Documentation

- [Architecture Guide](./architecture.md)
- [Workflow Guide](./workflow.md)
- [API Test Notes](./tests/README.md)
- [Monitoring Guide](./monitoring/README.md)

## What The Platform Includes

- Role-based authentication and dashboards for donors, NGOs, riders, and admins
- Food donation publishing with category, quantity, weight, expiry, pickup window, and map coordinates
- NGO request and fulfillment flows, including direct handover and rider-assisted delivery
- Real-time notifications and messaging over a dedicated websocket server
- Redis-backed rate limiting, OTP storage, geospatial donation lookup, rider location, and karma leaderboard
- Cloudflare R2 presigned uploads for food images and delivery proof
- AI support chat and voice transcription endpoints using Groq
- Translation support and map-based interfaces for multilingual, location-aware usage
- Admin tools for users, requests, reviews, reports, logs, bugs, verification, and operational stats
- Karma, badges, and leaderboard mechanics for donor and rider engagement

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI, custom UI components, Framer Motion |
| Backend | Next.js route handlers, standalone websocket server with `ws` |
| Database | PostgreSQL via Prisma 7 and `@prisma/adapter-pg` |
| Realtime and cache | Redis with `ioredis` |
| File storage | Cloudflare R2 via S3-compatible APIs |
| Maps | Mapbox GL |
| AI features | Groq via AI SDK, Groq Whisper transcription |
| Email | Resend |
| Bot protection | Cloudflare Turnstile |
| Testing | Vitest |
| Packaging and runtime | Bun, Docker, Docker Compose |
| Infra as code | Terraform for AWS ECS/Fargate, ALB, networking, and domain wiring |

## Repository Layout

```text
sharebite/
|-- app/                   # App Router pages, layouts, route groups, and API handlers
|   |-- (auth)/            # Public login, register, and password recovery pages
|   |-- (dashboard)/       # Role-specific dashboard experiences
|   |-- api/               # Route handlers for auth, donations, requests, chat, admin, etc.
|   |-- demo/              # Demo pages
|   `-- terms/             # Role-specific terms pages
|-- components/            # Reusable UI, chat, map, support, and provider components
|-- lib/                   # Shared auth, Prisma, Redis, storage, notifications, validation, and helpers
|-- prisma/                # Prisma schema, migrations, and badge seeding
|-- public/                # Static assets
|-- server/                # Standalone websocket server and background worker scripts
|-- terraform/             # AWS deployment infrastructure
|-- tests/                 # Route and behavior-oriented Vitest suites
|-- Dockerfile             # Container image build
|-- docker-compose.yml     # Multi-service local stack
|-- proxy.ts               # Global API auth, RBAC, and CORS handling
`-- start.sh               # Container startup script
```

## Route Map

### Public and shared pages

- `/` public landing page
- `/login`, `/register`, `/forgot-password`
- `/donations` shared browsing area
- `/terms/*` role-specific terms pages
- `/demo/*` experimental or presentation pages

### Dashboard areas

- `/donor/*` donor dashboard, profile, donations, NGOs, messages, notifications, complaints
- `/ngo/*` NGO dashboard, find-food, requests, history, messages, notifications, complaints
- `/rider/*` rider dashboard, bounties, missions, notifications, settings
- `/admin/*` admin dashboard, users, requests, donations, reviews, reports, logs, map, verification, bugs, settings

### API areas

- `/api/auth/*` registration, login, logout, session lookup, OTP verification, password reset, token fetch
- `/api/donations/*` donation CRUD and cleanup
- `/api/requests/*` pickup requests, approval, rider assignment, handover, delivery, verification
- `/api/chat/*` AI support, conversations, messages, read state, voice transcription
- `/api/admin/*` admin dashboards and moderation endpoints
- `/api/upload/*` authenticated presigned upload endpoints
- `/api/public/stats` public impact stats
- `/api/leaderboard` karma leaderboard
- `/api/translate` translation proxy
- `/api/bugs`, `/api/reports`, `/api/donor-reports`, `/api/reviews`, `/api/notifications`

## System Snapshot

```text
Browser
  |
  v
Next.js App Router UI
  |
  +--> Next.js API routes ----------------------------+
  |                                                   |
  |                                                   +--> PostgreSQL via Prisma
  |                                                   +--> Redis for rate limits, geo, OTP, leaderboard, rider location
  |                                                   +--> Cloudflare R2 for uploads
  |                                                   +--> Groq for AI chat and transcription
  |                                                   +--> Resend for password reset email
  |                                                   +--> RapidAPI translation provider
  |
  +--> /api/auth/token --> websocket connection ------> server/ws.ts
                                                        |
                                                        +--> Redis pub/sub fan-out
                                                        +--> real-time notifications, chat, typing, rider tracking
```

## Core Domain Model

The Prisma schema centers on a few important entities:

- `User`: base identity model with role, verification state, profile, location, strikes, suspension, and rider availability
- `FoodDonation`: donor-created donation record with food details, status, timing, and pickup location
- `PickupRequest`: NGO request lifecycle, optional rider assignment, handover PIN, proof, and timestamps
- `Notification`: persistent in-app alerts for request status, new donations, bug responses, and system events
- `Conversation` and `Message`: one-to-one operational chat around donations
- `Review`: post-transaction trust signal tied to a donation
- `AuditLog`, `Report`, `DonorReport`, `Violation`: admin moderation and governance records
- `Badge` and `UserBadge`: donor recognition and achievement tracking
- `BugReport` and `BugResponse`: user support issue intake and admin replies

## Status Model

Two status systems work together:

- `FoodDonation.status`: `AVAILABLE`, `REQUESTED`, `APPROVED`, `COLLECTED`, `EXPIRED`
- `PickupRequest.status`: `PENDING`, `APPROVED`, `REJECTED`, `ASSIGNED`, `ON_THE_WAY`, `COMPLETED`

In the current code, most operational progress is tracked on `PickupRequest.status`, while `FoodDonation.status` is actively moved through `AVAILABLE`, `APPROVED`, and `COLLECTED`.

## Environment Variables

The project does not currently ship with a committed `.env.example`, so this table is the practical setup reference derived from the codebase.

| Variable | Required | Used for |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection for Prisma and worker processes |
| `JWT_SECRET` | Yes | Session token signing and verification |
| `REDIS_URL` | Recommended | Rate limiting, OTP storage, geo search, leaderboard, rider location, websocket fan-out |
| `NEXT_PUBLIC_APP_URL` | Recommended | Allowed origin for API CORS handling in `proxy.ts` |
| `NEXT_PUBLIC_WS_URL` | Recommended | Browser websocket base URL |
| `INTERNAL_WS_URL` | Recommended | Internal HTTP relay from app server to websocket server |
| `R2_ACCOUNT_ID` | Yes for uploads | Cloudflare R2 endpoint construction |
| `R2_ACCESS_KEY_ID` | Yes for uploads | Cloudflare R2 credentials |
| `R2_SECRET_ACCESS_KEY` | Yes for uploads | Cloudflare R2 credentials |
| `R2_BUCKET_NAME` | Yes for uploads | Bucket used for signed uploads |
| `R2_PUBLIC_DOMAIN` | Yes for uploads | Public base URL for uploaded objects |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Recommended | Map rendering in donor, NGO, and rider interfaces |
| `GROQ_API_KEY` | Optional | AI support chat and voice transcription |
| `RESEND_API_KEY` | Optional | Forgot-password email delivery |
| `RAPIDAPI_KEY` | Optional | Translation API access |
| `RAPIDAPI_HOST` | Optional | Translation API host |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Recommended | Browser Turnstile widget |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Recommended | Server-side Turnstile verification |
| `NODE_ENV` | Recommended | Runtime mode for cookies and logging behavior |

## Local Development

### Prerequisites

- Bun installed locally
- PostgreSQL available, or the `db` service from Docker Compose
- Redis available, or the `redis` service from Docker Compose

### 1. Install dependencies

```bash
bun install
```

### 2. Create `.env`

Add the environment variables listed above. At minimum you should supply:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=replace-this
REDIS_URL=redis://127.0.0.1:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:8080
INTERNAL_WS_URL=http://localhost:8081
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_DOMAIN=
NEXT_PUBLIC_MAPBOX_TOKEN=
GROQ_API_KEY=
RESEND_API_KEY=
RAPIDAPI_KEY=
RAPIDAPI_HOST=
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=
```

### 3. Prepare the database

```bash
bunx prisma generate
bunx prisma migrate dev
```

Optional seed step for badge data:

```bash
bun run prisma/seed-badges.ts
```

### 4. Run supporting services

If you do not already have PostgreSQL and Redis running locally:

```bash
docker compose up db redis -d
```

### 5. Run the app

Start the web app and websocket server in separate terminals:

```bash
bun run dev
```

```bash
bun run ws
```

If you want the expiry alert worker running as well:

```bash
bun run server/watchtower.ts
```

Then open `http://localhost:3000`.

## Docker And Compose

The repository includes a multi-service Compose setup with:

- `web` for the Next.js application
- `ws` for the dedicated websocket and internal relay server
- `db` for PostgreSQL
- `redis` for cache and realtime coordination

Bring the full stack up with:

```bash
docker compose up --build
```

### Important runtime note

The committed `start.sh` currently starts `server/ws.ts` and then runs `bun run dev` for the web application. That is convenient for iterative environments, but it is not a typical hardened production launch path. The image itself is built with standalone output, so if you want a stricter production runtime, update the startup command to use the built server rather than the dev server.

## Testing

Run the suite with:

```bash
bun run test
```

Available test coverage currently targets API and behavior-heavy areas such as:

- authentication
- donations
- requests
- donor and NGO flows
- admin actions
- notifications
- uploads
- leaderboard
- reports and reviews
- regression checks

Linting can be run with:

```bash
bun run lint
```

## Deployment

### Docker image

The `Dockerfile` builds a standalone Next.js output, copies the generated Prisma client, includes the websocket server files, and exposes ports `3000`, `8080`, and `8081`.

### Terraform

The `terraform/` directory defines an AWS-oriented deployment shape with:

- ECS Fargate service
- ECR repository
- ALB listeners and target groups
- VPC and network resources
- domain wiring
- environment variable injection for the app runtime

The ECS definition is set up to expose both the web port and websocket port through the load balancer.

## Notable Implementation Notes

- `proxy.ts` handles CORS, API route protection, and an extra admin-only guard for `/api/admin/*`.
- `lib/auth.ts` resolves sessions across role-specific cookies and tries to infer the preferred role from the request path.
- `withSecurity()` applies rate limiting and security headers around many route handlers. If Redis is unavailable, rate limiting fails open rather than taking the API down.
- Donation geo-indexing, rider location, leaderboard, OTP storage, and websocket pub/sub all depend on Redis.
- `server/watchtower.ts` exists as a background worker for urgent expiry alerts, but it is not part of the default `package.json` scripts.
- The registration route currently allows direct admin registration. That may be acceptable for internal use, but most production deployments would gate admin creation behind an invite or secret.

## Suggested Reading Order

1. [README](./README.md) for setup and repo orientation
2. [Architecture Guide](./architecture.md) for the technical layout
3. [Workflow Guide](./workflow.md) for lifecycle and operations
4. [API Test Notes](./tests/README.md) for test context

## License

No license file is currently committed in this repository. If you plan to open-source the project, add a top-level license file and update this section.
