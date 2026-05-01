# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android device/emulator
npm run ios            # Run on iOS simulator
npm run web            # Run web version
npm run lint           # Run ESLint
npm run proto-gen      # Regenerate protobuf/gRPC stubs from .proto files
```

EAS builds (production/CI):
```bash
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

## Architecture Overview

**Framework**: Expo + React Native with Expo Router (file-based routing), TypeScript strict mode.

**Networking**: Two API layers run in parallel:
- **gRPC-web (Connect RPC)** — tracker, tracking-manager, notifier, family-messenger services. Clients live in `services/` and are typed from generated stubs in `proto/`.
- **REST (axios)** — emergency reports, criminal reports, file upload. Also in `services/`.

**Auth**: Keycloak OIDC with PKCE via `expo-auth-session`. Tokens stored in AsyncStorage with refresh logic. gRPC calls attach tokens via metadata helpers in `utils/authMetadata.ts`.

### Boot Flow

```
app/index.tsx          → permissions, background task registration, onboarding check
app/_layout.tsx        → 9-provider Context tree (see Provider Tree below), hooks init
app/(app)/_layout.tsx  → auth gating, push notifications, Stack navigation (13 screens)
app/(app)/(tabs)/_layout.tsx → bottom tab navigation (3 main tabs + dev-only test tabs)
```

### Provider Tree (outermost → innermost)

`AuthProvider` → `DevModeProvider` → `LanguageProvider` → `ProfileProvider` → `SettingsProvider` → `TrackingProvider` → `EmergencyProvider` → `ReportsProvider` → `POIAnalyticsProvider` → `MapProvider`

Providers that depend on auth state must be inside `AuthProvider`. The `TrackingProvider` coordinates the real-time location upload pipeline.

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo Router screens — auth flows, tab screens, modals, stack routes |
| `components/` | Reusable UI components (bottom sheets, modals, map markers, loaders) |
| `contexts/` | 12 React Context domains (Auth, Tracking, Settings, Emergency, etc.) |
| `hooks/` | Custom hooks for location tracking, notifications, voice SOS, gRPC streaming |
| `services/` | API adapters — thin wrappers over gRPC clients and axios instances |
| `utils/` | Low-level helpers: auth metadata, AsyncStorage, service URLs, formatters |
| `constant/` | Keys, TypeScript types, EN/VI language dictionaries, mock data |
| `proto/` | `.proto` definitions + generated JS/TS stubs; do not hand-edit generated files |
| `styles/` | Design tokens — colors, spacing, border radii |
| `android/` | Native Android project; Kotlin foreground services for location and crash detection |

### Protobuf / gRPC

Proto definitions are in `proto/*.proto`. Generated stubs are committed to `proto/gen/`. When a `.proto` file changes, run `npm run proto-gen` (uses `buf` with config in `buf.gen.yaml`) and commit both the definition and the generated output together.

### Localization

Two languages: English and Vietnamese. Strings live in per-screen dictionary objects in `constant/`. The active language comes from `LanguageContext`. When adding a new screen, add both `en` and `vi` entries.

### Background / Native

- **Android foreground service** (`android/`) keeps location alive when the app is backgrounded.
- `expo-background-task` + `expo-task-manager` coordinate background upload tasks registered at boot in `app/index.tsx`.
- Crash/distraction detection runs as a Kotlin native service; interface via `expo-modules`.

### Environment

Service URLs, Keycloak realm/client ID, and API keys live in `.env`. Dev mode (toggled in Settings) allows overriding service URLs at runtime via `DevModeContext`.

### Path Aliases

`@/*` maps to the project root (configured in `tsconfig.json`). Use this alias for all internal imports instead of relative paths.
