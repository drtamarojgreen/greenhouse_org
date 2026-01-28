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
# Library
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 2700
# Lab / Sanctuary
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 3650
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 4000
# Finale / Outro
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 4300
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 4450
# Credits
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 4750
$BLENDER_CMD --background --python "$PYTHON_SCRIPT" -- --frame 4950

echo "Step 2: Starting Full Animation Render (Divided into 200-frame chunks)..."
echo "This uses the render_full_movie.py script to manage the render lifecycle."

python3 scripts/blender/movie/render_full_movie.py

echo "Render Job Completed. Individual chunks are located in scripts/blender/movie/renders/"
