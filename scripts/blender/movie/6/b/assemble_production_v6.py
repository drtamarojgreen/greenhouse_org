import bpy
import os
import sys
import math

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(V6_DIR)
import config

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

            if "target" in data:
                import mathutils
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
            elif "rot" in data:
                cam.rotation_euler = data["rot"]

            if cam_name == "WIDE":
                scene.camera = cam

            if "Static" not in cam_name:
                setup_camera_path(cam)

def setup_camera_path(cam_obj):
    """Creates a Bezier curve and constrains the camera to it."""
    bpy.ops.curve.primitive_bezier_curve_add(radius=5.0)
    curve = bpy.context.active_object
    curve.name = f"Path_{cam_obj.name}"

    con = cam_obj.constraints.new(type='FOLLOW_PATH')
    con.target = curve
    con.use_curve_follow = True # Orient camera along the curve

    # Animate the path to make the camera move along it
    # This operator adds keyframes to the constraint's offset_factor
    bpy.context.view_layer.objects.active = cam_obj # Make camera active for the operator
    bpy.ops.constraint.followpath_path_animate(constraint=con.name, owner='OBJECT')

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
            bpy.ops.mesh.primitive_plane_add(size=1000, location=data["pos"])
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

    # Blender 5.1/5.0 internal bug: io_scene_fbx looks for 'use_space_transform'
    # and 'files' even if they are missing from RNA.
    def _patch_fbx_operators():
        import bpy
        try: bpy.ops.preferences.addon_enable(module="io_scene_fbx")
        except: pass
        from bpy.props import BoolProperty, CollectionProperty
        import io_scene_fbx
        target_classes = set()
        for op_id in ["EXPORT_SCENE_OT_fbx", "IMPORT_SCENE_OT_fbx"]:
            if hasattr(bpy.types, op_id): target_classes.add(getattr(bpy.types, op_id))
        import inspect
        for name, obj in inspect.getmembers(io_scene_fbx):
            if inspect.ismodule(obj):
                for sub_name, sub_obj in inspect.getmembers(obj):
                    if inspect.isclass(sub_obj) and ("EXPORT" in sub_name or "IMPORT" in sub_name) and "FBX" in sub_name:
                        target_classes.add(sub_obj)
            elif inspect.isclass(obj) and ("EXPORT" in name or "IMPORT" in name) and "FBX" in name:
                target_classes.add(obj)
        for cls in target_classes:
            cname = cls.__name__.upper()
            if "EXPORT" in cname and not hasattr(cls, "use_space_transform"):
                setattr(cls, "use_space_transform", BoolProperty(name="Use Space Transform", default=False))
            if "IMPORT" in cname and not hasattr(cls, "files"):
                setattr(cls, "files", CollectionProperty(type=bpy.types.OperatorFileListElement))
        print("  DEBUG: Comprehensive FBX monkeypatch applied in Phase B.")

    try: _patch_fbx_operators()
    except Exception as e: print(f"  WARNING: Monkeypatch failed in Phase B: {e}")

    for file in os.listdir(asset_dir):
        if file.endswith(".fbx"):
            path = os.path.join(asset_dir, file)

            # Capture objects before import
            pre_import = set(bpy.data.objects.keys())

            # Ensure filepath is absolute
            abs_path = os.path.abspath(path)

            try:
                bpy.ops.import_scene.fbx(filepath=abs_path)
            except Exception as e:
                print(f"  ERROR: FBX Import failed for {file}: {e}")
                continue

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
