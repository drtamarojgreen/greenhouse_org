#!/bin/bash
# Parallel Render Script for Movie v2.0
# Usage: ./render_v2.sh

BLENDER_BIN="blender" # Update if blender is not in path
SCRIPT_PATH="scripts/blender/movie/2/run_v2.py"

echo "Launching Parallel Render Chunks..."

# Example: Launching 4 parallel chunks of 2125 frames each (Total 8500)
$BLENDER_BIN -b -P $SCRIPT_PATH -- --frame-start 1 --frame-end 2125 --render &
$BLENDER_BIN -b -P $SCRIPT_PATH -- --frame-start 2126 --frame-end 4250 --render &
$BLENDER_BIN -b -P $SCRIPT_PATH -- --frame-start 4251 --frame-end 6375 --render &
$BLENDER_BIN -b -P $SCRIPT_PATH -- --frame-start 6376 --frame-end 8500 --render &

wait
echo "All render chunks complete. Output in renders/v2/"
