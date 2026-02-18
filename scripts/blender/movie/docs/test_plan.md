# GreenhouseMD Silent Movie: Pre-Render Test Plan

**Comprehensive verification suite covering all implemented changes — must pass before any render is initiated.**

## Document Overview

### Scope
This document covers all changes discussed and designed across the full development session: Blender 5.0 material fixes, camera system overhaul, narrative choreography, lighting redesign, environment buildout, weather system, and test suite gaps identified in prior audit rounds.

### How to Use
Execute tests in section order. Sections 1–3 are run headless via Blender CLI. Sections 4–9 require a Blender session with the full movie loaded. Mark each row Pass or Fail. Do not proceed to render until all **CRITICAL** rows pass.

### Test Counts by Method
- **AUTOMATED**: Run via `run_blender_tests.py`, no human judgment needed.
- **SEMI-AUTO**: Script produces output; human checks the output.
- **MANUAL**: Visual inspection inside Blender viewport or rendered still.

### Critical Test Policy
Rows marked **CRITICAL** represent gate conditions. A single **CRITICAL** failure blocks all rendering regardless of other results. These map to issues that would produce an unrecoverable output artefact.

---

## Section 1 — Blender 5.0 Material Compatibility
*Verify every material fix lands correctly before any geometry is evaluated.*  
**Run command:** `blender --background --python tests/test_blender_5_0_features.py`

### 1.1 ShaderNodeMixRGB Replacement
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 1.1.1 | **CRITICAL**: MixRGB → style.create_mix_node in bark material | Open `PlantMat_Herbaceous` node tree. Confirm no `ShaderNodeMixRGB` nodes present. | Zero `ShaderNodeMixRGB` nodes; `ShaderNodeMix` nodes present with correct blend_type | AUTOMATED | ☐ Pass ☐ Fail |
| 1.1.2 | MixRGB → style.create_mix_node in leaf material | Open `LeafMat_Herbaceous` node tree. Confirm no `ShaderNodeMixRGB` nodes. | Zero `ShaderNodeMixRGB` nodes in leaf material | AUTOMATED | ☐ Pass ☐ Fail |
| 1.1.3 | MixRGB → style.create_mix_node in marble floor | Check `CheckeredMarble` material node tree for legacy `MixRGB` nodes. | No `ShaderNodeMixRGB`; mix node output correctly wired to Base Color | AUTOMATED | ☐ Pass ☐ Fail |
| 1.1.4 | MixRGB → style.create_mix_node in greenhouse iron | Check `GH_Iron` material node tree. | No `ShaderNodeMixRGB`; overlay blend correctly applied to iron base | AUTOMATED | ☐ Pass ☐ Fail |
| 1.1.5 | `get_mix_sockets` returns correct socket tuple | Call `style.get_mix_sockets()` on a freshly created mix node. Assert tuple length is 3. | Returns (Factor, A/Input1, B/Input2) without `AttributeError` | AUTOMATED | ☐ Pass ☐ Fail |

### 1.2 Transparency (blend_method) Fix
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 1.2.1 | **CRITICAL**: Eye materials use surface_render_method on Blender 5.0 | Inspect `mat_gnome_eye` and `EyeMat_Herbaceous`. Check for `surface_render_method` attribute when running on 5.0. | `surface_render_method = 'BLENDED'`; no `mat.blend_method = 'BLEND'` call present on 5.0 builds | AUTOMATED | ☐ Pass ☐ Fail |
| 1.2.2 | Dust particle material transparency | Check `DustMat` material. Confirm version-safe transparency setter was used. | Material renders as semi-transparent; no opaque black particles visible | SEMI-AUTO | ☐ Pass ☐ Fail |
| 1.2.3 | Greenhouse glass transparency | Check `GH_Glass` material. Confirm Alpha=1.0 and Transmission socket set via style helper. | Glass pane visible as transparent; exterior visible through glass in render still | MANUAL | ☐ Pass ☐ Fail |
| 1.2.4 | Rain drop material transparency | Check `RainMat` Alpha=0.15 and `surface_render_method` set correctly. | Rain particles visible as translucent streaks, not opaque white rods | MANUAL | ☐ Pass ☐ Fail |

### 1.3 Color Ramp elements.clear() Fix
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 1.3.1 | **CRITICAL**: `create_noise_based_material` avoids `.clear()` crash | Call `style.create_noise_based_material()` with 3 color stops. Confirm no `RuntimeError`. | Material created successfully; color ramp has exactly 3 elements at correct positions | AUTOMATED | ☐ Pass ☐ Fail |
| 1.3.2 | Wood material color ramp integrity | Inspect `PedestalMat` and `IslandMat` node trees. Check color ramp element count. | Color ramp has 2 valid elements; no index-out-of-range errors in console | AUTOMATED | ☐ Pass ☐ Fail |
| 1.3.3 | Pillar material color ramp integrity | Check `PillarMat_StoicPillar` color ramp. Confirm elements are within [0,1] position range. | Both ramp stops at valid positions; green rune color visible on pillar render | MANUAL | ☐ Pass ☐ Fail |

### 1.4 Roughness Socket Type Coercion Fix
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 1.4.1 | Leaf fuzz uses RGB-to-BW node before Roughness | Inspect `LeafMat` node tree. Confirm `ShaderNodeRGBToBW` exists between fuzz ramp and Roughness input. | `RGBToBW` node present; Val output wired to Roughness; no type mismatch warning in console | AUTOMATED | ☐ Pass ☐ Fail |
| 1.4.2 | Leaf material renders with visible surface texture | Render still at frame 501. Inspect leaf surfaces on Herbaceous head. | Leaf surfaces show fuzz variation in roughness; not uniformly matte or uniformly glossy | MANUAL | ☐ Pass ☐ Fail |

### 1.5 Emission Socket Naming Fix
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 1.5.1 | **CRITICAL**: Eye emission uses `style.set_principled_socket` | Search `gnome_antagonist.py` and `plant_humanoid.py` for direct Emission Color input access. Should be zero. | All emission assignments routed through `style.set_principled_socket()`; no `KeyError` in console | AUTOMATED | ☐ Pass ☐ Fail |
| 1.5.2 | Gnome eyes glow red at runtime | Load scene, jump to frame 2200, render still. Check gnome eye spheres. | Both gnome eyes emit red; emission strength >5.0 confirmed in material inspector | MANUAL | ☐ Pass ☐ Fail |
| 1.5.3 | Plant eyes emit correct species color | Render frame 800. Check Herbaceous and Arbor eye emission colors. | Herbaceous eyes warm white, Arbor eyes blue-white; no black eye spheres | MANUAL | ☐ Pass ☐ Fail |

### 1.6 Curve-to-Mesh Join Race Condition Fix
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 1.6.1 | **CRITICAL**: All arm/leg curves converted before `join()` | After `load_assets()`, query object types of `Herbaceous_Arm_L/R` and `Leg_L/R`. | All four objects report `type='MESH'`; no `CURVE` type objects in character hierarchy | AUTOMATED | ☐ Pass ☐ Fail |
| 1.6.2 | Torso is active object during join | Inspect `create_plant_humanoid()` join logic. Confirm `bpy.context.view_layer.objects.active` is torso. | Active object is torso (MESH) at join time; no 'active object not in selection' error | AUTOMATED | ☐ Pass ☐ Fail |
| 1.6.3 | Character arms visible after join | Render frame 800. Confirm both arm curves are visible as solid meshes. | Arms and legs render as solid green vine meshes; no missing limbs | MANUAL | ☐ Pass ☐ Fail |

---

## Section 2 — Camera System
*Zoom-out fly-ins, closeups, drone shots, and retreat choreography.*

### 2.1 Drone Shots
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 2.1.1 | Opening drone exists (frames 101–180) | Read camera location keyframe at frame 101 and 180. Check Z altitude. | Frame 101: `cam.z >= 60`. Frame 180: `cam.z <= 20`. Smooth bezier interpolation. | AUTOMATED | ☐ Pass ☐ Fail |
| 2.1.2 | Garden drone exists (frames 401–480) | Read camera location at frames 401 and 480. Confirm lateral sweep at altitude. | Camera `Z >= 50` at frame 401; X or Y changes by `>= 80` units across sweep | AUTOMATED | ☐ Pass ☐ Fail |
| 2.1.3 | Sanctuary drone exists (frames 3901–3960) | Read camera keyframes in range 3901–3960. | `Z >= 60` at frame 3901; descends to `Z <= 15` by frame 4050 | AUTOMATED | ☐ Pass ☐ Fail |
| 2.1.4 | Victory drone after retreat (frames 14200–14400) | Read camera keyframes in range 14200–14400. | `Z >= 70`; camera sweeps laterally; both characters visible | AUTOMATED | ☐ Pass ☐ Fail |
| 2.1.5 | Drone shots use BEZIER/EASE_IN_OUT | Check fcurve interpolation type at drone boundary keyframes. | All drone boundary keyframes have `interpolation='BEZIER'` and `easing='EASE_IN_OUT'` | AUTOMATED | ☐ Pass ☐ Fail |
| 2.1.6 | **CRITICAL**: Camera `clip_end >= 500` for drone altitude | Read `scene.camera.data.clip_end` after `setup_engine()`. | `clip_end >= 500.0`; no geometry clipping visible in altitude renders | AUTOMATED | ☐ Pass ☐ Fail |
| 2.1.7 | Visual review: drone reveals greenhouse roof | Render stills at 101, 130, 160, 180. Review sequence. | Greenhouse roof, surrounding garden beds, and gravel path all visible from above | MANUAL | ☐ Pass ☐ Fail |
| 2.1.8 | Visual review: drone descend lands correctly | Render frames 180–200 as sequence. Review descent path. | Camera descends smoothly into greenhouse entrance; no clipping through walls | MANUAL | ☐ Pass ☐ Fail |

### 2.2 Zoom-Out / Fly-In Shots
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 2.2.1 | Garden fly-in distance spans >= 40 units Y | Compute Y distance between camera at frame 401 and frame 550. | Absolute Y delta `>= 40`; represents meaningful spatial approach | AUTOMATED | ☐ Pass ☐ Fail |
| 2.2.2 | Interaction sequence opens with wide shot | Read camera location at frame 4501. | Camera `Y <= -60` or distance from origin `>= 80`; characters appear small | AUTOMATED | ☐ Pass ☐ Fail |
| 2.2.3 | Fly-in arrives at medium shot by frame 5000 | Read camera location at frame 5000. | Camera distance from origin `<= 20`; characters fill ~50% of frame height | AUTOMATED | ☐ Pass ☐ Fail |
| 2.2.4 | Visual review: fly-in feels cinematic | Play back frames 401–550 in viewport. Observe motion quality. | Smooth deceleration on arrival; no robotic constant-speed movement | MANUAL | ☐ Pass ☐ Fail |

### 2.3 Dialogue Closeup Shots
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 2.3.1 | Closeup keyframes exist in scene 16 (9501–10200) | Count camera keyframes between 9501 and 10200. Must be `>= 4`. | At least 4 distinct camera positions; shot/reverse-shot pattern present | AUTOMATED | ☐ Pass ☐ Fail |
| 2.3.2 | Closeup camera distance to character <= 4 units | Find minimum camera-to-character distance across frames 9525–10100. | Min distance `<= 4.0`; face fills significant frame area | AUTOMATED | ☐ Pass ☐ Fail |
| 2.3.3 | Closeup keyframes cover all 7 dialogue scenes | Check that camera keyframe count in each scene (16–22) is `>= 4`. | Each scene 16–22 has `>= 4` camera keyframes; no frozen dead zones | AUTOMATED | ☐ Pass ☐ Fail |
| 2.3.4 | Shot/reverse-shot alternates between characters | For scene 16: compare camera X at frame 9525 vs 9830. | X changes sign (negative = Herbaceous, positive = Arbor); alternation confirmed | AUTOMATED | ☐ Pass ☐ Fail |
| 2.3.5 | Gnome closeup during scene 18 shows gnome | Render frame 11200. Check gnome presence in frame. | Gnome occupies `>= 30%` of frame height; expression visible | MANUAL | ☐ Pass ☐ Fail |
| 2.3.6 | **CRITICAL**: No camera keyframe gaps > 2000 frames | Scan all camera keyframes. Report maximum gap between consecutive keys. | No gap `> 2000` frames anywhere on timeline; 9501–14500 gap is closed | AUTOMATED | ☐ Pass ☐ Fail |

### 2.4 Credits & Intertitle Camera Fixes
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 2.4.1 | Credits text rotation is -90 degrees on X | Read `CreditsText.rotation_euler[0]` after scene 12 `setup_scene()`. | `rotation_euler[0] == -pi/2` (~ -1.5708); not +pi/2 | AUTOMATED | ☐ Pass ☐ Fail |
| 2.4.2 | Credits scroll upward on screen | Read `CreditsText` location Z at frame 14501 and 15000. | `Z(15000) > Z(14501)`; text moves upward toward positive Z | AUTOMATED | ☐ Pass ☐ Fail |
| 2.4.3 | Branding text not obscured by geometry | Render frame 50. Inspect whether `GreenhouseMD` text is fully visible. | Title readable against dark background; no greenhouse wall intersection | MANUAL | ☐ Pass ☐ Fail |
| 2.4.4 | Greenhouse hidden during branding (1–100) | Check `Greenhouse_Structure.hide_render` at frame 1 and 101. | `hide_render=True` at frame 1; `hide_render=False` at frame 101 | AUTOMATED | ☐ Pass ☐ Fail |

---

## Section 3 — Narrative Choreography
*Power reversal, plant advance, gnome retreat, and spatial separation.*

### 3.1 Gnome Starting Position for Dialogue Block
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 3.1.1 | Gnome location keyframed at scene 18 start | Check gnome location keyframe at frame 10901. | Keyframe exists; location approximately (3, 3, 0) — facing plants | AUTOMATED | ☐ Pass ☐ Fail |
| 3.1.2 | Gnome rotation faces plant characters | Read `gnome.rotation_euler[2]` at frame 10901. | Z rotation ~ 225° (3.93 radians); gnome faces toward origin | AUTOMATED | ☐ Pass ☐ Fail |
| 3.1.3 | Gnome scale reset to 0.6 at scene 18 start | Read `gnome.scale` at frame 10901. | `Scale = (0.6, 0.6, 0.6)`; no lingering scale distortion | AUTOMATED | ☐ Pass ☐ Fail |

### 3.2 Plant Advance / Power Assertion
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 3.2.1 | Herbaceous moves toward gnome (scenes 18–19) | Compare Herbaceous `location.y` at frame 10901 vs 11600. | Y increases from ~0 to ~2; plant moves toward gnome (3,3) | AUTOMATED | ☐ Pass ☐ Fail |
| 3.2.2 | Arbor flanks from opposite side | Compare Arbor `location.x` at frame 10901 vs 11600. | X moves toward gnome X; flanking approach from different angle | AUTOMATED | ☐ Pass ☐ Fail |
| 3.2.3 | Plant scale increases during power phase | Read plant scale at frame 11500. | `Scale >= (1.15, 1.15, 1.15)`; plants appear larger under pressure | AUTOMATED | ☐ Pass ☐ Fail |
| 3.2.4 | Gnome scale shrinks under plant pressure | Read gnome scale at 11500 vs 10901. | `Scale(11500) < Scale(10901)`; visual diminishment confirmed | AUTOMATED | ☐ Pass ☐ Fail |
| 3.2.5 | Plants return to normal scale after gnome flees | Read plant scale at frame 14300. | Scale returns to `(1.0, 1.0, 1.0)`; dominance was temporary | AUTOMATED | ☐ Pass ☐ Fail |
| 3.2.6 | Visual review: spatial dominance readable | Render frames 11200, 11500, 11800. Review spatial relationship. | Plants clearly closer to gnome; gnome visually smaller; power shift readable | MANUAL | ☐ Pass ☐ Fail |

### 3.3 Gnome Retreat Sequence
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 3.3.1 | Gnome stumble keyframes at scene 22 start | Check `rotation_euler[1]` keyframes between 13701 and 13800. | At least 2 stumbles; Y rotation oscillates between 0 and 15° | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.2 | Gnome turns before sprinting | Read `gnome.rotation_euler[2]` at 13850 vs 14000. | Z rotation changes by ~135°; gnome visibly turns away | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.3 | Gnome sprint covers large distance | Read gnome location at frame 13701+300 vs frame 14450. | Distance `>= 35` units; gnome is clearly off screen by 14450 | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.4 | Sprint uses EASE_IN interpolation | Check gnome location fcurve easing on sprint keyframes (~14001). | `Interpolation=BEZIER`, `easing=EASE_IN`; gnome accelerates away | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.5 | Gnome hidden before credits roll | Read `gnome.hide_render` at frame 14450. | `hide_render = True` at or before 14450; gnome not visible during credits | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.6 | **CRITICAL**: No teleport jumps during retreat | Sample location every 10 frames (13701–14450). Max delta per sample. | No single 10-frame delta `> 10` units; movement is continuous | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.7 | Plant pursuit and victory pose | Read plant location keyframes in range 13701–14400. | Both plants have location keyframes in scene 22; they advance then hold | AUTOMATED | ☐ Pass ☐ Fail |
| 3.3.8 | Visual review: retreat reads as defeat | Render frames 13701, 13900, 14100, 14400. Review narrative. | Gnome clearly fleeing; plants triumphant; story legible without text | MANUAL | ☐ Pass ☐ Fail |

### 3.4 Camera Supports Power Reversal Narrative
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 3.4.1 | Scene 22 camera opens on gnome (favoring) | Read camera location and target at frame 13701. | Camera close to gnome (within 8 units); target at gnome head height | AUTOMATED | ☐ Pass ☐ Fail |
| 3.4.2 | Camera swings to favor plants mid-retreat | Read camera X at frame 13701 vs frame 14000. | X shifts toward plant side; camera perspective now favors protagonists | AUTOMATED | ☐ Pass ☐ Fail |
| 3.4.3 | Wide shot shows gnome tiny, plants prominent | Render frame 14100. Inspect relative size. | Gnome appears smaller than plants; wide shot reinforces power relationship | MANUAL | ☐ Pass ☐ Fail |

---

## Section 4 — Lighting System
*New spotlights, emission fix, and scene-adaptive brightness.*

### 4.1 Emission-as-Fade Bug Fix
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 4.1.1 | **CRITICAL**: `apply_fade_transition` uses `hide_render` | Inspect `style.apply_fade_transition()` source code. | Contains `hide_render` keyframes; no `Emission Strength` manipulation | AUTOMATED | ☐ Pass ☐ Fail |
| 4.1.2 | Garden bush emission is 0 after fade-in | Read `GardenBush_0` material `Emission Strength` at frame 600. | `Emission Strength = 0.0`; material lit by scene lights only | AUTOMATED | ☐ Pass ☐ Fail |
| 4.1.3 | Brain emission stays below 0.5 base | Read brain material `Emission Strength` at frame 300. | Base `<= 0.5`; pulse amplitude `<= 0.4`; no overpowered glow | AUTOMATED | ☐ Pass ☐ Fail |
| 4.1.4 | Characters receive directional light | Render frame 800 with Cycles. Inspect Herbaceous shading. | Clear light and shadow side visible; not flat illumination | MANUAL | ☐ Pass ☐ Fail |

### 4.2 New Character Key Lights
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 4.2.1 | `HerbaceousKeyLight` object exists | Query `bpy.data.objects.get('HerbaceousKeyLight')`. | Object exists; `type=LIGHT`; `data.type='SPOT'`; `energy=15000` | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.2 | `ArborKeyLight` object exists | Query `bpy.data.objects.get('ArborKeyLight')`. | Object exists; `type=LIGHT`; `data.type='SPOT'`; `energy=15000` | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.3 | `GnomeKeyLight` exists with green tint | Query `GnomeKeyLight` data color. | Light exists; color ~ (0.4, 0.8, 0.3) — sickly green | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.4 | `DomeFill` area light exists | Query `bpy.data.objects.get('DomeFill')`. | Object exists; `type=LIGHT`; `data.type='AREA'`; `size >= 15.0` | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.5 | `GroundBounce` area light exists | Query `bpy.data.objects.get('GroundBounce')`. | Object exists; pointing upward; sage green translucent tint | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.6 | Character key lights brighten during dialogue | Read `HerbaceousKeyLight` energy at frame 9550. | `Energy = 25000` during dialogue (~67% increase from base 15000) | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.7 | `GnomeKeyLight` dims progressively (S19–S22) | Read `GnomeKeyLight` energy at 11601, 12301, 13001, 13701. | Decreases: 8000 → 4000 → 1500 → 500 at scene boundaries | AUTOMATED | ☐ Pass ☐ Fail |
| 4.2.8 | Visual review: characters clearly lit | Render frame 9600. Inspect character face lighting. | Features readable; no blown-out emission halo; clear shadows | MANUAL | ☐ Pass ☐ Fail |

---

## Section 5 — Environment & Weather
*Greenhouse interior, exterior garden, rain system, and shrubbery.*

### 5.1 Greenhouse Interior
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 5.1.1 | Potting bench objects created | Count objects with 'PottingBench' in name. | `>= 5` objects present (4 wall benches + 1 back bench) | AUTOMATED | ☐ Pass ☐ Fail |
| 5.1.2 | Display island object exists | Query `bpy.data.objects.get('DisplayIsland')`. | Object exists; scale ~ (2.5, 1.0, 0.4) | AUTOMATED | ☐ Pass ☐ Fail |
| 5.1.3 | Hanging baskets created and attached | Count objects with 'HangingBasket' in name. | `>= 5` baskets; each has a corresponding `BasketWire` object | AUTOMATED | ☐ Pass ☐ Fail |
| 5.1.4 | Potted plants on benches have materials | For each `PottingBench_N_Plant_M`, check material slot count. | Every plant object has `>= 1` material slot; no bare grey meshes | AUTOMATED | ☐ Pass ☐ Fail |
| 5.1.5 | `TerracottaMat` exists with noise color | Check `TerracottaMat` node tree for `ShaderNodeTexNoise`. | Uses noise-based color variation; not flat single color | AUTOMATED | ☐ Pass ☐ Fail |
| 5.1.6 | Visual review: interior looks dressed | Render frame 800 with wide interior shot. Review dressing. | Benches with pots along walls; hanging plants from roof; not empty | MANUAL | ☐ Pass ☐ Fail |

### 5.2 Exterior Garden
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 5.2.1 | Hedge row objects created (count >= 4) | Count objects with 'Hedge' in name. | `>= 4` hedge objects surrounding greenhouse perimeter | AUTOMATED | ☐ Pass ☐ Fail |
| 5.2.2 | Gravel path object exists | Query `bpy.data.objects.get('GravelPath')`. | Object exists; positioned in front of entrance | AUTOMATED | ☐ Pass ☐ Fail |
| 5.2.3 | Exterior garden beds created | Count collections with 'ExteriorBed' in name. | `>= 4` exterior bed collections along front path | AUTOMATED | ☐ Pass ☐ Fail |
| 5.2.4 | `ExteriorGround` plane exists | Query `bpy.data.objects.get('ExteriorGround')`. | Object exists; `size=200`; GrassMat applied with noise variation | AUTOMATED | ☐ Pass ☐ Fail |
| 5.2.5 | Hedge material has displacement | Check one `Hedge` object for `Displace` modifier. | Modifier present; assigned texture creates organic lumpy surface | AUTOMATED | ☐ Pass ☐ Fail |
| 5.2.6 | Visual review: drone reveals exterior | Render frame 120 (opening drone). Review environment. | Hedges, beds, gravel path, and grass ground all visible from altitude | MANUAL | ☐ Pass ☐ Fail |

### 5.3 Rain System
| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 5.3.1 | Rain emitter object exists for shadow scene | Query `bpy.data.objects.get('RainEmitter')`. | Object exists; `hide_render=True`; particle system present | AUTOMATED | ☐ Pass ☐ Fail |
| 5.3.2 | Rain particle system (MEDIUM intensity) | Read settings: count, velocity, render type. | `count=6000`; `render_type='LINE'`; `velocity Z ~= -22` | AUTOMATED | ☐ Pass ☐ Fail |
| 5.3.3 | Rain frame range (1801–2500) | Read particle system `frame_start` and `frame_end`. | `start=1801`; `end=2500`; rain only present during antagonist scenes | AUTOMATED | ☐ Pass ☐ Fail |
| 5.3.4 | Storm emitter exists for retreat scene | Count particle systems with `count >= 15000`. | `>= 1` STORM-intensity system with frame range in scene 22 (13701+) | AUTOMATED | ☐ Pass ☐ Fail |
| 5.3.5 | Rain splash objects created | Count objects with 'RainSplash' in name. | `>= 20` splash ring objects positioned on floor plane | AUTOMATED | ☐ Pass ☐ Fail |
| 5.3.6 | Wet lens compositor effect activates | Read `ChromaticAberration` dispersion at frame 1825. | `Dispersion >= 0.05` inside rain scene; reverts to `<= 0.02` after | AUTOMATED | ☐ Pass ☐ Fail |
| 5.3.7 | Visual review: rain visible on glass | Render frame 2200. Check for rain streak particles. | Rain streaks visible inside; wet lens distortion present; storm aura | MANUAL | ☐ Pass ☐ Fail |

---

## Section 6 — Existing Test Suite Pass Requirements
*All pre-existing tests must continue to pass after new changes.*  
**Run command:** `python3 run_blender_tests.py`

| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 6.1.1 | **test_render_preparedness.py** pass | Run file. Check assets, mats, compositor, etc. | Exit code 0; OVERALL STATUS: ALL TESTS PASSED | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.2 | **test_blender_5_0_features.py** pass | BSDF v2, layered action, FBX patch, Eevee Next, etc. | Exit code 0; all 6 subtests report PASS | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.3 | **test_interaction_scene.py** pass | Frame range, plant/talking anim, staff gesture, etc. | Exit code 0; no assertion errors | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.4 | **test_asset_details.py** pass | Hero hierarchy, procedural textures, visibility keys. | Exit code 0; interaction range present in keys | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.5 | **test_timeline_extension.py** pass | Frame bounds 1–15000, credits 14501–15000, new keys. | Exit code 0; R1–R10 all PASS | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.6 | **test_scene_modules.py** pass | Import, smoke tests, camera/key creation, bounds. | Exit code 0; scenes 16–22 and retreat execute OK | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.7 | **test_mouth_rig.py** pass | Amplitude bounds [0.05–2.5], neutral segments. | Exit code 0; no R21/R23/R26 failures | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.8 | **test_expression_rig.py** pass | Presets, brow limits, eye target constraints. | Exit code 0; GazeTarget constraint valid | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.9 | **test_gnome_retreat.py** pass | Path exists, speed ramp, off-screen state. | Exit code 0; R42/R44/R45/R48 all PASS | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.10 | **test_final_release_gate.py** pass | Full timeline 1–15000, required assets, gate checks. | Exit code 0; R100 PASS printed | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.11 | **test_lighting_integrity.py** pass | Sun/Rim/Fill ratios, volumetric stability. | Exit code 0; no R62/R63/R68/R70 failures | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.12 | **test_mesh_integrity_visibility.py** pass | Mouth clipping, floor penetration, shape key bounds. | Exit code 0; no negative scales, no penetration | AUTOMATED | ☐ Pass ☐ Fail |
| 6.1.13 | **test_render_management.py** pass | Output naming, frame count, chunking logic. | Exit code 0; `render_manager.py` contains logic | AUTOMATED | ☐ Pass ☐ Fail |

---

## Section 7 — Visual QA Render Stills
*Render one still per scene and sign off each frame visually before full render.*  
**Run command:** `bash render_silent_movie.sh` (renders 18 audit stills)

| Frame | Scene | Must See in Frame | Must NOT See | Signed Off |
|-------|-------|-------------------|--------------|------------|
| 50 | Branding (S00) | GreenhouseMD text fully readable; dark background | Wall/Pillar obscuring text; upside-down text | ☐ PASS ☐ FAIL |
| 150 | Intro/Establishing (S01) | Drone view of roof; garden beds; gravel path | Camera inside; missing hedges; pure black ground | ☐ PASS ☐ FAIL |
| 300 | Brain Scene (S02) | Pulsing brain prop; warm point light | Brain blowing out scene; flat emission look | ☐ PASS ☐ FAIL |
| 450 | Garden Wide (S02) | Both characters in frame; garden beds visible | Self-illuminating characters; flat chess floor | ☐ PASS ☐ FAIL |
| 575 | Garden Closeup (S02) | Herbaceous face fills ~40%; leaf hair; eye color | Black eyes; missing arms; uniform lighting | ☐ PASS ☐ FAIL |
| 850 | Socratic (S03) | Both facing each other; thoughts; warm lighting | Gnome visible; Arbor not taller than Herbaceous | ☐ PASS ☐ FAIL |
| 1150 | Exchange (S04) | StoicAnvil; Herbaceous hammering pose; book | Anvil missing; T-pose characters; no props | ☐ PASS ☐ FAIL |
| 1700 | Bridge (S05) | Glowing node spheres; Neuron prop; cyan lighting | Nodes black; flat lighting with no node glow | ☐ PASS ☐ FAIL |
| 2250 | Shadow/Antagonist (S07) | Gnome with glowing orb; rain streaks; desaturated | No rain; bright cheerful lighting; gnome hidden | ☐ PASS ☐ FAIL |
| 2450 | Gnome Closeup (S07/08) | Gnome face closeup; red eyes; green key light | Eyes black; flat lighting; same cam as garden | ☐ PASS ☐ FAIL |
| 2700 | Library (S09) | Book on pedestal; Herbaceous leaning over; wood | Book or pedestal missing; gnome visible | ☐ PASS ☐ FAIL |
| 3650 | Futuristic Lab (S10) | Hologram; lab bench; Herbaceous observing; blue | Lab props missing; warm garden lighting active | ☐ PASS ☐ FAIL |
| 4000 | Sanctuary (S11) | Dense foliage; firefly particles; characters breathing | Sparse environment; invisible flies; fixed pose | ☐ PASS ☐ FAIL |
| 4450 | Finale (S_Finale) | Bright triumphant lighting; flower in bloom; upright | Dark shadow lighting; flower missing/tiny | ☐ PASS ☐ FAIL |
| 9600 | Dialogue Closeup (S16) | Herbaceous tight closeup; mouth anim; rim light | Wide shot; black eyes; flat emission lighting | ☐ PASS ☐ FAIL |
| 11200 | Gnome Reaction (S18) | Gnome medium shot; plants advancing behind; fear | Gnome in same spot as S16; plants invisible | ☐ PASS ☐ FAIL |
| 13900 | Retreat Mid-Sprint (S22) | Gnome small/receding; plants triumphant foreground | Gnome same size as plants; no rain; static pos | ☐ PASS ☐ FAIL |
| 14800 | Credits (S12) | Scrolling white text; vines growing alongside | Upside-down; behind geometry; greenhouse vis | ☐ PASS ☐ FAIL |

---

## Section 8 — Performance & Render Readiness
*Confirm the scene will not crash or stall during a 15,000-frame render.*

| ID | Test Name | What to Verify | Expected Result | Method | Result |
|----|-----------|----------------|-----------------|--------|--------|
| 8.1 | Quality 'test' < 5 mins/frame | Time single frame at `quality='test'`. | Renders in `< 300` seconds on target machine | MANUAL | ☐ Pass ☐ Fail |
| 8.2 | Quality 'final' < 30 mins/frame | Time single frame at `quality='final'`. | Single frame `< 1800s`; full render `< 375 GPU-h` | MANUAL | ☐ Pass ☐ Fail |
| 8.3 | **CRITICAL**: Batching logic | Instantiate `render_range(1, 15000, 'test')`. | 75 subprocess calls (75x200=15000); max chunk 200 | AUTOMATED | ☐ Pass ☐ Fail |
| 8.4 | Deterministic seeds | Read `random_seed` for all particle systems. | All seeds set; renders match across machines | AUTOMATED | ☐ Pass ☐ Fail |
| 8.5 | No orphan data blocks | Count `bpy.data.meshes/mats/curves` with 0 users. | Zero orphans; memory footprint is clean | AUTOMATED | ☐ Pass ☐ Fail |
| 8.6 | Object count within limits | Count total objects in `bpy.context.scene.objects`. | Total objects `< 5000`; no VRAM OOM risk | SEMI-AUTO | ☐ Pass ☐ Fail |
| 8.7 | `audit_renders.py` success | Run against a 100-frame test range. Check logs. | Log files contain no 'ERROR'; stills generated | SEMI-AUTO | ☐ Pass ☐ Fail |
| 8.8 | `stitch_chunks.py` dry-run | Run in dry-run. Confirm ffmpeg string is valid. | Correct glob pattern; no path separator errors | SEMI-AUTO | ☐ Pass ☐ Fail |
| 8.9 | CI workflow passes | Trigger `blender_test.yml`. Check Job results. | All jobs green; no test file import errors | AUTOMATED | ☐ Pass ☐ Fail |
| 8.10 | Memory usage < 12 GB | Monitor peak RSS during 200-frame chunk render. | Peak RSS `< 12 GB`; does not trigger OOM killer | MANUAL | ☐ Pass ☐ Fail |

---

## Section 9 — Final Sign-Off Checklist
*Gate conditions that must all be checked before submitting to render farm.*

| Gate Condition | Confirmed By | Date |
|----------------|--------------|------|
| 1. All **CRITICAL** automated tests pass (exit code 0) | | |
| 2. All 18 visual QA stills reviewed and marked PASS | | |
| 3. Section 3 narrative choreography confirmed readable | | |
| 4. Section 4 lighting: no self-illuminating characters | | |
| 5. Section 5 environment: interior visibly dressed | | |
| 6. Drone shots reviewed at 120, 430, 3925, 14300 | | |
| 7. Dialogue closeups reviewed at 9600, 10600, 11200 | | |
| 8. Credits scroll upward, readable, no obscuration | | |
| 9. Single-frame 'final' quality time & estimate recorded | | |
| 10. Render farm chunk schedule prepared | | |
| 11. Output directory has write permissions on all nodes | | |
| 12. Backup of .blend state saved before submission | | |

---

### Render Authorisation

**Lead Developer Sign-off**  
*I confirm all CRITICAL tests pass and visual stills are approved.*

**Signature:** _________________________________  
**Date:** _________________________________

**Render Farm Job ID**  
*Record the farm job ID here for traceability.*

**Job ID:** _________________________________  
**Nodes:** _________________________________

---
*GreenhouseMD Production Pipeline • Pre-Render Test Plan v1.0 • Generated from scripts/blender/movie/ codebase*
