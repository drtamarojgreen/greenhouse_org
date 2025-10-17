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
