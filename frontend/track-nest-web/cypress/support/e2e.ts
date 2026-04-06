// ***********************************************************
// Global support file – runs before every spec
// ***********************************************************

import "./commands";

// Suppress uncaught exceptions from Keycloak initialisation and Next.js
// hydration that are outside the test's control
Cypress.on("uncaught:exception", (err) => {
  // Keycloak errors during mocked auth setup
  if (
    err.message.includes("Keycloak") ||
    err.message.includes("keycloak") ||
    err.message.includes("Cannot read properties of undefined") ||
    err.message.includes("ResizeObserver loop") ||
    err.message.includes("NEXT_REDIRECT")
  ) {
    return false;
  }
  return true;
});

// Reset auth state before each test unless the test opts out
beforeEach(() => {
  // Tests that need auth will call cy.loginAs() or cy.visitAsRole()
  // No blanket clear here so individual tests control state
});
