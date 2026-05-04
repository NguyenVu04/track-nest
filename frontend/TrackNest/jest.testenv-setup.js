// This file runs via `setupFiles` (before the test framework) to pre-mock the
// Expo winter runtime registry. Without this, expo/src/winter/runtime.native.ts
// installs a lazy getter that calls require('./ImportMetaRegistry'), which chains
// into getBundleUrl.native.ts → NativeSourceCode (TurboModule) and throws in
// Jest 30 + Expo 54.0.33 because TurboModules are not available in jsdom.
jest.mock('expo/src/winter/ImportMetaRegistry', () => ({
  ImportMetaRegistry: { url: null },
}));
