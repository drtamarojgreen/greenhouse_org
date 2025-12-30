#!/bin/bash
set -euo pipefail

# --- Master Disorder Highlight Renderer ---
# This script orchestrates the rendering of brain regions based on a disorder configuration file.
# It reads a .conf file, loops through the defined regions, and calls the
# underlying Blender runner script for each one.

# --- Script Setup ---
# Get the directory where this script is located to reliably find other scripts.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# --- VALIDATION ---
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_disorder_config>"
    echo "Example: $0 disorder_configs/depression.conf"
    exit 1
fi

CONFIG_FILE="$1"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration file not found at: $CONFIG_FILE"
    exit 1
fi

# --- PARSING ---
# Source the config file to load the variables (DISORDER_NAME, REGIONS) into the environment.
# This approach is simple and effective for our key-value format.
source "$CONFIG_FILE"

echo "Starting render pipeline for disorder: $DISORDER_NAME"
echo "--------------------------------------------------"

# --- EXECUTION LOOP ---
# Use a 'read' loop to process the REGIONS string.
# Set the Internal Field Separator (IFS) to a comma to split the string into pairs.
IFS=',' read -ra REGION_PAIRS <<< "$REGIONS"

for pair in "${REGION_PAIRS[@]}"; do
    # Within each pair, split by the pipe '|' to separate the region name from the label text.
    # This is done using parameter expansion for safety and clarity.
    REGION_NAME="${pair%%|*}"
    LABEL_TEXT="${pair#*|}"

    echo "Processing Region: $REGION_NAME"
    echo "  > Label Text: '$LABEL_TEXT'"

    # Construct a deterministic, lowercase output filename (e.g., depression_hippocampus.mkv).
    # This ensures consistency and predictability.
    sanitized_disorder_name=$(echo "$DISORDER_NAME" | tr '[:upper:]' '[:lower:]' | tr -s ' ' '_')
    OUTPUT_FILENAME="${sanitized_disorder_name}_${REGION_NAME}.mkv"
    echo "  > Output File: '$OUTPUT_FILENAME'"

    # Call the detailed runner script that interfaces with Blender.
    # This script is responsible for passing all necessary arguments to the Python script.
    echo "  > Invoking Blender job runner..."
    "$SCRIPT_DIR/run_blender_region_job.sh" "$REGION_NAME" "$LABEL_TEXT" "$OUTPUT_FILENAME"

    echo "--------------------------------------------------"
done

echo "All regions for '$DISORDER_NAME' have been processed."
