# ShareBite Tests

This directory contains the Vitest-based API and behavior test suite for ShareBite.

## Current Test Areas

- `auth.test.ts` for registration, login, logout, validation, and suspension logic
- `donations.test.ts` for donor donation flows
- `requests.test.ts` for NGO request creation and fulfillment flows
- `admin.test.ts` for admin-only actions and dashboard behavior
- `chat.test.ts` for chat-related flows
- `notifications.test.ts` for notification behavior
- `upload.test.ts` for upload-related API behavior
- `leaderboard.test.ts` for karma leaderboard logic
- `reports.test.ts`, `donor-reports.test.ts`, `reviews.test.ts` for trust and moderation flows
- `ngo.test.ts`, `donor.test.ts`, `rider.test.ts` for role-specific behavior
- `public-stats.test.ts` and `core-regressions.test.ts` for shared platform checks

## How To Run The Suite

Install dependencies first at the repository root:

```bash
bun install
```

Then run:

```bash
bun run test
```

If you prefer npm:

```bash
npm test
```

## Configuration

The suite is already wired through the root `vitest.config.ts` with:

- `jsdom` test environment
- `@` path alias mapped to the repository root

## Practical Notes

- Many tests are written around route-handler behavior and mocked dependencies rather than full browser flows.
- If you change Prisma models, auth handling, or request lifecycles, these tests are a good first place to extend.
- If you add a new API domain, follow the existing file naming pattern and keep the test close to the route behavior it validates.
