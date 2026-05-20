# Movie 10 Rendering Explanation (Frames 5001-10000)

This document explains the scene composition and rendering logic for the second half of Movie 10, specifically addressing the transition at frame 5001 and the environmental setup.

## Narrative Beats and Visibility

The production utilizes a beat-driven visibility system. Each beat triggers visibility events for specific entities:

| Frame Range | Beat Name | Key Entities Made Visible |
| :--- | :--- | :--- |
| 5001 - 6500 | The Creeping Standardization | **Blight_HF**, **Lichen_HF** |
| 6501 - 8000 | The Sky Patrol | **Drone_X10**, **Spore_HF** |
| 8001 - 9500 | The Deep Root Conflict | High-intensity protagonist animations |
| 9501 - 10000 | The Horizon Realized | **Herbaceous_HF** Victory Pose |

## Environmental Orchestration

At frame 5001, the production transitions into "The Creeping Standardization". This involves the introduction of standardizing elements into the mental landscape.

### Vegetation and "Overpowering Trees"
The `ExteriorModeler` (in `exterior.py`) scatters vegetation based on the `environment.vegetation` configuration.
- **Count:** 8 trees (as per `movie_config.json`).
- **Placement:** Randomized within a distance of 80 to 200 units from the origin.
- **Scale:** Randomized between 2.5 and 5.0.

If the trees appear to "overpower" the characters at frame 5001, it is likely due to the camera transition associated with the new narrative beat, or the randomized placement of a large tree (`ext_tree_X`) between the camera and the protagonists.

### Visibility Transitions
The `Director` manages visibility through keyframes on `hide_render` and `hide_viewport`. When a new beat starts at 5001:
1. The entities defined in the `storyline` for that beat are toggled to `visible`.
2. Any objects in the `greenhouse` context that are listed in `disallowed_assets` are hidden.

## Technical Execution (Render Pipeline)
The `render.py` script executes the following at frame 5001:
1. **Frame Set:** `bpy.context.scene.frame_set(5001)`.
2. **Camera Selection:** The `Director`'s `apply_sequencing` logic determines the active camera based on the `sequencing` and `cycle` configuration.
3. **Engine:** EEVEE with 32 samples.
4. **Output:** Saved as `frame_5001.png` in the `renders/` directory.

## Known Issues and Mitigation
- **Tree Occlusion:** If a tree is blocking the shot, the `seed` in `movie_config.json` for the environment should be adjusted to change the randomized scatter positions.
- **Standardization Beat:** The "overpowering" nature of the environment at 5001 is a thematic choice representing "The Creeping Standardization," where the mental landscape becomes more crowded and rigid.
