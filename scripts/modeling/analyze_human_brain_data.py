import pandas as pd
import os
from download_data import download_oasis_human_data, download_brain_map_data

def analyze_physical_dimensions(data_path):
    """
    Analyzes the physical dimensions of the human brain from the OASIS dataset.
    Args:
        data_path (str): The path to the oasis_cross-sectional.csv file.
    """
    try:
        if not os.path.exists(data_path):
            print(f"Data file not found at {data_path}. Downloading...")
            download_oasis_human_data()

        df = pd.read_csv(data_path)
        print("Human Brain Physical Dimensions (OASIS Dataset):")

        # eTIV: Estimated total intracranial volume in mm^3
        etiv_stats = df['eTIV'].describe()
        print("\nEstimated Total Intracranial Volume (eTIV) in mm^3:")
        print(etiv_stats)

        # nWBV: Normalized whole brain volume
        nwbv_stats = df['nWBV'].describe()
        print("\nNormalized Whole Brain Volume (nWBV):")
        print(nwbv_stats)

    except Exception as e:
        print(f"Error analyzing physical dimensions: {e}")

def analyze_neuronal_glial_proportion(data_path):
    """
    Analyzes the neuronal to glial proportion from the brain-map.org dataset.
    Args:
        data_path (str): The path to the brain_map_clinical_data.csv file.
    """
    try:
        if not os.path.exists(data_path):
            print(f"Data file not found at {data_path}. Downloading...")
            download_brain_map_data()

        df = pd.read_csv(data_path)
        print("\nNeuronal to Glial Proportion Analysis (Brain-map.org):")
        # The prompt mentions that a 1 cubic mm sample of human brain tissue had a 2-to-1 glia to neuron ratio.
        # This dataset does not contain direct counts of neurons or glia.
        # It contains clinical and pathological data, but not cell counts.
        # Therefore, I will state that the information is not available in this dataset
        # and refer to the information given in the prompt.
        print("The provided dataset from brain-map.org does not contain direct neuron and glia cell counts.")
        print("However, based on the information provided in the prompt, a recent study on a cubic millimeter of human brain tissue found a glia-to-neuron ratio of 2-to-1.")

    except Exception as e:
        print(f"Error analyzing neuronal/glial proportion: {e}")


if __name__ == "__main__":
    analyze_physical_dimensions("data/oasis_cross-sectional.csv")
    analyze_neuronal_glial_proportion("data/brain_map_clinical_data.csv")