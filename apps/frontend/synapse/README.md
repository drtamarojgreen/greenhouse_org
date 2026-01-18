# Synapse Visualization

This directory contains the frontend code for the **Synapse** visualization page.

---

## How it works

The `Synapse.js` file fetches synapse model data from a static JSON file and passes it to the client-side script using a hidden text element.

### Key Features:

-   **Static Data Fetching**: Fetches synapse model data from a JSON endpoint.
-   **Data Bridge**: Passes the JSON string to the frontend via the `#synapseDataElement`.

### External Data Source:

-   Synapse Model: `https://drtamarojgreen.github.io/greenhouse_org/endpoints/models_synapses.json`

### Velo Elements Used:

-   `$w("#synapseDataElement")`: A hidden text element used to bridge the fetched JSON data to the client-side script.
