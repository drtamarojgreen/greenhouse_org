# Greenhouse Movie Engine Architecture

## Data Flow
1. **Scene Definitions**: Configured via `scenes.config` or Python scripts.
2. **Orchestration**: `movie_engine.cpp` loads the config and drives the frame loop.
3. **Animation**: `SceneNodes.hpp` uses `MathCore.hpp` to calculate actor states per frame.
4. **Mesh Operations**: `GeometryCore.hpp` (SoA) handles vertex transforms.
5. **Rendering**: `Renderer.hpp` rasterizes meshes to PPM frames.
6. **Python Integration**: `bindings.cpp` provides a pybind11-based bridge for Blender.

## Performance Design
- **SoA Layout**: Mesh vertices are stored in Structure-of-Arrays for cache efficiency.
- **Header-only Math**: Critical kernels are inlined via `MathCore.hpp`.
- **Deterministic**: All animations are frame-indexed and repeatable.

## Error Handling
- Use `Movie::Status` and `Movie::StatusCode` for all public API boundaries.
- Defensive validation at the Python/C++ boundary in `bindings.cpp`.

## Threading
- `SceneNode::animate` is designed to be thread-safe for parallel frame evaluation.
- All Blender-bound calls must be synchronized or kept on the main thread.
