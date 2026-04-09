import bpy
import os
import sys
import math

# Path logic to find assets_v5
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.append(SCRIPT_DIR)

# Ensure plant_humanoid_v5 can find its own dependencies (like style_utilities)
# which is located in MOVIE_ROOT (two levels up from assets_v5, one level up from SCRIPT_DIR)
# /home/tamarojgreen/development/LLM/greenhouse_org/scripts
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(SCRIPT_DIR)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

from assets_v5.plant_humanoid_v5 import create_plant_humanoid_v5

def setup_render_test():
    # Clear scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Create character
    arm_obj = create_plant_humanoid_v5("TestChar", (0, 0, 0))
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.object.mode_set(mode='POSE')
    
    arm_l = arm_obj.pose.bones.get("Arm.L")
    arm_r = arm_obj.pose.bones.get("Arm.R")
    
    if not arm_l or not arm_r:
        print("ERROR: Arm bones not found!")
        return

    up_val = math.radians(70)
    down_val = math.radians(-40)
    
    # Reset pose and key baseline
    for b in (arm_l, arm_r):
        b.rotation_mode = 'XYZ'
    
    # Frame 1: Up
    arm_l.rotation_euler[0] = up_val
    arm_r.rotation_euler[0] = up_val
    arm_l.keyframe_insert(data_path="rotation_euler", frame=1)
    arm_r.keyframe_insert(data_path="rotation_euler", frame=1)
    
    # Frame 2: Down
    arm_l.rotation_euler[0] = down_val
    arm_r.rotation_euler[0] = down_val
    arm_l.keyframe_insert(data_path="rotation_euler", frame=2)
    arm_r.keyframe_insert(data_path="rotation_euler", frame=2)
    
    # Frame 3: Up
    arm_l.rotation_euler[0] = up_val
    arm_r.rotation_euler[0] = up_val
    arm_l.keyframe_insert(data_path="rotation_euler", frame=3)
    arm_r.keyframe_insert(data_path="rotation_euler", frame=3)
    
    # Switch back to Object Mode before adding camera/light
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # Setup camera (slightly further back and higher to see the "up" arms)
    bpy.ops.object.camera_add(location=(0, -5, 2.0), rotation=(math.radians(80), 0, 0))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    
    # Setup 3-point lighting for visual clarity
    # Key light
    bpy.ops.object.light_add(type='SPOT', location=(3, -4, 3))
    key = bpy.context.active_object
    key.data.energy = 8000
    key.data.spot_size = math.radians(45)
    
    # Fill light
    bpy.ops.object.light_add(type='SPOT', location=(-3, -4, 2))
    fill = bpy.context.active_object
    fill.data.energy = 3000
    fill.data.spot_size = math.radians(60)
    
    # Rim light
    bpy.ops.object.light_add(type='SPOT', location=(0, 4, 3))
    rim = bpy.context.active_object
    rim.data.energy = 12000
    rim.data.spot_size = math.radians(40)
    
    # Point lights at the character
    for light in (key, fill, rim):
        t = light.constraints.new(type='TRACK_TO')
        t.target = arm_obj
        t.track_axis = 'TRACK_NEGATIVE_Z'
        t.up_axis = 'UP_Y'
    
    # Render settings
    bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    bpy.context.scene.render.resolution_x = 640
    bpy.context.scene.render.resolution_y = 360
    
    output_dir = os.path.join(SCRIPT_DIR, "renders", "arm_test")
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Starting render of test frames to {output_dir}...")
    
    for f in (1, 2, 3):
        bpy.context.scene.frame_set(f)
        filepath = os.path.join(output_dir, f"frame_{f:04d}.png")
        bpy.context.scene.render.filepath = filepath
        bpy.ops.render.render(write_still=True)
        print(f"Rendered frame {f} to {filepath}")

if __name__ == "__main__":
    setup_render_test()
