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
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 50
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 200
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 350
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 475
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 600
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 725
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 850

echo "Step 2: Starting Full Animation Render (Low Sample Count)..."
echo "Output will be at: $OUTPUT_PATH"

# Run blender with the python script and then trigger animation render
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" --render-anim --render-output "$OUTPUT_PATH"

echo "Render Job Completed."
