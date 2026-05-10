# Movie Migration Errors: Version 9 Regression Audit

This document details the features, configurations, and logic present in Movie Versions 5, 6, and 7 that are currently missing or regressed in Version 9.

## 1. Configuration Regressions (movie_config.json)

The following root configuration blocks and parameters have been lost or significantly reduced in Version 9:

- **Missing Root Blocks**:
  - `normalization`: Version 7 included a `normalization` block for global strategy (BBOX, origin reset, culling). Version 9 lacks this, relying on hardcoded or implicit logic.
  - `patrol_paths`: Version 7 (and 6) defined `patrol_paths` with waypoints (e.g., `perimeter`, `perimeter_inner`). Version 9 mentions patrol in entity definitions but lacks the global path definitions in `movie_config.json`.
  - `interior`: Version 7 included an `interior` block for scene-specific assets.

- **Missing Paths**:
  - `m6_root`: While present in Version 9, it is not consistently used for legacy asset resolution compared to Version 7's `BackdropModeler`.

## 2. Entity & Component Regressions

- **WaterCan**:
  - **Version 7**: Included a complex `structure` with both `Body` and `Spout` geometry.
  - **Version 9**: Simplified to only `Body` (a sphere), losing the recognizable spout.
- **GreenhouseMobile**:
  - **Version 7**: Defined a detailed `structure` including `wheel_radius`, `wheel_width`, `num_windows`, `door_width`, `door_height`, and `roof_type`.
  - **Version 9**: The `structure` in `movie_config.json` is reduced to only `body_length`, `body_width`, and `body_height`. While `greenhouse_mobile.py` uses a local `greenhouse_mobile.json`, the data-driven flexibility via the main config is lost.
- **GardenHose**:
  - **Version 9**: Simplified to a single cone. Version 5 used a dedicated script for more realistic representation.

## 3. Storyline & Narrative Regressions

Version 9's narrative arc is significantly truncated compared to the "Spirits of the Greenhouse" arc established in Version 6 and expanded in Version 7.

- **Missing Beats**:
  - `Rite of Joy`: Missing the spiritual joining of `Radiant_Aura` and the "Spirit Dance".
  - `Blessing`: Missing the interaction where spirits imbue props with glowing essence.
  - `Final Ascent`: Missing the synchronized finale of the full Sylvan Ensemble.
  - `Outro Gather`: Missing the final formation and retreat logic.
  - `Vegetative Groove`: The iconic dance finale from Version 5 is not integrated into the Version 9 storyline beats.
- **Missing Events**:
  - `visibility`: Many visibility transitions (e.g., `hidden_at`, `visible_at`) for secondary characters are absent.
  - `altitude`: Procedural altitude changes for aerial spirits are missing.
  - `emission_pulse`: Dynamic material property animation for props is missing.

## 4. Environment & Procedural Modeling Regressions

Version 9's `ExteriorModeler` (and related environment scripts) fails to implement several key features from Version 7:

- **Missing Features**:
  - **Torches**: Procedural path torches with emission pulses and flame geometry.
  - **Lavender**: Detailed lavender beds with randomized stalk and flower placement.
  - **Statues**: Procedural pillar-top statues (spiritual sentinels) present in Version 7.
  - **Fog**: Support for "Mood Fog" (Volume Scatter) in the environment configuration.
- **Pillars**: Version 7 pillars had complex geometry (base, shaft, capital); Version 9 uses simple cylinders.

## 5. Animation & Interaction Regressions

- **Missing Procedural Tags**:
  - `grasp`: Logic for curling fingers and applying `Child-Of` constraints to props.
  - `bend_down`: Torso pitching for ground-level interaction.
  - `reach_out`: Supportive arm extension.
  - `droop` / `stretch` / `wiggle`: Expressive procedural movements defined in Version 5.
- **Prop Interaction**:
  - The entire system for characters "picking up" and using props (`WaterCan`, `GardenHose`) via dynamic constraints is absent in Version 9's `AnimationHandler`.
- **Facial Detail**:
  - Loss of "teeth" visibility logic and "mole" twitch animations mentioned in Version 5 technical notes.
