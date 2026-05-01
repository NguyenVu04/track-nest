# AGENTS.md

This file provides guidance to AI coding agents (Copilot, Claude, etc.) working in this repository. It summarizes key conventions, architecture, and commands to ensure agents are immediately productive and avoid common pitfalls. For details, see the linked documentation files.

---

## Project Overview

- **Framework:** Expo + React Native (TypeScript, strict mode)
- **Routing:** Expo Router (file-based)
- **State:** React Contexts + custom hooks
- **Networking:** gRPC-web (Connect RPC) and REST (axios)
- **Auth:** Keycloak OIDC (PKCE, expo-auth-session)
- **Localization:** English & Vietnamese (see `constant/languages/`)

---

## Build & Run Commands

- `npm install` — Install dependencies
- `npm start` — Start Expo dev server
- `npm run android` — Run on Android device/emulator
- `npm run ios` — Run on iOS simulator
- `npm run web` — Run web version
- `npm run lint` — Run ESLint
- `npm run proto-gen` — Regenerate protobuf/gRPC stubs from .proto files

See `CLAUDE.md` for EAS build commands and more details.

---

## Key Architecture & Conventions

- **Provider Tree:** See `CLAUDE.md` and `APP_TECHNICAL_OVERVIEW.md` for the required provider/component order. Providers that depend on auth must be inside `AuthProvider`.
- **gRPC/REST:** API adapters live in `services/`, typed from generated stubs in `proto/`. Do not hand-edit generated files.
- **Localization:** Add new strings to both `en` and `vi` dictionaries in `constant/`.
- **Path Aliases:** Use `@/` for all internal imports (see `tsconfig.json`).
- **Background Tasks:** Registered in `app/index.tsx` using `expo-background-task` and `expo-task-manager`.
- **Android Native:** Foreground service for location/crash in `android/`.
- **.env:** Service URLs, Keycloak realm/client ID, and API keys. Dev mode allows runtime override via `DevModeContext`.

---

## Documentation Links

- [CLAUDE.md](CLAUDE.md) — Full architecture, commands, provider tree
- [APP_TECHNICAL_OVERVIEW.md](APP_TECHNICAL_OVERVIEW.md) — Tech stack, runtime, folder responsibilities
- [MOBILE_APP_DOCS.md](MOBILE_APP_DOCS.md) — Feature/UI docs, navigation, screen inventory
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) — Roadmap, missing features, integration plan
- [FCM_FLOW.md](FCM_FLOW.md) — Push notification flow
- [UI_REFACTOR_PLAN.md](UI_REFACTOR_PLAN.md) — UI redesign plan

---

## Common Pitfalls & Agent Guidance

- **Do not hand-edit generated proto files** in `proto/`. Always use `npm run proto-gen` after editing `.proto` files.
- **Always update both language files** when adding UI strings.
- **Provider/context order matters** for boot and runtime. See docs for correct order.
- **Use path aliases** (`@/`) for all internal imports.
- **Background/foreground services**: Android-specific logic lives in `android/`.
- **Dev mode**: Use `DevModeContext` for runtime URL overrides.

---

For any new features, first check the implementation plan and UI docs for requirements and conventions. Link to existing docs instead of duplicating content.
