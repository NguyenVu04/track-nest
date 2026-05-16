# Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Build app
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY app/            ./app/
COPY components/     ./components/
COPY contexts/       ./contexts/
COPY messages/       ./messages/
COPY mocks/          ./mocks/
COPY public/         ./public/
COPY hooks/          ./hooks/
COPY lib/            ./lib/
COPY services/       ./services/
COPY styles/         ./styles/
COPY types/          ./types/
COPY utils/          ./utils/
COPY next.config.ts  ./
COPY tsconfig.json   ./
COPY postcss.config.mjs ./
COPY package.json    ./

# NEXT_PUBLIC_* vars are inlined at build time, not runtime.
# Every variable listed here must be passed via --build-arg (or build.args in compose).
ARG NEXT_PUBLIC_USER_TRACKING_API_URL
ARG NEXT_PUBLIC_EMERGENCY_OPS_API_URL
ARG NEXT_PUBLIC_EMERGENCY_OPS_WS_URL
ARG NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_USER_REALM
ARG NEXT_PUBLIC_REPORTER_REALM
ARG NEXT_PUBLIC_EMERGENCY_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_KEYCLOAK_FLOW
ARG NEXT_PUBLIC_TINYMCE_API_KEY

ENV NEXT_PUBLIC_USER_TRACKING_API_URL=$NEXT_PUBLIC_USER_TRACKING_API_URL
ENV NEXT_PUBLIC_EMERGENCY_OPS_API_URL=$NEXT_PUBLIC_EMERGENCY_OPS_API_URL
ENV NEXT_PUBLIC_EMERGENCY_OPS_WS_URL=$NEXT_PUBLIC_EMERGENCY_OPS_WS_URL
ENV NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL=$NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_USER_REALM=$NEXT_PUBLIC_USER_REALM
ENV NEXT_PUBLIC_REPORTER_REALM=$NEXT_PUBLIC_REPORTER_REALM
ENV NEXT_PUBLIC_EMERGENCY_REALM=$NEXT_PUBLIC_EMERGENCY_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_KEYCLOAK_FLOW=$NEXT_PUBLIC_KEYCLOAK_FLOW
ENV NEXT_PUBLIC_TINYMCE_API_KEY=$NEXT_PUBLIC_TINYMCE_API_KEY

RUN npm run build

# Production runtime — standalone bundle only (~no node_modules)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static   ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public         ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
