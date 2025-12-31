
import os
import urllib.request
import json
import sys

# Constants
ATLAS_URL = "http://download.alleninstitute.org/informatics-archive/current-release/mouse_ccf/annotation/ccf_2017/annotation_25.nrrd"
STRUCTURE_GRAPH_URL = "http://api.brain-map.org/api/v2/structure_graph_download/1.json"
DATA_DIR = "data/atlas"

def download_file(url, output_path):
    print(f"Downloading {url} to {output_path}...")
    try:
        urllib.request.urlretrieve(url, output_path)
        print("Download complete.")
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

def main():
    # Ensure data directory exists
    if not os.path.exists(DATA_DIR):
        print(f"Creating directory {DATA_DIR}...")
        os.makedirs(DATA_DIR)

    # 1. Download Structure Graph
    graph_path = os.path.join(DATA_DIR, "structure_graph.json")
    if not os.path.exists(graph_path):
        if not download_file(STRUCTURE_GRAPH_URL, graph_path):
            sys.exit(1)
    else:
        print(f"Structure graph already exists at {graph_path}")

    # 2. Download Annotation Volume (25 micron)
    volume_path = os.path.join(DATA_DIR, "annotation_25.nrrd")
    if not os.path.exists(volume_path):
        if not download_file(ATLAS_URL, volume_path):
            sys.exit(1)
    else:
        print(f"Annotation volume already exists at {volume_path}")

    print("\n--- Phase 1 Complete ---")
    print(f"Atlas data is ready in {DATA_DIR}")

if __name__ == "__main__":
    main()
