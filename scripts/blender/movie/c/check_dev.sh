#!/bin/bash
# Incremental Check Script for Developers
set -e

echo "[CHECK] Running quick linter and check suite..."

# Run clang-format if available
if command -v clang-format &> /dev/null; then
    echo "  [LINT] Formatting source..."
    clang-format -i src/*.cpp include/*.hpp tests/cards/*.cpp tests/cpp/*.cpp
else
    echo "  [SKIP] clang-format not found."
fi

# Placeholder for running tests if a build exists
if [ -f "build/core_unit_tests" ]; then
    echo "  [TEST] Running unit tests..."
    ./build/core_unit_tests
else
    echo "  [WARN] Build artifact 'core_unit_tests' not found. Skip."
fi

echo "[CHECK] Incremental check complete."
