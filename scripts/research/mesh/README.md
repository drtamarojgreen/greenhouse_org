# MeSH Historical Research Pipeline Suite

This suite implements a multi-stage empirical framework for discovering and analyzing historical research trends in Medical Subject Headings (MeSH), with a specific focus on mental health. It has evolved through multiple iterations, moving from simple API discovery to complex neural embeddings and multi-source knowledge graphs.

## 🏗️ Current Production Architecture

The system is organized into three distinct operational layers that represent the current production standard:

### 1. Ingestion & Pre-processing (`historical_analysis.py`)
Parses raw NLM MeSH XML and NCBI PubMed baseline files to aggregate yearly term frequencies.
- **Entry Point**: `python3 -m scripts.research.mesh.historical_analysis --mode [discovery|full]`
- **Technical Detail**: Uses `ProcessPoolExecutor` for parallel parsing of compressed XML.gz files.
- **Outputs**: `curated_terms.json`, `full_time_series.csv`.

### 2. Discovery Layer - PCA Edition (`terms/`)
Uses Principal Component Analysis and K-Means clustering to identify thematic research clusters based on temporal trajectory similarities.
- **Entry Point**: `python3 scripts/research/mesh/terms/scripts/run_pipeline.py`
- **Technical Detail**: Log-normalization of frequencies followed by SVD-based dimensionality reduction to project high-dimensional temporal vectors into a compact latent space.

### 3. Discovery Layer - Neural Edition (`trends/`)
Uses a custom NumPy-only Autoencoder for non-linear latent embeddings and a Neural MLP for trend classification, paired with logistic S-curve growth modeling.
- **Entry Point**: `python3 scripts/research/mesh/trends/scripts/run_pipeline.py`
- **Technical Detail**: Fits the logistic function $f(x) = \frac{L}{1 + e^{-k(x - x_0)}}$ to identify inflection years ($x_0$) in research acceleration.

---

## 🧬 Detailed Version Analysis

### Version 1 (v1): Baseline Discovery
*   **Overview**: The foundational implementation of the MeSH discovery logic, focused on basic term retrieval and major topic identification.
*   **Technical Depth**: Utilizes the NCBI E-Utilities (`esearch`, `efetch`) to identify MeSH descriptors tagged as `MajorTopicYN="Y"`.
*   **Usage**: Integrated as the core logic within `pubmed_client.py`.
*   **Outcome**: Established the basic capability to find associations between mental health terms and general medical subjects.

### Version 2 (v2): Analytics Suite
*   **Overview**: Introduced the first layer of quantitative analytics for trend monitoring.
*   **Technical Depth**: Implements Z-score calculations and Compound Annual Growth Rate (CAGR) for every discovered term.
*   **Usage Example**: `python scripts/research/mesh/v2/pipeline.py` (Configured via `v2/config.yaml`).
*   **Outcome**: Enabled the identification of "high-growth" vs "stagnant" research areas within psychiatry.

### Version 3 (v3): NLP Enrichment
*   **Overview**: Integrates Natural Language Processing (NLP) to move from metadata analysis to content analysis.
*   **Technical Depth**: Uses a basic keyword extraction engine to analyze the `AbstractText` of retrieved papers, providing sub-topic context.
*   **Usage Example**: `python scripts/research/mesh/v3/pipeline.py` (Includes sunburst and network visualizations).
*   **Outcome**: Discovered latent themes within "Depression" research, such as "Inflammation" and "Gut Microbiome" before they became major MeSH headings.

### Version 4 (v4): Hierarchical Trees
*   **Overview**: Transitioned from a flat list of terms to a recursive tree-based discovery system.
*   **Technical Depth**: Implements level-specific thresholds (e.g., Level 1: 20k docs, Level 4: 1k docs) to manage discovery depth and prevent "branch explosion."
*   **Usage Example**: `python scripts/research/mesh/v4/pipeline.py` (Outputs `discovery_v4.json`).
*   **Outcome**: mapped the lineage of research from "Neurodevelopmental Disorders" down to specific phenotypic expressions.

### Version 5 (v5): Temporal Dynamics
*   **Overview**: Specialized in longitudinal shifts and chronological emergence.
*   **Technical Depth**: Slices data into 5-year intervals (1950-2025) and applies smoothing curves to frequency data.
*   **Usage Example**: `python scripts/research/mesh/v5/pipeline.py` (Configured via `v5/config.yaml`).
*   **Outcome**: Visualized the rise of "Post-Traumatic Stress Disorder" research post-1980, correlating with clinical definition changes.

### Version 6 (v6): Graph Integration
*   **Overview**: Bridges internal discovery with external graph datasets.
*   **Technical Depth**: Ingests a `graph.csv` (from v7) and uses a composite score (num_edges + weight) to prioritize nodes for deep discovery.
*   **Usage Example**: `python scripts/research/mesh/v6/pipeline.py`.
*   **Outcome**: Successfully cross-referenced MeSH terms with FDA drug label data to identify pharmaceutical trends.

### Version 7 (v7): Network Analytics
*   **Overview**: A dedicated graph-theoretic analysis suite.
*   **Technical Depth**: Uses NetworkX to calculate Betweenness Centrality, Density, and Weakly Connected Components (WCC) on the research graph.
*   **Usage Example**: `python scripts/research/mesh/v7/analyze_graph.py`.
*   **Outcome**: Identified "Hub" terms that act as bridges between disparate research fields (e.g., "Inflammation" as a hub between "Cardiology" and "Psychiatry").

### Version 8 (v8): Multi-Source Pharma
*   **Overview**: The most expansive discovery version, integrating five distinct external data sources.
*   **Technical Depth**: Concurrent fetching from DrugBank (v1 API), DisGeNET (v1 API), OpenTargets, and ClinicalTrials.gov.
*   **Usage Example**: `python scripts/research/mesh/v8/main_pipeline.py`.
*   **Outcome**: Created a unified "Mental Health Knowledge Graph" mapping conditions to drugs, genes, and active clinical trials.

### Version 9 (v9): Unified Production
*   **Overview**: The current production-grade orchestration engine.
*   **Technical Depth**: Integrates Discovery, Temporal, and Graph builders with an automated "Generic Term Exclusion" filter (e.g., stripping "Humans", "Adult").
*   **Usage Example**: `python scripts/research/mesh/v9/main_pipeline.py`.
*   **Outcome**: Automated, publication-ready reporting for mental health research trends.

### Version A (va): Visual Dashboard
*   **Overview**: A browser-based interactive discovery interface.
*   **Technical Depth**: Pure HTML/JS implementation using the DOMParser for XML metadata and direct browser-to-NCBI API calls.
*   **Usage Example**: Open `scripts/research/mesh/va/index.html` in any modern browser.
*   **Outcome**: Enabled real-time "human-in-the-loop" discovery where researchers can stop and refine the queue.

### Version B (vb): Lightweight Core
*   **Overview**: A zero-dependency, minimalist Python implementation.
*   **Technical Depth**: Uses `urllib.request` instead of `requests` and `xml.etree.ElementTree` for parsing.
*   **Usage Example**: `python scripts/research/mesh/vb/discovery.py`.
*   **Outcome**: Portable discovery scripts capable of running on any standard Python 3.x environment without `pip install`.

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
