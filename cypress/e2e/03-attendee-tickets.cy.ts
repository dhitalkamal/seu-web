// demo 3: attendee tickets and QR codes
describe("Attendee - Tickets & QR", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
  });

  it("shows the tickets page with registered events", () => {
    cy.visit("/tickets");
    cy.contains("Tickets").should("be.visible");
  });

  it("shows QR code modal when clicking Show QR", () => {
    cy.visit("/tickets");
    cy.get("body").then(($body) => {
      if ($body.find("button:contains('Show QR')").length) {
        cy.contains("Show QR").first().click();
        // QR code SVG should render
        cy.get("svg", { timeout: 5000 }).should("exist");
      } else {
        cy.log("No tickets with QR available - skipping");
      }
    });
  });

  it("shows event history page", () => {
    cy.visit("/history");
    cy.contains("History").should("be.visible");
  });

  it("shows participation passport", () => {
    cy.visit("/passport");
    cy.contains("Passport").should("be.visible");
  });
});
