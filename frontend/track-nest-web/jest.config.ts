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
    'app/**/*.{ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// nextJest sets its own transformIgnorePatterns which excludes all node_modules.
// Export as async so we can patch the resolved config after Next.js builds it,
// adding the ESM-only packages that must be transpiled by Babel/SWC.
export default async () => {
  const nextConfig = await createJestConfig(config)()
  return {
    ...nextConfig,
    transformIgnorePatterns: [
      '/node_modules/(?!(keycloak-js|react-leaflet|leaflet|@react-leaflet)/)',
    ],
  }
}
