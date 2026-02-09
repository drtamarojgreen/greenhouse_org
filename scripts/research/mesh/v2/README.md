# Enhanced MeSH Discovery Suite (v2)

## Overview

The Enhanced MeSH Discovery Suite (v2) is a pipeline for discovering related MeSH terms starting from a seed term. It uses the PubMed API to find related terms and then enriches the results with analytics and visualizations.

## Capabilities

*   **Term Discovery:** Starting with a seed term, the pipeline discovers related MeSH terms.
*   **Data Enrichment:** The discovered terms are enriched with analytics, such as Z-scores and Compound Annual Growth Rate (CAGR).
*   **Visualization:** The pipeline generates visualizations to help understand the discovered terms, such as a growth comparison plot.
*   **Configuration:** The pipeline can be fully configured using a `config.yaml` file.

## How to Use

1.  **Configure the pipeline:** Edit the `config.yaml` file to set the desired parameters for the pipeline.
2.  **Run the pipeline:** Execute the `pipeline.py` script to run the pipeline.

```bash
python scripts/research/mesh/v2/pipeline.py
```

## Limitations

*   The pipeline is currently limited to the PubMed API for term discovery.
*   The analytics are basic and can be extended with more advanced metrics.

## Enhancements

*   **Configuration:** The pipeline is now fully configurable using the `config.yaml` file.
*   **Modularity:** The code has been refactored for better modularity and readability.
*   **Error Handling:** The pipeline now includes basic error handling.
