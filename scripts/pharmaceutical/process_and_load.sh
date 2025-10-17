#!/usr/bin/env bash

# This script orchestrates the entire data pipeline:
# 1. Downloads all required data from FDA and DailyMed.
# 2. Converts the tabular Drugs@FDA data to RDF.
# 3. Converts all DailyMed SPL XML files to RDF.
# 4. Loads all generated RDF into a Fuseki triple store.

set -e # Exit immediately if a command exits with a non-zero status.

# --- CONFIGURATION ---
RAW_DATA_DIR="./raw_data"
XML_SOURCE_DIR="${RAW_DATA_DIR}/dailymed_xml"
RDF_OUT_DIR="./rdf_data"
FUSEKI_URL="http://localhost:3030/spl/data"
XSLT_FILE="spl2rdf_extended.xsl" # Assumes this is in the same directory

# --- STAGE 1: Download Data ---
echo "--- STAGE 1: DOWNLOADING DATA ---"
bash ./download_data.sh
echo "--- DOWNLOAD COMPLETE ---"

# --- STAGE 2: Convert Drugs@FDA (Tabular) to RDF ---
echo "--- STAGE 2: CONVERTING DRUGS@FDA TO RDF ---"
python3 ./convert_drugsfda_to_rdf.py
echo "--- DRUGS@FDA CONVERSION COMPLETE ---"

# --- STAGE 3: Convert DailyMed (XML) to RDF ---
echo "--- STAGE 3: CONVERTING DAILYMED XML TO RDF ---"
# Ensure output directory for SPL RDF exists
mkdir -p "${RDF_OUT_DIR}/spl"

# Check if XSLT file exists
if [ ! -f "$XSLT_FILE" ]; then
    echo "Error: XSLT file not found: $XSLT_FILE"
    exit 1
fi

# Process each SPL XML file
find "${XML_SOURCE_DIR}" -type f -name "*.xml" | while read -r xml_file; do
  spl_id=$(basename "$xml_file" .xml)
  echo "Processing SPL: $spl_id"
  xsltproc --stringparam spl_id "$spl_id" "$XSLT_FILE" "$xml_file" > "${RDF_OUT_DIR}/spl/${spl_id}.rdf"
done
echo "--- DAILYMED XML CONVERSION COMPLETE ---"

# --- STAGE 4: Load ALL RDF data into Fuseki ---
echo "--- STAGE 4: LOADING ALL RDF DATA INTO FUSEKI ---"
# Check if Fuseki is available
if ! curl -s --head "$FUSEKI_URL" | head -n 1 | grep "200 OK" > /dev/null; then
    echo "Error: Fuseki server is not responding at $FUSEKI_URL"
    echo "Please ensure your Fuseki server is running and the 'spl' dataset is created."
    exit 1
fi

# Load the single Drugs@FDA RDF file
echo "Loading Drugs@FDA RDF..."
curl -s -X POST \
     -H "Content-Type: application/rdf+xml" \
     --data-binary @"${RDF_OUT_DIR}/drugsfda.rdf" \
     "$FUSEKI_URL"

# Load all the SPL RDF files
echo "Loading DailyMed SPL RDF files..."
find "${RDF_OUT_DIR}/spl" -type f -name "*.rdf" | while read -r rdf_file; do
  echo "  - Loading $(basename "$rdf_file")"
  curl -s -X POST \
       -H "Content-Type: application/rdf+xml" \
       --data-binary @"$rdf_file" \
       "$FUSEKI_URL"
done
echo "--- DATA LOADING COMPLETE ---"

echo "PIPELINE EXECUTION FINISHED SUCCESSFULLY."