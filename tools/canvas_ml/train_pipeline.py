
import sys
import os

# Ensure we can import from the current package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from canvas_ml import generator, harvester, vision

def run_pipeline():
    print("=== CanvasML Training Pipeline ===")
    
    print("\n[Step 1] Generating Variations...")
    generator.generate()
    
    print("\n[Step 2] Harvesting Data...")
    harvester.harvest()
    
    print("\n[Step 3] Analyzing Vision Data...")
    vision.analyze()
    
    print("\n=== Pipeline Complete ===")

if __name__ == "__main__":
    run_pipeline()
