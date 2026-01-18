# Genetic Simulation

This directory contains the frontend code for the **Genetic Simulation** page of the Greenhouse for Mental Health website.

---

## How it works

The `Genetic.js` file contains Velo code that initializes the genetic simulation environment. It assumes that the HTML structure is already present on the page (e.g., via a Custom Element or Embed HTML) and that an external script handles the core logic.

### Key Features:

-   **Environment Initialization**: Prepares the page for the simulation when the browser environment is ready.
-   **Configuration**: Defines initial configuration parameters such as population size and mutation rate.

### Velo Elements Used:

-   `#genetic-app-container`: The target selector where the application is injected.

---

This approach allows the genetic simulation to be integrated seamlessly into the Wix environment while keeping the complex logic in external scripts.
