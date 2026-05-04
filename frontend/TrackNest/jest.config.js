module.exports = {
  preset: 'jest-expo',
  // setupFiles runs before the test framework (no jest.mock available here).
  setupFiles: ['<rootDir>/jest.testenv-setup.js'],
  // setupFilesAfterEnv runs after jest is initialised — jest.mock() works here.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    // Intercept both package-form and relative-form requires of the registry.
    'expo/src/winter/ImportMetaRegistry': '<rootDir>/__mocks__/expoImportMetaRegistry.js',
    // Stub the entire winter runtime so no lazy globals (including
    // __ExpoImportMetaRegistry) are installed. This prevents the chain:
    //   runtime.native -> ImportMetaRegistry -> getBundleUrl.native -> NativeSourceCode
    // which throws in Jest 30 + Expo 54.0.33 when NativeSourceCode is not available.
    'expo/src/winter/runtime': '<rootDir>/__mocks__/expoRuntime.js',
  },
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'utils/**/*.{ts,tsx}',
    'hooks/useMockFollowers.ts',
    '!utils/locationTypes.ts',
    '!utils/index.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
}
