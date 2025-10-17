# Comprehensive Pharmaceutical Data Analysis Pipeline

This pipeline is designed to process and analyze FDA drug data with a focus on mental health. It creates a comprehensive, linked knowledge graph by integrating two key FDA datasets: **DailyMed (SPL)** and **Drugs@FDA**.

The pipeline automates the following steps:
1.  **Downloads** all relevant drug label data (Human Prescription and OTC) from DailyMed and the full Drugs@FDA data file.
2.  **Converts** both the XML-based SPL files and the tabular Drugs@FDA files into a unified RDF format.
3.  **Links** the two datasets using the drug application number (`ApplNo`), enabling powerful cross-dataset queries.
4.  **Loads** the entire RDF knowledge graph into an Apache Jena Fuseki triple store.
5.  **Executes** a series of advanced SPARQL queries to analyze the integrated data.

## Prerequisites

Before running this pipeline, ensure you have the following software installed:

*   **`bash`**: The Bourne-again shell.
*   **`wget`**: A command-line tool for downloading files.
*   **`unzip`**: A utility for decompressing zip archives.
*   **`xsltproc`**: A command-line XSLT processor (typically included in the `libxslt` package).
*   **`curl`**: A command-line tool for transferring data with URLs.
*   **`python3`**: Python 3.6 or newer.
*   **`pip`**: The Python package installer.
*   **Apache Jena Fuseki**: A SPARQL server. Download it from the [Apache Jena website](https://jena.apache.org/download/).

## Setup

1.  **Install Python Dependencies**:
    The pipeline requires `pandas` and `rdflib`. Install them using pip:
    ```bash
    pip install pandas rdflib
    ```

2.  **Obtain XSLT File**:
    This pipeline requires an XSLT stylesheet named `spl2rdf_extended.xsl` to convert the SPL XML to RDF. This file is not included in the repository and must be obtained separately. Place it in the `scripts/pharmaceutical/` directory.

3.  **Start Fuseki Server**:
    *   Start your Fuseki server.
    *   Create a new dataset named `spl`. The scripts are configured to use this name. You can adjust the `FUSEKI_URL` variable in the scripts if you use a different name.
    *   Example command to start a server with an in-memory dataset named `spl`:
        ```bash
        ./fuseki-server --update --mem /spl
        ```

## Execution

The pipeline is executed via two main scripts.

### 1. Process and Load All Data

This is the main orchestrator script. It handles everything from downloading the raw data to loading the final, processed RDF into Fuseki.

```bash
bash ./process_and_load.sh
```
This script executes a multi-stage process that may take a significant amount of time, depending on your internet connection and machine performance, as it downloads and processes several gigabytes of data.

### 2. Run Analytical Queries

After the `process_and_load.sh` script has completed successfully, you can run the analytical queries against the populated Fuseki server.

```bash
bash ./run_queries.sh
```
The results will be saved as `.csv` files in the `scripts/pharmaceutical/results/` directory. The queries are designed to showcase the benefits of the linked dataset, allowing you to ask complex questions that span both drug label text and structured approval data.

## Pipeline Overview

*   `download_data.sh`: Downloads all required data files and unzips them into the `raw_data/` directory.
*   `convert_drugsfda_to_rdf.py`: Converts the tabular Drugs@FDA data into a single `drugsfda.rdf` file.
*   `process_and_load.sh`: The main orchestrator that runs all steps in the correct order.
*   `run_queries.sh`: Contains advanced, cross-dataset SPARQL queries.
*   `spl2rdf_extended.xsl`: (Required, not included) The stylesheet for converting SPL XML to RDF.
*   `rdf_data/`: Directory where the generated RDF files are stored before loading.
*   `results/`: Directory where the CSV results of the queries are saved.