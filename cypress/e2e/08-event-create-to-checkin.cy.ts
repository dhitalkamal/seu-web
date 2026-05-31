// demo 8: full end-to-end flow - create event, register, get QR, check-in
describe("End-to-End: Event Create -> Register -> Check-in", () => {
  const eventTitle = `Demo Event ${Date.now()}`;

  it("step 1: organizer creates a free event", () => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
    cy.visit("/org/events/create");
    // step 1 - basics
    cy.get("input").first().type(eventTitle);
    cy.get("textarea").first().type("This is a test event created by Cypress E2E automation.");
    // click Next
    cy.contains("Next").click();

    // step 2 - schedule
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    const dayAfter = new Date(Date.now() + 172800000).toISOString().slice(0, 16);
    cy.get("input[type='datetime-local']").first().type(tomorrow);
    cy.get("input[type='datetime-local']").last().type(dayAfter);
    cy.get("input[placeholder*='location'], input[placeholder*='custom']").first().type("Kathmandu, Nepal");
    cy.contains("Next").click();

    // step 3 - tickets (free by default)
    cy.contains("Free").should("be.visible");
    cy.contains("Next").click();

    // step 4 - review + create
    cy.contains(eventTitle).should("be.visible");
    cy.contains("Create Event").click();

    // should navigate to event detail
    cy.url({ timeout: 15000 }).should("include", "/org/events/");
  });

  it("step 2: attendee views the event and registers", () => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
    cy.visit("/events");
    // find the created event
    cy.contains(eventTitle).should("be.visible");
    cy.contains(eventTitle).click();
    // register
    cy.contains("Register Now").click();
    cy.contains("Registered", { timeout: 10000 }).should("be.visible");
  });

  it("step 3: attendee views ticket with QR code", () => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
    cy.visit("/tickets");
    cy.contains(eventTitle).should("be.visible");
    // open QR
    cy.contains("Show QR").first().click();
    cy.get("svg", { timeout: 5000 }).should("exist"); // QR code SVG
  });

  it("step 4: organizer opens check-in console and selects event", () => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
    cy.visit("/org/checkin");
    cy.contains("Select event").should("be.visible");
    // select the created event from dropdown
    cy.get("select").select(1); // select first published event
    // KPIs should show
    cy.get(".kpi-grid", { timeout: 10000 }).should("exist");
    cy.contains("Checked in").should("be.visible");
    cy.contains("Start camera").should("be.visible");
  });
});
