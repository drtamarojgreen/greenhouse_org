# scripts/acoustic/src/data_acquisition/02_fetch_clinical_trials_data.py

import os
import requests
import pandas as pd

def fetch_clinical_trials_data(query="music therapy OR acoustic stimulation", max_records=50):
    """
    Fetches data from ClinicalTrials.gov for a given query.

    Args:
        query (str): The search query.
        max_records (int): The maximum number of records to fetch.
    """
    print(f"Fetching up to {max_records} records from ClinicalTrials.gov for query: '{query}'...")

    base_url = "https://clinicaltrials.gov/api/v2/studies"
    params = {
        "query.term": query,
        "pageSize": max_records,
        "fields": "NCTId,BriefTitle,BriefSummary" # Specify fields to retrieve
    }

    try:
        response = requests.get(base_url, params=params)
        response.raise_for_status()  # Raise an exception for bad status codes
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from ClinicalTrials.gov: {e}")
        return

    studies = data.get("studies", [])
    if not studies:
        print("No studies found for the query.")
        return

    # Extract relevant information
    trial_data = []
    for study in studies:
        protocol = study.get("protocolSection", {})
        identification_module = protocol.get("identificationModule", {})
        description_module = protocol.get("descriptionModule", {})

        trial_data.append({
            "id": identification_module.get("nctId"),
            "title": identification_module.get("briefTitle"),
            "summary": description_module.get("briefSummary", "") # Summary might be missing
        })

    # Save to CSV
    df = pd.DataFrame(trial_data)
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "clinical_trials_data.csv")
    df.to_csv(output_path, index=False)

    print(f"Successfully fetched and saved {len(df)} clinical trials to {output_path}")

if __name__ == "__main__":
    fetch_clinical_trials_data()
