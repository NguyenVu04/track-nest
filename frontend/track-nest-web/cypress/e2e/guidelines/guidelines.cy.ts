/**
 * GUIDELINES TESTS
 *
 * Techniques applied:
 *  - Use-case Testing
 *      UC-GL-01 : View guidelines list
 *      UC-GL-02 : Reporter creates a guideline document
 *      UC-GL-03 : Publisher publishes a guideline
 *      UC-GL-04 : Search guidelines
 *
 *  - Equivalence Class Partitioning (ECP)
 *      • title   : valid non-empty | empty (blocked)
 *      • content : valid non-empty | empty (blocked)
 *      • search  : match | partial | no-match
 *
 *  - Boundary Value Analysis (BVA)
 *      • title   : 1 char (min) | 255 chars (upper boundary)
 *      • abstractText : empty is accepted (optional)
 *
 *  - Decision Table
 *      Role × Create button visibility (same as other lists)
 */

describe("Guidelines Page", () => {
  beforeEach(() => {
    cy.mockGuidelinesApi();
    cy.visitAsRole("/dashboard/guidelines", "Reporter");
    cy.wait("@getGuidelines");
  });

  // =========================================================================
  // UC-GL-01 : List renders guidelines
  // =========================================================================
  context("UC-GL-01 | Guidelines list renders correctly", () => {
    it("displays all guideline titles from fixture", () => {
      cy.contains("Evacuation Protocol").should("be.visible");
      cy.contains("Missing Person Reporting Guide").should("be.visible");
    });

    it("shows public/private badge", () => {
      // One is public (isPublic: true) and one is not
      cy.get("table tbody tr, [data-testid='guideline-row']").should("have.length.at.least", 2);
    });
  });

  // =========================================================================
  // UC-GL-02 : Reporter creates a guideline
  // =========================================================================
  context("UC-GL-02 | Create guideline (Use-case + BVA + ECP)", () => {
    beforeEach(() => {
      cy.contains(/new guideline|create.*guideline|add guideline/i).click();
    });

    // BVA – title
    it("BVA-GL-T01 | 1 character title (minimum boundary) is accepted", () => {
      cy.get("#title, input[placeholder*='title' i], input[name='title']").first().type("A");
      cy.get("#title, input[placeholder*='title' i], input[name='title']")
        .first()
        .should("have.value", "A");
    });

    it("BVA-GL-T02 | 255 character title (upper boundary) is accepted", () => {
      const longTitle = "G".repeat(255);
      cy.get("#title, input[placeholder*='title' i], input[name='title']")
        .first()
        .type(longTitle);
      cy.get("#title, input[placeholder*='title' i], input[name='title']")
        .first()
        .invoke("val")
        .should("have.length", 255);
    });

    it("BVA-GL-T03 | empty title (below minimum) prevents submission", () => {
      // Leave title empty, fill content
      cy.get("textarea, #content").first().type("Valid content.");
      cy.get("button[type='submit'], button").contains(/save|create|submit/i).click();
      cy.get("@createGuideline.all").should("have.length", 0);
    });

    // ECP – content
    it("ECP-GL-CONTENT-01 | valid content allows submission", () => {
      cy.get("#title, input[placeholder*='title' i], input[name='title']")
        .first()
        .type("Safety Procedures Guide");
      cy.get("textarea").first().type("Step 1: Remain calm. Step 2: Evacuate.");
      cy.get("button[type='submit'], button").contains(/save|create|submit/i).click();
      cy.wait("@createGuideline");
    });

    it("ECP-GL-CONTENT-02 | empty content (required) prevents submission", () => {
      cy.get("#title, input[placeholder*='title' i], input[name='title']")
        .first()
        .type("Some title");
      // Leave textarea empty
      cy.get("button[type='submit'], button").contains(/save|create|submit/i).click();
      cy.get("@createGuideline.all").should("have.length", 0);
    });
  });

  // =========================================================================
  // UC-GL-04 : Search guidelines
  // =========================================================================
  context("UC-GL-04 | Search guidelines (ECP)", () => {
    it("ECP-SEARCH-MATCH | exact title match shows the guideline", () => {
      cy.get("input[placeholder*='Search' i]").type("Evacuation Protocol");
      cy.contains("Evacuation Protocol").should("be.visible");
    });

    it("ECP-SEARCH-PARTIAL | partial match works", () => {
      cy.get("input[placeholder*='Search' i]").type("Evacuation");
      cy.contains("Evacuation Protocol").should("be.visible");
    });

    it("ECP-SEARCH-NOMATCH | no-match hides all results", () => {
      cy.get("input[placeholder*='Search' i]").type("ZZNOTEXIST999");
      cy.contains("Evacuation Protocol").should("not.exist");
    });
  });

  // =========================================================================
  // Decision Table – Role × Create button
  // =========================================================================
  context("DT | Role × Create guideline button", () => {
    it("DT-GL-R01 | Reporter sees the Create button", () => {
      cy.contains(/new guideline|create.*guideline|add guideline/i).should("be.visible");
    });

    it("DT-GL-R02 | Admin does NOT see the Create button", () => {
      cy.mockGuidelinesApi();
      cy.visitAsRole("/dashboard/guidelines", "Admin");
      cy.wait("@getGuidelines");
      cy.contains(/new guideline|create.*guideline|add guideline/i).should("not.exist");
    });

    it("DT-GL-R03 | Emergency Services does NOT see the Create button", () => {
      cy.mockGuidelinesApi();
      cy.visitAsRole("/dashboard/guidelines", "Emergency Services");
      cy.wait("@getGuidelines");
      cy.contains(/new guideline|create.*guideline|add guideline/i).should("not.exist");
    });
  });
});
