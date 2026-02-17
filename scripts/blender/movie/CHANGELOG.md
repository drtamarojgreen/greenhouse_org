# Changelog

## [1.1.0] - 2026-05-22
### Architectural Overhaul
- Extracted `BaseMaster` to reduce code duplication between main film and sequel.
- Consolidated `SCENE_MAP` into `constants.py`.
- Split `animate_master` into logical sub-methods for maintainability.
- Standardized dependency management via `ensure_dependencies`.
- Improved scene import error logging.

### Bug Fixes
- Fixed `self.beam` visibility crash.
- Fixed `GazeTarget` parenting issue that broke subsequent scenes.
- Fixed material creation order in `gnome_antagonist.py`.
- Fixed absolute rotation values in intertitles.

### Performance
- Consolidated object loops in `animate_master`.
- Added quality presets for rendering.
