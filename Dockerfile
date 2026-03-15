# Stage 1: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Stage 2: Build the application
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Stage 3: Production image
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 openvlt && \
    adduser --system --uid 1001 openvlt

COPY --from=builder /app/public ./public
COPY --from=builder --chown=openvlt:openvlt /app/.next/standalone ./
COPY --from=builder --chown=openvlt:openvlt /app/.next/static ./.next/static

RUN mkdir -p /app/data && chown -R openvlt:openvlt /app/data

VOLUME /app/data

USER openvlt

EXPOSE 3456

ENV PORT=3456
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
