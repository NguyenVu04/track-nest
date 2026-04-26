// Pre-resolve the ExpoImportMetaRegistry lazy getter so jest-runtime doesn't
// throw when a module accesses import.meta during module loading.
jest.mock('expo/src/winter/ImportMetaRegistry', () => ({
  ImportMetaRegistry: { url: null },
}));
