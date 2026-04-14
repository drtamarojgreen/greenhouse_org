# Movie 6: The Spirits of the Greenhouse

This directory contains the production pipeline for Movie 6 of the Greenhouse for Mental Health Development. This scene explores the metaphysical shift in the greenhouse as bioluminescent spirits emerge to interact with our horticultural heroes.

## Pipeline Overview

The Scene 6 pipeline is divided into two primary phases to ensure asset portability and production reliability.

### Phase A: Asset Extraction & Standardization
Standardizes complex character assets from legacy production blends into decoupled FBX and texture files.

**To run extraction:**
```bash
blender --background --python scripts/blender/movie/6/a/extract_ensemble.py
```
*Outputs are saved to `scripts/blender/movie/6/assets/`.*

### Phase B: Scene Assembly & Rendering
Assembles the final cinematic environment using standardized assets and high-fidelity environmental restoration.

**To assemble the production scene:**
```bash
blender --background --python scripts/blender/movie/6/b/assemble_production_v6.py
```

**To perform a production render (Frames 1-3):**
```bash
blender --background --python scripts/blender/movie/6/render_scene6.py -- --frames 1-3
```

## Testing & Verification

A comprehensive suite of 40+ integration tests ensures geometric integrity, color parity, and cinematic alignment.

**To run all tests:**
```bash
blender --background --python scripts/blender/movie/6/tests/run_all_tests.py
```

### Key Diagnostic Tests
- `test_character_scale`: Ensures robust scaling (percentile-based) despite procedural vertex outliers.
- `test_v6_spirit_integration`: Verifies spatial separation, visibility, and texture mapping.
- `test_rig_integrity`: Validates armature deformation flags and vertex group coverage.
- `test_protagonist_colors`: Confirms material accuracy for chroma keying.

## Storyline & Direction
For detailed narrative beats and character interaction guidelines, see `scripts/blender/movie/6/storyline/storyline.md`.
