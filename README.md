# ShareBite

ShareBite is a full-stack food rescue platform built to move surplus food from donors to NGOs as quickly and transparently as possible. The application combines a polished public site, role-based dashboards, operational APIs, real-time notifications, map-driven discovery, and optional rider logistics into one system.

The codebase is organized around four main actors:

- `DONOR` users publish and manage food donations.
- `NGO` users discover food, request pickups, and complete collection.
- `RIDER` users handle optional last-mile pickup and delivery.
- `ADMIN` users verify organizations, review activity, moderate issues, and monitor platform health.

## What ShareBite Does

ShareBite solves the food-rescue workflow end to end:

- Donors publish surplus food with quantity, expiry, and pickup location in minutes.
- NGOs discover nearby, available donations and request pickups quickly.
- Riders can be assigned for assisted pickup and handover when direct collection is difficult.
- Admins verify organizations, moderate abuse, monitor activity, and maintain platform trust.

The result is a practical, real-world coordination system that reduces food waste and improves delivery speed to communities that need support.

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

## Tech Stack

| Category | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| UI and styling | Tailwind CSS, Radix UI, custom UI components, Framer Motion |
| Backend | Next.js route handlers, standalone websocket server with `ws` |
| Data | PostgreSQL via Prisma 7 and `@prisma/adapter-pg` |
| Realtime and cache | Redis with `ioredis` |
| File storage | Cloudflare R2 via S3-compatible APIs |
| Maps | Mapbox GL |
| AI features | Groq via AI SDK, Groq Whisper transcription |
| Email | Resend |
| Bot protection | Cloudflare Turnstile |
| Testing | Vitest |
| Runtime and packaging | Bun, Docker, Docker Compose |
| Infrastructure and deployment | Kubernetes, Argo CD, Terraform, AWS ECS/Fargate, ALB, networking, and domain wiring |

### Tech Stack Logos

#### Frontend and UI

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/) [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwind-css&logoColor=38BDF8)](https://tailwindcss.com/) [![Framer Motion](https://img.shields.io/badge/Framer_Motion-0B0B0B?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)

#### Backend, Data, and Realtime

[![Bun](https://img.shields.io/badge/Bun-0A0A0A?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/) [![Prisma](https://img.shields.io/badge/Prisma-0C344B?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-1B2B5B?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Redis](https://img.shields.io/badge/Redis-8C1C13?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/) [![WebSocket](https://img.shields.io/badge/WebSocket-111111?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/docs/Web/API/WebSockets_API)

#### Deployment and Infrastructure

[![Docker](https://img.shields.io/badge/Docker-062036?style=for-the-badge&logo=docker&logoColor=2496ED)](https://www.docker.com/) [![Kubernetes](https://img.shields.io/badge/Kubernetes-0B132B?style=for-the-badge&logo=kubernetes&logoColor=326CE5)](https://kubernetes.io/) [![Argo CD](https://img.shields.io/badge/Argo_CD-1F2937?style=for-the-badge&logo=argo&logoColor=EF7B4D)](https://argo-cd.readthedocs.io/) [![Terraform](https://img.shields.io/badge/Terraform-1A1A2E?style=for-the-badge&logo=terraform&logoColor=844FBA)](https://www.terraform.io/) [![AWS](https://img.shields.io/badge/AWS-111111?style=for-the-badge&logo=amazonaws&logoColor=FF9900)](https://aws.amazon.com/)

#### Integrations and Platform Services

[![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-1A1A1A?style=for-the-badge&logo=cloudflare&logoColor=F38020)](https://www.cloudflare.com/developer-platform/r2/) [![Mapbox](https://img.shields.io/badge/Mapbox-1B1B1B?style=for-the-badge&logo=mapbox&logoColor=white)](https://www.mapbox.com/) [![Resend](https://img.shields.io/badge/Resend-0A0A0A?style=for-the-badge&logo=maildotru&logoColor=white)](https://resend.com/) [![Groq](https://img.shields.io/badge/Groq-1E1E1E?style=for-the-badge&logo=databricks&logoColor=white)](https://groq.com/)

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

The project includes a committed `.env.example`. The table below is the practical reference for required and optional runtime configuration.

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

### Kubernetes And Argo CD (External DB And Redis)

This repository now includes Kubernetes and Argo CD manifests for deploying only application workloads:

- `web` (Next.js) on port `3000`
- `ws` (websocket server) on port `8080`

No PostgreSQL or Redis manifests are included. The deployment expects external managed services through environment variables (`DATABASE_URL`, `REDIS_URL`).

#### Deployment Status

- Application architecture is complete.
- API, websocket, and operational workflows are complete.
- Kubernetes base and overlays are complete.
- Argo CD Applications are complete.
- External Secrets integration is complete.
- Manual CI workflow is configured and available when needed.

Only final deployment execution steps are left at cluster/runtime level (secret backend setup, TLS readiness, image tag updates, and Argo CD sync).

#### Manifest layout

- `k8s/base/`: shared manifests (deployments, services, ingress, HPAs, PDBs, config, ExternalSecret, pre-sync migration job)
- `k8s/overlays/dev/`: dev hostnames and scaling overrides
- `k8s/overlays/prod/`: production hostnames and scaling overrides
- `argocd/`: Argo CD `Application` resources for dev and prod

#### Production-safe process split

The Kubernetes deployments override container commands so one process runs per pod:

- Web deployment command: `node server.js`
- WS deployment command: `bun run server/ws.ts`

This avoids the multi-process `start.sh` behavior inside orchestrated production workloads.

#### Migration strategy

The file `k8s/base/presync-migrate-job.yaml` is an Argo CD PreSync hook that runs:

```bash
bunx prisma migrate deploy --schema prisma/schema.prisma
```

This ensures schema migrations are applied before workloads are updated.

#### Deploy with Argo CD

1. Confirm `repoURL` in these files points to your Git repository:
  - `argocd/sharebite-dev-application.yaml`
  - `argocd/sharebite-prod-application.yaml`
2. Install External Secrets Operator in your cluster and create a `ClusterSecretStore` named `sharebite-cluster-secrets`.
3. Populate your external secret backend with environment-specific keys used by overlays:
  - `sharebite/dev`
  - `sharebite/prod`
4. Update immutable image tags before each deployment:
  - `k8s/overlays/dev/kustomization.yaml`
  - `k8s/overlays/prod/kustomization.yaml`
5. Apply Argo CD applications:

```bash
kubectl apply -f argocd/sharebite-dev-application.yaml
kubectl apply -f argocd/sharebite-prod-application.yaml
```

The app workloads read runtime secrets from the Kubernetes secret `sharebite-secrets`, which is created automatically by the External Secrets resources.

#### Sync policy

- Dev application uses automated sync (`prune` + `selfHeal`).
- Prod application is set to manual sync for safer releases.

#### Rollback

Use Argo CD rollback to a previous healthy revision:

```bash
argocd app rollback sharebite-prod <history-id>
```

If required, you can also roll back individual deployments:

```bash
kubectl -n sharebite-prod rollout undo deployment/sharebite-web
kubectl -n sharebite-prod rollout undo deployment/sharebite-ws
```

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
