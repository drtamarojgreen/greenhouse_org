#!/bin/bash
# GreenhouseMD Sequel Movie Render Orchestrator

# Ensure we are in the repo root
if [ ! -f "scripts/blender/movie/sequel_generator.py" ]; then
    echo "Error: Run this script from the repository root."
    exit 1
fi

BLENDER_CMD="blender"
PYTHON_SCRIPT="scripts/blender/movie/sequel_generator.py"
OUTPUT_DIR="scripts/blender/render_outputs/sequel"

mkdir -p "$OUTPUT_DIR"

echo "Step 1: Generating Test Frames for the Sequel..."
# Branding
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 50
# Walking Action (with zoom)
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 800
# Duel Action (with zoom)
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 4670
# Credits
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 5900

echo "Step 2: Starting Full Sequel Animation Render..."
echo "This uses the render_full_movie.py script with the --sequel flag."

python3 scripts/blender/movie/render_full_movie.py --sequel

echo "Sequel Render Job Completed. Individual chunks are located in scripts/blender/movie/renders/sequel/"
