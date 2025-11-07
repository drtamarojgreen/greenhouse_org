# BDD Testing Strategy for the Greenhouse Simulation Model

## 1. Introduction

This document outlines a Behavior-Driven Development (BDD) strategy for testing the interactive simulation model. The goal is to create a testing framework that is clear, collaborative, and directly tied to the application's intended behavior from a user's perspective.

This strategy is designed to integrate seamlessly with the project's existing, custom-built testing infrastructure, including the lightweight test runner (`test_framework.js`) and assertion library (`assertion_library.js`).

## 2. The BDD Process

The BDD workflow remains centered on collaboration between business, development, and QA stakeholders. The process follows a simple loop:
*   **Discuss:** The team collaborates to define a feature's behavior using concrete examples.
*   **Define:** These examples are written down in a structured, plain-language format called Gherkin in `.feature` files.
*   **Develop:** The development team writes the JavaScript "step definition" code to make these Gherkin scenarios pass, leveraging the existing test framework.

## 3. A Custom JavaScript BDD Framework

Instead of relying on external libraries, we will develop a lightweight, in-house BDD framework. This approach provides maximum control and ensures perfect integration with our existing tools. The new framework will be a JavaScript implementation inspired by the patterns established in the legacy Python-based BDD runner (`tests/bdd_legacy/bdd_runner.py`).

### Key Components:

1.  **Gherkin Parser:** A simple parser to read `.feature` files and extract Scenarios and their corresponding steps (Given, When, Then).
2.  **Step Registry:** A global or module-level object to map plain-text step expressions (using regular expressions) to their corresponding JavaScript implementation functions.
3.  **BDD Runner (`bdd_runner.js`):** The orchestrator that:
    *   Finds and parses all `.feature` files.
    *   Dynamically generates test suites using the existing `TestFramework.describe()` function for each Feature or Scenario.
    *   For each step in a scenario, it finds the matching function in the Step Registry and executes it, wrapping it in a `TestFramework.it()` block.
    *   Uses the existing `assert` library for all assertions within the step definitions.

### Proposed Directory Structure:

To maintain consistency with the legacy setup, the new JavaScript BDD tests should be organized as follows:

```
tests/
└── bdd/
    ├── features/
    │   └── simulation_launch.feature
    └── steps/
    |   └── simulation_launch_steps.js
    └── bdd_runner.js
```

## 4. Example Implementation

Here is a practical example of how to test the simulation's launch sequence using the proposed custom framework.

### Step 1: Write the Feature File

This step remains the same, using the standard Gherkin syntax.

**`tests/bdd/features/simulation_launch.feature`**
```gherkin
Feature: Simulation Launch
  As a user
  I want to launch the interactive simulation after acknowledging the disclaimer
  So that I can explore the educational model.

  Scenario: Successfully launching the simulation after giving consent
    Given the simulation consent screen is displayed
    When I check the "I acknowledge" consent checkbox
    And I click the "Launch Simulation" button
    Then the main simulation interface should be displayed
    And the consent screen should no longer be visible
```

### Step 2: Write the Step Definition File

The step definitions will be written in JavaScript and will use the custom assertion library (`assert`) and interact with the DOM.

**`tests/bdd/steps/simulation_launch_steps.js`**
```javascript
// This file would export a function to register its steps with the BDD runner.

// Assume a 'GreenhouseBDD' object is provided by the runner
const { Given, When, Then } = GreenhouseBDD;

Given('the simulation consent screen is displayed', () => {
  const launchButton = document.getElementById('start-simulation-btn');
  assert.isNotNull(launchButton, 'Launch button should exist');
  assert.isTrue(launchButton.disabled, 'Launch button should be disabled initially');
});

When('I check the "I acknowledge" consent checkbox', () => {
  const consentCheckbox = document.getElementById('consent-checkbox');
  consentCheckbox.click();
});

When('I click the "Launch Simulation" button', () => {
  const launchButton = document.getElementById('start-simulation-btn');
  assert.isFalse(launchButton.disabled, 'Launch button should be enabled after consent');
  launchButton.click();
});

Then('the main simulation interface should be displayed', () => {
  // The main interface is identified by a key element, e.g., the controls panel
  const controlsPanel = document.querySelector('.greenhouse-controls-panel');
  assert.isNotNull(controlsPanel, 'Simulation controls panel should be displayed');
});

Then('the consent screen should no longer be visible', () => {
  const consentCheckbox = document.getElementById('consent-checkbox');
  assert.isNull(consentCheckbox, 'Consent checkbox should no longer be in the DOM');
});
```

## 5. Benefits of This Approach

*   **Consistency:** Leverages the existing `describe/it` structure and assertion library, maintaining a uniform testing style across the project.
*   **Control:** Provides full control over the BDD implementation, allowing for custom features and optimizations.
*   **Lightweight:** Avoids adding large, external dependencies to the project.
*   **Living Documentation:** The `.feature` files will continue to serve as clear, up-to-date documentation of the application's behavior.
