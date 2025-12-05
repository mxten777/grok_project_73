// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />

// Custom command to login
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
});

// Custom command to wait for loading to complete
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-cy="loading"]').should('not.exist');
});

// Custom command to check if user is logged in
Cypress.Commands.add('shouldBeLoggedIn', () => {
  cy.get('[data-cy="user-menu"]').should('be.visible');
});

// Custom command to navigate to a page
Cypress.Commands.add('navigateTo', (page: string) => {
  cy.get(`[data-cy="nav-${page}"]`).click();
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      waitForLoading(): Chainable<void>;
      shouldBeLoggedIn(): Chainable<void>;
      navigateTo(page: string): Chainable<void>;
    }
  }
}

export {};