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

## 🧬 Detailed Version Analysis

The following table provides a comprehensive breakdown of the pipeline's evolution from the initial baseline to the current multi-stage production system.

| Version | Focus | Description | Applications | Usage | Key Differences |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **v1** | **Baseline Discovery** | Initial implementation of the term discovery logic using basic NCBI E-Utility calls. | Rapid discovery of high-level MeSH associations. | Integrated into `pubmed_client.py` and core utilities. | Standard baseline; lacks advanced metrics or caching. |
| **v2** | **Analytics Suite** | Introduces statistical metrics like Z-scores and CAGR (Compound Annual Growth Rate). | Comparative growth analysis between research fields. | `python scripts/research/mesh/v2/pipeline.py` | Added `config.yaml` support and quantitative growth metrics. |
| **v3** | **NLP Enrichment** | Integrates Natural Language Processing to extract themes from paper abstracts. | Identifying sub-topics within MeSH terms (e.g., specific symptoms). | `python scripts/research/mesh/v3/pipeline.py` | Moves beyond metadata to analyze actual abstract text content. |
| **v4** | **Hierarchical Trees** | Implements recursive discovery to map "trees" of research lineages. | Mapping the inheritance and branching of scientific concepts. | `python scripts/research/mesh/v4/pipeline.py` | Uses SQLite for persistent caching; generates tree-based JSON output. |
| **v5** | **Temporal Timelines** | Focuses on longitudinal shifts and the chronological emergence of terms. | Visualizing the "history" of a disorder's research landscape. | `python scripts/research/mesh/v5/pipeline.py` | Specialized in generating chronological graphical timelines. |
| **v6** | **Graph Integration** | Bridges discovery with external graph datasets (derived from v7). | Cross-referencing MeSH with broader clinical and pharmacological datasets. | `python scripts/research/mesh/v6/pipeline.py` | Ingests external `.csv` graph data to prioritize top-node discovery. |
| **v7** | **Network Analytics** | Pure network analysis using NetworkX to calculate graph-theoretic metrics. | Identifying "Hub" terms and calculating research connectivity density. | `python scripts/research/mesh/v7/analyze_graph.py` | Shift from discovery to structural analysis (centrality, density, WCC). |
| **v8** | **Multi-Source Pharma** | Connects MeSH to DrugBank, DisGeNET, OpenTargets, and ClinicalTrials.gov. | Drug discovery and genetic association mapping for mental health. | `python scripts/research/mesh/v8/main_pipeline.py` | Massive horizontal expansion to five distinct external APIs. |
| **v9** | **Unified Production** | An orchestrated production-grade pipeline integrating all previous stages. | Production-scale research analysis and publication-ready reporting. | `python scripts/research/mesh/v9/main_pipeline.py` | Fully automated; integrates Clinical Trials, Temporal, and Graph builders. |
| **va** | **Visual Dashboard** | A frontend-enabled interactive discovery and monitoring tool. | Real-time tracking of discovery progress and visual exploration. | Open `scripts/research/mesh/va/index.html` in a browser. | Browser-based UI; utilizes direct browser-to-NCBI API calls. |
| **vb** | **Zero-Dependency** | A minimalist, standard-library implementation for maximum portability. | Running discovery on restricted servers or minimal environments. | `python scripts/research/mesh/vb/discovery.py` | No external dependencies; uses only Python standard libraries. |

---

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
    # Run PCA discovery (Thematic Clustering)
    python3 scripts/research/mesh/terms/scripts/run_pipeline.py
    # Run Neural trend analysis (Predictive Modeling)
    python3 scripts/research/mesh/trends/scripts/run_pipeline.py
    # Run production v9 pipeline (Unified Orchestration)
    python3 scripts/research/mesh/v9/main_pipeline.py
    ```

Final results and multi-source graph data are consolidated in the `data/` and version-specific `output/` directories.
