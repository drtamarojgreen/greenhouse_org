# scripts/acoustic/src/data_acquisition/01_fetch_pubmed_data.py

import os
import pandas as pd
from Bio import Entrez

def fetch_pubmed_data(query="music therapy[Title/Abstract] OR acoustic stimulation[Title/Abstract]", max_records=50):
    """
    Fetches data from PubMed for a given query.

    Args:
        query (str): The search query for PubMed.
        max_records (int): The maximum number of records to fetch.
    """
    print(f"Fetching up to {max_records} records from PubMed for query: '{query}'...")

    # Always provide your email to NCBI
    Entrez.email = "agent.aventuro@example.com"

    # Search PubMed
    handle = Entrez.esearch(db="pubmed", term=query, retmax=max_records)
    record = Entrez.read(handle)
    handle.close()
    id_list = record["IdList"]

    if not id_list:
        print("No articles found for the query.")
        return

    # Fetch details for the found IDs
    handle = Entrez.efetch(db="pubmed", id=id_list, rettype="medline", retmode="text")
    records = handle.read()
    handle.close()

    # Parse the records
    # MEDLINE format is a bit tricky to parse manually, but we can extract fields.
    articles = []
    for record_str in records.strip().split("\n\n"):
        if not record_str:
            continue

        current_article = {}
        for line in record_str.split("\n"):
            if line.startswith("PMID-"):
                current_article["id"] = line.split("- ")[1].strip()
            elif line.startswith("TI  -"):
                current_article["title"] = line.split("- ")[1].strip()
            elif line.startswith("AB  -"):
                # Abstract can be multi-line
                if "abstract" not in current_article:
                    current_article["abstract"] = ""
                current_article["abstract"] += line.split("- ")[1].strip() + " "

        # Clean up abstract
        if "abstract" in current_article:
            current_article["abstract"] = current_article["abstract"].strip()

        if "id" in current_article and "title" in current_article and "abstract" in current_article:
            articles.append(current_article)

    if not articles:
        print("Could not parse any articles. The format might have changed.")
        return

    # Save to CSV
    df = pd.DataFrame(articles)
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "pubmed_data.csv")
    df.to_csv(output_path, index=False)

    print(f"Successfully fetched and saved {len(df)} articles to {output_path}")

if __name__ == "__main__":
    fetch_pubmed_data()
