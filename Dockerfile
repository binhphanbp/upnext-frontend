FROM node:24.11.1-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
ARG NEXT_PUBLIC_API_BASE_URL=https://api.upnext.works
ARG NEXT_PUBLIC_API_MOCKING=disabled
ARG NEXT_PUBLIC_RECRUITER_COMPANY_ID=76445328-62fc-4f74-b4e8-9398a8ad7a3a
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_MOCKING=$NEXT_PUBLIC_API_MOCKING
ENV NEXT_PUBLIC_RECRUITER_COMPANY_ID=$NEXT_PUBLIC_RECRUITER_COMPANY_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:24.11.1-alpine AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
