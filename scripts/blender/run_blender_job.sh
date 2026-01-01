#!/bin/bash

# --- Master Blender Job Runner ---
# This script executes a specific render job from the render_suite.py script.
# It requires Blender to be installed and accessible in the system's PATH.

# --- CONFIGURATION ---
# The Blender command. If 'blender' is not in your PATH, provide the full path.
# Example: BLENDER_CMD="/Applications/Blender.app/Contents/MacOS/Blender"
BLENDER_CMD="blender"

# --- VALIDATION ---
# Check if a job name was provided as an argument.
if [ -z "$1" ]; then
    echo "Usage: $0 <job_name>"
    echo "Example: $0 turntable_procedural"
    echo "Available jobs: all, turntable_procedural, zoom_glow, wireframe_flyover"
    exit 1
fi

JOB_NAME=$1

# Find the absolute path of the directory where this script is located.
# This ensures that we can reliably locate render_suite.py.
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
RENDER_SUITE_PATH="$SCRIPT_DIR/render_suite.py"

# Check if the render_suite.py script exists.
if [ ! -f "$RENDER_SUITE_PATH" ]; then
    echo "Error: The master script 'render_suite.py' was not found at:"
    echo "$RENDER_SUITE_PATH"
    exit 1
fi

# Check if the Blender command is available.
if ! command -v $BLENDER_CMD &> /dev/null; then
    echo "Error: Blender command '$BLENDER_CMD' not found."
    echo "Please ensure Blender is installed and that the command is in your system's PATH,"
    echo "or set the BLENDER_CMD variable in this script to the full path of the Blender executable."
    exit 1
fi

# --- EXECUTION ---
export PYTHONPATH="/home/jules/.pyenv/versions/3.12.12/lib/python3.12/site-packages:$PYTHONPATH"
echo "Starting Blender job: $JOB_NAME"
echo "Using script: $RENDER_SUITE_PATH"
echo "----------------------------------------"

# Run Blender in the background, passing the Python script and all arguments.
# The '--' separator is crucial: it tells Blender to pass the subsequent arguments
# to the Python script instead of interpreting them itself.
$BLENDER_CMD -b -P "$RENDER_SUITE_PATH" -- "$JOB_NAME" "${@:2}"

# Check the exit code of the Blender command.
EXIT_CODE=$?
echo "----------------------------------------"
if [ $EXIT_CODE -eq 0 ]; then
    echo "Blender job '$JOB_NAME' completed successfully."
else
    echo "Blender job '$JOB_NAME' failed with exit code $EXIT_CODE."
fi

exit $EXIT_CODE
