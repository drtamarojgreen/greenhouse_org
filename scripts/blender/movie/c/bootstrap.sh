#!/bin/bash
# Greenhouse Movie Engine Bootstrap Script
set -e

echo "[BOOTSTRAP] Setting up C++ environment for Movie Engine..."

# Ensure renders/frames directory exists
mkdir -p renders/frames

# Check for dependencies
if ! command -v cmake &> /dev/null; then
    echo "  [WARN] cmake not found. Please install it to build."
fi

if ! command -v g++ &> /dev/null; then
    echo "  [WARN] g++ not found. Please install a C++17 compiler."
fi

echo "[BOOTSTRAP] Configuration complete. Run 'mkdir build && cd build && cmake .. && make' to build."
