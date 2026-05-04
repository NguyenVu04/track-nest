// Stubs out expo/src/winter/runtime.native so the lazy global getters
// (including __ExpoImportMetaRegistry) are never installed during tests.
// Without this stub, runtime.native.ts triggers require('./ImportMetaRegistry')
// which chains into getBundleUrl.native → NativeSourceCode (TurboModule) and
// throws "outside of test scope" in Jest 30 / Expo 54.0.33+.
module.exports = {};
