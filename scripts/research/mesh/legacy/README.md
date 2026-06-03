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

## 📊 Overlapping Functionality Across Versions

| Feature | Versions Implementing | Core Logic | Configurability |
|---|---|---|---|
| Basic PubMed term discovery | v1, v2, v3, v4, v5, vb | `pubmed_client` with `esearch`/`efetch` | Hard‑coded in early versions; later moved to `config.yaml` (v2‑v5) |
| Quantitative analytics (CAGR, Z‑score) | v2, v5, v6, v9, v10 | `DataProcessor` / `DataProcessorV9` | Configurable thresholds in v2/v5; static in v6/v9/v10 |
| Dimensionality reduction (PCA/Autoencoder) | v2 (PCA), v3 (autoencoder) | `sklearn`/`numpy` pipelines | Parameters in `config.yaml` for v2/v3 |
| Hierarchical tree discovery | v4, v6, v7, v9, v10 | Tree building logic in `DiscoveryEngineV4` | Depth & node thresholds configurable in v4; static in later versions |
| Multi‑source integration | v8 (DrugBank, DisGeNET, OpenTargets, ClinicalTrials), v9 (adds ClinicalTrials), v10 (adds systematic review schemas, neuro‑modeling) | API clients per source | Each source has its own hard‑coded query shape; v10 adds many more configs |
| Temporal trend analysis | v5, v9, v10 | `TemporalEngineV5` / `TemporalEngineV9` | Configurable intervals in v5/v9; static in v10 |
| Visualization | v3 (sunburst), v5 (timeline), v9 (graph), v10 (notebooks, plots) | Matplotlib / custom visualizers | Output formats (CSV/JSON/PNG) vary per version |
| Cache reuse | v6, v8, v9 | SQLite cache (`cache.db`) | Path configurable; v11 will reuse same cache |

---

## 🚀 v11 – Configurable Intervention‑Specific PubMed & Reactome Pipeline

**Location**: `scripts/research/mesh/v11/`

### Config (`config.yaml`)
```yaml
pipeline:
  disorder: "Depression"
  # List of intervention types to explore for the given disorder
  interventions:
    - "Cognitive Behavioral Therapy"
    - "Selective Serotonin Reuptake Inhibitor"
    - "Physical Exercise"

output:
  json_path: "scripts/research/mesh/v11/output/graph.json"
  csv_path: "scripts/research/mesh/v11/output/graph.csv"

cache:
  db_path: "scripts/research/mesh/v11/cache.db"

reactome:
  graphql_endpoint: "https://reactome.org/GraphQL"
```

### What v11 Does
1. **Loads the configuration** to obtain the target disorder and a list of intervention types.
2. **For each intervention type**:
   - Calls `discover_related_terms` (from the core PubMed client) to obtain a set of MeSH terms associated with that intervention.
   - Builds a **PubMed article tree** where the root is the intervention, the second level are the discovered MeSH terms, and leaf nodes are the PubMed IDs returned by `efetch` for each term.
3. **Maps leaf‑level MeSH terms to Reactome pathways** via the public GraphQL endpoint. The query asks for pathway identifiers (`stId`) and human‑readable names that contain the term.
4. **Aggregates the results** into a dictionary of pathways → list of leaf terms.
5. **Writes two output files**:
   - **JSON** containing the full hierarchical structure and pathway mapping.
   - **CSV** with a flat table: `disorder,intervention,meSH_term,reactome_pathway_id,reactome_pathway_name`.
6. **Reuses the existing SQLite cache** (`scripts/research/mesh/v11/cache.db`). All PubMed requests go through the same caching layer used by v6‑v9, so repeated runs are fast.
7. **Logs progress** to STDOUT and a `pipeline.log` file for debugging.

### Files Added
- `scripts/research/mesh/v11/__init__.py` (empty, marks the package)
- `scripts/research/mesh/v11/config.yaml` (see above)
- `scripts/research/mesh/v11/main_pipeline.py` – orchestrates the whole workflow.
- `scripts/research/mesh/v11/output/` – directory created at runtime for the two result files.

### Why a Single “Super‑Config” Cannot Replace All Versions

1. **Divergent Data Sources** – Early versions only need PubMed; later versions pull from DrugBank, DisGeNET, OpenTargets, ClinicalTrials, FDA, and even systematic‑review schemas. Each source requires its own authentication, pagination, and response parsing logic. Packing all of these into one flat YAML would make the file unreadable and error‑prone.
2. **Algorithmic Evolution** – The pipeline steps have fundamentally changed (simple term lookup → PCA → auto‑encoders → hierarchical trees → temporal modelling → meta‑analysis). These steps have different input shapes, hyper‑parameters, and outputs. A single switch‑based config would still need custom code paths for each algorithm, which defeats the purpose of a unified configuration.
3. **Hard‑Coded Business Rules** – Thresholds for tree depth, node‑pruning, trial‑phase aggregation, neuro‑simulation parameters, and many other domain‑specific rules are baked into the code for performance and clarity. Exposing every rule as a config entry would explode the schema and make validation extremely hard.
4. **Output Diversity** – Versions emit CSV, JSON, PNG, SVG, notebooks, and interactive dashboards. Each output format has its own rendering pipeline and dependencies. A monolithic config would have to describe every possible artifact, leading to a combinatorial explosion of options.
5. **Maintainability** – Keeping a single massive config would make it difficult for new contributors to understand which settings affect which version. Incremental version‑specific configs keep the responsibility surface small and allow targeted testing.

**Conclusion** – v11 adds a new, well‑scoped capability (intervention‑specific PubMed discovery → Reactome pathway mapping) while reusing the existing cache and PubMed client. It demonstrates how we can continue to extend the suite without trying to force a one‑size‑fits‑all configuration.

---

## 📂 New Files Added in v11

- `scripts/research/mesh/v11/__init__.py`
- `scripts/research/mesh/v11/config.yaml`
- `scripts/research/mesh/v11/main_pipeline.py`

---

*All files are ready for execution. Run the pipeline with:* `python -m scripts.research.mesh.v11.main_pipeline`

The above content shows the entire, complete file contents of the requested file.


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
