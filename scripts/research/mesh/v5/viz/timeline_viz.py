"""
MeSH Discovery Suite V5 - Timeline Visualization
Generates high-fidelity graphical timelines using Matplotlib.
"""
import json
import matplotlib.pyplot as plt
import numpy as np
import os
from typing import Dict, Any

class TimelineVizV5:
    """
    Visualization engine for mental health research longitudinal data.
    """
    def __init__(self, data_path: str = "scripts/research/mesh/v5/timeline_v5.json"):
        with open(data_path, "r") as f:
            self.data = json.load(f)
        os.makedirs("scripts/research/mesh/v5/viz_output", exist_ok=True)

    def generate(self, output_name: str = "mental_health_timeline.png"):
        """
        Creates a stacked area chart or multiple line chart for the timeline.
        """
        intervals = self.data["intervals"]
        datasets = self.data["datasets"]
        
        plt.figure(figsize=(14, 8), dpi=150)
        plt.style.use('dark_background')
        
        x = np.arange(len(intervals))
        
        # Plotting each dataset
        for ds in datasets:
            plt.plot(x, ds["counts"], label=ds["label"], color=ds["color"], linewidth=2.5, marker='o', markersize=4)
            
        plt.xticks(x, intervals, rotation=45, ha='right', fontsize=9)
        plt.xlabel("Temporal Intervals (5-Year Buckets)", fontsize=12, labelpad=15)
        plt.ylabel("Publication Count (PubMed)", fontsize=12, labelpad=15)
        plt.title("Longitudinal Trends in Mental Health Research (1950-2025)", fontsize=16, pad=20, fontweight='bold')
        
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left', borderaxespad=0., fontsize=10)
        plt.grid(True, linestyle='--', alpha=0.3)
        plt.tight_layout()
        
        output_path = f"scripts/research/mesh/v5/viz_output/{output_name}"
        plt.savefig(output_path, bbox_inches='tight')
        print(f"Graphical timeline saved to {output_path}")
        plt.close()

if __name__ == "__main__":
    viz = TimelineVizV5()
    viz.generate()
