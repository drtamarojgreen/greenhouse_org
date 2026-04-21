import bpy
import os
import sys

# prioritize movie/6 and assets_v6 for absolute imports
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

# Prioritize movie/ for style_utilities
MOVIE_DIR = os.path.dirname(V6_DIR)
if MOVIE_DIR not in sys.path: sys.path.insert(0, MOVIE_DIR)

import config
import plant_humanoid_v6
import asset_manager_v6
import director_v6
import camera_rig_v6
import chroma_green_setup
import exterior_setup_v6
import asset_normalization_functions

# Ensure assets_v6 is in path for props_v6
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path:
    sys.path.append(ASSETS_V6_DIR)

from props_v6 import create_water_can_v6, create_garden_hose_v6

def standardize_ensemble_heights():
    """No-op shim."""
    pass

def apply_blender_5_1_compatibility_patches():
    import bpy.types
    if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx") and not hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"):
        bpy.types.IMPORT_SCENE_OT_fbx.files = bpy.props.CollectionProperty(type=bpy.types.OperatorFileListElement)
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx") and not hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_selection"):
        bpy.types.EXPORT_SCENE_OT_fbx.use_selection = bpy.props.BoolProperty(default=True)
    if not hasattr(bpy.data, "grease_pencils_v3"):
        bpy.types.BlendData.grease_pencils_v3 = property(lambda self: [])
    if not hasattr(bpy.types.AnimData, "action_slot"):
        bpy.types.AnimData.action_slot = property(lambda self: True)

def generate_full_scene_v6():
    """Master production assembly."""
    import time
    start_t = time.time()

    am = asset_manager_v6.SylvanEnsembleManager()
    am.ensure_clean_slate()
    
    apply_blender_5_1_compatibility_patches()

    # Render Engine: EEVEE for fast production rendering (~10s/frame)
    # Cycles was causing 15-minute frames due to path-traced transparency and lights.
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    bpy.context.scene.render.use_compositing = False

    # EEVEE quality settings
    eevee = bpy.context.scene.eevee
    if hasattr(eevee, 'taa_render_samples'):
        eevee.taa_render_samples = 64
    if hasattr(eevee, 'use_bloom'):
        eevee.use_bloom = True                # Emissive flame glow
    if hasattr(eevee, 'use_gtao'):
        eevee.use_gtao = True                 # Ambient occlusion for depth
    if hasattr(eevee, 'use_shadows'):
        eevee.use_shadows = True
    # Shadow atlas: only the SUN needs high-res shadows; cube maps kept small
    if hasattr(eevee, 'shadow_cube_pool_size'):
        eevee.shadow_cube_pool_size  = '512'  # Point/spot shadow resolution
    if hasattr(eevee, 'shadow_cascade_size'):
        eevee.shadow_cascade_size    = '1024' # Sun shadow resolution


    # Set Color Management to a neutral standard
    bpy.context.scene.render.image_settings.color_mode = 'RGBA' # Ensure RGBA output
    bpy.context.scene.display_settings.display_device = 'sRGB'
    bpy.context.scene.view_settings.view_transform = 'Standard'
    bpy.context.scene.view_settings.look = 'None'
    bpy.context.scene.view_settings.exposure = 0.0
    bpy.context.scene.view_settings.gamma = 1.0

    # 3. Environment & Cinematography
    chroma_green_setup.setup_chroma_green_backdrop()
    exterior_setup_v6.setup_exterior_world()

    # Ensure assets collection exists before creating procedural characters
    if config.COLL_ASSETS not in bpy.data.collections:
        assets_coll = bpy.data.collections.new(config.COLL_ASSETS)
        bpy.context.scene.collection.children.link(assets_coll)

    plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS)
    plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_ARBOR, config.CHAR_ARBOR_POS)

    # 2b. Prop Generation
    # Position props on the ground between the characters
    create_water_can_v6("WaterCan", (0.0, -0.4, 0.0))
    create_garden_hose_v6("GardenHose", (0.0, 0.4, 0.0))

    am.link_ensemble()
    am.renormalize_objects()

    dv6 = director_v6.SylvanDirector()
    dv6.setup_cinematics() # Build standard 3-camera rig
    dv6.position_protagonists()
    dv6.compose_ensemble()

    # Force dependency graph update after character movement but before path creation
    bpy.context.view_layer.update()

    dv6.setup_camera_paths() # Build dynamic paths for Act IV

    # Trigger character animations
    dv6.apply_scene_animations()

    # Setup production lighting for all characters
    # Force dependency graph update so world-space locations are accurate for lighting (Point 142)
    bpy.context.view_layer.update()

    # Filter to main bodies or rigs to avoid constraint spam on sub-props
    all_subjects = [o for o in bpy.data.collections[config.COLL_ASSETS].objects
                    if (o.type == 'MESH' and "Body" in o.name) or o.type == 'ARMATURE']
    plant_humanoid_v6.setup_production_lighting(all_subjects)

    bpy.context.view_layer.update()

    # --- Shadow buffer audit ---
    # Only the sun light needs to cast shadows. Disable shadow casting on all
    # other lights (ensemble rim/key/leg lights, any residual point lights)
    # to keep the scene well under EEVEE's 2048-slot shadow buffer limit.
    shadow_kept = 0
    shadow_off  = 0
    for light in bpy.data.lights:
        if light.type == 'SUN':
            light.use_shadow = True
            shadow_kept += 1
        else:
            light.use_shadow = False
            shadow_off += 1
    print(f"Shadow audit: {shadow_kept} SUN light(s) casting shadows, "
          f"{shadow_off} other light(s) shadow-disabled.")

    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()
