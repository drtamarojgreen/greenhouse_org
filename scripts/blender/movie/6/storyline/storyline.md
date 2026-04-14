# Movie v6: The Spirits of the Greenhouse

## Storyline: Act IV — The Verdant Presence

In the wake of the "Vegetative Groove," the Greenhouse undergoes a metaphysical shift. The air becomes thick with bioluminescent spores, and from the deep foliage of the oldest trees, two legendary entities emerge: **Sylvan_Majesty** and **Radiant_Aura**. They are here to witness the horticultural triumph of Herbaceous and Arbor.

### Act IV Beats:
1.  **The Arrival** (Frames 0-600): Bioluminescent fog fills the greenhouse. **Sylvan_Majesty** manifests near the central pillar.
2.  **The Rite of Joy** (Frames 600-1800): **Radiant_Aura** joins, performing a high-altitude "Spirit Dance" above the protagonists.
3.  **The Blessing** (Frames 1800-3000): The spirits interact with the `WaterCan` and `GardenHose`, imbuing them with glowing essence.
4.  **Final Ascent** (Frames 3000-4200): All characters, including the full **Sylvan Ensemble**, perform a synchronized finale before the spirits fade back into the emerald glow.

### Character Dynamics: The "Great Spore Tag"
While Scene 6 is a witness to progress, the internal cognitive dynamics are represented by playful, G-rated interactions between the "Protagonist" thoughts (Herbaceous and Arbor) and "Antagonist" distractions (The Shadow Spirits).

#### The Playful Conflict (Rated G):
- **Bouncing Barbs**: Instead of mechanical combat, characters engage in "Spore Tag." Antagonists like **Shadow_Weaver** might toss "Gloom Puffs" (soft, slow-moving dark clouds) that represent minor anxieties. Protagonists dodge these with rhythmic, dance-like motions, turning the "conflict" into a display of cognitive flexibility.
- **The Tickle Tussle**: When spirits get close, they perform "Leaf Tickles" or "Spore Dusting." If a protagonist is "hit," they simply glow a brighter shade of purple or green, symbolizing the absorption and regulation of the distraction rather than defeat.
- **Horticultural Pranks**: A Sylvan spirit might playfully pull a `GardenHose` to spray glowing "Wisdom Water," or **Emerald_Sentinel** might stand in a way that "occludes" a target plant, forcing the protagonists to find a new perspective (camera angle shift).
- **The Resolution**: By Frame 3600, all conflict transforms into a unified glow. The "Antagonists" are not banished but integrated into the ecosystem, symbolizing the acceptance and self-regulation of all mental states.

---

## Technical Implementation Plan (Movie v6)

### 1. Phase A: Asset Extraction & Standardization
- **Extraction Protocol**: Utilize `scripts/blender/movie/6/a/extract_ensemble.py` to decouple the Sylvan Ensemble from the source `.blend` files.
- **Output Format**: Standalone FBX files in `scripts/blender/movie/6/assets/` named by their user-friendly IDs:
    - `Sylvan_Majesty.fbx`
    - `Radiant_Aura.fbx`
    - `Phoenix_Herald.fbx`
    - (etc.)
- **Texture Policy**: All textures extracted to the same directory for relative-path portability.

### 2. Mesh Optimization (Vertex Reduction)
The Spirit assets are historically high-poly. We will utilize the diagnostic toolset to ensure project performance.
- **Tools**:
    - `scripts/blender/diagnostics/auto_decimate.py`
    - `scripts/blender/diagnostics/optimize_mesh.py`
- **Execution Plan**:
    1.  **Discovery**: Run `find_high_poly.py` to identify the most expensive Spirit meshes.
    2.  **Decimation**: Apply `auto_decimate.py` to target `.blend` files in the Equipment directory with a ratio of `0.5` (50% reduction).
    3.  **Baking**: Optimize textures using `optimize_textures.py` to downscale 4K textures to 2K for faster EEVEE rendering.

### 3. Rigging & Animation Mapping
The spirits use **Mixamo-standard armatures** (`mixamorig:` nomenclature), as confirmed by our inspection of `MHD2_animation133.blend`.
- **Bone Mapping Strategy**:
    - Our `animation_library_v5` calls standard names: `Head`, `Torso`, `Hand.L`, `Hand.R`.
    - **Mapping Table**:
        - `Head` -> `mixamorig:Head`
        - `Torso` -> `mixamorig:Spine2`
        - `Hand.L` -> `mixamorig:LeftHand`
        - `Hand.R` -> `mixamorig:RightHand`
        - `Leg.L` -> `mixamorig:LeftUpLeg`
        - `Leg.R` -> `mixamorig:RightUpLeg`
- **Animation Reuse**: 
    - Verify that `apply_nod`, `apply_shake_head`, and `apply_dance` work on the spirits' bone hierarchies by adding a `BONE_NAME_MAP` to `animation_library_v6.py`.
- **Integrated Actions**:
    - We will also leverage the **100+ native actions** found in `MHD2` and `MHD` blend files for ambient spirit movements.

### 4. Scene Integration
- **[NEW] `v6/generate_scene6.py`**:
    - Inherit environment from Scene 5.
    - Add `Volume Scatter` for "Mood Fog" using `style.animate_mood_fog`.
    - Position spirits at `(5, 5, 0)` and `(-5, 5, 2)` respectively.

### 5. Verification Plan
- **Diagnostic Suite**: Add `test_v6_spirit_integrity.py` to verify:
    - Vertex counts are below the threshold after decimation.
    - Animation keys are correctly applied to the new armatures.
    - Textures are correctly loaded from the external path.
