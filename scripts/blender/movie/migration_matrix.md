# Migration Capability Matrix: Silent Renderer vs. Modern Standards

| Capability | V2/V3/V4 Feature | Legacy Silent Renderer (V5) | Implementation Status |
| :--- | :--- | :--- | :--- |
| **Initialization** | Hard reset (`read_homefile`), deterministic defaults | Selective clearing, complex state inheritance | **Partial** |
| **Visibility** | Scale-culling (scale=0) to avoid Z-drift | Z-shift (-50.0) with constant interpolation | **Partial** (Needs Scale-culling) |
| **Camera Safety** | Rail/track camera constraints, framing safety | `ensure_camera` with `TrackCharacters`, `apply_camera_safety` | **Partial** (Needs Rig Contract) |
| **Chroma Support** | Standardized `chroma_green_setup.py` | Basic `chroma_green` toggle in `BaseMaster` | **Partial** |
| **Render Presets** | Centralized `preview/review/final` map | `QUALITY_PRESETS` in `constants.py` | **Missing** (Unification needed) |
| **Performance** | F-curve noise modifiers over manual keys | Mix of manual keying and some noise (cam) | **Partial** (Needs procedural utilities) |
| **Testing** | Behavior-focused pipeline outputs | Extensive unit/integration tests | **Present** (Needs migration tests) |
| **Ops Tooling** | Render presets, diagnostics, render audits | `Profiler`, `audit_renders.py`, `check_blankness.py` | **Present** |
