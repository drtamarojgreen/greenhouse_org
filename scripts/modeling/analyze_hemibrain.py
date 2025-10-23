import pandas as pd
import os
from download_data import download_fly_hemibrain_data

def analyze_hemibrain_scale(data_path):
    """
    Analyzes the scale of the hemibrain dataset.
    Args:
        data_path (str): The path to the supplemental_data_3.csv file.
    """
    try:
        if not os.path.exists(data_path):
            print(f"Data file not found at {data_path}. Downloading...")
            download_fly_hemibrain_data()

        df = pd.read_csv(data_path)
        num_neurons = len(df)
        # The 'pre' column contains the number of output synapses for each neuron
        total_synapses = df['pre'].sum()
        print(f"Hemibrain Dataset Scale:")
        print(f"  - Number of neurons: {num_neurons}")
        print(f"  - Total number of output synapses: {total_synapses}")
    except Exception as e:
        print(f"Error analyzing hemibrain scale: {e}")

def analyze_neurotransmitter_proportions(data_path):
    """
    Analyzes the neurotransmitter proportions in the hemibrain dataset.
    Args:
        data_path (str): The path to the supplemental_data_6.csv file.
    """
    try:
        if not os.path.exists(data_path):
            print(f"Data file not found at {data_path}. Downloading...")
            download_fly_hemibrain_data()

        df = pd.read_csv(data_path)
        nt_columns = ['acetylcholine', 'glutamate', 'gaba', 'dopamine', 'serotonin', 'octopamine']

        # Convert columns to numeric, coercing errors to NaN, then fill NaN with 0
        for col in nt_columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        nt_totals = df[nt_columns].sum()
        total_nt = nt_totals.sum()

        print("\nNeurotransmitter Proportions:")
        for nt, total in nt_totals.items():
            proportion = (total / total_nt) * 100
            print(f"  - {nt}: {int(total)} ({proportion:.2f}%)")

    except Exception as e:
        print(f"Error analyzing neurotransmitter proportions: {e}")

if __name__ == "__main__":
    analyze_hemibrain_scale("data/supplemental_data_3.csv")
    analyze_neurotransmitter_proportions("data/supplemental_data_6.csv")