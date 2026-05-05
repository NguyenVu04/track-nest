// jest-expo/src/preset/setup.js (which runs before this file) explicitly calls
// require('expo/src/winter'). That loads runtime.native.ts, which uses
// installGlobal to replace several configurable globals (structuredClone, URL,
// TextDecoder, __ExpoImportMetaRegistry, etc.) with lazy property getters.
//
// Each lazy getter defers a require() call until the property is first accessed.
// In Jest 30, if that deferred require fires after leaveTestCode() has been called
// (isInsideTestCode === false), jest-runtime throws
// "You are trying to import a file outside of the scope of the test code."
//
// Fix: access all the lazy globals RIGHT HERE, while setupFiles is executing.
// At this point isInsideTestCode is undefined (not false), so _execModule
// won't throw. installGlobal's getValue() then calls setValue() which replaces
// each lazy getter with a plain value via Object.defineProperty. From this
// point on, accessing these globals returns the plain value directly — no
// deferred require(), no risk of an "outside scope" error.
void globalThis.__ExpoImportMetaRegistry;
void globalThis.structuredClone;
void globalThis.URL;
void globalThis.URLSearchParams;
void globalThis.TextDecoder;
void globalThis.TextDecoderStream;
void globalThis.TextEncoderStream;
