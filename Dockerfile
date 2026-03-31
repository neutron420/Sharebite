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

# Pass build-time environment variables for Next.js static generation
ARG DATABASE_URL
ARG JWT_SECRET
ARG R2_ACCOUNT_ID
ARG R2_ACCESS_KEY_ID
ARG R2_SECRET_ACCESS_KEY
ARG R2_BUCKET_NAME
ARG R2_PUBLIC_DOMAIN
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG REDIS_URL
ARG INTERNAL_WS_URL
ARG NEXT_PUBLIC_WS_URL
ARG OPENAI_API_KEY
ARG RESEND_API_KEY
ARG NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ARG CLOUDFLARE_TURNSTILE_SECRET_KEY
ARG GROQ_API_KEY
ARG RAPIDAPI_KEY
ARG RAPIDAPI_HOST
ARG RESEND_FROM_EMAIL
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID
ARG RAZORPAY_KEY_ID
ARG RAZORPAY_KEY_SECRET
ARG RAZORPAY_WEBHOOK_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV JWT_SECRET=$JWT_SECRET
ENV R2_ACCOUNT_ID=$R2_ACCOUNT_ID
ENV R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID
ENV R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY
ENV R2_BUCKET_NAME=$R2_BUCKET_NAME
ENV R2_PUBLIC_DOMAIN=$R2_PUBLIC_DOMAIN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV REDIS_URL=$REDIS_URL
ENV INTERNAL_WS_URL=$INTERNAL_WS_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV RESEND_API_KEY=$RESEND_API_KEY
ENV NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY
ENV CLOUDFLARE_TURNSTILE_SECRET_KEY=$CLOUDFLARE_TURNSTILE_SECRET_KEY
ENV GROQ_API_KEY=$GROQ_API_KEY
ENV RAPIDAPI_KEY=$RAPIDAPI_KEY
ENV RAPIDAPI_HOST=$RAPIDAPI_HOST
ENV RESEND_FROM_EMAIL=$RESEND_FROM_EMAIL
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID
ENV RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID
ENV RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET
ENV RAZORPAY_WEBHOOK_SECRET=$RAZORPAY_WEBHOOK_SECRET
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
