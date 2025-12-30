#!/bin/bash
set -euo pipefail

# --- Region-Specific Blender Job Runner ---
# This script executes the 'region_highlight' job from the render_suite.py script.
# It is designed to be called by the master 'render_disorder_highlight.sh' script.

# --- CONFIGURATION ---
BLENDER_CMD="blender"
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
RENDER_SUITE_PATH="$SCRIPT_DIR/render_suite.py"

# --- VALIDATION ---
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <region_name> <label_text> <output_filename>"
    echo "This script is intended to be called by a higher-level orchestration script."
    exit 1
fi

REGION_NAME="$1"
LABEL_TEXT="$2"
OUTPUT_FILENAME="$3"

if [ ! -f "$RENDER_SUITE_PATH" ]; then
    echo "Error: The master script 'render_suite.py' was not found at: $RENDER_SUITE_PATH"
    exit 1
fi

if ! command -v $BLENDER_CMD &> /dev/null; then
    echo "Error: Blender command '$BLENDER_CMD' not found."
    exit 1
fi

# --- EXECUTION ---
echo "Starting Blender region_highlight job:"
echo "  > Region: $REGION_NAME"
echo "  > Text:   '$LABEL_TEXT'"
echo "  > Output: $OUTPUT_FILENAME"
echo "----------------------------------------"

# Run Blender in the background, passing the Python script and all arguments.
# The job name 'region_highlight' is hardcoded here, as this script's sole purpose
# is to run this specific job. The remaining arguments are passed to the Python script.
$BLENDER_CMD -b -P "$RENDER_SUITE_PATH" -- region_highlight "$REGION_NAME" "$LABEL_TEXT" "$OUTPUT_FILENAME"

EXIT_CODE=$?
echo "----------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "Blender job for region '$REGION_NAME' completed successfully."
else
    echo "Blender job for region '$REGION_NAME' failed with exit code $EXIT_CODE."
fi

exit $EXIT_CODE
