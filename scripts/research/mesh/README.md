# MeSH Historical Research Pipeline Suite

This suite implements a multi-stage empirical framework for discovering and analyzing historical research trends in Medical Subject Headings (MeSH), with a specific focus on mental health. It has evolved through multiple iterations, moving from simple API discovery to complex neural embeddings and multi-source knowledge graphs.

## 🏗️ Current Architecture

The system is organized into three distinct operational layers that represent the current production standard:

### 1. Ingestion & Pre-processing (`historical_analysis.py`)
Parses raw NLM MeSH XML and NCBI PubMed baseline files to aggregate yearly term frequencies.
- **Entry Point**: `python3 -m scripts.research.mesh.historical_analysis --mode [discovery|full]`
- **Outputs**: `curated_terms.json`, `full_time_series.csv`.

### 2. Discovery Layer - PCA Edition (`terms/`)
Uses Principal Component Analysis and K-Means clustering to identify thematic research clusters based on temporal trajectory similarities.
- **Entry Point**: `python3 scripts/research/mesh/terms/scripts/run_pipeline.py`
- **Focus**: Unsupervised theme discovery using linear dimensionality reduction.

### 3. Discovery Layer - Neural Edition (`trends/`)
Uses a custom NumPy-only Autoencoder for non-linear latent embeddings and a Neural MLP for trend classification, paired with logistic S-curve growth modeling.
- **Entry Point**: `python3 scripts/research/mesh/trends/scripts/run_pipeline.py`
- **Focus**: Advanced non-linear trend classification and predictive growth modeling.

---

## 🧬 Pipeline Evolutions

The suite maintains historical versions representing different architectural breakthroughs in MeSH research:

| Version | Focus | Key Features |
| :--- | :--- | :--- |
| **v2** | **Enhanced Discovery** | Configurable PubMed search with Z-score and CAGR analytics. |
| **v3** | **NLP Enrichment** | Abstract-level keyword extraction and co-occurrence network analysis. |
| **v4** | **Hierarchical Trees** | Recursive discovery building hierarchical tree structures with SQLite caching. |
| **v5** | **Temporal Dynamics** | Longitudinal analysis focusing on timeline visualizations of term emergence. |
| **v6** | **Graph Ingestion** | Discovery driven by external graph datasets and top-node processing. |
| **v7** | **Network Analytics** | Advanced topological analysis (density, centrality) using NetworkX. |
| **v8** | **Multi-Source Data** | Integration with DrugBank, DisGeNET, OpenTargets, and ClinicalTrials.gov. |
| **v9** | **Production Suite** | The unified pipeline: Discovery + Clinical Trials + Temporal + Graph stages. |
| **va** | **Visual Analysis** | Interactive Web Dashboard for real-time discovery monitoring. |
| **vb** | **Lightweight Core** | Zero-dependency Python implementation for restricted environments. |

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
3.  **Run Discovery Pipelines**:
    ```bash
    # Run PCA discovery
    python3 scripts/research/mesh/terms/scripts/run_pipeline.py
    # Run Neural trend analysis
    python3 scripts/research/mesh/trends/scripts/run_pipeline.py
    # Run production v9 pipeline
    python3 scripts/research/mesh/v9/main_pipeline.py
    ```

Final results and multi-source graph data are consolidated in the `data/` and version-specific `output/` directories.
