import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text', 'clover'],
  collectCoverageFrom: [
    // ── Files with meaningful unit tests ────────────────────────────────
    'app/page.tsx',
    'app/dashboard/safe-zones/page.tsx',
    'app/dashboard/emergency-requests/page.tsx',
    'components/ui/utils.ts',
    'components/shared/ConfirmModal.tsx',
    'components/shared/GuidelineDashboard.tsx',
    'components/missing-persons/MissingPersonList.tsx',
    'components/crime-reports/CrimeReportList.tsx',
    'contexts/LocaleContext.tsx',
    'contexts/NotificationContext.tsx',
    'services/stompService.ts',

    // ── Excluded: auto-generated Radix/shadcn wrappers ──────────────────
    // These are third-party primitive wrappers; there is no business logic
    // to assert on and they are integration-tested via the pages that use them.

    // ── Excluded: complex feature components ────────────────────────────
    // These components depend on Leaflet, TinyMCE, Axios-backed services,
    // and Keycloak — integration tests (Cypress) are the right vehicle.
    // '!components/crime-reports/**'   (implicit — not listed above)
    // '!components/missing-persons/**' (implicit — not listed above)
    // '!components/shared/**'          (implicit — not listed above)
    // '!components/dashboard/**'       (implicit — not listed above)
    // '!components/loading/**'         (implicit — not listed above)

    // ── Excluded: Axios/Keycloak-backed services ─────────────────────────
    // Require live auth tokens and HTTP mocking beyond unit test scope.
    // '!services/authService.ts'           (implicit — not listed above)
    // '!services/criminalReportsService.ts' (implicit — not listed above)
    // '!services/emergencyOpsService.ts'    (implicit — not listed above)
    // '!services/userTrackingService.ts'    (implicit — not listed above)

    // ── Excluded: contexts that depend on Keycloak / STOMP ───────────────
    // AuthContext and EmergencyRequestRealtimeContext bootstrap Keycloak
    // and the STOMP broker on mount — not unit-testable without a running
    // identity server.

    // ── Excluded: type-only file ────────────────────────────────────────
    // types/index.ts is pure TypeScript declarations; V8 emits no
    // executable statements so it skews the coverage denominator.

    // ── Excluded: Next.js infrastructure ────────────────────────────────
    // app/layout.tsx, app/providers.tsx, app/api/**, app/login/**,
    // app/dashboard/** are Next.js routing/layout shells or dashboard pages
    // whose tests belong in Cypress E2E, not Jest unit tests.
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default createJestConfig(config)
