// ***********************************************
// Custom Cypress Commands for TrackNest Web App
// ***********************************************

// ---------------------------------------------------------------------------
// Auth helpers – bypass Keycloak by seeding localStorage directly
// ---------------------------------------------------------------------------

Cypress.Commands.add("loginAs", (role: string) => {
  const users: Record<string, object> = {
    Reporter: {
      id: "reporter-001",
      username: "reporter1",
      email: "reporter1@tracknest.test",
      role: ["Reporter"],
      fullName: "Reporter User",
      status: "Active",
    },
    Admin: {
      id: "admin-001",
      username: "admin1",
      email: "admin1@tracknest.test",
      role: ["Admin"],
      fullName: "Admin User",
      status: "Active",
    },
    "Emergency Service": {
      id: "emergency-001",
      username: "emergency1",
      email: "emergency1@tracknest.test",
      role: ["Emergency Service"],
      fullName: "Emergency User",
      status: "Active",
    },
    User: {
      id: "user-001",
      username: "user1",
      email: "user1@tracknest.test",
      role: ["User"],
      fullName: "Regular User",
      status: "Active",
    },
  };

  const user = users[role];
  if (!user) throw new Error(`Unknown role: ${role}`);

  cy.window().then((win) => {
    win.localStorage.setItem("auth_user", JSON.stringify(user));
    win.localStorage.setItem("access_token", "mock-access-token-for-testing");
    win.localStorage.setItem("refresh_token", "mock-refresh-token-for-testing");
    win.localStorage.setItem("token_type", "Bearer");
    win.localStorage.setItem("user_role", role.toLowerCase().replace(" ", "_"));
  });
});

Cypress.Commands.add("clearAuth", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("auth_user");
    win.localStorage.removeItem("access_token");
    win.localStorage.removeItem("refresh_token");
    win.localStorage.removeItem("token_type");
    win.localStorage.removeItem("user_role");
  });
});

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

Cypress.Commands.add("visitAsRole", (path: string, role: string) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      const users: Record<string, object> = {
        Reporter: {
          id: "reporter-001",
          username: "reporter1",
          email: "reporter1@tracknest.test",
          role: ["Reporter"],
          fullName: "Reporter User",
          status: "Active",
        },
        Admin: {
          id: "admin-001",
          username: "admin1",
          email: "admin1@tracknest.test",
          role: ["Admin"],
          fullName: "Admin User",
          status: "Active",
        },
        "Emergency Service": {
          id: "emergency-001",
          username: "emergency1",
          email: "emergency1@tracknest.test",
          role: ["Emergency Service"],
          fullName: "Emergency User",
          status: "Active",
        },
        User: {
          id: "user-001",
          username: "user1",
          email: "user1@tracknest.test",
          role: ["User"],
          fullName: "Regular User",
          status: "Active",
        },
      };
      win.localStorage.setItem("auth_user", JSON.stringify(users[role]));
      win.localStorage.setItem("access_token", "mock-access-token-for-testing");
      win.localStorage.setItem("refresh_token", "mock-refresh-token");
      win.localStorage.setItem("token_type", "Bearer");
      win.localStorage.setItem("user_role", role.toLowerCase().replace(" ", "_"));
    },
  });
});

// ---------------------------------------------------------------------------
// API intercept helpers
// ---------------------------------------------------------------------------

Cypress.Commands.add("mockCriminalReportsApi", () => {
  cy.intercept("GET", "**/report-manager/crime-reports*", {
    fixture: "crime-reports.json",
  }).as("getCrimeReports");

  cy.intercept("POST", "**/report-manager/crime-reports", (req) => {
    req.reply({
      statusCode: 201,
      body: {
        id: "cr-mock-001",
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reporterId: "reporter-001",
        isPublic: false,
        status: "PENDING",
      },
    });
  }).as("createCrimeReport");

  cy.intercept("POST", "**/report-manager/crime-reports/*/publish", {
    statusCode: 200,
    body: {},
  }).as("publishCrimeReport");

  cy.intercept("DELETE", "**/report-manager/crime-reports/*", {
    statusCode: 204,
    body: {},
  }).as("deleteCrimeReport");
});

Cypress.Commands.add("mockMissingPersonsApi", () => {
  cy.intercept("GET", "**/report-manager/missing-person-reports*", {
    fixture: "missing-persons.json",
  }).as("getMissingPersons");

  cy.intercept("POST", "**/report-manager/missing-person-reports", (req) => {
    req.reply({
      statusCode: 201,
      body: {
        id: "mp-mock-001",
        ...req.body,
        createdAt: new Date().toISOString(),
        userId: "reporter-001",
        reporterId: "reporter-001",
        status: "PENDING",
        isPublic: false,
      },
    });
  }).as("createMissingPerson");

  cy.intercept("POST", "**/report-manager/missing-person-reports/*/publish", {
    statusCode: 200,
    body: {},
  }).as("publishMissingPerson");

  cy.intercept("DELETE", "**/report-manager/missing-person-reports/*", {
    statusCode: 204,
    body: {},
  }).as("deleteMissingPerson");
});

Cypress.Commands.add("mockSafeZonesApi", () => {
  cy.intercept("GET", "**/safe-zone-manager/zones*", {
    fixture: "safe-zones.json",
  }).as("getSafeZones");

  cy.intercept("POST", "**/safe-zone-manager/zones", (req) => {
    req.reply({
      statusCode: 201,
      body: {
        id: "sz-mock-001",
        ...req.body,
        createdAt: new Date().toISOString(),
        emergencyServiceId: "emergency-001",
      },
    });
  }).as("createSafeZone");

  cy.intercept("DELETE", "**/safe-zone-manager/zones/*", {
    statusCode: 204,
    body: {},
  }).as("deleteSafeZone");
});

Cypress.Commands.add("mockEmergencyRequestsApi", () => {
  cy.intercept("GET", "**/emergency-request-manager/requests*", {
    fixture: "emergency-requests.json",
  }).as("getEmergencyRequests");

  cy.intercept("POST", "**/emergency-request-manager/requests/*/accept", {
    statusCode: 200,
    body: {},
  }).as("acceptEmergencyRequest");

  cy.intercept("POST", "**/emergency-request-manager/requests/*/reject", {
    statusCode: 200,
    body: {},
  }).as("rejectEmergencyRequest");
});

Cypress.Commands.add("mockGuidelinesApi", () => {
  cy.intercept("GET", "**/report-manager/guidelines*", {
    fixture: "guidelines.json",
  }).as("getGuidelines");

  cy.intercept("POST", "**/report-manager/guidelines", (req) => {
    req.reply({
      statusCode: 201,
      body: {
        id: "gl-mock-001",
        ...req.body,
        createdAt: new Date().toISOString(),
        reporterId: "reporter-001",
        isPublic: false,
      },
    });
  }).as("createGuideline");
});

// ---------------------------------------------------------------------------
// Type declarations
// ---------------------------------------------------------------------------

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(role: string): Chainable<void>;
      clearAuth(): Chainable<void>;
      visitAsRole(path: string, role: string): Chainable<void>;
      mockCriminalReportsApi(): Chainable<void>;
      mockMissingPersonsApi(): Chainable<void>;
      mockSafeZonesApi(): Chainable<void>;
      mockEmergencyRequestsApi(): Chainable<void>;
      mockGuidelinesApi(): Chainable<void>;
    }
  }
}
