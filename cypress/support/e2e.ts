// global support file loaded before every spec

// custom command: login as a user and store the JWT
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request("POST", "/iam/api/v1/auth/login/", { email, password }).then((res) => {
    const { access, refresh } = res.body.data;
    window.localStorage.setItem("sansaar-tokens", JSON.stringify({ access, refresh }));
  });
});

// custom command: login as superadmin
Cypress.Commands.add("loginSuperadmin", (email: string, password: string) => {
  cy.request("POST", "/iam/api/v1/auth/login/", { email, password }).then((res) => {
    const { access, refresh } = res.body.data;
    // superadmin app reads from the same storage key
    window.localStorage.setItem("sansaar-tokens", JSON.stringify({ access, refresh }));
  });
});

// custom command: wait for page to finish loading (no spinners)
Cypress.Commands.add("waitForLoad", () => {
  cy.get(".animate-pulse", { timeout: 15000 }).should("not.exist");
});

// type declarations for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginSuperadmin(email: string, password: string): Chainable<void>;
      waitForLoad(): Chainable<void>;
    }
  }
}
