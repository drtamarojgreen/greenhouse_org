import argparse
import sys
import os

# Add the parent directory to sys.path to allow importing from 'src'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src import pipeline

def main():
    parser = argparse.ArgumentParser(description="Run Empirical MeSH Trends Pipeline with Neural Classification")
    parser.add_argument("--config", default="config/pipeline.yaml", help="Path to configuration file")

    args = parser.parse_args()

    # Ensure we are in the trends directory
    os.chdir(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

    pipeline.run(args.config)

if __name__ == "__main__":
    main()
