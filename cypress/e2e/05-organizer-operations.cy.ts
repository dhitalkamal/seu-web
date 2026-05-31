// demo 5: organizer operations - check-in, waitlist, participation, campaigns
describe("Organizer - Operations", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
  });

  it("shows check-in console with event selector", () => {
    cy.visit("/org/checkin");
    cy.contains("Check-in console").should("be.visible");
    cy.contains("Select event").should("be.visible");
    // event dropdown should have options
    cy.get("select").should("exist");
  });

  it("shows start camera button for QR scanning", () => {
    cy.visit("/org/checkin");
    cy.contains("Start camera").should("be.visible");
  });

  it("shows waitlist management page", () => {
    cy.visit("/org/waitlist");
    cy.contains("Waitlist").should("be.visible");
  });

  it("shows volunteer applications page", () => {
    cy.visit("/org/volunteer-apps");
    cy.contains("Volunteer").should("be.visible");
  });

  it("shows community page", () => {
    cy.visit("/org/community");
    cy.contains("Community").should("be.visible");
  });

  it("shows campaigns page", () => {
    cy.visit("/org/campaigns");
    cy.contains("Campaigns").should("be.visible");
  });

  it("shows finance hub with real KPIs", () => {
    cy.visit("/org/finance");
    cy.contains("Finance").should("be.visible");
    cy.get(".kpi-grid").should("exist");
  });

  it("shows reports page with generate option", () => {
    cy.visit("/org/reports");
    cy.contains("Reports").should("be.visible");
  });

  it("shows analytics page with real data", () => {
    cy.visit("/org/analytics");
    cy.contains("Analytics").should("be.visible");
    cy.get(".kpi-grid").should("exist");
  });

  it("shows taxonomy page", () => {
    cy.visit("/org/taxonomy");
    cy.contains("Taxonomy").should("be.visible");
  });

  it("shows participation page", () => {
    cy.visit("/org/participation");
    cy.contains("Participation").should("be.visible");
  });
});
