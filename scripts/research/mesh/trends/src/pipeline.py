import logging
import os
import yaml
import time
import numpy as np
import pandas as pd
from . import data_io, pruning, vectorize, embedding, clustering, analysis, validation, neural_net

def run(config_path):
    # Setup logging
    os.makedirs('logs', exist_ok=True)
    logging.basicConfig(filename='logs/pipeline_run.log', level=logging.INFO,
                        format='%(asctime)s - %(message)s')
    logger = logging.getLogger()

    logger.info("Starting Trends Pipeline Run")

    # Load Config
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    # 1. Load Data
    start_time = time.time()
    raw_data_path = 'data/raw/mesh_year_counts.csv'
    df = data_io.load_mesh_counts(raw_data_path)
    logger.info(f"Loaded data: {len(df)} rows. Time: {time.time() - start_time:.4f}s")

    # 2. Prune Terms
    start_time = time.time()
    df_pruned = pruning.prune_terms(df, config)
    data_io.save_dataframe('data/interim/pruned_terms.csv', df_pruned)
    logger.info(f"Pruned terms. Time: {time.time() - start_time:.4f}s")

    # 3. Vectorize
    start_time = time.time()
    year_range = (config['dataset']['year_start'], config['dataset']['year_end'])
    matrix, terms, years = vectorize.build_term_year_matrix(df_pruned, year_range)
    matrix = vectorize.normalize_matrix(matrix)
    validation.check_matrix_health(matrix)
    data_io.save_numpy_array('data/interim/term_year_matrix.npy', matrix)
    logger.info(f"Vectorized. Matrix shape: {matrix.shape}. Time: {time.time() - start_time:.4f}s")

    # 4. Embed (using NN Autoencoder)
    start_time = time.time()
    n_components = config['embedding']['n_components']
    if config['embedding'].get('method') == 'nn':
        embeddings = embedding.compute_nn_embeddings(matrix, n_components,
                                                     epochs=config['embedding'].get('epochs', 50),
                                                     lr=config['embedding'].get('lr', 0.01))
    else:
        embeddings = embedding.compute_pca_embeddings(matrix, n_components)
    data_io.save_numpy_array('data/interim/embeddings.npy', embeddings)
    logger.info(f"Embeddings computed. Shape: {embeddings.shape}. Time: {time.time() - start_time:.4f}s")

    # 5. Cluster
    start_time = time.time()
    labels, centroids = clustering.kmeans_fit(embeddings,
                                              config['clustering']['n_clusters'],
                                              config['clustering']['random_seed'])
    validation.verify_cluster_distribution(labels)
    assignments = clustering.assign_clusters(terms, labels)
    data_io.save_dataframe('data/output/cluster_assignments.csv', assignments)
    logger.info(f"Clustering complete. Time: {time.time() - start_time:.4f}s")

    # 6. Analyze
    start_time = time.time()
    metrics = analysis.compute_cluster_metrics(matrix, assignments, terms, years)
    target_clusters = analysis.select_target_clusters(metrics, config['mental_health_detection'])
    data_io.save_json('data/output/mental_health_clusters.json', target_clusters)

    top_terms = analysis.top_terms_by_year(matrix, target_clusters, assignments, terms, years, config['output']['top_terms_per_year'])
    data_io.save_json('data/output/top_terms_by_year.json', top_terms)

    # 7. Growth Modeling & Classification (Neural Net Part)
    # Fit growth models for top terms in target clusters
    growth_results = {}
    target_cluster_ids = [c['cluster'] for c in target_clusters]
    target_terms_df = assignments[assignments['cluster'].isin(target_cluster_ids)]

    for _, row in target_terms_df.iterrows():
        term = row['term']
        idx = terms.index(term)
        series = matrix[idx]
        fit = analysis.fit_growth_model(series)
        if fit:
            growth_results[term] = fit
    data_io.save_json('data/output/growth_models.json', growth_results)

    # Simple MLP classification of terms into "Target" vs "Other"
    # This is a supervised task for demonstration of the MLP
    # Training set: target cluster terms (label 1) and others (label 0)
    X = embeddings
    y = np.zeros((len(terms), 1))
    for i, label in enumerate(labels):
        if label in target_cluster_ids:
            y[i] = 1

    mlp = neural_net.SimpleMLP(n_components, 8, 1, learning_rate=0.1)
    mlp.train(X, y, epochs=100)
    predictions = mlp.predict(X)

    # Save predictions
    classification_results = pd.DataFrame({
        'term': terms,
        'target_probability': predictions.flatten()
    })
    data_io.save_dataframe('data/output/classification_results.csv', classification_results)

    logger.info(f"Analysis and Neural Classification complete. Time: {time.time() - start_time:.4f}s")
    print("Trends Pipeline completed successfully.")

if __name__ == "__main__":
    pass
