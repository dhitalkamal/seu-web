// demo 1: authentication flow - register, login, verify, profile
describe("Authentication Flow", () => {
  it("shows the login page", () => {
    cy.visit("/login");
    cy.contains("Sign in").should("be.visible");
    cy.get("input[type='email']").should("be.visible");
    cy.get("input[type='password']").should("be.visible");
  });

  it("shows the registration page", () => {
    cy.visit("/register");
    cy.contains("Create account").should("be.visible");
    cy.get("input[type='email']").should("be.visible");
  });

  it("logs in with valid credentials and redirects to events", () => {
    cy.fixture("users").then((users) => {
      cy.visit("/login");
      cy.get("input[type='email']").type(users.attendee.email);
      cy.get("input[type='password']").type(users.attendee.password);
      cy.get("button[type='submit']").click();
      cy.url({ timeout: 10000 }).should("include", "/events");
    });
  });

  it("shows profile page with user info", () => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
      cy.visit("/profile");
      cy.contains("Profile").should("be.visible");
    });
  });
});
