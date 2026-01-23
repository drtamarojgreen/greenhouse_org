# Empirical MeSH Trends Pipeline (Neural & Modeling Edition)

This advanced pipeline extends the empirical discovery framework with custom Neural Network components and rigorous growth modeling to identify and classify research expansion in mental health.

## Advanced Methodology

1.  **Neural Embedding (Autoencoder)**: Instead of linear PCA, this pipeline utilizes a custom, NumPy-only **Autoencoder** to learn non-linear latent representations of temporal trajectories.
2.  **Unsupervised Clustering**: K-Means is performed on the neural embeddings to identify research themes.
3.  **Logistic Growth Modeling**: For terms in target clusters, the pipeline uses SciPy's `curve_fit` to fit a **Logistic (S-curve) Growth Model**:
    $$f(x) = \frac{L}{1 + e^{-k(x - x_0)}}$$
    This allows for precise quantification of growth rates ($k$) and the "inflection year" ($x_0$).
4.  **Neural Classification (MLP)**: A Multi-Layer Perceptron (MLP) is trained to classify terms based on their latent features into "Target Growth" vs "General Research" categories.

## Performance & Constraints

- **CPU-Only**: All neural network math is implemented in pure NumPy.
- **Auditable**: Every stage is logged with execution times and parameter settings.
- **Deterministic**: Random seeds are strictly enforced for reproducible NN training.

## Output Artifacts

- `classification_results.csv`: Neural network probabilities for every term being a high-growth research area.
- `growth_models.json`: Fitted logistic parameters (L, k, x0) for key terms.
- `mental_health_clusters.json`: Thematic groupings matching the historical growth profile.

## Usage

```bash
# Generate neural-specific test data
python scripts/generate_mock_data.py

# Run the neural pipeline
python scripts/run_pipeline.py --config config/pipeline.yaml
```
