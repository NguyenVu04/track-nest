/**
 * SAFE ZONES TESTS
 *
 * Techniques applied:
 *  - Boundary Value Analysis (BVA)
 *      Variables & limits:
 *        • name   : min = 1 char; no declared max (test 100 chars)
 *        • radius : min boundary = 1 metre; large value = 50000 m;
 *                   zero / negative are semantically invalid but depend on backend
 *        • latitude  : [-90, 90]
 *        • longitude : [-180, 180]
 *
 *  - Equivalence Class Partitioning (ECP)
 *      • type (select) : Police Station | Hospital | Shelter | Other
 *      • name search   : exact match | partial | no match
 *
 *  - Decision Table (DT)
 *      Role × Feature access:
 *      ┌─────────────────────┬────────────────────┬──────────────────┐
 *      │ Role                │ Page accessible    │ Add button shown │
 *      ├─────────────────────┼────────────────────┼──────────────────┤
 *      │ Emergency Service  │ YES                │ YES              │
 *      │ Reporter            │ NO (Access Denied) │ N/A              │
 *      │ Admin               │ NO (Access Denied) │ N/A              │
 *      │ User                │ NO (Access Denied) │ N/A              │
 *      └─────────────────────┴────────────────────┴──────────────────┘
 *
 *  - Use-case Testing
 *      UC-SZ-01 : Emergency Service user views safe zones list
 *      UC-SZ-02 : Create safe zone end-to-end
 *      UC-SZ-03 : Delete safe zone with confirmation
 *      UC-SZ-04 : Search safe zones by name
 *      UC-SZ-05 : Click row to view on map
 */

describe("Safe Zones Page", () => {
  // =========================================================================
  // Decision Table – Role × page access
  // =========================================================================
  context("DT | Role × page access control", () => {
    it("DT-SZ-01 | Emergency Service can access the page", () => {
      cy.mockSafeZonesApi();
      cy.visitAsRole("/dashboard/safe-zones", "Emergency Service");
      cy.wait("@getSafeZones");
      cy.contains("Safe Zones").should("be.visible");
      cy.contains("Access Denied").should("not.exist");
    });

    it("DT-SZ-02 | Reporter sees Access Denied", () => {
      cy.visitAsRole("/dashboard/safe-zones", "Reporter");
      cy.contains("Access Denied").should("be.visible");
    });

    it("DT-SZ-03 | Admin sees Access Denied", () => {
      cy.visitAsRole("/dashboard/safe-zones", "Admin");
      cy.contains("Access Denied").should("be.visible");
    });

    it("DT-SZ-04 | Regular User sees Access Denied", () => {
      cy.visitAsRole("/dashboard/safe-zones", "User");
      cy.contains("Access Denied").should("be.visible");
    });
  });

  // =========================================================================
  // Shared setup for Emergency Service tests
  // =========================================================================
  describe("Emergency Service role – full access", () => {
    beforeEach(() => {
      cy.mockSafeZonesApi();
      cy.visitAsRole("/dashboard/safe-zones", "Emergency Service");
      cy.wait("@getSafeZones");
    });

    // -----------------------------------------------------------------------
    // UC-SZ-01 : List renders zones
    // -----------------------------------------------------------------------
    context("UC-SZ-01 | Safe zones list renders correctly", () => {
      it("displays zone names from fixture", () => {
        cy.contains("District 1 Police Station").should("be.visible");
        cy.contains("Cho Ray Hospital").should("be.visible");
        cy.contains("City Shelter – North").should("be.visible");
      });

      it("shows radius column values", () => {
        cy.contains("200m").should("be.visible");
        cy.contains("500m").should("be.visible");
        cy.contains("150m").should("be.visible");
      });

      it("shows coordinate pairs for each zone", () => {
        // Coordinates formatted to 4dp
        cy.contains("10.7769").should("be.visible");
      });
    });

    // -----------------------------------------------------------------------
    // UC-SZ-02 : Create safe zone
    // -----------------------------------------------------------------------
    context("UC-SZ-02 | Create safe zone form", () => {
      beforeEach(() => {
        cy.contains("Add Safe Zone").click();
        cy.contains("Add Safe Zone").should("be.visible"); // modal title
      });

      // --- BVA: name ---
      it("BVA-SZ-NAME01 | 1 character name (minimum) enables the Confirm button", () => {
        cy.get("input").eq(0).clear().type("X"); // name field
        cy.get("input[type='number']").eq(0).type("10.5"); // latitude
        cy.get("input[type='number']").eq(1).type("106.5"); // longitude
        cy.get("input[type='number']").eq(2).type("100"); // radius
        cy.contains("button", "Confirm").should("not.be.disabled");
      });

      it("BVA-SZ-NAME02 | 100 character name is accepted", () => {
        const longName = "Z".repeat(100);
        cy.get("input").eq(0).clear().type(longName);
        cy.get("input").eq(0).invoke("val").should("have.length", 100);
      });

      it("BVA-SZ-NAME03 | empty name keeps Confirm button disabled", () => {
        cy.get("input").eq(0).clear();
        cy.contains("button", "Confirm").should("be.disabled");
      });

      // --- BVA: radius ---
      it("BVA-SZ-RAD01 | radius = 1 metre (near-minimum boundary)", () => {
        cy.get("input[type='number']")
          .filter("[step]")
          .last()
          .clear()
          .type("1");
        cy.get("input[type='number']").filter("[step]").last().should("have.value", "1");
      });

      it("BVA-SZ-RAD02 | radius = 500 (default / typical value)", () => {
        cy.get("input[type='number']")
          .filter("[step]")
          .last()
          .clear()
          .type("500");
        cy.get("input[type='number']").filter("[step]").last().should("have.value", "500");
      });

      it("BVA-SZ-RAD03 | radius = 50000 (large boundary value)", () => {
        cy.get("input[type='number']")
          .filter("[step]")
          .last()
          .clear()
          .type("50000");
        cy.get("input[type='number']").filter("[step]").last().should("have.value", "50000");
      });

      // --- BVA: latitude ---
      it("BVA-SZ-LAT01 | latitude = -90 accepted", () => {
        cy.get("input[type='number']").eq(0).type("-90");
        cy.get("input[type='number']").eq(0).should("have.value", "-90");
      });

      it("BVA-SZ-LAT02 | latitude = 90 accepted", () => {
        cy.get("input[type='number']").eq(0).type("90");
        cy.get("input[type='number']").eq(0).should("have.value", "90");
      });

      // --- BVA: longitude ---
      it("BVA-SZ-LON01 | longitude = -180 accepted", () => {
        cy.get("input[type='number']").eq(1).type("-180");
        cy.get("input[type='number']").eq(1).should("have.value", "-180");
      });

      it("BVA-SZ-LON02 | longitude = 180 accepted", () => {
        cy.get("input[type='number']").eq(1).type("180");
        cy.get("input[type='number']").eq(1).should("have.value", "180");
      });

      // --- ECP: type select ---
      it("ECP-SZ-TYPE-01 | type = Police Station is selectable", () => {
        cy.get("select").select("Police Station");
        cy.get("select").should("have.value", "Police Station");
      });

      it("ECP-SZ-TYPE-02 | type = Hospital is selectable", () => {
        cy.get("select").select("Hospital");
        cy.get("select").should("have.value", "Hospital");
      });

      it("ECP-SZ-TYPE-03 | type = Shelter is selectable", () => {
        cy.get("select").select("Shelter");
        cy.get("select").should("have.value", "Shelter");
      });

      it("ECP-SZ-TYPE-04 | type = Other is selectable", () => {
        cy.get("select").select("Other");
        cy.get("select").should("have.value", "Other");
      });

      // --- UC-SZ-02 full flow ---
      it("UC-SZ-02 | fills form and confirms creation", () => {
        // Get all inputs inside the modal
        cy.get(".fixed input").first().clear().type("New Police Post");  // name
        cy.get(".fixed input[type='number']").eq(0).type("10.8231");     // latitude
        cy.get(".fixed input[type='number']").eq(1).type("106.6297");    // longitude
        cy.get(".fixed input[type='number']").eq(2).type("300");          // radius
        cy.contains("button", "Confirm").click();
        cy.wait("@createSafeZone").then((interception) => {
          expect(interception.request.body).to.include({ name: "New Police Post" });
        });
        cy.contains("Safe zone created successfully").should("be.visible");
      });

      // --- Cancel modal ---
      it("clicking Cancel closes the create modal", () => {
        cy.contains("button", "Cancel").click();
        cy.contains("Add Safe Zone").should("not.exist");
      });
    });

    // -----------------------------------------------------------------------
    // UC-SZ-03 : Delete safe zone with confirmation
    // -----------------------------------------------------------------------
    context("UC-SZ-03 | Delete safe zone", () => {
      it("clicking delete icon opens the ConfirmModal", () => {
        cy.get("button[title='Delete Safe Zone']").first().click();
        cy.contains("Delete Safe Zone").should("be.visible");
        cy.contains("Are you sure").should("be.visible");
      });

      it("confirming delete calls the delete API", () => {
        cy.get("button[title='Delete Safe Zone']").first().click();
        cy.contains("button", "Delete").click();
        cy.wait("@deleteSafeZone");
        cy.contains("Safe zone deleted successfully").should("be.visible");
      });

      it("cancelling the ConfirmModal does not call the delete API", () => {
        cy.get("button[title='Delete Safe Zone']").first().click();
        cy.contains("button", /cancel/i).click();
        cy.get("@deleteSafeZone.all").should("have.length", 0);
      });
    });

    // -----------------------------------------------------------------------
    // UC-SZ-04 : Search safe zones
    // -----------------------------------------------------------------------
    context("UC-SZ-04 | Search safe zones (ECP)", () => {
      it("ECP-SZ-SEARCH-01 | exact name match", () => {
        cy.get("input[placeholder*='Search']").type("Cho Ray Hospital");
        cy.contains("Cho Ray Hospital").should("be.visible");
        cy.contains("District 1 Police Station").should("not.exist");
      });

      it("ECP-SZ-SEARCH-02 | partial name match", () => {
        cy.get("input[placeholder*='Search']").type("Police");
        cy.contains("District 1 Police Station").should("be.visible");
      });

      it("ECP-SZ-SEARCH-03 | no match returns empty table", () => {
        cy.get("input[placeholder*='Search']").type("ZZZNOTEXIST");
        cy.contains("District 1 Police Station").should("not.exist");
        cy.contains("Cho Ray Hospital").should("not.exist");
      });
    });

    // -----------------------------------------------------------------------
    // UC-SZ-05 : Click row to view on map
    // -----------------------------------------------------------------------
    context("UC-SZ-05 | Row click selects zone on map", () => {
      it("clicking a row highlights it and updates the map panel title", () => {
        cy.contains("tr", "Cho Ray Hospital").click();
        cy.contains("Cho Ray Hospital Location").should("be.visible");
      });

      it("clicking 'Show All Safe Zones' resets to all-zones view", () => {
        cy.contains("tr", "Cho Ray Hospital").click();
        cy.contains("← Show All Safe Zones").click();
        cy.contains("All Safe Zones Map").should("be.visible");
      });
    });
  });
});
