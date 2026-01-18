# Pathway Visualization

This directory contains the frontend code for the **Pathway** visualization page, specifically for KEGG dopaminergic data.

---

## How it works

The `Pathway.js` file fetches raw XML data for a biological pathway and passes it to the browser-side script via a hidden text element.

### Key Features:

-   **XML Data Fetching**: Fetches KEGG dopaminergic pathway data in XML format.
-   **Data Bridge**: Passes the raw XML string to the frontend via the `#pathwayText` element.

### External Data Source:

-   Pathway Data: `https://drtamarojgreen.github.io/greenhouse_org/endpoints/kegg_dopaminergic_raw.xml`

### Velo Elements Used:

-   `$w("#pathwayText")`: A hidden text element used to bridge the fetched XML data to the client-side visualization logic.
