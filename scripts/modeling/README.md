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