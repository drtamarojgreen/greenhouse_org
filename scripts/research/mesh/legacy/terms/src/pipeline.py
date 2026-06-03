import logging
import os
import yaml
import time
from . import data_io, pruning, vectorize, embedding, clustering, analysis, validation

def run(config_path):
    # Setup logging
    logging.basicConfig(filename='logs/pipeline_run.log', level=logging.INFO, 
                        format='%(asctime)s - %(message)s')
    logger = logging.getLogger()
    
    logger.info("Starting Pipeline Run")
    
    # Load Config
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    logger.info(f"Configuration loaded. Random Seed: {config['clustering']['random_seed']}")

    # 1. Load Data
    start_time = time.time()
    raw_data_path = 'data/raw/mesh_year_counts.csv'
    if not os.path.exists(raw_data_path):
        logger.error(f"Raw data not found at {raw_data_path}")
        return
        
    df = data_io.load_mesh_counts(raw_data_path)
    logger.info(f"Loaded data: {len(df)} rows. Time: {time.time() - start_time:.4f}s")
    
    # 2. Prune Terms
    start_time = time.time()
    initial_term_count = df['term'].nunique()
    df_pruned = pruning.prune_terms(df, config)
    pruned_term_count = df_pruned['term'].nunique()
    data_io.save_dataframe('data/interim/pruned_terms.csv', df_pruned)
    logger.info(f"Pruned terms. Terms: {initial_term_count} -> {pruned_term_count}. Time: {time.time() - start_time:.4f}s")
    
    # 3. Vectorize
    start_time = time.time()
    year_range = (config['dataset']['year_start'], config['dataset']['year_end'])
    matrix, terms, years = vectorize.build_term_year_matrix(df_pruned, year_range)
    matrix = vectorize.normalize_matrix(matrix)
    validation.check_matrix_health(matrix)
    data_io.save_numpy_array('data/interim/term_year_matrix.npy', matrix)
    logger.info(f"Vectorized. Matrix shape: {matrix.shape}. Time: {time.time() - start_time:.4f}s")
    
    # 4. Embed
    start_time = time.time()
    embeddings = embedding.compute_pca_embeddings(matrix, config['embedding']['n_components'])
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
    
    # Top terms (placeholder logic in analysis module)
    top_terms = analysis.top_terms_by_year(matrix, target_clusters, assignments, terms, years, config['output']['top_terms_per_year'])
    data_io.save_json('data/output/top_terms_by_year.json', top_terms)
    
    logger.info(f"Analysis complete. Found {len(target_clusters)} target clusters. Time: {time.time() - start_time:.4f}s")
    
    print("Pipeline completed successfully.")

if __name__ == "__main__":
    # For testing
    pass