# Empirical MeSH Term Discovery Pipeline (PCA Edition)

This pipeline provides a robust, unsupervised framework for discovering research themes and temporal trends in Medical Subject Headings (MeSH). It is designed to be CPU-efficient and fully reproducible.

## Methodology

1.  **Pruning**: Filters the raw term frequency data based on total volume, consistency of presence across years, and temporal variance.
2.  **Vectorization**: Converts term frequencies into a temporal term-year matrix, followed by log-normalization to stabilize high-growth signals.
3.  **PCA Embedding**: Uses Principal Component Analysis (via SVD) to project the high-dimensional temporal vectors into a compact latent space.
4.  **K-Means Clustering**: Groups terms with similar temporal trajectories into thematic clusters.
5.  **Historical Analysis**: Calculates per-cluster metrics (slope, variance, peak year) to identify clusters matching "mental health growth" profiles.

## Directory Structure

- `config/`: YAML configuration for pruning thresholds and model hyperparameters.
- `data/raw/`: Input MeSH count data (CSV).
- `data/interim/`: Intermediate files like the term-year matrix and embeddings.
- `data/output/`: Final cluster assignments, metrics, and top terms by year.
- `src/`: Core Python modules for each stage of the pipeline.
- `scripts/`: Execution and mock data generation scripts.
- `logs/`: Runtime logs for auditing performance and execution flow.

## Outputs

- `cluster_assignments.csv`: Mapping of every term to its discovered cluster.
- `mental_health_clusters.json`: Statistics for clusters identified as high-growth.
- `top_terms_by_year.json`: The most frequent terms within target clusters for every year in the range.

## Usage

```bash
# Generate test data
python scripts/generate_mock_data.py

# Run the pipeline
python scripts/run_pipeline.py --config config/pipeline.yaml
```
