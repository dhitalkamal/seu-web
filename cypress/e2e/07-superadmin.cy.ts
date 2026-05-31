// demo 7: superadmin flow - all platform management pages
// note: superadmin app runs on a different port, so we use the nginx proxy at /admin/
describe("Superadmin Platform", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => {
      cy.loginSuperadmin(users.superadmin.email, users.superadmin.password);
    });
  });

  it("shows superadmin dashboard", () => {
    cy.visit("/admin/");
    cy.contains("Platform").should("be.visible");
  });

  it("shows organizations page", () => {
    cy.visit("/admin/organizations");
    cy.contains("Organizations").should("be.visible");
  });

  it("shows verification queue", () => {
    cy.visit("/admin/verification-queue");
    cy.contains("Verification").should("be.visible");
  });

  it("shows users management", () => {
    cy.visit("/admin/users");
    cy.contains("Users").should("be.visible");
  });

  it("shows billing page with revenue KPIs", () => {
    cy.visit("/admin/billing");
    cy.contains("Billing").should("be.visible");
    cy.get(".kpi-grid").should("exist");
  });

  it("shows platform analytics", () => {
    cy.visit("/admin/analytics");
    cy.contains("Analytics").should("be.visible");
  });

  it("shows health dashboard", () => {
    cy.visit("/admin/health");
    cy.contains("Health").should("be.visible");
  });

  it("shows feature flags", () => {
    cy.visit("/admin/feature-flags");
    cy.contains("Feature").should("be.visible");
  });

  it("shows audit log", () => {
    cy.visit("/admin/audit-log");
    cy.contains("Audit").should("be.visible");
  });

  it("shows support tickets", () => {
    cy.visit("/admin/support");
    cy.contains("Support").should("be.visible");
  });

  it("shows disputes", () => {
    cy.visit("/admin/disputes");
    cy.contains("Disputes").should("be.visible");
  });

  it("shows announcements", () => {
    cy.visit("/admin/announcements");
    cy.contains("Announcements").should("be.visible");
  });

  it("shows moderation", () => {
    cy.visit("/admin/moderation");
    cy.contains("Moderation").should("be.visible");
  });

  it("shows compliance", () => {
    cy.visit("/admin/compliance");
    cy.contains("Compliance").should("be.visible");
  });
});
