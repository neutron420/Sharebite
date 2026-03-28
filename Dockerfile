FROM oven/bun:alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client to the custom path
RUN bun prisma generate

# Build Next.js
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy essential files for both Web and WS
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/server ./server
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/app/generated/prisma ./app/generated/prisma

# Ensure we have node_modules for the WS server
COPY --from=deps /app/node_modules ./node_modules

# Copy the start script BEFORE switching to non-root user
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 3000
EXPOSE 8080
EXPOSE 8081

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV INTERNAL_WS_URL="http://localhost:8081"

CMD ["./start.sh"]
