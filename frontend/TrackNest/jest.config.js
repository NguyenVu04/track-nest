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
    '@react-native-async-storage/async-storage': '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock',
    '^lottie-react-native$': '<rootDir>/__mocks__/lottie-react-native.js',
    '^react-native-webview$': '<rootDir>/__mocks__/react-native-webview.js',
    '^tamagui$': '<rootDir>/__mocks__/tamagui.js',
    '^@tamagui/.*': '<rootDir>/__mocks__/tamagui.js',
    'tamagui\\.config': '<rootDir>/__mocks__/tamagui-config.js',
  },
  reporters: [
    'default',
    '<rootDir>/reporters/failedTestsReporter.js',
  ],
  collectCoverage: true,
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}'
  ],
}
