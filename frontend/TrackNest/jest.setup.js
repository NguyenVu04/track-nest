// Silence console noise emitted by components and native module stubs.
// The expo/src/winter/ImportMetaRegistry module is handled by moduleNameMapper
// in jest.config.js — do not call jest.mock() for it here, as that interferes
// with the mapper when running via setupFilesAfterEnv.
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});
