# Brain Connectome Analysis and Modeling

This project provides a set of scripts to download, analyze, and model brain connectome data from various public datasets.

## Getting Started

1.  **Download the data:**
    Run the `download_data.py` script to fetch all the necessary datasets. This script will create a `data/` directory and place the files there.
    ```bash
    python3 scripts/modeling/download_data.py
    ```

2.  **Run the analysis scripts:**
    Once the data is downloaded, you can run the analysis scripts to explore the datasets.

    *   **Fly Hemibrain Analysis:**
        ```bash
        python3 scripts/modeling/analyze_hemibrain.py
        ```
        This script will print statistics about the scale of the fly hemibrain connectome and the proportions of different neurotransmitters.

    *   **Human Brain Data Analysis:**
        ```bash
        python3 scripts/modeling/analyze_human_brain_data.py
        ```
        This script will print statistics about the physical dimensions of the human brain from the OASIS dataset and discuss the neuronal-to-glial proportion based on information from the Allen Brain Atlas.

## Data Integration with the National Library of Medicine (NLM)

This project also includes a conceptual framework for integrating the connectome data with detailed biochemical information from the NLM.

### Data Sources

*   **Fly Hemibrain Connectome:** Provides detailed information about neuron connectivity and neurotransmitters in the fly brain.
*   **Human Brain Data (OASIS & Allen Brain Map):** Provides clinical, demographic, and some physical measurement data for the human brain.
*   **National Library of Medicine (NLM):**
    *   **PubChem:** A database of chemical molecules and their activities against biological assays. It contains detailed information on neurotransmitters.
    *   **Reactome:** A database of biological pathways and processes. It is integrated with PubChem and provides detailed information on neurotransmitter pathways.

### Integration Approach

The goal is to enrich our connectome model with detailed biochemical information about neurotransmitters and their associated pathways. This can be achieved by linking the neurotransmitters identified in our datasets with the information available in PubChem and Reactome.

1.  **Fetching Neurotransmitter Data from PubChem:**
    The PubChem PUG REST API can be used to programmatically fetch information about specific neurotransmitters.

2.  **Fetching Pathway Data from Reactome (via PubChem):**
    The Reactome database, accessible through PubChem, provides detailed information on biological pathways related to neurotransmission.

3.  **Linking Data to the Connectome:**
    The data from PubChem and Reactome can be linked to our connectome data through the neurotransmitters, allowing for a more comprehensive model.

## Cognitive Modeling Demonstration (R)

This project includes a demonstration of how to use the `catmaid` R package to fetch and visualize neuron data from the fly connectome.

*   **Run the R script:**
    ```R
    source('scripts/modeling/R/cognitive_modeling_demo.R')
    ```
    This script will connect to the CATMAID server, download neuron data, and generate 3D plots.

## Conceptual Distributed Computing Environment

The `setup_environment.sh` script provides a conceptual demonstration of how to set up a distributed computing environment for analyzing large-scale connectome data using tools like Hadoop and Spark.
# Brain Connectome & Cognitive Modeling Scripts

This directory contains a collection of scripts for analyzing brain connectome data, estimating computational requirements, and demonstrating big data processing and cognitive modeling techniques.

## Project Structure

The project is organized into the following subdirectories:

-   `analysis/`: Contains Python scripts for programmatically downloading and analyzing data from various neuroscience datasets.
-   `big_data_setup/`: Includes demonstration scripts for setting up and using a distributed computing environment for large-scale data analysis.
-   `R/`: Provides an R script for a cognitive modeling visualization demonstration using live data from the Virtual Fly Brain CATMAID server.

---

## `analysis/`

This directory contains scripts that perform data analysis on brain datasets.

-   `hemibrain_analysis.py`: Downloads and analyzes data from the Eckstein and Bates et al., Cell (2024) hemibrain study. It calculates neurotransmitter proportions and provides a placeholder for analyzing the dataset's scale.
-   `human_brain_analysis.py`: Provides placeholder functions to demonstrate how one would download and analyze data from the Brain-Map aging study to compute brain dimensions and neuron-to-glia ratios.
-   `estimate_computational_needs.py`: Uses the findings and estimations from the other analysis scripts to estimate the storage and computational resources needed for a full-scale functional brain simulation.

---

## `big_data_setup/`

This directory provides scripts to demonstrate a big data workflow.

-   `setup_cluster.sh`: A commented shell script that outlines the steps to install and configure a big data environment, including Hadoop, Spark, and MySQL.
-   `process_connectome_distributed.py`: A PySpark script that demonstrates how to load, process, and partition a large-scale connectome dataset in a distributed manner using Spark and the Parquet file format.

---

## `R/`

This directory contains scripts for visualization and cognitive modeling in R.

-   `cognitive_modeling_demo.R`: An R script that connects to a live public CATMAID server to fetch and visualize fly connectome data (ORNs and PNs) in 3D, demonstrating a real-world cognitive modeling workflow.
