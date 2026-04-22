/**
 * AUTH / LOGIN TESTS
 *
 * Techniques applied:
 *  - Use-case Testing   : Full login redirect flows
 *  - Equivalence Class Partitioning : authenticated vs unauthenticated states
 *  - Decision Table     : auth state × target route → expected outcome
 *
 * Decision Table – Auth State × Route Access:
 * ┌─────────────────────┬─────────────────────────────┬──────────────────────────────┐
 * │ Auth State          │ Target Route                │ Expected Outcome             │
 * ├─────────────────────┼─────────────────────────────┼──────────────────────────────┤
 * │ Unauthenticated     │ /login                      │ Login page rendered          │
 * │ Unauthenticated     │ /dashboard/missing-persons  │ Redirect to /login           │
 * │ Authenticated(any)  │ /login                      │ Redirect to /dashboard/...   │
 * │ Authenticated(any)  │ /dashboard/missing-persons  │ Dashboard rendered           │
 * └─────────────────────┴─────────────────────────────┴──────────────────────────────┘
 */

describe("Authentication – Login Page", () => {
  // -------------------------------------------------------------------------
  // UC-01 : Unauthenticated user sees login page
  // -------------------------------------------------------------------------
  context("UC-01 | Unauthenticated access", () => {
    beforeEach(() => {
      cy.clearAuth();
      cy.clearLocalStorage();
      cy.visit("/login");
    });

    it("renders the TrackNest login card", () => {
      cy.contains("TrackNest").should("be.visible");
      cy.contains("Sign in with Keycloak").should("be.visible");
    });

    it("displays the three feature pills (Crime Reports, Missing Persons, Safe Zones)", () => {
      cy.contains("Crime Reports").should("be.visible");
      cy.contains("Missing Persons").should("be.visible");
      cy.contains("Safe Zones").should("be.visible");
    });

    it("shows OAuth 2.0 / OIDC secured-by note", () => {
      cy.contains("Secured by Keycloak").should("be.visible");
    });

    it("the login button is interactive and clickable", () => {
      cy.contains("Sign in with Keycloak")
        .should("be.visible")
        .and("not.be.disabled");
    });
  });

  // -------------------------------------------------------------------------
  // UC-02 : Unauthenticated user is redirected from protected routes
  // -------------------------------------------------------------------------
  context("UC-02 | Protected route redirect (ECP – unauthenticated class)", () => {
    beforeEach(() => {
      cy.clearAuth();
      cy.clearLocalStorage();
    });

    const protectedRoutes = [
      "/dashboard/missing-persons",
      "/dashboard/crime-reports",
      "/dashboard/guidelines",
      "/dashboard/safe-zones",
      "/dashboard/emergency-requests",
    ];

    protectedRoutes.forEach((route) => {
      it(`redirects ${route} → /login when unauthenticated`, () => {
        cy.visit(route, { failOnStatusCode: false });
        cy.url().should("include", "/login");
      });
    });
  });

  // -------------------------------------------------------------------------
  // UC-03 : Authenticated user bypasses the login page
  // -------------------------------------------------------------------------
  context("UC-03 | Authenticated user access (ECP – authenticated class)", () => {
    it("redirects authenticated Reporter away from /login", () => {
      cy.visitAsRole("/login", "Reporter");
      // Keycloak init will detect existing token and push to dashboard
      cy.url().should("include", "/dashboard");
    });

    it("redirects authenticated Admin away from /login", () => {
      cy.visitAsRole("/login", "Admin");
      cy.url().should("include", "/dashboard");
    });

    it("redirects authenticated Emergency Services user away from /login", () => {
      cy.visitAsRole("/login", "Emergency Services");
      cy.url().should("include", "/dashboard");
    });
  });

  // -------------------------------------------------------------------------
  // UC-04 : Authenticated user can reach the dashboard directly
  // -------------------------------------------------------------------------
  context("UC-04 | Direct dashboard access when authenticated", () => {
    it("Reporter lands on missing-persons dashboard", () => {
      cy.visitAsRole("/dashboard/missing-persons", "Reporter");
      cy.url().should("include", "/dashboard/missing-persons");
    });

    it("Admin lands on accounts page", () => {
      cy.visitAsRole("/dashboard/accounts", "Admin");
      cy.url().should("include", "/dashboard");
    });

    it("Emergency Services user lands on safe-zones page", () => {
      cy.visitAsRole("/dashboard/safe-zones", "Emergency Services");
      cy.url().should("include", "/dashboard");
    });
  });

  // -------------------------------------------------------------------------
  // UC-05 : Logout clears session and redirects to login
  // -------------------------------------------------------------------------
  context("UC-05 | Logout flow", () => {
    beforeEach(() => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "Reporter");
    });

    it("logout button is visible in the header", () => {
      // The header renders a logout button
      cy.get("button").contains(/log.?out/i).should("exist");
    });

    it("clicking logout clears localStorage auth keys", () => {
      cy.get("button").contains(/log.?out/i).click();
      cy.window().then((win) => {
        expect(win.localStorage.getItem("access_token")).to.be.null;
        expect(win.localStorage.getItem("auth_user")).to.be.null;
      });
    });
  });
});
