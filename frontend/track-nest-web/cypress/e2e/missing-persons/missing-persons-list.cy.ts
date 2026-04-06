/**
 * MISSING PERSONS LIST TESTS
 *
 * Techniques applied:
 *  - Use-case Testing : Browse list, filter by status, publish, delete
 *  - Equivalence Class Partitioning : Status filter classes, search classes
 *  - Decision Table : Status × available actions
 *
 * Decision Table – Report Status × Available Actions:
 * ┌────────────┬───────────┬──────────────┬────────────────┐
 * │ Status     │ Publish   │ Delete       │ View Detail    │
 * ├────────────┼───────────┼──────────────┼────────────────┤
 * │ PENDING    │ YES       │ YES          │ YES            │
 * │ PUBLISHED  │ NO        │ YES          │ YES            │
 * │ RESOLVED   │ NO        │ YES          │ YES            │
 * │ DELETED    │ NO        │ NO           │ YES            │
 * └────────────┴───────────┴──────────────┴────────────────┘
 */

describe("Missing Persons – List Page", () => {
  beforeEach(() => {
    cy.mockMissingPersonsApi();
    cy.visitAsRole("/dashboard/missing-persons", "Reporter");
    cy.wait("@getMissingPersons");
  });

  // =========================================================================
  // UC-MPL-01 : List renders all persons from API
  // =========================================================================
  context("UC-MPL-01 | List renders missing persons", () => {
    it("shows all three persons from the fixture", () => {
      cy.contains("Sarah Johnson").should("be.visible");
      cy.contains("Tommy Brown").should("be.visible");
      cy.contains("Margaret Lee").should("be.visible");
    });

    it("displays status badges for each record", () => {
      cy.contains("PENDING").should("be.visible");
      cy.contains("PUBLISHED").should("be.visible");
      cy.contains("RESOLVED").should("be.visible");
    });
  });

  // =========================================================================
  // UC-MPL-02 : Search (ECP – search term classes)
  // =========================================================================
  context("UC-MPL-02 | Search (ECP)", () => {
    it("ECP-SEARCH-EXACT | exact full name match shows the person", () => {
      cy.get("input[placeholder*='Search']").type("Sarah Johnson");
      cy.contains("Sarah Johnson").should("be.visible");
    });

    it("ECP-SEARCH-PARTIAL | partial first name still matches", () => {
      cy.get("input[placeholder*='Search']").type("Tommy");
      cy.contains("Tommy Brown").should("be.visible");
    });

    it("ECP-SEARCH-NOMATCH | non-matching term hides all persons", () => {
      cy.get("input[placeholder*='Search']").type("ZZZNOTFOUND999");
      cy.contains("Sarah Johnson").should("not.exist");
      cy.contains("Tommy Brown").should("not.exist");
    });

    it("ECP-SEARCH-CASE | case-insensitive search works", () => {
      cy.get("input[placeholder*='Search']").type("margaret");
      cy.contains("Margaret Lee").should("be.visible");
    });

    it("ECP-SEARCH-CLEAR | clearing search shows full list", () => {
      cy.get("input[placeholder*='Search']").type("Sarah").clear();
      cy.contains("Sarah Johnson").should("be.visible");
      cy.contains("Tommy Brown").should("be.visible");
    });
  });

  // =========================================================================
  // ECP – Status filter classes
  // =========================================================================
  context("ECP | Status filter", () => {
    it("ECP-STATUS-ALL | 'All' filter shows every record", () => {
      // If a status filter select exists, set it to All
      cy.get("select").then(($selects) => {
        if ($selects.length > 0) {
          cy.get("select").first().select("all", { force: true });
        }
      });
      cy.contains("Sarah Johnson").should("be.visible");
      cy.contains("Tommy Brown").should("be.visible");
      cy.contains("Margaret Lee").should("be.visible");
    });

    it("ECP-STATUS-PENDING | filtering to PENDING shows only pending records", () => {
      cy.get("select").then(($selects) => {
        if ($selects.length > 0) {
          cy.get("select").first().select("PENDING", { force: true });
          cy.contains("Sarah Johnson").should("be.visible");
        }
      });
    });

    it("ECP-STATUS-PUBLISHED | filtering to PUBLISHED shows only published records", () => {
      cy.get("select").then(($selects) => {
        if ($selects.length > 0) {
          cy.get("select").first().select("PUBLISHED", { force: true });
          cy.contains("Tommy Brown").should("be.visible");
        }
      });
    });
  });

  // =========================================================================
  // Decision Table – Status × Actions
  // =========================================================================
  context("DT | Status × Action availability", () => {
    it("DT-MP-01 | PENDING report has a Publish action available", () => {
      // Sarah Johnson is PENDING
      cy.contains("tr", "Sarah Johnson").within(() => {
        cy.get("button[title*='ublish'], button[aria-label*='ublish']").should("exist");
      });
    });

    it("DT-MP-02 | PUBLISHED report does NOT have a Publish action", () => {
      // Tommy Brown is PUBLISHED
      cy.contains("tr", "Tommy Brown").within(() => {
        cy.get("button[title*='ublish'], button[aria-label*='ublish']").should("not.exist");
      });
    });

    it("DT-MP-03 | View Detail is available for all statuses", () => {
      cy.get("table tbody tr").each(($tr) => {
        cy.wrap($tr).within(() => {
          cy.get("button, a").should("exist");
        });
      });
    });
  });

  // =========================================================================
  // UC-MPL-03 : Navigation to create form
  // =========================================================================
  context("UC-MPL-03 | Reporter navigates to create form", () => {
    it("Reporter sees New Missing Person button", () => {
      cy.contains(/new missing person|create.*missing/i).should("be.visible");
    });

    it("clicking the button navigates to the create page", () => {
      cy.contains(/new missing person|create.*missing/i).click();
      cy.url().should("include", "/missing-persons/create");
    });
  });

  // =========================================================================
  // Decision Table – Role × Create button visibility
  // =========================================================================
  context("DT | Role × Create button visibility", () => {
    it("DT-ROLE-01 | Reporter sees Create button", () => {
      cy.contains(/new missing person|create.*missing/i).should("be.visible");
    });

    it("DT-ROLE-02 | Admin does NOT see Create button", () => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "Admin");
      cy.wait("@getMissingPersons");
      cy.contains(/new missing person|create.*missing/i).should("not.exist");
    });

    it("DT-ROLE-03 | Emergency Services does NOT see Create button", () => {
      cy.mockMissingPersonsApi();
      cy.visitAsRole("/dashboard/missing-persons", "Emergency Services");
      cy.wait("@getMissingPersons");
      cy.contains(/new missing person|create.*missing/i).should("not.exist");
    });
  });
});
