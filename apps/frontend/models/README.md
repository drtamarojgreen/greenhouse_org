# Models Visualization

This directory contains the frontend code for the **Models** page, which visualizes brain, synapse, and environment data.

---

## How it works

The `Models.js` file fetches multiple JSON datasets from an external source and passes them to the browser-side script using a hidden text element as a data bridge.

### Key Features:

-   **Multi-Source Data Fetching**: Fetches data for brain, synapse, and environment models concurrently.
-   **Data Bridge**: Passes the combined JSON data to the frontend via the `#dataTextElement` and `#testLabel`.

### External Data Sources:

-   Brain Model: `https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_brain.json`
-   Synapse Model: `https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_synapses.json`
-   Environment Model: `https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_environment.json`

### Velo Elements Used:

-   `$w("#dataTextElement")`: A hidden text element used to pass JSON data to the client-side script.
-   `$w("#testLabel")`: Used as an alternative data holder using a custom attribute.
