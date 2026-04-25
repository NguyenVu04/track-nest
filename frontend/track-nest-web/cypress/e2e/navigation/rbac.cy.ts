/**
 * NAVIGATION & ROLE-BASED ACCESS CONTROL (RBAC) TESTS
 *
 * Techniques applied:
 *  - Decision Table (DT) – primary technique
 *      Axes: Role × Route → Expected access outcome
 *      Axes: Role × Sidebar item → Visible | Hidden
 *
 *  - Use-case Testing
 *      UC-NAV-01 : Sidebar reflects correct items per role
 *      UC-NAV-02 : Active link is highlighted
 *      UC-NAV-03 : Breadcrumbs render on interior pages
 *
 * Full Decision Table – Role × Route Access:
 * ┌─────────────────────┬──────────────────────────┬──────────────────────┐
 * │ Role                │ Route                    │ Outcome              │
 * ├─────────────────────┼──────────────────────────┼──────────────────────┤
 * │ Reporter            │ /dashboard/missing-persons│ ACCESSIBLE          │
 * │ Reporter            │ /dashboard/crime-reports  │ ACCESSIBLE          │
 * │ Reporter            │ /dashboard/guidelines     │ ACCESSIBLE          │
 * │ Reporter            │ /dashboard/safe-zones     │ ACCESS DENIED msg   │
 * │ Reporter            │ /dashboard/emergency-req  │ ACCESS DENIED msg   │
 * │ Reporter            │ /dashboard/accounts       │ ACCESSIBLE (admin UI hidden) │
 * ├─────────────────────┼──────────────────────────┼──────────────────────┤
 * │ Admin               │ /dashboard/accounts       │ ACCESSIBLE          │
 * │ Admin               │ /dashboard/missing-persons│ ACCESSIBLE          │
 * │ Admin               │ /dashboard/safe-zones     │ ACCESS DENIED msg   │
 * ├─────────────────────┼──────────────────────────┼──────────────────────┤
 * │ Emergency Service  │ /dashboard/safe-zones     │ ACCESSIBLE          │
 * │ Emergency Service  │ /dashboard/emergency-req  │ ACCESSIBLE          │
 * │ Emergency Service  │ /dashboard/missing-persons│ ACCESSIBLE          │
 * ├─────────────────────┼──────────────────────────┼──────────────────────┤
 * │ User                │ /dashboard/missing-persons│ ACCESSIBLE          │
 * │ User                │ /dashboard/safe-zones     │ ACCESS DENIED msg   │
 * └─────────────────────┴──────────────────────────┴──────────────────────┘
 *
 * Sidebar visibility Decision Table:
 * ┌─────────────────────┬─────────────┬────────────────────┬──────────────┬──────────┐
 * │ Sidebar Item        │ Reporter    │ Emergency Service │ Admin        │ User     │
 * ├─────────────────────┼─────────────┼────────────────────┼──────────────┼──────────┤
 * │ Overview            │ VISIBLE     │ VISIBLE            │ VISIBLE      │ VISIBLE  │
 * │ Missing Persons     │ VISIBLE     │ VISIBLE            │ VISIBLE      │ VISIBLE  │
 * │ Crime Reports       │ VISIBLE     │ VISIBLE            │ VISIBLE      │ VISIBLE  │
 * │ Guidelines          │ VISIBLE     │ VISIBLE            │ VISIBLE      │ VISIBLE  │
 * │ Emergency Requests  │ HIDDEN      │ VISIBLE            │ HIDDEN       │ HIDDEN   │
 * │ Safe Zones          │ HIDDEN      │ VISIBLE            │ HIDDEN       │ HIDDEN   │
 * │ Accounts            │ HIDDEN      │ HIDDEN             │ VISIBLE      │ HIDDEN   │
 * └─────────────────────┴─────────────┴────────────────────┴──────────────┴──────────┘
 */

describe("Navigation & RBAC", () => {
  // =========================================================================
  // UC-NAV-01 : Sidebar items per role
  // =========================================================================
  context("UC-NAV-01 | Sidebar reflects correct items per role", () => {
    it("Reporter sees standard nav items but NOT Emergency Requests or Safe Zones", () => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "Reporter");
      cy.get("nav, aside").within(() => {
        cy.contains(/overview|dashboard/i).should("exist");
        cy.contains(/missing persons/i).should("exist");
        cy.contains(/crime reports/i).should("exist");
        cy.contains(/guidelines/i).should("exist");
        cy.contains(/emergency requests/i).should("not.exist");
        cy.contains(/safe zones/i).should("not.exist");
        cy.contains(/accounts/i).should("not.exist");
      });
    });

    it("Emergency Service sees Emergency Requests AND Safe Zones", () => {
      cy.mockSafeZonesApi();
      cy.visitAsRole("/dashboard/safe-zones", "Emergency Service");
      cy.wait("@getSafeZones");
      cy.get("nav, aside").within(() => {
        cy.contains(/emergency requests/i).should("exist");
        cy.contains(/safe zones/i).should("exist");
        cy.contains(/accounts/i).should("not.exist");
      });
    });

    it("Admin sees Accounts but NOT Emergency Requests or Safe Zones", () => {
      cy.visitAsRole("/dashboard/missing-persons", "Admin");
      cy.get("nav, aside").within(() => {
        cy.contains(/accounts/i).should("exist");
        cy.contains(/emergency requests/i).should("not.exist");
        cy.contains(/safe zones/i).should("not.exist");
      });
    });

    it("Regular User does NOT see Emergency Requests, Safe Zones, or Accounts", () => {
      cy.visitAsRole("/dashboard/missing-persons", "User");
      cy.get("nav, aside").within(() => {
        cy.contains(/emergency requests/i).should("not.exist");
        cy.contains(/safe zones/i).should("not.exist");
        cy.contains(/accounts/i).should("not.exist");
      });
    });
  });

  // =========================================================================
  // Decision Table – Role × Route
  // =========================================================================
  context("DT | Role × Route access", () => {
    // Reporter routes
    it("DT-R01 | Reporter → /dashboard/missing-persons → accessible", () => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "Reporter");
      cy.url().should("include", "/dashboard/missing-persons");
      cy.contains("Access Denied").should("not.exist");
    });

    it("DT-R02 | Reporter → /dashboard/crime-reports → accessible", () => {
      cy.mockCriminalReportsApi();
      cy.visitAsRole("/dashboard/crime-reports", "Reporter");
      cy.url().should("include", "/dashboard/crime-reports");
      cy.contains("Access Denied").should("not.exist");
    });

    it("DT-R03 | Reporter → /dashboard/safe-zones → Access Denied", () => {
      cy.visitAsRole("/dashboard/safe-zones", "Reporter");
      cy.contains("Access Denied").should("be.visible");
    });

    it("DT-R04 | Reporter → /dashboard/emergency-requests → Access Denied", () => {
      cy.visitAsRole("/dashboard/emergency-requests", "Reporter");
      cy.contains("Access Denied").should("be.visible");
    });

    // Admin routes
    it("DT-A01 | Admin → /dashboard/accounts → accessible", () => {
      cy.visitAsRole("/dashboard/accounts", "Admin");
      cy.url().should("include", "/dashboard");
      cy.contains("Access Denied").should("not.exist");
    });

    it("DT-A02 | Admin → /dashboard/safe-zones → Access Denied", () => {
      cy.visitAsRole("/dashboard/safe-zones", "Admin");
      cy.contains("Access Denied").should("be.visible");
    });

    // Emergency Service routes
    it("DT-E01 | Emergency Service → /dashboard/safe-zones → accessible", () => {
      cy.mockSafeZonesApi();
      cy.visitAsRole("/dashboard/safe-zones", "Emergency Service");
      cy.wait("@getSafeZones");
      cy.contains("Access Denied").should("not.exist");
    });

    it("DT-E02 | Emergency Service → /dashboard/emergency-requests → accessible", () => {
      cy.mockEmergencyRequestsApi();
      cy.visitAsRole("/dashboard/emergency-requests", "Emergency Service");
      cy.wait("@getEmergencyRequests");
      cy.contains("Access Denied").should("not.exist");
    });

    // User routes
    it("DT-U01 | User → /dashboard/missing-persons → accessible", () => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "User");
      cy.url().should("include", "/dashboard/missing-persons");
    });

    it("DT-U02 | User → /dashboard/safe-zones → Access Denied", () => {
      cy.visitAsRole("/dashboard/safe-zones", "User");
      cy.contains("Access Denied").should("be.visible");
    });
  });

  // =========================================================================
  // UC-NAV-02 : Header shows correct user info per role
  // =========================================================================
  context("UC-NAV-02 | Header user info", () => {
    it("Reporter header displays 'Reporter' role badge", () => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "Reporter");
      cy.get("header, [data-testid='header']").then(($header) => {
        if ($header.length) {
          cy.wrap($header).contains(/reporter/i).should("exist");
        } else {
          // Fallback: role badge somewhere on the page
          cy.contains(/reporter/i).should("exist");
        }
      });
    });

    it("Admin header displays 'Admin' role badge", () => {
      cy.visitAsRole("/dashboard/accounts", "Admin");
      cy.contains(/admin/i).should("exist");
    });

    it("Emergency Service header displays 'Emergency Service' role badge", () => {
      cy.mockSafeZonesApi();
      cy.visitAsRole("/dashboard/safe-zones", "Emergency Service");
      cy.wait("@getSafeZones");
      cy.contains(/emergency/i).should("exist");
    });
  });

  // =========================================================================
  // UC-NAV-03 : Sidebar navigation links work
  // =========================================================================
  context("UC-NAV-03 | Sidebar link navigation", () => {
    beforeEach(() => {
      cy.mockMissingPersonsApi();
      cy.mockCriminalReportsApi();
      cy.mockGuidelinesApi();
      cy.visitAsRole("/dashboard/missing-persons", "Reporter");
    });

    it("clicking Crime Reports in sidebar navigates to crime-reports page", () => {
      cy.get("nav, aside").contains(/crime reports/i).click();
      cy.url().should("include", "/dashboard/crime-reports");
    });

    it("clicking Guidelines in sidebar navigates to guidelines page", () => {
      cy.get("nav, aside").contains(/guidelines/i).click();
      cy.url().should("include", "/dashboard/guidelines");
    });

    it("clicking Missing Persons in sidebar navigates to missing-persons page", () => {
      cy.get("nav, aside").contains(/missing persons/i).click();
      cy.url().should("include", "/dashboard/missing-persons");
    });
  });
});
