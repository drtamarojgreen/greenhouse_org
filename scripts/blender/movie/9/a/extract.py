import bpy
import os
import sys

# Ensure parent directory is in path for direct execution
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

import config
import components
from a.extractor import AssetExtractor

def run_extraction():
    """
    Production asset extraction for Movie 9.
    Architecture Kept: Separating asset extraction from scene assembly
    is a key pipeline feature that ensures production stability by
    decoupling asset source files from the final production environment.
    """
    # Use extractor.py OO structure and extraction.json
    config_path = os.path.join(parent_dir, "a", "extraction.json")
    extractor = AssetExtractor(config_path)
    extractor.run()

if __name__ == "__main__":
    run_extraction()
