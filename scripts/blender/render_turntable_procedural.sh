#!/bin/bash
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)
"$SCRIPT_DIR/run_blender_job.sh" turntable_procedural
