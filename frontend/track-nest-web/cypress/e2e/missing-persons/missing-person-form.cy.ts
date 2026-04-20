/**
 * MISSING PERSON FORM TESTS
 *
 * Techniques applied:
 *  - Boundary Value Analysis (BVA)
 *      Variables & limits:
 *        • title        : min = 1 char; no declared max (test 255)
 *        • fullName     : min = 1 char
 *        • personalId   : min = 1 char
 *        • date         : earliest valid date vs future date
 *        • latitude     : [-90, 90]
 *        • longitude    : [-180, 180]
 *        • contactPhone : min = 1 char (required field; type="tel")
 *
 *  - Equivalence Class Partitioning (ECP)
 *      • contactEmail : valid email format | invalid format (no @) | empty
 *      • photo URL    : valid https URL | invalid URL format | empty (optional)
 *      • date         : past date | today | future date
 *      • personalId   : alphanumeric string | numeric-only | special chars
 *
 *  - Use-case Testing
 *      UC-MP-01 : Reporter creates a valid missing person report
 *      UC-MP-02 : Form submits and calls the API correctly
 *      UC-MP-03 : Cancel button navigates away without submitting
 *      UC-MP-04 : Required field validation blocks submission
 */

describe("Missing Person Form", () => {
  beforeEach(() => {
    cy.mockMissingPersonsApi();
    cy.visitAsRole("/dashboard/missing-persons/create", "Reporter");
    cy.contains("New Missing Person Report").should("be.visible");
  });

  // =========================================================================
  // BVA – Title field
  // =========================================================================
  context("BVA | Title field boundaries", () => {
    it("BVA-T01 | title with 1 character (minimum boundary) is accepted", () => {
      cy.get("#title").clear().type("X");
      cy.get("#title").should("have.value", "X");
    });

    it("BVA-T02 | title with 255 characters (upper boundary test) is accepted", () => {
      const longTitle = "B".repeat(255);
      cy.get("#title").clear().type(longTitle);
      cy.get("#title").invoke("val").should("have.length", 255);
    });

    it("BVA-T03 | empty title (below minimum) prevents form submission", () => {
      cy.get("#title").clear();
      cy.get("#fullName").type("Test Person");
      cy.get("#personalId").type("ID-001");
      cy.get("#date").type("2026-04-01");
      cy.get("#content").type("Description");
      cy.get("#contactPhone").type("+1234567890");
      cy.get("form").submit();
      // API should NOT be called
      cy.get("@createMissingPerson.all").should("have.length", 0);
    });
  });

  // =========================================================================
  // BVA – Full name field
  // =========================================================================
  context("BVA | Full name field boundaries", () => {
    it("BVA-FN01 | fullName with 1 character (minimum boundary)", () => {
      cy.get("#fullName").clear().type("A");
      cy.get("#fullName").should("have.value", "A");
    });

    it("BVA-FN02 | fullName with 100 characters", () => {
      const longName = "C".repeat(100);
      cy.get("#fullName").clear().type(longName);
      cy.get("#fullName").invoke("val").should("have.length", 100);
    });

    it("BVA-FN03 | empty fullName prevents submission", () => {
      cy.get("#fullName").clear();
      cy.get("#title").type("Test Report");
      cy.get("#personalId").type("ID-001");
      cy.get("#date").type("2026-04-01");
      cy.get("#content").type("Description");
      cy.get("#contactPhone").type("+1234567890");
      cy.get("form").submit();
      cy.get("@createMissingPerson.all").should("have.length", 0);
    });
  });

  // =========================================================================
  // BVA – Latitude and Longitude
  // =========================================================================
  context("BVA | Coordinate boundaries", () => {
    it("BVA-LAT01 | latitude = -90 (south boundary)", () => {
      cy.get("#latitude").clear().type("-90");
      cy.get("#latitude").should("have.value", "-90");
    });

    it("BVA-LAT02 | latitude = 0 (midpoint)", () => {
      cy.get("#latitude").clear().type("0");
      cy.get("#latitude").should("have.value", "0");
    });

    it("BVA-LAT03 | latitude = 90 (north boundary)", () => {
      cy.get("#latitude").clear().type("90");
      cy.get("#latitude").should("have.value", "90");
    });

    it("BVA-LON01 | longitude = -180 (west boundary)", () => {
      cy.get("#longitude").clear().type("-180");
      cy.get("#longitude").should("have.value", "-180");
    });

    it("BVA-LON02 | longitude = 0", () => {
      cy.get("#longitude").clear().type("0");
      cy.get("#longitude").should("have.value", "0");
    });

    it("BVA-LON03 | longitude = 180 (east boundary)", () => {
      cy.get("#longitude").clear().type("180");
      cy.get("#longitude").should("have.value", "180");
    });
  });

  // =========================================================================
  // ECP – Contact email equivalence classes
  // =========================================================================
  context("ECP | Contact email classes", () => {
    it("ECP-EMAIL-01 | valid email format is accepted by the email input", () => {
      cy.get("#contactEmail").clear().type("contact@example.com");
      cy.get("#contactEmail").should("have.value", "contact@example.com");
      // Browser validates type=email only on submit
      cy.get("#contactEmail").invoke("prop", "validity").its("valid").should("eq", true);
    });

    it("ECP-EMAIL-02 | email without @ (invalid class) fails browser validation", () => {
      cy.get("#contactEmail").clear().type("invalidemail.com");
      cy.get("#contactEmail")
        .invoke("prop", "validity")
        .its("valid")
        .should("eq", false);
    });

    it("ECP-EMAIL-03 | empty email (optional field) is valid – form can submit", () => {
      cy.get("#contactEmail").clear();
      cy.get("#contactEmail").invoke("prop", "validity").its("valid").should("eq", true);
    });

    it("ECP-EMAIL-04 | email with subdomain is valid", () => {
      cy.get("#contactEmail").clear().type("user@mail.example.org");
      cy.get("#contactEmail").invoke("prop", "validity").its("valid").should("eq", true);
    });
  });

  // =========================================================================
  // ECP – Photo URL classes
  // =========================================================================
  context("ECP | Photo URL field classes", () => {
    it("ECP-PHOTO-01 | valid https URL is accepted", () => {
      cy.get("#photo").clear().type("https://example.com/sarah.jpg");
      cy.get("#photo").invoke("prop", "validity").its("valid").should("eq", true);
    });

    it("ECP-PHOTO-02 | invalid URL (no protocol) fails browser URL validation", () => {
      cy.get("#photo").clear().type("not-a-valid-url");
      cy.get("#photo").invoke("prop", "validity").its("valid").should("eq", false);
    });

    it("ECP-PHOTO-03 | empty photo URL is valid (optional field)", () => {
      cy.get("#photo").clear();
      cy.get("#photo").invoke("prop", "validity").its("valid").should("eq", true);
    });
  });

  // =========================================================================
  // ECP – Date field (date missing)
  // =========================================================================
  context("ECP | Date field classes", () => {
    it("ECP-DATE-01 | past date is a valid 'date missing' value", () => {
      cy.get("#date").type("2020-06-15");
      cy.get("#date").should("have.value", "2020-06-15");
    });

    it("ECP-DATE-02 | today's date is valid", () => {
      const today = new Date().toISOString().slice(0, 10);
      cy.get("#date").type(today);
      cy.get("#date").should("have.value", today);
    });

    it("ECP-DATE-03 | future date is accepted (person may have gone missing in future records)", () => {
      cy.get("#date").type("2030-01-01");
      cy.get("#date").should("have.value", "2030-01-01");
    });
  });

  // =========================================================================
  // ECP – PersonalId classes
  // =========================================================================
  context("ECP | Personal ID classes", () => {
    it("ECP-PID-01 | alphanumeric ID is valid", () => {
      cy.get("#personalId").clear().type("DL-123456");
      cy.get("#personalId").should("have.value", "DL-123456");
    });

    it("ECP-PID-02 | numeric-only ID is valid", () => {
      cy.get("#personalId").clear().type("0123456789");
      cy.get("#personalId").should("have.value", "0123456789");
    });

    it("ECP-PID-03 | passport-style ID with special chars is valid", () => {
      cy.get("#personalId").clear().type("PASS-LX5532");
      cy.get("#personalId").should("have.value", "PASS-LX5532");
    });

    it("ECP-PID-04 | empty personal ID (required field) prevents submission", () => {
      cy.get("#personalId").clear();
      cy.get("#title").type("Test Report");
      cy.get("#fullName").type("Test Person");
      cy.get("#date").type("2026-04-01");
      cy.get("#content").type("Description");
      cy.get("#contactPhone").type("+1234567890");
      cy.get("form").submit();
      cy.get("@createMissingPerson.all").should("have.length", 0);
    });
  });

  // =========================================================================
  // UC-MP-01 : Full end-to-end create flow
  // =========================================================================
  context("UC-MP-01 | Reporter creates a valid missing person report", () => {
    it("fills all required fields and submits successfully", () => {
      cy.get("#title").clear().type("Missing Person – Jane Doe");
      cy.get("#fullName").clear().type("Jane Doe");
      cy.get("#personalId").clear().type("ID-XYZ-789");
      cy.get("#date").type("2026-04-05");
      cy.get("#latitude").clear().type("10.8231");
      cy.get("#longitude").clear().type("106.6297");
      cy.get("#content").clear().type(
        "Jane Doe, 25 years old, last seen wearing a blue dress near the eastern market."
      );
      cy.get("#contactEmail").clear().type("family@example.com");
      cy.get("#contactPhone").clear().type("+1 234 567 8900");

      cy.get("button[type='submit']").click();
      cy.wait("@createMissingPerson").then((interception) => {
        expect(interception.request.body).to.include({ fullName: "Jane Doe" });
      });
    });
  });

  // =========================================================================
  // UC-MP-03 : Cancel navigates away without API call
  // =========================================================================
  context("UC-MP-03 | Cancel without submitting", () => {
    it("Cancel button does not call the create API", () => {
      cy.get("#title").type("Partial data");
      cy.get("button").contains(/cancel/i).click();
      cy.get("@createMissingPerson.all").should("have.length", 0);
    });
  });

  // =========================================================================
  // UC-MP-04 : Required field validation
  // =========================================================================
  context("UC-MP-04 | Required field validation blocks submission", () => {
    const requiredFields: Array<{ id: string; label: string }> = [
      { id: "title", label: "title" },
      { id: "fullName", label: "full name" },
      { id: "personalId", label: "personal ID" },
      { id: "content", label: "description" },
    ];

    requiredFields.forEach(({ id, label }) => {
      it(`missing ${label} blocks form submission`, () => {
        // Fill everything except this field
        cy.get("#title").type("Test Report");
        cy.get("#fullName").type("Test Person");
        cy.get("#personalId").type("ID-001");
        cy.get("#date").type("2026-04-01");
        cy.get("#content").type("Description here");
        cy.get("#contactPhone").type("+1234567890");
        // Now clear the field under test
        cy.get(`#${id}`).clear();
        cy.get("form").submit();
        cy.get("@createMissingPerson.all").should("have.length", 0);
      });
    });
  });
});
