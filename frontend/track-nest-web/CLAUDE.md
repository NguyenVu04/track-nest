# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (http://localhost:3000)
npm run dev

# Build & serve production
npm run build && npm start

# Lint
npm run lint

# Cypress E2E tests
npm run cypress:open          # interactive
npm run cypress:run           # headless
npm run cypress:run:headless  # headless Chrome
```

> Package manager is **pnpm** (`packageManager: pnpm@10.32.0` in package.json). Use `pnpm` for installs, `npm run` for scripts.

## Stack

- Next.js 16 App Router, React 19, TypeScript 5
- Tailwind CSS v4 (PostCSS plugin — no `tailwind.config.js`)
- Radix UI primitives + shadcn/ui component pattern
- Keycloak 26 via `keycloak-js` for auth
- Axios for HTTP; request interceptors auto-attach and refresh JWT tokens
- STOMP/WebSocket via `@stomp/stompjs` + SockJS for real-time emergency notifications
- `next-intl` for i18n (EN + VI), locale switching via `LocaleContext`
- Leaflet/react-leaflet for maps
- Cypress for E2E only — no unit tests exist

## Architecture

### Provider Hierarchy (`app/providers.tsx`)

```
LocaleProvider → AuthProvider → NotificationProvider → EmergencyRequestRealtimeProvider
```

This order is load-bearing: auth must initialize before the STOMP provider attempts to connect.

### Service Layer (`services/`)

Each backend microservice has its own `*Service.ts`:

- `authService.ts` — Keycloak singleton; token persistence to `localStorage`; `refreshToken()` / `getAccessToken()` / `logout()`
- `emergencyOpsService.ts` — Emergency requests and safe zones (`NEXT_PUBLIC_EMERGENCY_OPS_API_URL`, default `localhost:8800/emergency-ops`)
- `criminalReportsService.ts` — Crime/missing-person reports (`NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL`)
- `userTrackingService.ts` — User tracking, family circles (`NEXT_PUBLIC_USER_TRACKING_API_URL`)
- `stompService.ts` — STOMP client singleton; connects with `?access_token=...` in query string; reconnects every 5 s

Every service file creates an Axios instance and a request interceptor that calls `authService.refreshToken()` then injects `Authorization: Bearer <token>`. Callers never handle tokens manually.

### Auth (`contexts/AuthContext.tsx`)

- Keycloak initialized with `onLoad: "check-sso"` on mount
- Token auto-refreshed 30 s before expiry via `keycloak.onTokenExpired`
- Role extracted via `mapTokenRole()` — roles map to `UserRole` enum in `types/index.ts`
- `app/api/keycloak/[...path]/route.ts` proxies browser → Keycloak upstream to avoid CORS; uses `KEYCLOAK_UPSTREAM_URL` (server-side only)

### Real-time Emergency Notifications (`contexts/EmergencyRequestRealtimeContext.tsx`)

Active only for `EMERGENCY_SERVICES` role users. On auth, `EmergencyRequestRealtimeProvider` calls `stompService.connect(token)` and subscribes to `/user/queue/emergency-request`. New messages trigger `addNotification()` and increment a `refresh` counter that pages can watch via `useEmergencyRequestRealtime()`.

### Types (`types/index.ts`)

Single file for all domain types. Key enums: `UserRole`, request statuses (`PENDING/ACCEPTED/REJECTED/CLOSED`), report statuses (`PENDING/PUBLISHED/REJECTED`). Service files define their own request/response interfaces alongside the service functions.

### Component Conventions

- `components/ui/` — Radix primitive wrappers (shadcn/ui pattern); do not modify these for feature logic
- `components/shared/` — reusable business components (MapView, LocationPicker, RichTextEditor, ConfirmModal, EmptyState)
- Feature components go in `components/<feature>/` (e.g., `crime-reports/`, `missing-persons/`, `dashboard/`)
- Almost everything is `"use client"`. Server components are only used for async data fetching at the page level.
- Dynamic imports with loading states are the norm for heavy dashboard components (`next/dynamic` with `ssr: false`)

### i18n

Translation keys live in `messages/en.json` and `messages/vi.json`. Use `useTranslations()` from `next-intl` in components. When adding new UI strings, add keys to both files.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_USER_TRACKING_API_URL` | User tracking service base URL |
| `NEXT_PUBLIC_EMERGENCY_OPS_API_URL` | Emergency ops service base URL |
| `NEXT_PUBLIC_CRIMINAL_REPORTS_API_URL` | Criminal reports service base URL |
| `NEXT_PUBLIC_EMERGENCY_OPS_WS_URL` | WebSocket endpoint for STOMP |
| `NEXT_PUBLIC_KEYCLOAK_URL` | Keycloak server URL (browser-facing) |
| `NEXT_PUBLIC_KEYCLOAK_REALM` | Keycloak realm |
| `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID` | Keycloak client ID |
| `KEYCLOAK_UPSTREAM_URL` | Real Keycloak URL (server-side proxy only, not exposed to browser) |
| `NEXT_PUBLIC_TINYMCE_API_KEY` | TinyMCE editor license |

Defaults in each service file fall back to `localhost:8800` routes (via Envoy proxy from the monorepo compose stack).
