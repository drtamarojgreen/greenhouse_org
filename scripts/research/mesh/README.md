# MeSH Historical Research Pipeline Suite

This suite implements a three-stage empirical framework for discovering and analyzing historical research trends in Medical Subject Headings (MeSH), with a specific focus on mental health.

## 🏗️ Architecture

The system is organized into three distinct operational layers:

### 1. Ingestion Layer (`historical_analysis.py`)
Parses raw NLM MeSH XML and NCBI PubMed baseline files to aggregate yearly term frequencies.
- **Entry Point**: `python3 -m scripts.research.mesh.historical_analysis --mode [discovery|full]`
- **Outputs**: `curated_terms.json`, `full_time_series.csv`, `modeling_results.csv`.

### 2. Discovery Layer - PCA Edition (`terms/`)
Uses Principal Component Analysis and K-Means clustering to identify thematic research clusters based on temporal trajectory similarities.
- **Entry Point**: `python3 scripts/research/mesh/terms/scripts/run_pipeline.py`
- **Output**: Unsupervised theme discovery results.

### 3. Discovery Layer - Neural Edition (`trends/`)
Uses a custom NumPy-only Autoencoder for non-linear latent embeddings and a Neural MLP for trend classification.
- **Entry Point**: `python3 scripts/research/mesh/trends/scripts/run_pipeline.py`
- **Output**: Advanced neural trend classification and logistic growth modeling.

## 🚀 Getting Started

1.  **Ingest Data**:
    ```bash
    python3 -m scripts.research.mesh.historical_analysis --mode discovery
    python3 -m scripts.research.mesh.historical_analysis --mode full
    ```
2.  **Prepare Analysis Datasets**:
    ```bash
    python3 scripts/research/mesh/scripts/prepare_analysis_data.py
    ```
3.  **Run discovery pipelines**:
    ```bash
    python3 scripts/research/mesh/terms/scripts/run_pipeline.py
    python3 scripts/research/mesh/trends/scripts/run_pipeline.py
    ```
4.  **Export Final Results**:
    ```bash
    python3 scripts/research/mesh/scripts/export_results_to_csv.py
    ```

Final CSV results and documentation are consolidated in the `data/` directory.
