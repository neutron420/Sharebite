# ShareBite API Tests

This folder contains a comprehensive suite of API test cases for the ShareBite backend. The tests use standard `describe` and `it` block structures (which are compatible with both **Jest** and **Vitest** frameworks) and demonstrate how testing can be conducted for Next.js App Router handlers (`route.ts`), mocking the Prisma models.

## Structure

- `auth.test.ts`: Covers all authentication endpoints (Login, Register, Logout, etc.), validation handling, and suspension enforcement checks.
- `donations.test.ts`: Covers the core CRUD operations for food donations from Donors.
- `requests.test.ts`: Covers the negotiation flow between NGOs and Donors (creating pickup requests, approving/rejecting, generating PINs).
- `admin.test.ts`: Details specialized endpoints only accessible to administrators (suspending accounts, adding strikes, aggregating dashboard metrics).

## How to Run These Tests (Setup)

Currently, the project is not bundled with a test runner inside the root `package.json`. To execute these tests, you will need to install a test runner like `vitest`.

### 1. Install Vitest
Since the project relies heavily on React, Next, and Prisma, `vitest` is strongly recommended for its native TS support.
Run the following at the root of your project:

```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

### 2. Configuration
You can create a `vitest.config.ts` in your root file if advanced module resolution is needed (especially for `@/lib/` path aliases):

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})
```

### 3. Run
Execute the tests by simply running:

```bash
npx vitest run tests/
```

*(You can also add `"test": "vitest"` into your `package.json` scripts.)*

## Notes on Implementation
These files currently list the architectural **test case definitions and descriptions** (the "given, when, then" logic) alongside mocked dependencies (`vi.mock`). 
To fully implement them for live CI/CD systems, simply fill in the body of each `it()` block with actual `fetch`/`NextRequest` logic invoking the exported `GET/POST/PUT/DELETE` functions from your API handlers.
