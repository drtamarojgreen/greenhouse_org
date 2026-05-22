# Movie 10: High-Fidelity Horizon Production Suite

## Introduction
Movie 10 is a modular, high-fidelity Blender production environment designed for the "High-Fidelity Horizon" storyline. It features advanced character modeling, rigging, and shading localized to ensure zero regressions across the codebase.

## System Capabilities
- **High-Fidelity Mesh Generation:** Procedural characters with iris, pupil, and detailed foliage.
- **Advanced Rigging:** 42-bone skeletal system with facial and limb articulation.
- **PBR-Lite Shading:** Built-in support for subsurface scattering and realistic bark/leaf textures.
- **Cinematic Sequencing:** Automatic camera switching and dynamic lighting rig initialization.
- **Structural Enforcement (SDD):** C++ based auditors verify the production environment before execution.

## System Limitations
- **Runtime Dependency:** Requires Blender 5.1+ for full feature support (EEVEE-Next, advanced Python API).
- **Environment:** Designed for headless execution in CI/CD pipelines but requires a GPU-capable environment for actual frame rendering.
- **Asset Scope:** Optimized for biological and procedural assets; hard-surface modeling is supported but limited in the base modular.

## Usage Instructions

### Rendering Frames
To render a specific range of frames:
```bash
blender --background --python scripts/blender/movie/10/master.py -- --start 1 --end 100
```

### Rendering the Full Movie
To execute the full production loop as defined in `movie_config.json`:
```bash
blender --background --python scripts/blender/movie/10/master.py
```

### Running Tests
Unit tests are located in `tests/unit/` and can be run via:
```bash
python3 scripts/blender/movie/10/tests/unit/run_all_tests.py
```

Localized SDD structural audits (C++):
```bash
cd scripts/blender/movie/10/tests/sdd && make run
```

## Production Configuration
The main controller logic is driven by `movie_config.json`. Any changes to character ensembles, frame ranges (currently 1-10000), or storyline events should be modified there.
