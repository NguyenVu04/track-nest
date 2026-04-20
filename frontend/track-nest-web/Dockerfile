# Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

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
COPY services/       ./services/
COPY styles/         ./styles/
COPY types/          ./types/
COPY next.config.ts  ./
COPY tsconfig.json   ./
COPY postcss.config.mjs ./
COPY package.json    ./
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
