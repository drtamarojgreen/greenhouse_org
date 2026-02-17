# Changelog

## [1.1.0] - 2026-05-22
### Architectural Overhaul
- Extracted `BaseMaster` to reduce code duplication between main film and sequel.
- Consolidated `SCENE_MAP` into `constants.py` with standardized naming.
- Split `animate_master` into logical sub-methods (`_animate_characters`, `_animate_props`, etc.).
- Standardized dependency management via `ensure_dependencies`.
- Improved scene import error logging with actual exceptions.
- Added quality presets (`test`, `preview`, `final`) and configurable GPU device selection.

### Bug Fixes
- Fixed `self.beam` visibility crash with proper initialization and guards.
- Fixed `GazeTarget` parenting issue that broke subsequent scenes by using positional animation.
- Fixed material creation order and naming in `gnome_antagonist.py`.
- Fixed absolute rotation values in intertitles to prevent accumulation.
- Fixed duplicate rotation keyframes for `h1` by consolidating logic.
- Resolved missing `style` imports in test suite.
- Fixed non-destructive constraint management in `add_tracking_constraint`.

### Performance & Optimization
- Consolidated object loops in `animate_master` for better efficiency.
- Replaced heavy per-frame keyframing with **Noise F-Curve Modifiers** for breathing, flickering, and gestures.
- Joined static parts of the Gnome and Greenhouse assets into single meshes to reduce draw calls.
- Implemented material LOD system for procedural bark and leaf materials.
- Optimized target range rendering by skipping redundant scene build logic.

### Cinematic & Materials
- Upgraded procedural materials (Bark, Leaf, Brain, Marble) with combined normals and correct ranges.
- Added **Establishing Shot** for Greenhouse Reveal (Shot S01).
- Improved character acting with **hip sway**, **rhythmic closures** in talk animation, and **discrete eye saccades**.
- Enhanced facial expressions with mouth deformation (widening/thinning).
- Added secondary motion to Gnome cloak via Wave modifier.
- Implemented unique firefly behavior in Sanctuary scene.
- Configured Color Management (Filmic) and Motion Blur defaults.

### Tooling & CI
- Added `README.md` explaining project architecture and distributed rendering.
- Implemented `stitch_chunks.py` for final movie assembly.
- Improved `audit_renders.py` with per-render log files.
- Added GitHub Actions workflow (`blender_test.yml`) for headless testing.
- Added `--quick` testing mode for structural verification.
- Fixed timeline contiguity and approximate float matching in tests.
