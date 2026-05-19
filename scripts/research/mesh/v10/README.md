# MeSH Discovery & Systematic Review Suite (v10)

A strictly **data-driven, zero-hallucination** orchestration framework for clinical systematic synthesis, meta-analysis, and systems pharmacology. All narrative text, clinical decisions, and pharmacological context are generated exclusively from live biomedical APIs — NCBI PubMed, openFDA, ClinicalTrials.gov, RxNorm, and the NLM MeSH RDF API.

---

## Features

- **100% SciPy-Free Meta-Analysis** — Pure-NumPy DerSimonian-Laird Random-Effects pooling, Winitzki normal CDFs, and Egger regression.
- **Zero Placeholders** — If an API returns no data, the pipeline logs and skips rather than generating fallback text.
- **Deep MeSH Association Mapping** — BFS graph traversal across up to 5 seed terms, producing both per-seed trees and a merged cross-seed co-occurrence table.
- **Fail-Fast Connectivity** — Pipeline aborts immediately on network failure rather than silently using stale data.
- **Fully Config-Driven** — Every threshold, count, CAGR, depth, seed term, and node limit lives in `config.yaml`. No magic numbers in source code.

---

## Usage

No flags are mandatory. The pipeline resolves all required paths from `config.yaml` when CLI flags are omitted.

### Default Synthesis (Meta-Analysis Only)

Runs synthesis using `infrastructure.studies_file` from `config.yaml`:

```bash
# No flags — reads studies_file from config.yaml
python3 -m scripts.research.mesh.v10.main_pipeline

# Override the studies file on the CLI
python3 -m scripts.research.mesh.v10.main_pipeline \
  --studies-file path/to/my_studies.json
```

### Full Data-Enriched Dashboard

Adds physiological circadian simulations, UME/GME/OSCE educational modules, roadmapping, and public policy briefs.

```bash
python3 -m scripts.research.mesh.v10.main_pipeline \
  --studies-file scripts/research/mesh/v10/output/studies_database.json \
  --data-enriched
```

### Dynamic MeSH Neurobiological Modeling

Connects to the NLM MeSH RDF API to cross-reference extracted PEICOT keywords against hierarchical MeSH domains (`[A08]` Anatomy, `[D]` Chemicals, `[G/F]` Physiology).

```bash
python3 -m scripts.research.mesh.v10.main_pipeline \
  --studies-file scripts/research/mesh/v10/output/studies_database.json \
  --modeling
```

### Deep Seed Association Forest (`--seed`)

Bypasses synthesis entirely. Builds a PubMed MeSH co-occurrence tree for each seed term, then produces a **merged cross-seed table** ranking every discovered MeSH term by how many seeds it appeared under.

```bash
# Use seed_exploration.default_terms from config.yaml
python3 -m scripts.research.mesh.v10.main_pipeline --seed

# Override with explicit terms on the CLI (up to max_seeds)
python3 -m scripts.research.mesh.v10.main_pipeline --seed ADHD Stress Glutathione

# Combine with a studies file (synthesis + seed exploration)
python3 -m scripts.research.mesh.v10.main_pipeline \
  --studies-file scripts/research/mesh/v10/output/studies_database.json \
  --seed ADHD Stress
```

Output structure:
1. An individual `🌳 DEEP ASSOCIATION MeSH TREE` for each seed term.
2. A `🔗 MERGED CROSS-SEED MeSH TERM CO-OCCURRENCE` table showing:
   - **MeSH Term** — each discovered node label
   - **Seeds Found In** — e.g. `2 / 3` (appeared under 2 of 3 seeds)
   - **Coverage** — visual bar `████░░░░`
   - **Seed Labels** — which specific seeds contained this term

---

## Configuration (`config.yaml`)

All pipeline behaviour is controlled from `config.yaml`. Source code contains **no fallback magic numbers** — missing required keys raise a descriptive `KeyError` at startup.

### `discovery` — General traversal settings

```yaml
discovery:
  max_levels: 3              # default depth for discovery traversals
  max_children_per_node: 6   # default branch limit per node
  total_max_terms: 100
```

### `seed_exploration` — Seed forest settings

```yaml
seed_exploration:
  default_terms:             # used when --seed is called with no arguments
    - "ADHD"
    - "Stress"
    - "Glutathione"
  max_depth: 3               # levels deep per seed tree (overrides discovery.max_levels)
  max_children: 3            # branches per node (decays by 1 per level to prevent explosion)
  max_seeds: 5               # hard cap on number of seed terms per run
```

### `meta_analysis` — Pooling and heterogeneity

```yaml
meta_analysis:
  readiness_criteria:
    min_studies_pooled: 3
    min_sample_size_per_study: 15
    homogeneity_max_p_value: 0.05
  default_model: "random-effects"   # or "fixed-effects"
  confidence_level: 0.95
  heterogeneity_metrics: ["I2", "tau2", "Q"]
  effect_conversions:
    allowed_types: ["SMD", "OR", "RR", "HR"]
  multiplicity_control: "FDR"       # or "Bonferroni", "Holm"
```

### `simulation_defaults` — Emerging discovery timeseries

All counts and growth rates for the burst-detection engine are config-driven:

```yaml
simulation_defaults:
  emerging_years: [2021, 2022, 2023, 2024, 2025]
  emerging_counts_burst: [2, 5, 12, 28, 62]
  emerging_counts_weak:  [1, 2, 6, 12, 24]
  emerging_counts_steady: [22, 24, 25, 24, 23]
  emerging_cagr_burst: 88.5    # CAGR for fastest-growing trial term
  emerging_cagr_weak: 52.0     # CAGR for second trial term
  emerging_cagr_steady: 1.1    # CAGR for steady physiological pathway term
  mock_nodes:
    - id: "Dynamic_1"
      label: "Intervention Pathway A"
    - id: "Dynamic_2"
      label: "Intervention Pathway B"
```

### `discovery_emerging` — Burst detection thresholds

```yaml
discovery_emerging:
  burst_detection:
    growth_multiplier: 1.5   # recent count must exceed historical mean + multiplier * std
```

### `neuro_modeling` — Physiological simulation

```yaml
neuro_modeling:
  simulation_steps: 24
  default_alpha: 0.05
```

### `infrastructure` — Paths and FAIR metadata

```yaml
infrastructure:
  cache_db: "scripts/research/mesh/v10/cache.db"
  output_dir: "scripts/research/mesh/v10/output"
  formats: ["json", "csv", "png", "svg"]
  fair_metadata:
    license: "CC-BY-4.0"
    repository: "https://github.com/drtamarojgreen/greenhouse_org"
    creator: "Greenhouse Org Research Group"
```

---

## API Sources

All data is fetched live. No cached or simulated fallback data is ever used.

| API | Purpose |
|---|---|
| NCBI PubMed E-Utilities | Study metadata, abstract text, MeSH headings |
| openFDA Drug Label | Active ingredients, indications, warnings |
| ClinicalTrials.gov v2 | Active trial IDs, phases, sponsors |
| NLM RxNorm | RxCUI identifiers, drug name normalisation |
| NLM Clinical Tables | ICD-9 disease/condition lookups |
| NLM MeSH RDF | Hierarchical descriptor tree traversal |

> **Note on 404s**: Non-pharmacological interventions (e.g. "Behavioral Coping") will produce `DEBUG`-level 404 log entries against the openFDA endpoint. This is expected — openFDA only indexes pharmacological substances. These are not errors.

---

## Limitations

1. **Rate Limiting** — A mandatory `0.35s` sleep is enforced between every API call to respect NLM's unauthenticated limit of 3 requests/second. Do not remove this delay.

2. **Seed Execution Time** — Each seed term requires 2 API calls per node visited. With `max_depth: 3` and `max_children: 3`, a single seed makes roughly 25–40 calls (~15–20 seconds). Three seeds takes approximately 1–2 minutes.

3. **Sparse Trees** — Very specific or niche seed terms may return few or no MeSH co-occurrence hits if the top-N PubMed papers for that term lack full MeSH annotation. The tree will render with fewer branches; this is truthful, not a bug.

4. **Network Required** — The pipeline has no offline mode. Missing connectivity raises a `ConnectionError` and exits immediately.

5. **No Mandatory Flags** — Running with no arguments uses `infrastructure.studies_file` from `config.yaml`. If that key is also absent, the pipeline exits with a clear descriptive error.
