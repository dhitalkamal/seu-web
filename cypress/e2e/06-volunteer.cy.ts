// demo 6: volunteer flow - home, applications, shifts, hours, certificates
describe("Volunteer Flow", () => {
  beforeEach(() => {
    cy.fixture("users").then((users) => {
      cy.login(users.attendee.email, users.attendee.password);
    });
  });

  it("shows volunteer home page", () => {
    cy.visit("/volunteer");
    cy.contains("Volunteer").should("be.visible");
  });

  it("shows volunteer applications page", () => {
    cy.visit("/volunteer/applications");
    cy.contains("Applications").should("be.visible");
  });

  it("shows volunteer shifts page", () => {
    cy.visit("/volunteer/shifts");
    cy.contains("Shifts").should("be.visible");
  });

  it("shows volunteer hours page", () => {
    cy.visit("/volunteer/hours");
    cy.contains("Hours").should("be.visible");
  });

  it("shows volunteer certificates page", () => {
    cy.visit("/volunteer/certificates");
    cy.contains("Certificates").should("be.visible");
  });
});
