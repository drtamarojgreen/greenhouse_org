import bpy
import os
import sys
import math

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(V6_DIR)
import config

# Monkeypatch for Blender 5.1 FBX operator bugs
if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx"):
    try:
        op_cls = bpy.types.EXPORT_SCENE_OT_fbx
        for prop_name in ["use_space_transform", "apply_unit_scale", "use_selection"]:
            if not hasattr(op_cls, prop_name):
                op_cls.__annotations__[prop_name] = bpy.props.BoolProperty(name=prop_name, default=True if "selection" in prop_name else False)
                setattr(op_cls, prop_name, True if "selection" in prop_name else False)
        print("  INFO: Applied robust monkeypatch for EXPORT_SCENE_OT_fbx")
    except Exception as e:
        print(f"  WARNING: Failed to apply export monkeypatch: {e}")

if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx"):
    try:
        if "files" not in bpy.types.IMPORT_SCENE_OT_fbx.__annotations__:
            bpy.types.IMPORT_SCENE_OT_fbx.__annotations__["files"] = bpy.props.CollectionProperty(
                type=bpy.types.OperatorFileListElement, options={'HIDDEN', 'SKIP_SAVE'})
            print("  INFO: Applied robust monkeypatch for IMPORT_SCENE_OT_fbx.files")
    except Exception as e:
        print(f"  WARNING: Failed to apply import monkeypatch: {e}")

def setup_cinematic_rig():
    """Step 2: Implementation of WIDE, OTS, and Static camera rigs."""
    scene = bpy.context.scene
    coll = bpy.data.collections.get("6b_Environment")

    ots_targets = {
        "WIDE":         {"pos": config.CAM_WIDE_POS, "rot": (math.radians(90), 0, 0), "lens": 35},
        "OTS1":         {"pos": config.CAM_OTS1_POS, "target": config.CHAR_HERBACEOUS_EYE, "lens": 50},
        "OTS2":         {"pos": config.CAM_OTS2_POS, "target": config.CHAR_ARBOR_EYE, "lens": 50},
        "OTS_Static_1": {"pos": config.CAM_OTS1_POS, "target": config.CHAR_HERBACEOUS_EYE, "lens": 50},
        "OTS_Static_2": {"pos": config.CAM_OTS2_POS, "target": config.CHAR_ARBOR_EYE, "lens": 50},
    }

    for cam_name, data in ots_targets.items():
        if cam_name not in bpy.data.objects:
            cam_data = bpy.data.cameras.new(cam_name)
            cam = bpy.data.objects.new(cam_name, cam_data)
            coll.objects.link(cam)

            cam.location = data["pos"]
            cam_data.lens = data["lens"]
            cam_data.clip_end = 2000.0 # Standard Scene 6 visibility

            # Initial rotation
            if "target" in data:
                import mathutils
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
            elif "rot" in data:
                cam.rotation_euler = data["rot"]

            if cam_name == "WIDE":
                scene.camera = cam

            if "Static" not in cam_name:
                # Resolve target object for TRACK_TO
                track_obj = None
                if "OTS1" in cam_name: track_obj = bpy.data.objects.get(config.FOCUS_HERBACEOUS)
                elif "OTS2" in cam_name: track_obj = bpy.data.objects.get(config.FOCUS_ARBOR)
                elif "WIDE" in cam_name: track_obj = bpy.data.objects.get(config.LIGHTING_MIDPOINT)

                setup_camera_path(cam, track_target=track_obj)

def setup_camera_path(cam_obj, track_target=None):
    """Creates a Bezier curve and constrains the camera to it with tracking."""
    bpy.ops.curve.primitive_bezier_curve_add(radius=5.0)
    curve = bpy.context.active_object
    curve.name = f"Path_{cam_obj.name}"

    con_path = cam_obj.constraints.new(type='FOLLOW_PATH')
    con_path.target = curve
    con_path.use_curve_follow = False # TRACK_TO will handle orientation

    if track_target:
        con_track = cam_obj.constraints.new(type='TRACK_TO')
        con_track.target = track_target
        con_track.track_axis = 'TRACK_NEGATIVE_Z'
        con_track.up_axis = 'UP_Y'

    # Animate the path to make the camera move along it
    # This operator adds keyframes to the constraint's offset_factor
    bpy.context.view_layer.objects.active = cam_obj # Make camera active for the operator
    bpy.ops.constraint.followpath_path_animate(constraint=con_path.name, owner='OBJECT')

    print(f"PROD_ASSEMBLY: Curve animation established for {cam_obj.name}")


def setup_environmental_restoration():
    """Step 3: 1:1 restoration of ChromaBackdrop_Wide architecture."""
    import mathutils
    coll = bpy.data.collections.get("6b_Environment")

    backdrops = {
        "ChromaBackdrop_Wide": {"pos": (0, 50, 5),    "cam": (0.0, -8.0, 2.0)},
        "ChromaBackdrop_OTS1": {"pos": (-50, -20, 5), "cam": (4.0, 3.0, 2.8)},
        "ChromaBackdrop_OTS2": {"pos": (50, 20, 5),   "cam": (-4.0, -3.0, 2.8)},
    }

    mat_name = "ChromaKey_V6"
    mat = bpy.data.materials.get(mat_name) or bpy.data.materials.new(name=mat_name)
    mat.use_nodes = True
    # Always clear and rebuild to ensure standards
    mat.node_tree.nodes.clear()
    nodes = mat.node_tree.nodes
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.0, 1.0, 0.0, 1.0)
    mat.node_tree.links.new(bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    for name, data in backdrops.items():
        if name not in bpy.data.objects:
            bpy.ops.mesh.primitive_plane_add(size=100, location=data["pos"])
            bg = bpy.context.active_object
            bg.name = name

            # Remove from scene collection and link to environment collection
            for c in bg.users_collection: c.objects.unlink(bg)
            coll.objects.link(bg)

            vec = mathutils.Vector(data["cam"]) - mathutils.Vector(data["pos"])
            bg.rotation_euler = vec.to_track_quat('Z', 'Y').to_euler()
            bg.data.materials.append(mat)


def link_fbx_assets():
    """Step 4: Integrate decoupled FBX assets into the production master."""
    asset_dir = os.path.join(V6_DIR, "assets")
    if not os.path.exists(asset_dir):
        print("WARNING: Asset directory missing. Run Phase A first.")
        return

    coll = bpy.data.collections.get("6a_Assets")

    for file in os.listdir(asset_dir):
        if file.endswith(".fbx"):
            path = os.path.join(asset_dir, file)

            # Capture objects before import
            pre_import = set(bpy.data.objects.keys())
            bpy.ops.import_scene.fbx(filepath=path)
            post_import = set(bpy.data.objects.keys())

            new_objs = post_import - pre_import
            for obj_name in new_objs:
                obj = bpy.data.objects.get(obj_name)
                if obj:
                    # Link to asset collection
                    for c in list(obj.users_collection): c.objects.unlink(obj)
                    if obj.name not in coll.objects:
                        coll.objects.link(obj)

                    # Ensure all recursive children are also in the collection
                    for child in obj.children_recursive:
                        for c in list(child.users_collection): c.objects.unlink(child)
                        if child.name not in coll.objects:
                            coll.objects.link(child)

            print(f"PROD_ASSEMBLY: Linked {file}")

def initialize_production():
    """Main assembly sequence."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Create Pipeline Collections
    col_6a = bpy.data.collections.new("6a_Assets")
    col_6b = bpy.data.collections.new("6b_Environment")
    bpy.context.scene.collection.children.link(col_6a)
    bpy.context.scene.collection.children.link(col_6b)

    setup_environmental_restoration()
    setup_cinematic_rig()
    link_fbx_assets()

    bpy.context.view_layer.update()

if __name__ == "__main__":
    print("--- STARTING PHASE B: PRODUCTION ASSEMBLY ---")
    initialize_production()
    print("SUCCESS: Scene 6 Production Assembled.")
