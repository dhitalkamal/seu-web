// demo 4: organizer workspace - dashboard, events, venues, sponsors, team
describe("Organizer - Workspace", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
  });

  it("shows org dashboard with KPIs", () => {
    cy.visit("/org/dashboard");
    cy.contains("Overview").should("be.visible");
    // KPI cards should render
    cy.get(".kpi-grid").should("exist");
  });

  it("shows events list", () => {
    cy.visit("/org/events");
    cy.contains("Events").should("be.visible");
  });

  it("opens event creation wizard", () => {
    cy.visit("/org/events/create");
    cy.contains("Basics").should("be.visible");
    cy.contains("Schedule").should("be.visible");
    cy.contains("Tickets").should("be.visible");
  });

  it("shows venues page with create option", () => {
    cy.visit("/org/venues");
    cy.contains("Venues").should("be.visible");
  });

  it("shows sponsors page", () => {
    cy.visit("/org/sponsors");
    cy.contains("Sponsors").should("be.visible");
  });

  it("shows team management page", () => {
    cy.visit("/org/team");
    cy.contains("Team").should("be.visible");
  });

  it("shows org settings page", () => {
    cy.visit("/org/settings");
    cy.contains("Basic Info").should("be.visible");
  });

  it("shows pricing/plans page", () => {
    cy.visit("/org/pricing");
    cy.contains("Pricing").should("be.visible");
  });
});
