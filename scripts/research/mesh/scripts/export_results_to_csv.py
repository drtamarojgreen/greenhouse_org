import pandas as pd
import json
import os
import shutil

def json_to_csv(json_path, csv_path):
    if not os.path.exists(json_path):
        print(f"Warning: {json_path} not found.")
        return
    with open(json_path, 'r') as f:
        data = json.load(f)

    if isinstance(data, list):
        df = pd.DataFrame(data)
    elif isinstance(data, dict):
        # Handle different dict structures
        try:
            if not data:
                df = pd.DataFrame()
            else:
                first_key = next(iter(data))
                if isinstance(data[first_key], list) and len(data[first_key]) > 0 and isinstance(data[first_key][0], dict):
                    # It's top_terms_by_year {year: [{term, count}, ...]}
                    flat_data = []
                    for year, terms in data.items():
                        for entry in terms:
                            new_entry = entry.copy()
                            new_entry['year'] = year
                            flat_data.append(new_entry)
                    df = pd.DataFrame(flat_data)
                elif isinstance(data[first_key], list):
                    # It's growth_models {term: [L, k, x0]}
                    df = pd.DataFrame.from_dict(data, orient='index', columns=['L', 'k', 'x0']).reset_index().rename(columns={'index': 'term'})
                else:
                    # Regular dict, try to convert to list of records
                    df = pd.DataFrame.from_dict(data, orient='index').reset_index().rename(columns={'index': 'key'})
        except Exception as e:
            print(f"Error converting {json_path}: {e}")
            return
    else:
        print(f"Unknown data format in {json_path}")
        return

    df.to_csv(csv_path, index=False)
    print(f"Converted {json_path} to {csv_path}")

def copy_csv(src, dst):
    if os.path.exists(src):
        shutil.copy(src, dst)
        print(f"Copied {src} to {dst}")
    else:
        print(f"Warning: {src} not found.")

def main():
    target_dir = "scripts/research/mesh/data"
    os.makedirs(target_dir, exist_ok=True)

    # Ingestion Results
    json_to_csv("data/output/curated_terms.json", os.path.join(target_dir, "curated_terms.csv"))
    copy_csv("data/output/discovery_stats.csv", os.path.join(target_dir, "discovery_stats.csv"))
    copy_csv("data/output/full_time_series.csv", os.path.join(target_dir, "full_time_series.csv"))
    copy_csv("data/output/modeling_results.csv", os.path.join(target_dir, "modeling_results.csv"))

    # PCA Pipeline Results (terms)
    copy_csv("scripts/research/mesh/terms/data/output/cluster_assignments.csv", os.path.join(target_dir, "pca_cluster_assignments.csv"))
    json_to_csv("scripts/research/mesh/terms/data/output/mental_health_clusters.json", os.path.join(target_dir, "pca_mental_health_clusters.csv"))
    json_to_csv("scripts/research/mesh/terms/data/output/top_terms_by_year.json", os.path.join(target_dir, "pca_top_terms_by_year.csv"))

    # Neural Pipeline Results (trends)
    copy_csv("scripts/research/mesh/trends/data/output/classification_results.csv", os.path.join(target_dir, "neural_classification_results.csv"))
    copy_csv("scripts/research/mesh/trends/data/output/cluster_assignments.csv", os.path.join(target_dir, "neural_cluster_assignments.csv"))
    json_to_csv("scripts/research/mesh/trends/data/output/mental_health_clusters.json", os.path.join(target_dir, "neural_mental_health_clusters.csv"))
    json_to_csv("scripts/research/mesh/trends/data/output/growth_models.json", os.path.join(target_dir, "neural_growth_models.csv"))
    json_to_csv("scripts/research/mesh/trends/data/output/top_terms_by_year.json", os.path.join(target_dir, "neural_top_terms_by_year.csv"))

if __name__ == "__main__":
    main()
