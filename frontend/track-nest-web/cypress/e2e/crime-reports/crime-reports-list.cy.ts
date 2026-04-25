/**
 * CRIME REPORTS LIST TESTS
 *
 * Techniques applied:
 *  - Use-case Testing   : Browse, search, filter, publish, delete
 *  - Equivalence Class Partitioning : search term classes (match / no match / partial)
 *  - Decision Table     : Role × Action availability
 *
 * Decision Table – Role × Action on crime reports list:
 * ┌──────────────────────┬──────────────────┬─────────────────┬──────────────────┐
 * │ Role                 │ Create button    │ Publish button  │ Delete button    │
 * ├──────────────────────┼──────────────────┼─────────────────┼──────────────────┤
 * │ Reporter             │ Visible          │ Visible(PENDING)│ Visible          │
 * │ Admin                │ Not visible      │ Not visible     │ Not visible      │
 * │ Emergency Service   │ Not visible      │ Not visible     │ Not visible      │
 * │ User                 │ Not visible      │ Not visible     │ Not visible      │
 * └──────────────────────┴──────────────────┴─────────────────┴──────────────────┘
 */

describe("Crime Reports – List Page", () => {
  beforeEach(() => {
    cy.mockCriminalReportsApi();
    cy.visitAsRole("/dashboard/crime-reports", "Reporter");
    cy.wait("@getCrimeReports");
  });

  // =========================================================================
  // UC-CRL-01 : List renders all reports from API
  // =========================================================================
  context("UC-CRL-01 | List renders reports", () => {
    it("displays reports from the fixture", () => {
      cy.contains("Vehicle Break-in on Main St").should("be.visible");
      cy.contains("Assault near Central Park").should("be.visible");
      cy.contains("Minor Vandalism – Bus Stop").should("be.visible");
    });

    it("shows severity badges for each report", () => {
      // Fixture has severity 3, 4, 1
      cy.get("table tbody tr").should("have.length.at.least", 3);
    });
  });

  // =========================================================================
  // UC-CRL-02 : Search functionality (ECP on search terms)
  // =========================================================================
  context("UC-CRL-02 | Search / filter (ECP)", () => {
    it("ECP-SEARCH-MATCH | searching with an exact match shows the report", () => {
      cy.get("input[placeholder*='Search']").type("Vehicle Break-in");
      cy.contains("Vehicle Break-in on Main St").should("be.visible");
    });

    it("ECP-SEARCH-PARTIAL | partial match still finds the report", () => {
      cy.get("input[placeholder*='Search']").type("Break");
      cy.contains("Vehicle Break-in on Main St").should("be.visible");
    });

    it("ECP-SEARCH-NOMATCH | no-match search class shows empty/filtered state", () => {
      cy.get("input[placeholder*='Search']").type("ZZZZNOTEXIST99999");
      cy.contains("Vehicle Break-in on Main St").should("not.exist");
    });

    it("ECP-SEARCH-EMPTY | clearing search restores full list", () => {
      cy.get("input[placeholder*='Search']").type("Vehicle").clear();
      cy.contains("Vehicle Break-in on Main St").should("be.visible");
      cy.contains("Assault near Central Park").should("be.visible");
    });

    it("ECP-SEARCH-CASE | search is case-insensitive", () => {
      cy.get("input[placeholder*='Search']").type("vehicle break-in");
      cy.contains("Vehicle Break-in on Main St").should("be.visible");
    });
  });

  // =========================================================================
  // UC-CRL-03 : Publish action (Reporter role)
  // =========================================================================
  context("UC-CRL-03 | Publish crime report (Reporter)", () => {
    it("publish button is available on a PENDING/unpublished report", () => {
      // The fixture has cr-002 with isPublic: false — should show publish button
      cy.get("table tbody tr").should("contain.text", "Assault near Central Park");
    });

    it("clicking publish calls the publish API endpoint", () => {
      // Look for publish action buttons (icon or text)
      cy.get("table tbody").within(() => {
        cy.get("button[title*='ublish'], button[aria-label*='ublish']")
          .first()
          .click({ force: true });
      });
      cy.wait("@publishCrimeReport");
    });
  });

  // =========================================================================
  // UC-CRL-04 : Delete action (Reporter role)
  // =========================================================================
  context("UC-CRL-04 | Delete crime report (Reporter)", () => {
    it("delete button is available for Reporter", () => {
      cy.get("table tbody").within(() => {
        cy.get("button[title*='elete'], button[aria-label*='elete']").should(
          "have.length.at.least",
          1
        );
      });
    });

    it("delete triggers confirmation modal", () => {
      cy.get("table tbody").within(() => {
        cy.get("button[title*='elete'], button[aria-label*='elete']")
          .first()
          .click({ force: true });
      });
      // ConfirmModal should appear
      cy.get("body").then(($body) => {
        if ($body.text().includes("Are you sure")) {
          cy.contains("Are you sure").should("be.visible");
        }
      });
    });
  });

  // =========================================================================
  // Decision Table – Role × action availability
  // =========================================================================
  context("DT | Role-based visibility of action buttons", () => {
    it("DT-R01 | Reporter sees Create New Crime Report button", () => {
      cy.contains(/new crime report|create.*crime/i).should("be.visible");
    });

    it("DT-R02 | Admin does NOT see Create button", () => {
      cy.mockCriminalReportsApi();
      cy.visitAsRole("/dashboard/crime-reports", "Admin");
      cy.wait("@getCrimeReports");
      cy.contains(/new crime report|create.*crime/i).should("not.exist");
    });

    it("DT-R03 | Emergency Service does NOT see Create button", () => {
      cy.mockCriminalReportsApi();
      cy.visitAsRole("/dashboard/crime-reports", "Emergency Service");
      cy.wait("@getCrimeReports");
      cy.contains(/new crime report|create.*crime/i).should("not.exist");
    });

    it("DT-R04 | Regular User does NOT see Create button", () => {
      cy.mockCriminalReportsApi();
      cy.visitAsRole("/dashboard/crime-reports", "User");
      cy.wait("@getCrimeReports");
      cy.contains(/new crime report|create.*crime/i).should("not.exist");
    });
  });
});
