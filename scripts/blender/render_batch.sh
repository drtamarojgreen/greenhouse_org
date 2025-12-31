#!/bin/bash
OUTPUT_DIR="/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/branded_png_frames"
mkdir -p "$OUTPUT_DIR"

for f in {1..60}
do
    echo "--- STARTING FRAME $f ---"
    blender -b -P scripts/blender/isolate_brain_region.py -- --frame $f
    if [ $? -ne 0 ]; then
        echo "CRITICAL: Frame $f returned error $?"
    fi
done

echo "Muxing final video..."
ffmpeg -y -i "$OUTPUT_DIR/frame_%03d.png" -c:v libx264 -pix_fmt yuv420p scripts/blender/branded_region_tour_final.mp4
