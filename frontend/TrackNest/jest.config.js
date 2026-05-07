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
    'expo/src/winter/ImportMetaRegistry': '<rootDir>/__mocks__/expoImportMetaRegistry.js',
    'expo/src/winter/runtime': '<rootDir>/__mocks__/expoRuntime.js',
  },
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}'
  ],
}
