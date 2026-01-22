import argparse
import sys
import os

from . import pipeline

def main():
    parser = argparse.ArgumentParser(description="Run Empirical MeSH Term Discovery Pipeline")
    parser.add_argument("--config", default="config/pipeline.yaml", help="Path to configuration file")
    
    args = parser.parse_args()
    
    pipeline.run(args.config)

if __name__ == "__main__":
    main()