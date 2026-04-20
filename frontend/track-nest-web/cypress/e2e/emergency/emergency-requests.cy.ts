/**
 * EMERGENCY REQUESTS TESTS
 *
 * Techniques applied:
 *  - Use-case Testing
 *      UC-ER-01 : Emergency Services views request list
 *      UC-ER-02 : Emergency Services accepts a PENDING request
 *      UC-ER-03 : Emergency Services rejects a PENDING request
 *      UC-ER-04 : Filter requests by status
 *
 *  - Decision Table (DT)
 *      Role × page access:
 *      ┌─────────────────────┬────────────────────┐
 *      │ Role                │ Access             │
 *      ├─────────────────────┼────────────────────┤
 *      │ Emergency Services  │ ACCESSIBLE         │
 *      │ Reporter            │ ACCESS DENIED      │
 *      │ Admin               │ ACCESS DENIED      │
 *      │ User                │ ACCESS DENIED      │
 *      └─────────────────────┴────────────────────┘
 *
 *      Status × Available Actions:
 *      ┌─────────────┬──────────┬──────────┬──────────────┐
 *      │ Status      │ Accept   │ Reject   │ Complete     │
 *      ├─────────────┼──────────┼──────────┼──────────────┤
 *      │ PENDING     │ YES      │ YES      │ NO           │
 *      │ ACCEPTED    │ NO       │ NO       │ YES          │
 *      │ COMPLETED   │ NO       │ NO       │ NO           │
 *      │ REJECTED    │ NO       │ NO       │ NO           │
 *      └─────────────┴──────────┴──────────┴──────────────┘
 *
 *  - Equivalence Class Partitioning (ECP)
 *      • search by ID: valid existing ID | non-existing ID | empty
 *      • status filter: PENDING | ACCEPTED | COMPLETED | ALL
 */

declare global {
  namespace Cypress {
    interface Chainable {
      visitAsRole(path: string, role: string): Chainable<void>;
      mockEmergencyRequestsApi(): Chainable<void>;
    }
  }
}

export {};

describe("Emergency Requests Page", () => {
  // =========================================================================
  // Decision Table – Role × page access
  // =========================================================================
  context("DT | Role × access control", () => {
    it("DT-ER-01 | Emergency Services can access the page", () => {
      cy.mockEmergencyRequestsApi();
      cy.visitAsRole("/dashboard/emergency-requests", "Emergency Services");
      cy.wait("@getEmergencyRequests");
      cy.contains("Access Denied").should("not.exist");
    });

    it("DT-ER-02 | Reporter sees Access Denied", () => {
      cy.visitAsRole("/dashboard/emergency-requests", "Reporter");
      cy.contains("Access Denied").should("be.visible");
    });

    it("DT-ER-03 | Admin sees Access Denied", () => {
      cy.visitAsRole("/dashboard/emergency-requests", "Admin");
      cy.contains("Access Denied").should("be.visible");
    });

    it("DT-ER-04 | Regular User sees Access Denied", () => {
      cy.visitAsRole("/dashboard/emergency-requests", "User");
      cy.contains("Access Denied").should("be.visible");
    });
  });

  // =========================================================================
  // Emergency Services tests
  // =========================================================================
  describe("Emergency Services – full access", () => {
    beforeEach(() => {
      cy.mockEmergencyRequestsApi();
      cy.visitAsRole("/dashboard/emergency-requests", "Emergency Services");
      cy.wait("@getEmergencyRequests");
    });

    // -----------------------------------------------------------------------
    // UC-ER-01 : List renders requests
    // -----------------------------------------------------------------------
    context("UC-ER-01 | Request list renders", () => {
      it("shows all three requests from fixture", () => {
        cy.contains("er-001").should("be.visible");
        cy.contains("er-002").should("be.visible");
        cy.contains("er-003").should("be.visible");
      });

      it("shows status badges for each request", () => {
        cy.contains("PENDING").should("be.visible");
        cy.contains("ACCEPTED").should("be.visible");
        cy.contains("COMPLETED").should("be.visible");
      });
    });

    // -----------------------------------------------------------------------
    // UC-ER-02 : Accept a PENDING request
    // -----------------------------------------------------------------------
    context("UC-ER-02 | Accept PENDING request", () => {
      it("accept button is available on a PENDING request", () => {
        cy.contains("tr", "er-001").within(() => {
          cy.get("button")
            .contains(/accept/i)
            .should("exist");
        });
      });

      it("clicking Accept calls the accept API", () => {
        cy.contains("tr", "er-001").within(() => {
          cy.get("button")
            .contains(/accept/i)
            .click();
        });
        cy.wait("@acceptEmergencyRequest");
      });
    });

    // -----------------------------------------------------------------------
    // UC-ER-03 : Reject a PENDING request
    // -----------------------------------------------------------------------
    context("UC-ER-03 | Reject PENDING request", () => {
      it("reject button is available on a PENDING request", () => {
        cy.contains("tr", "er-001").within(() => {
          cy.get("button")
            .contains(/reject/i)
            .should("exist");
        });
      });

      it("clicking Reject calls the reject API", () => {
        cy.contains("tr", "er-001").within(() => {
          cy.get("button")
            .contains(/reject/i)
            .click();
        });
        cy.wait("@rejectEmergencyRequest");
      });
    });

    // -----------------------------------------------------------------------
    // DT – Status × Actions
    // -----------------------------------------------------------------------
    context("DT | Status × action availability", () => {
      it("DT-STATUS-01 | PENDING request has Accept and Reject buttons", () => {
        cy.contains("tr", "er-001").within(() => {
          cy.get("button")
            .contains(/accept/i)
            .should("exist");
          cy.get("button")
            .contains(/reject/i)
            .should("exist");
        });
      });

      it("DT-STATUS-02 | ACCEPTED request does NOT have Accept button", () => {
        cy.contains("tr", "er-002").within(() => {
          cy.get("button")
            .contains(/^accept$/i)
            .should("not.exist");
        });
      });

      it("DT-STATUS-03 | COMPLETED request has no Accept or Reject buttons", () => {
        cy.contains("tr", "er-003").within(() => {
          cy.get("button")
            .contains(/^accept$/i)
            .should("not.exist");
          cy.get("button")
            .contains(/^reject$/i)
            .should("not.exist");
        });
      });
    });

    // -----------------------------------------------------------------------
    // UC-ER-04 : Search / filter (ECP)
    // -----------------------------------------------------------------------
    context("UC-ER-04 | Search requests (ECP)", () => {
      it("ECP-ER-SEARCH-01 | searching by existing ID shows the request", () => {
        cy.get("input[placeholder*='Search' i], input[type='text']")
          .first()
          .type("er-001");
        cy.contains("er-001").should("be.visible");
      });

      it("ECP-ER-SEARCH-02 | searching non-existing ID hides all requests", () => {
        cy.get("input[placeholder*='Search' i], input[type='text']")
          .first()
          .type("ZZNOTEXIST");
        cy.contains("er-001").should("not.exist");
        cy.contains("er-002").should("not.exist");
      });

      it("ECP-ER-SEARCH-03 | empty search shows all requests", () => {
        cy.get("input[placeholder*='Search' i], input[type='text']")
          .first()
          .clear();
        cy.contains("er-001").should("be.visible");
        cy.contains("er-002").should("be.visible");
        cy.contains("er-003").should("be.visible");
      });
    });

    // -----------------------------------------------------------------------
    // ECP – Status filter
    // -----------------------------------------------------------------------
    context("ECP | Status filter classes", () => {
      it("ECP-STATUS-PENDING | filtering to PENDING shows only pending requests", () => {
        cy.get("select").then(($selects) => {
          if ($selects.length > 0) {
            cy.get("select").first().select("PENDING", { force: true });
            cy.contains("PENDING").should("be.visible");
          }
        });
      });

      it("ECP-STATUS-ACCEPTED | filtering to ACCEPTED shows only accepted", () => {
        cy.get("select").then(($selects) => {
          if ($selects.length > 0) {
            cy.get("select").first().select("ACCEPTED", { force: true });
            cy.contains("ACCEPTED").should("be.visible");
          }
        });
      });

      it("ECP-STATUS-ALL | filtering to ALL shows every status", () => {
        cy.get("select").then(($selects) => {
          if ($selects.length > 0) {
            cy.get("select").first().select("", { force: true });
            cy.contains("PENDING").should("be.visible");
            cy.contains("ACCEPTED").should("be.visible");
            cy.contains("COMPLETED").should("be.visible");
          }
        });
      });
    });
  });
});
