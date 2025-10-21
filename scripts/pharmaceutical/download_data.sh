#!/usr/bin/env bash

# This script downloads and unzips the necessary datasets for the
# pharmaceutical data analysis pipeline. It includes basic error handling.

set -e # Exit immediately if a command exits with a non-zero status.

# CONFIGURATION
DATA_DIR="./raw_data"
BASE_DAILYMED_URL="https://dailymed-data.nlm.nih.gov/public-release-files"
DRUGSFDA_URL="https://www.fda.gov/media/89850/download?attachment"

# Create data directory
echo "Creating data directory: $DATA_DIR"
mkdir -p "$DATA_DIR"
cd "$DATA_DIR"

# --- Download and unzip DailyMed data ---
echo "--- Starting DailyMed Data Download ---"

# Human Prescription Labels (5 parts)
for i in {1..5}
do
  FILENAME="dm_spl_release_human_rx_part${i}.zip"
  URL="${BASE_DAILYMED_URL}/${FILENAME}"
  echo "Downloading ${FILENAME}..."
  wget -q -O "${FILENAME}" "${URL}"
  echo "Unzipping ${FILENAME}..."
  unzip -oq "${FILENAME}" -d "dailymed_xml"
  rm "${FILENAME}" # Remove zip file to save space
done

# Human OTC Labels (11 parts)
for i in {1..11}
do
  FILENAME="dm_spl_release_human_otc_part${i}.zip"
  URL="${BASE_DAILYMED_URL}/${FILENAME}"
  echo "Downloading ${FILENAME}..."
  wget -q -O "${FILENAME}" "${URL}"
  echo "Unzipping ${FILENAME}..."
  unzip -oq "${FILENAME}" -d "dailymed_xml"
  rm "${FILENAME}" # Remove zip file to save space
done

echo "--- DailyMed Data Download Complete ---"


# --- Download and unzip Drugs@FDA data ---
echo "--- Starting Drugs@FDA Data Download ---"

FILENAME="drugsatfda.zip"
echo "Downloading ${FILENAME}..."
wget -q -O "${FILENAME}" "${DRUGSFDA_URL}"
echo "Unzipping ${FILENAME}..."
unzip -oq "${FILENAME}" -d "drugsfda_raw"
rm "${FILENAME}" # Remove zip file to save space

echo "--- Drugs@FDA Data Download Complete ---"


cd ..
echo "All data download and extraction tasks are complete."