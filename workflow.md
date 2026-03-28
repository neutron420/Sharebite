# ShareBite Workflow Guide

This document explains how work moves through ShareBite, both from the product user's perspective and from the developer's perspective.

## 1. Roles At A Glance

### Donor

- creates food donations
- reviews incoming pickup requests
- approves handovers
- tracks completed impact

### NGO

- browses available donations
- requests pickups
- coordinates collection
- verifies completion directly or works with a rider

### Rider

- claims or receives approved pickup work
- shares live location
- verifies donor handover with a PIN
- uploads delivery proof and completes the mission

### Admin

- monitors platform activity
- verifies NGOs and other users
- moderates reports, reviews, and bugs
- oversees users, stats, logs, and requests

## 2. Account And Access Workflow

### Registration

1. A user signs up through `/register` and selects a role.
2. The registration route validates input with Zod and hashes the password with bcrypt.
3. The user record is created in PostgreSQL.
4. Admins are notified about the new registration.

Operational note:
The current registration route allows direct `ADMIN` creation. That is fine for internal environments, but most production systems would restrict this.

### Login

1. The user submits email, password, role, and Turnstile token.
2. The login route verifies Turnstile first.
3. Credentials are checked against the database.
4. Suspension and license blocks are enforced for non-admin users.
5. A role-specific session cookie is created.

### Session resolution

1. Subsequent requests use the stored JWT cookie.
2. `getSession()` chooses the most relevant role cookie for the request path.
3. Protected API routes are screened again by `proxy.ts`.

### Password recovery

1. The user submits email, role, and Turnstile token to `/api/auth/forgot-password`.
2. The server verifies role ownership for that email.
3. A 6-digit OTP is stored in Redis.
4. Resend sends the OTP email.
5. The user verifies the OTP through `/api/auth/verify-otp`.
6. The password is reset through `/api/auth/reset-password`.

## 3. Donation Workflow

### Create donation

1. A donor creates a donation through `/api/donations`.
2. The payload is validated by `donationSchema`.
3. A `FoodDonation` record is created with status `AVAILABLE`.
4. Nearby verified NGOs in the same city are notified.
5. Admins also receive oversight notifications.
6. If coordinates exist, the donation is added to Redis GEO search.
7. Donor karma and badge checks run.

### Browse donation

NGOs and other users can retrieve donation listings through `/api/donations` with filters for:

- category
- status
- donor
- city
- search text
- geospatial radius using Redis

The response also enriches each donation with donor details, request data, reviews, and an `isUrgent` flag for near-expiry items.

## 4. Request Workflow

### NGO creates request

1. An NGO submits a pickup request to `/api/requests`.
2. The API confirms the NGO is logged in, verified, and not suspended.
3. The donation must still be `AVAILABLE`.
4. A `PickupRequest` is created with status `PENDING`.
5. The donor is notified.

### Donor or admin reviews request

The request owner or an admin can update the request through `/api/requests/[id]`.

If approved:

1. A 4-digit handover PIN is generated.
2. The chosen request becomes `APPROVED`.
3. The related donation becomes `APPROVED`.
4. All other pending requests for that donation are rejected.
5. The NGO receives a success notification.
6. Verified available riders may be notified that a mission exists.

If rejected:

1. The request is marked `REJECTED`.
2. The donor can continue reviewing other requests.

## 5. Two Fulfillment Paths

ShareBite currently supports two real fulfillment patterns.

### Path A: Direct NGO handover

This is the simpler path when no rider is needed.

1. The NGO has an approved request with a handover PIN.
2. The NGO meets the donor.
3. The NGO submits the PIN to `/api/requests/[id]/verify`.
4. The request is marked `COMPLETED`.
5. The donation is marked `COLLECTED`.
6. The donor is notified.
7. The donation is removed from Redis GEO search.
8. Donor karma is added to the leaderboard.

### Path B: Rider-assisted fulfillment

This is the last-mile logistics path.

#### Rider assignment

1. After approval, an NGO can assign a rider through `/api/requests/[id]/assign`.
2. A rider can also claim the request themselves through the same endpoint.
3. The request becomes `ASSIGNED`.
4. The rider is marked unavailable.

#### Live mission

1. The rider posts live coordinates to `/api/rider/location`.
2. Location is stored in Redis with a TTL.
3. The websocket relay broadcasts updates to the donor and NGO.

#### Donor handover

1. The rider reaches the donor.
2. The rider submits the handover PIN to `/api/requests/[id]/handover`.
3. The request becomes `ON_THE_WAY`.
4. `pickedUpAt` is recorded.
5. The donation is marked `COLLECTED`.
6. The donor and NGO are both notified.

#### Final delivery

1. The rider submits delivery proof to `/api/requests/[id]/deliver`.
2. The request becomes `COMPLETED`.
3. `completedAt` and `deliveryImageUrl` are stored.
4. Rider delivery count is incremented.
5. Rider availability is restored.
6. Leaderboard karma is updated.
7. The rider's live location key is deleted from Redis.
8. The donor and NGO receive completion notifications.

## 6. Messaging Workflow

### Conversation setup

Conversations are tied to a donation and two participants. The codebase stores:

- `Conversation`
- `Message`

### Real-time chat

1. The browser fetches a token from `/api/auth/token`.
2. `SocketProvider` opens a websocket connection.
3. A user sends a `SEND_MESSAGE` event.
4. The websocket server stores the message in PostgreSQL.
5. The message is published through Redis pub/sub.
6. The receiver gets the real-time update.

Typing indicators follow the same overall pattern, but without database persistence.

## 7. Notification Workflow

Notifications are both persistent and real-time.

### Persistent notification path

1. A route creates a `Notification` record in PostgreSQL.
2. The recipient can later view it in their dashboard, even if they were offline at creation time.

### Real-time delivery path

1. The route posts a payload to the internal relay endpoint on the websocket server.
2. The websocket server republishes the event through Redis.
3. The current instance or another instance pushes it to connected clients.

This dual-path design is important because it gives ShareBite both reliability and immediacy.

## 8. Map And Discovery Workflow

### Donation discovery

1. The donor includes location data when creating a donation.
2. The donation is stored in PostgreSQL.
3. The donation is indexed in Redis GEO.
4. NGOs can search by location and radius.

### Rider tracking

1. Riders update their location frequently.
2. The last known coordinate is stored in Redis with a short TTL.
3. Donors and NGOs receive live movement updates over websockets.
4. If updates stop, the rider appears effectively offline because the Redis key expires.

## 9. AI Support Workflow

### Text support

1. The user opens the AI support entry point.
2. The frontend calls `/api/chat`.
3. The server builds a ShareBite-specific system prompt.
4. Live database counts are injected into the prompt context.
5. Groq streams a response back to the UI.

### Voice support

1. The user uploads audio to `/api/chat/voice`.
2. The server forwards the file to Groq transcription.
3. The transcript is returned to the UI.

## 10. Support And Moderation Workflow

### Bug report flow

1. An authenticated user submits a bug through `/api/bugs`.
2. A `BugReport` record is created in PostgreSQL.
3. Admins receive a websocket event targeted by role.
4. Admins review the bug in the dashboard.
5. An admin can respond through `/api/bugs/[id]`.
6. The user receives a `BUG_RESPONSE` notification.

### Report and review flow

The codebase also includes dedicated endpoints for:

- NGO reports
- donor reports
- reviews
- admin moderation actions
- audit logging

These features work together to make trust, enforcement, and accountability part of the normal product flow.

## 11. Background Operations Workflow

`server/watchtower.ts` runs an expiry-awareness loop:

1. Scan for `AVAILABLE` donations expiring within two hours.
2. Find verified NGOs in the same city.
3. Avoid duplicate urgent notifications.
4. Create `URGENT_EXPIRY` alerts.

It runs every 15 minutes when started. Right now it is a manual or separately orchestrated worker, not part of the default app startup.

## 12. Developer Workflow

### Local setup

1. Install dependencies with `bun install`.
2. Configure `.env`.
3. Start PostgreSQL and Redis, locally or through Compose.
4. Run `bunx prisma generate`.
5. Run `bunx prisma migrate dev`.
6. Start the web app with `bun run dev`.
7. Start the websocket server with `bun run ws`.
8. Optionally start `bun run server/watchtower.ts`.

### Making backend changes

If you change Prisma models:

1. Update `prisma/schema.prisma`.
2. Generate a migration.
3. Regenerate the Prisma client.
4. Re-test the affected routes and dashboards.

If you change realtime behavior:

1. Update the relevant API route or `lib/notifications.ts`.
2. Update `server/ws.ts` if the event shape changes.
3. Verify the frontend listener path in `SocketProvider` or consuming components.

### Testing

Use:

```bash
bun run test
```

Useful test groups already exist for:

- auth
- donations
- requests
- admin
- notifications
- chat
- reports
- uploads
- public stats
- regressions

### Container workflow

For full-stack local container testing:

```bash
docker compose up --build
```

One implementation detail to keep in mind:
the current `start.sh` launches the websocket server and then starts the Next.js dev server. That is acceptable for internal testing, but production-oriented workflows should replace that with a proper built server start path.

## 13. Release Workflow

The repo contains the pieces for a cloud deployment workflow:

1. Build a container image from the `Dockerfile`.
2. Push the image to ECR.
3. Apply Terraform in `terraform/`.
4. ECS runs the service behind the ALB.
5. Web and websocket traffic are exposed through separate target groups.

Before a production release, the safest checklist would include:

1. verify env vars and secrets
2. apply Prisma migrations
3. confirm Redis connectivity
4. confirm websocket connectivity from the browser
5. test upload, auth, and request fulfillment flows
6. verify admin registration policy is appropriate for the environment

## 14. Workflow Summary

The core platform rhythm is:

1. donor publishes food
2. NGO requests it
3. donor approves it
4. NGO either collects directly or works with a rider
5. the system records the result, notifies the participants, and updates trust and impact data

That combination of role-based UI, durable records, and real-time coordination is the heart of the ShareBite workflow.
