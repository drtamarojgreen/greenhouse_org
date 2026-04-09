import bpy
import os
import sys
import math

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(V6_DIR)
import config

def setup_cinematic_rig():
    """Step 2: Implementation of WIDE, OTS, and Static camera rigs."""
    cameras = ["WIDE", "OTS1", "OTS2", "OTS_Static_1", "OTS_Static_2"]
    scene = bpy.context.scene
    
    for cam_name in cameras:
        if cam_name not in bpy.data.objects:
            bpy.ops.object.camera_add()
            cam = bpy.context.active_object
            cam.name = cam_name
            
            # Restore v5 Standard: 35mm, Clip End 1000
            cam.data.lens = 35
            cam.data.clip_end = 1000.0
            
            # Ensure WIDE is set as the active scene camera
            if cam_name == "WIDE":
                scene.camera = cam
            
            # Implement Camera Curve Animation (Blender 5 feature)
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
    backdrop_name = "ChromaBackdrop_Wide"
    if backdrop_name not in bpy.data.objects:
        bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 15, 5))
        bg = bpy.context.active_object
        bg.name = backdrop_name
        bg.rotation_euler[0] = math.radians(90)
        
        # Assign Chroma material logic from v5 standards
        mat_name = "ChromaKey_V6"
        mat = bpy.data.materials.get(mat_name) or bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        
        # Clear default nodes for a clean shader setup
        nodes.clear()
        node_output = nodes.new(type='ShaderNodeOutputMaterial')
        bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
        
        # Set Base Color and link BSDF to Output
        bsdf.inputs['Base Color'].default_value = (0.0, 1.0, 0.0, 1.0) # Pure Green
        mat.node_tree.links.new(bsdf.outputs['BSDF'], node_output.inputs['Surface'])
        
        if not bg.data.materials:
            bg.data.materials.append(mat)
        else:
            bg.data.materials[0] = mat


def link_fbx_assets():
    """Step 4: Integrate decoupled FBX assets into the production master."""
    asset_dir = os.path.join(V6_DIR, "assets")
    if not os.path.exists(asset_dir):
        print("WARNING: Asset directory missing. Run Phase A first.")
        return

    for file in os.listdir(asset_dir):
        if file.endswith(".fbx"):
            path = os.path.join(asset_dir, file)
            bpy.ops.import_scene.fbx(filepath=path)
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
