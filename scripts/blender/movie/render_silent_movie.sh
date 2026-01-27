#!/bin/bash
# GreenhouseMD Silent Movie Render Orchestrator

# Ensure we are in the repo root
if [ ! -f "scripts/blender/movie/silent_movie_generator.py" ]; then
    echo "Error: Run this script from the repository root."
    exit 1
fi

BLENDER_CMD="blender"
PYTHON_SCRIPT="scripts/blender/movie/silent_movie_generator.py"
OUTPUT_PATH="scripts/blender/render_outputs/silent_movie/movie.mp4"

mkdir -p "scripts/blender/render_outputs/silent_movie"

echo "Step 1: Generating Test Frames..."
# Intro / Titles
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 50
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 150
# Brain / Garden
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 300
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 450
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 575
# Dialogue / Exchange
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 850
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 1150
# Forge / Bridge
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 1425
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 1700
# Shadow / Confrontation
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 2250
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 2450
# Finale / Outro
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 2750
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 2950

echo "Step 2: Starting Full Animation Render (Low Sample Count)..."
echo "Output will be at: $OUTPUT_PATH"

# Run blender with the python script and then trigger animation render
# Ensure flags are AFTER the '--' separator for the python script to parse them
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --render-anim --render-output "$OUTPUT_PATH"

echo "Render Job Completed."
