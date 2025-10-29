# Development Guidelines

This document provides a central reference for coding standards, architectural patterns, and development practices for this project. Adherence to these guidelines is crucial for maintaining a readable, scalable, and stable codebase.

## 1. General Principles

### 1.1. Code Commenting
**Mandate:** All new functions, complex logic blocks, and architectural components must be thoroughly commented. The goal is to explain the "why" behind the code, not just the "what."

### 1.2. Error Handling
**Mandate:** All asynchronous operations, particularly backend `fetch` calls, must be wrapped in `try...catch` blocks. The application must handle potential failures gracefully and provide clear, non-technical feedback to the user.

### 1.3. Branching and Commits
- **Branching:** Use a descriptive, kebab-case naming convention for branches (e.g., `feature/patient-self-scheduling`, `bugfix/calendar-rendering-issue`).
- **Commits:** Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This practice is vital for a clear and navigable version history.

## 2. JavaScript (Velo and Static Applications)

### 2.1. Architectural Patterns
- **Module Loading:** New static applications must integrate with the central loader (`greenhouse.js`), which is responsible for dynamically injecting dependencies based on the URL path.
- **Separation of Concerns:** Strictly adhere to the established separation of concerns:
    - `schedulerUI.js`: Responsible *only* for building and returning static DOM elements. It should contain no application logic or event listeners.
    - `*App.js` (e.g., `GreenhousePatientApp.js`): Contains all application logic, event handling, and backend communication for a specific view.
- **DOM Manipulation (Static JS):** To avoid conflicts with the Wix React DOM, all direct DOM manipulation in static JavaScript files (`docs/js/`) **must** use the safe wrapper functions provided in `GreenhouseReactCompatibility.js`.

### 2.2. Velo-Specific Guidelines
- **Selectors:**
    - **Mandate:** Never use Wix-generated, non-deterministic IDs (e.g., `#comp-xxxxxxxx`). All interactive elements must be assigned a stable, semantic ID in the Wix Editor.
    - Use `$w('#elementId')` for page-level elements.
    - Within repeater scope (`onItemReady`), you **must** use the item-scoped selector: `$item('#elementId')`.
- **Asynchronous Operations:** All backend function calls must use `async/await` syntax for improved readability and error handling. Avoid `.then()` chains.

### 2.3. Data Fetching
**Critical Mandate:** Data fetching must **never** be triggered automatically on script load. The UI must be fully rendered first. Data retrieval must be initiated by an explicit user action (e.g., clicking a button). This is a core architectural rule to prevent race conditions.

### 2.4. CSS
**Mandate:** To prevent style collisions with the Wix platform, all new CSS classes created for the static applications must be prefixed with `greenhouse-`.

## 3. Python (Scripts and Testing)

### 3.1. Style Guide
**Standard:** All Python code must adhere to the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide.

### 3.2. Dependencies
- Any new Python script that introduces a new dependency must include a comment block at the top of the file specifying the required packages (e.g., `#-*- Requirements: pandas, rdflib -*-`).
- The project's root `README.md` should be updated with instructions for installing these dependencies via `pip`.

### 3.3. Test Environment
- Python Selenium tests are executed in a headless environment using `pyvirtualdisplay`.
- Tests should not contain hardcoded paths to web drivers. They should assume that `geckodriver` is available in the system's `PATH`.
