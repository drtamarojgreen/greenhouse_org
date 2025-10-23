import os
import pandas as pd

def download_fly_hemibrain_data(data_dir="data"):
    """
    Downloads the fly hemibrain connectome data from Zenodo.
    This includes neuron information and neurotransmitter predictions.
    """
    print("Downloading fly hemibrain data...")
    # Dataset from: Eckstein, N., Bates, A. S., Champion, A. S., et al. (2024).
    # Supplemental Files for Eckstein and Bates et al., Cell (2024) [Data set]. Zenodo.
    # https://doi.org/10.5281/zenodo.10593546

    # supplemental_data_3.csv: Neuron-level data for the hemibrain dataset.
    url_3 = "https://zenodo.org/records/10593546/files/supplemental_data_3.csv?download=1"
    # supplemental_data_6.csv: Summary results for central brain secondary hemilineages.
    url_6 = "https://zenodo.org/records/10593546/files/supplemental_data_6.csv?download=1"

    os.makedirs(data_dir, exist_ok=True)
    os.system(f"wget -O {data_dir}/supplemental_data_3.csv '{url_3}'")
    os.system(f"wget -O {data_dir}/supplemental_data_6.csv '{url_6}'")
    print("Fly hemibrain data downloaded successfully.")

def download_oasis_human_data(data_dir="data"):
    """
    Downloads the OASIS cross-sectional MRI data.
    This dataset includes demographic and clinical data for 416 subjects.
    """
    print("\nDownloading OASIS human brain data...")
    # Dataset from: Open Access Series of Imaging Studies (OASIS)
    # https://www.oasis-brains.org/
    url = "https://sites.wustl.edu/oasisbrains/files/2024/04/oasis_cross-sectional-5708aa0a98d82080.xlsx"
    xlsx_path = f"{data_dir}/oasis_cross-sectional.xlsx"
    csv_path = f"{data_dir}/oasis_cross-sectional.csv"

    os.makedirs(data_dir, exist_ok=True)
    os.system(f"wget -O {xlsx_path} '{url}'")

    print("Converting OASIS data from XLSX to CSV...")
    try:
        df = pd.read_excel(xlsx_path)
        df.to_csv(csv_path, index=False)
        os.remove(xlsx_path) # remove original xlsx file
        print("OASIS data downloaded and converted successfully.")
    except Exception as e:
        print(f"Error converting OASIS data: {e}")


def download_brain_map_data(data_dir="data"):
    """
    Downloads the de-identified clinical information from the Allen Institute's
    Aging, Dementia and TBI study.
    """
    print("\nDownloading Brain-map.org clinical data...")
    # Dataset from: Allen Institute for Brain Science. Aging, Dementia and TBI Study.
    # https://aging.brain-map.org/
    url = "https://aging.brain-map.org/api/v2/data/query.csv?criteria=model::ApiTbiDonorDetail,rma::options[num_rows$eqall]"

    os.makedirs(data_dir, exist_ok=True)
    os.system(f"wget -O {data_dir}/brain_map_clinical_data.csv \"{url}\"")
    print("Brain-map.org data downloaded successfully.")


if __name__ == "__main__":
    print("--- Starting Data Download and Preparation ---")
    download_fly_hemibrain_data()
    download_oasis_human_data()
    download_brain_map_data()
    print("\n--- All datasets have been downloaded and prepared. ---")