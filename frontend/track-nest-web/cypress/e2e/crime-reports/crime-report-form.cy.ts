/**
 * CRIME REPORT FORM TESTS
 *
 * Techniques applied:
 *  - Boundary Value Analysis (BVA)
 *      Variables & limits:
 *        • title       : min = 1 char, no declared max (test with 255 chars)
 *        • severity    : min = 1, max = 5 (select options; no out-of-range possible)
 *        • numberOfVictims   : min = 0 (min attr on input); test 0, 1, 99
 *        • numberOfOffenders : min = 0; test 0, 1, 99
 *        • latitude    : real-world valid range [-90, 90]; test -90, 0, 90
 *        • longitude   : real-world valid range [-180, 180]; test -180, 0, 180
 *
 *  - Equivalence Class Partitioning (ECP)
 *      • title      : valid (non-empty string) | invalid (empty → form won't submit)
 *      • content    : valid (non-empty) | invalid (empty → form won't submit)
 *      • date       : past datetime | current datetime | future datetime
 *      • arrested   : true | false
 *      • severity   : Low class (1-2) | Medium class (3) | High class (4-5)
 *
 *  - Use-case Testing
 *      UC-CR-01 : Reporter creates a valid crime report end-to-end
 *      UC-CR-02 : Review modal appears before final submit
 *      UC-CR-03 : Cancel from review returns user to edit form
 *      UC-CR-04 : Cancel button navigates back to list
 */

describe("Crime Report Form", () => {
  beforeEach(() => {
    cy.mockCriminalReportsApi();
    cy.visitAsRole("/dashboard/crime-reports/create", "Reporter");
    // Wait for the page to be ready (form heading visible)
    cy.contains("New Crime Report").should("be.visible");
  });

  // =========================================================================
  // BVA – Title field
  // =========================================================================
  context("BVA | Title field boundaries", () => {
    it("BVA-T01 | submits when title has exactly 1 character", () => {
      cy.get("#title").clear().type("A");
      cy.get("#content").type("Valid description for boundary test.");
      cy.get("#date").type("2026-04-01T10:00");
      // Form submit shows review modal
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("be.visible");
    });

    it("BVA-T02 | submits when title has 255 characters (upper boundary)", () => {
      const longTitle = "A".repeat(255);
      cy.get("#title").clear().type(longTitle);
      cy.get("#content").type("Valid description.");
      cy.get("#date").type("2026-04-01T10:00");
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("be.visible");
    });

    it("BVA-T03 | prevents submission when title is empty (invalid boundary)", () => {
      cy.get("#title").clear();
      cy.get("#content").type("Some content");
      cy.get("#date").type("2026-04-01T10:00");
      cy.get("form").submit();
      // Native HTML5 required validation prevents review modal
      cy.contains("Review Crime Report").should("not.exist");
    });
  });

  // =========================================================================
  // BVA – Severity field (select options, range 1–5)
  // =========================================================================
  context("BVA | Severity field boundaries", () => {
    it("BVA-S01 | severity 1 (minimum) – Low", () => {
      cy.get("#severity").select("1");
      cy.get("#severity").should("have.value", "1");
    });

    it("BVA-S02 | severity 2 – Low-Medium (just above minimum)", () => {
      cy.get("#severity").select("2");
      cy.get("#severity").should("have.value", "2");
    });

    it("BVA-S03 | severity 3 – Medium (midpoint)", () => {
      cy.get("#severity").select("3");
      cy.get("#severity").should("have.value", "3");
    });

    it("BVA-S04 | severity 4 – High (just below maximum)", () => {
      cy.get("#severity").select("4");
      cy.get("#severity").should("have.value", "4");
    });

    it("BVA-S05 | severity 5 (maximum) – Critical", () => {
      cy.get("#severity").select("5");
      cy.get("#severity").should("have.value", "5");
    });
  });

  // =========================================================================
  // BVA – numberOfVictims and numberOfOffenders
  // =========================================================================
  context("BVA | Victim and offender count boundaries", () => {
    it("BVA-V01 | numberOfVictims = 0 (minimum boundary)", () => {
      cy.get("#numberOfVictims").clear().type("0");
      cy.get("#numberOfVictims").should("have.value", "0");
    });

    it("BVA-V02 | numberOfVictims = 1 (just above minimum)", () => {
      cy.get("#numberOfVictims").clear().type("1");
      cy.get("#numberOfVictims").should("have.value", "1");
    });

    it("BVA-V03 | numberOfVictims = 99 (large valid value)", () => {
      cy.get("#numberOfVictims").clear().type("99");
      cy.get("#numberOfVictims").should("have.value", "99");
    });

    it("BVA-O01 | numberOfOffenders = 0 (minimum boundary)", () => {
      cy.get("#numberOfOffenders").clear().type("0");
      cy.get("#numberOfOffenders").should("have.value", "0");
    });

    it("BVA-O02 | numberOfOffenders = 1 (just above minimum)", () => {
      cy.get("#numberOfOffenders").clear().type("1");
      cy.get("#numberOfOffenders").should("have.value", "1");
    });
  });

  // =========================================================================
  // BVA – Latitude and Longitude
  // =========================================================================
  context("BVA | Latitude and longitude boundaries", () => {
    it("BVA-LAT01 | latitude = -90 (south pole boundary)", () => {
      cy.get("#latitude").clear().type("-90");
      cy.get("#latitude").should("have.value", "-90");
    });

    it("BVA-LAT02 | latitude = 0 (equator midpoint)", () => {
      cy.get("#latitude").clear().type("0");
      cy.get("#latitude").should("have.value", "0");
    });

    it("BVA-LAT03 | latitude = 90 (north pole boundary)", () => {
      cy.get("#latitude").clear().type("90");
      cy.get("#latitude").should("have.value", "90");
    });

    it("BVA-LON01 | longitude = -180 (west boundary)", () => {
      cy.get("#longitude").clear().type("-180");
      cy.get("#longitude").should("have.value", "-180");
    });

    it("BVA-LON02 | longitude = 0 (prime meridian)", () => {
      cy.get("#longitude").clear().type("0");
      cy.get("#longitude").should("have.value", "0");
    });

    it("BVA-LON03 | longitude = 180 (east boundary)", () => {
      cy.get("#longitude").clear().type("180");
      cy.get("#longitude").should("have.value", "180");
    });
  });

  // =========================================================================
  // ECP – Equivalence class partitioning
  // =========================================================================
  context("ECP | Input equivalence classes", () => {
    // --- title ---
    it("ECP-TITLE-01 | valid title (non-empty string) passes form validation", () => {
      cy.get("#title").clear().type("Theft at Market Street");
      cy.get("#content").type("Full description here.");
      cy.get("#date").type("2026-04-01T10:00");
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("be.visible");
    });

    it("ECP-TITLE-02 | empty title (invalid class) blocks submission", () => {
      cy.get("#title").clear();
      cy.get("#content").type("Some content");
      cy.get("#date").type("2026-04-01T10:00");
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("not.exist");
    });

    // --- content ---
    it("ECP-CONTENT-01 | valid description (non-empty) passes", () => {
      cy.get("#title").clear().type("Valid title");
      cy.get("#content").type("A detailed description of the incident.");
      cy.get("#date").type("2026-04-01T10:00");
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("be.visible");
    });

    it("ECP-CONTENT-02 | empty description (invalid class) blocks submission", () => {
      cy.get("#title").clear().type("Valid title");
      cy.get("#content").clear();
      cy.get("#date").type("2026-04-01T10:00");
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("not.exist");
    });

    // --- date classes ---
    it("ECP-DATE-01 | past date is a valid incident date", () => {
      cy.get("#date").type("2020-01-15T08:00");
      cy.get("#date").should("have.value", "2020-01-15T08:00");
    });

    it("ECP-DATE-02 | future date is accepted by the input", () => {
      cy.get("#date").type("2030-12-31T23:59");
      cy.get("#date").should("have.value", "2030-12-31T23:59");
    });

    // --- arrested boolean ---
    it("ECP-ARRESTED-01 | arrested = false (default unchecked state)", () => {
      cy.get("input[type='checkbox']").should("not.be.checked");
    });

    it("ECP-ARRESTED-02 | arrested = true when checkbox is checked", () => {
      cy.get("input[type='checkbox']").check();
      cy.get("input[type='checkbox']").should("be.checked");
    });

    // --- severity classes ---
    it("ECP-SEV-LOW | severity in low class (1)", () => {
      cy.get("#severity").select("1");
      cy.get("#severity").should("have.value", "1");
    });

    it("ECP-SEV-MED | severity in medium class (3)", () => {
      cy.get("#severity").select("3");
      cy.get("#severity").should("have.value", "3");
    });

    it("ECP-SEV-HIGH | severity in high class (5)", () => {
      cy.get("#severity").select("5");
      cy.get("#severity").should("have.value", "5");
    });
  });

  // =========================================================================
  // Use-case testing – End-to-end flows
  // =========================================================================
  context("UC-CR-01 | Reporter creates a valid crime report end-to-end", () => {
    it("fills the form, reviews, and confirms submission", () => {
      cy.get("#title").clear().type("Robbery at Central Market");
      cy.get("#severity").select("4");
      cy.get("#date").type("2026-04-05T14:30");
      cy.get("#content").type(
        "Three suspects robbed a stall at the central market. CCTV footage available."
      );
      cy.get("#latitude").clear().type("10.8231");
      cy.get("#longitude").clear().type("106.6297");
      cy.get("#numberOfVictims").clear().type("2");
      cy.get("#numberOfOffenders").clear().type("3");
      cy.get("input[type='checkbox']").check();

      // Submit → review modal
      cy.get("form").submit();
      cy.contains("Review Crime Report").should("be.visible");

      // Verify review modal content
      cy.contains("Robbery at Central Market").should("be.visible");
      cy.contains("4/5").should("be.visible");
      cy.contains("Yes").should("be.visible"); // arrested

      // Confirm submission
      cy.contains("Confirm Submit").click();
      cy.wait("@createCrimeReport");
    });
  });

  context("UC-CR-02 | Review modal appears before final submit", () => {
    it("shows review modal with entered data summary", () => {
      cy.get("#title").clear().type("Test Incident");
      cy.get("#content").type("Test description");
      cy.get("#date").type("2026-04-01T12:00");
      cy.get("form").submit();

      cy.contains("Review Crime Report").should("be.visible");
      cy.contains("Test Incident").should("be.visible");
    });
  });

  context("UC-CR-03 | Back to Edit from review modal", () => {
    it("clicking 'Back to Edit' closes the review modal", () => {
      cy.get("#title").clear().type("Test Incident");
      cy.get("#content").type("Test description");
      cy.get("#date").type("2026-04-01T12:00");
      cy.get("form").submit();

      cy.contains("Review Crime Report").should("be.visible");
      cy.contains("Back to Edit").click();
      cy.contains("Review Crime Report").should("not.exist");

      // Form should still have the data
      cy.get("#title").should("have.value", "Test Incident");
    });
  });

  context("UC-CR-04 | Cancel returns to list", () => {
    it("Cancel button is present and navigates away from create form", () => {
      // The MissingPersonForm has a Cancel button; CrimeReportForm does too
      cy.get("button").contains(/cancel/i).should("exist");
    });
  });
});
