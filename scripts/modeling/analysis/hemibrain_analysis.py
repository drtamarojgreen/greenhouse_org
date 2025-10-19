import pandas as pd
import requests
import io

def download_supplemental_data_6():
    url = "https://zenodo.org/records/10593546/files/supplemental_data_6.csv?download=1"
    print("Downloading supplemental_data_6.csv...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        return pd.read_csv(io.StringIO(response.text))
    except requests.exceptions.RequestException as e:
        print(f"Error downloading data: {e}")
        return None

def download_supplemental_data_4():
    url = "https://zenodo.org/records/10593546/files/supplemental_data_4.csv?download=1"
    print("Placeholder for downloading supplemental_data_4.csv...")
    mock_data = {'root_id_630': [1, 2, 3], 'cell_type': ['T4a', 'T4b', 'T5a'], 'pre': [100, 150, 120], 'pos_x': [12345, 12346, 12347], 'pos_y': [54321, 54322, 54323], 'pos_z': [98765, 98766, 98767]}
    return pd.DataFrame(mock_data)

def analyze_neurotransmitter_proportions(df):
    if df is None: return
    print("\n--- Analyzing Neurotransmitter Proportions ---")
    nt_columns = ['hemibrain_acetylcholine', 'hemibrain_glutamate', 'hemibrain_gaba', 'hemibrain_dopamine', 'hemibrain_serotonin', 'hemibrain_octopamine']
    total_nt_counts = df[nt_columns].sum()
    grand_total = total_nt_counts.sum()
    proportions = (total_nt_counts / grand_total) * 100
    print("Total counts for each neurotransmitter:\n", total_nt_counts)
    print(f"\nGrand total of all neurotransmitter neurons: {grand_total}")
    print("\nProportion of each neurotransmitter (%):\n", proportions.round(2))

def analyze_hemibrain_scale(df):
    if df is None: return
    print("\n--- Analyzing Hemibrain Dataset Scale and Dimensions ---")
    print(f"Number of neuronal reconstructions: {len(df)}")
    print(f"Total number of presynapses: {df['pre'].sum()}")

if __name__ == "__main__":
    sup6_df = download_supplemental_data_6()
    analyze_neurotransmitter_proportions(sup6_df)
    sup4_df = download_supplemental_data_4()
    analyze_hemibrain_scale(sup4_df)
