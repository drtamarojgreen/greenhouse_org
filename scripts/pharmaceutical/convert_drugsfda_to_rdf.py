import pandas as pd
from rdflib import Graph, Literal, Namespace, RDF, RDFS, URIRef
import os

# --- Configuration ---
INPUT_DIR = './raw_data/drugsfda_raw'
OUTPUT_FILE = './rdf_data/drugsfda.rdf'
BASE_URI = "http://www.fda.gov/drugsatfda/"

# --- Namespaces ---
FDA = Namespace(BASE_URI)
XSD = Namespace("http://www.w3.org/2001/XMLSchema#")

# --- Initialize Graph ---
g = Graph()
g.bind("fda", FDA)
g.bind("rdfs", RDFS)

# --- Define Mappings ---
# Maps filenames to their primary key and the columns we want to process
file_mappings = {
    'Applications.txt': {
        'pk': 'ApplNo',
        'columns': {
            'ApplType': FDA.applicationType,
            'SponsorName': FDA.sponsorName
        }
    },
    'Products.txt': {
        'pk': 'ProductNo',
        'fk': 'ApplNo',
        'columns': {
            'Form': FDA.form,
            'Strength': FDA.strength,
            'DrugName': FDA.drugName,
            'ActiveIngredient': FDA.activeIngredient,
            'ReferenceDrug': FDA.isReferenceDrug,
            'ReferenceStandard': FDA.isReferenceStandard
        }
    },
    'Submissions.txt': {
        'pk': 'SubmissionNo',
        'fk': 'ApplNo',
        'columns': {
            'SubmissionType': FDA.submissionType,
            'SubmissionStatus': FDA.submissionStatus,
            'SubmissionStatusDate': FDA.submissionStatusDate,
            'ReviewPriority': FDA.reviewPriority
        }
    }
}

# --- Processing ---
print("Starting Drugs@FDA to RDF conversion...")

# Ensure output directory exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

for filename, mapping in file_mappings.items():
    file_path = os.path.join(INPUT_DIR, filename)
    if not os.path.exists(file_path):
        print(f"Warning: File not found, skipping: {file_path}")
        continue

    print(f"Processing {filename}...")
    try:
        # Read the tab-separated file
        df = pd.read_csv(file_path, sep='\t', dtype=str, on_bad_lines='warn')

        # Clean column names (remove leading/trailing spaces)
        df.columns = df.columns.str.strip()

        for index, row in df.iterrows():
            # Create a subject URI based on the application number
            appl_no = row.get(mapping.get('fk', mapping['pk'])).strip()
            subject = URIRef(f"{BASE_URI}application/{appl_no}")
            g.add((subject, RDF.type, FDA.Application))

            # If there's a different primary key (like for Products or Submissions), create a related entity
            if 'fk' in mapping:
                pk_val = row.get(mapping['pk']).strip()
                entity_type = filename.split('.')[0][:-1] # e.g., "Product" or "Submission"
                entity_subject = URIRef(f"{BASE_URI}{entity_type.lower()}/{appl_no}/{pk_val}")
                g.add((entity_subject, RDF.type, FDA[entity_type]))
                g.add((subject, FDA[f'has{entity_type}'], entity_subject)) # Link application to its product/submission
            else:
                entity_subject = subject

            # Add triples for each column in the mapping
            for col_name, predicate in mapping['columns'].items():
                if col_name in row and pd.notna(row[col_name]):
                    value = str(row[col_name]).strip()
                    g.add((entity_subject, predicate, Literal(value)))

    except Exception as e:
        print(f"Error processing {filename}: {e}")

# --- Serialize Graph ---
print(f"Serializing graph to {OUTPUT_FILE}...")
g.serialize(destination=OUTPUT_FILE, format='xml')

print("Conversion complete.")