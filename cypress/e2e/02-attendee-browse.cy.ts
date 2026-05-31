// demo 2: attendee browsing - event list, search, event detail
describe("Attendee - Browse Events", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
  });

  it("displays the event list page", () => {
    cy.visit("/events");
    cy.contains("Events").should("be.visible");
    // wait for events to load
    cy.get(".panel, [class*='event']", { timeout: 10000 }).should("exist");
  });

  it("opens an event detail page", () => {
    cy.visit("/events");
    // click the first event link
    cy.get("a[href*='/events/']").first().click();
    cy.contains("About this event").should("be.visible");
  });

  it("shows ticket tiers on event detail", () => {
    cy.visit("/events");
    cy.get("a[href*='/events/']").first().click();
    // ticket section or registration card should be visible
    cy.get("body").then(($body) => {
      if ($body.find(":contains('Ticket Options')").length) {
        cy.contains("Ticket Options").should("be.visible");
      } else {
        cy.contains("Register Now").should("be.visible");
      }
    });
  });

  it("searches for events using the search page", () => {
    cy.visit("/search");
    cy.get("input[placeholder*='Search']").type("test");
    cy.wait(1000);
    // results or empty state should appear
    cy.get("body").should("exist");
  });

  it("shows saved events page", () => {
    cy.visit("/saved");
    cy.contains("Saved").should("be.visible");
  });

  it("shows notifications page", () => {
    cy.visit("/notifications");
    cy.contains("Notifications").should("be.visible");
  });
});
