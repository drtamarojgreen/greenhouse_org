
import bpy
import os
import sys
import math

# --- SCRIPT SETUP ---
# To allow Blender to find our custom modules (camera_animations.py, visual_effects.py),
# we add the directory containing this script to Python's path.
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

# Import our custom animation and effects modules
try:
    import camera_animations as cam_anim
    import visual_effects as vfx
    print("Successfully imported custom modules.")
except ImportError as e:
    print(f"Error: Could not import custom modules: {e}")
    print("Please ensure 'camera_animations.py' and 'visual_effects.py' are in the same directory as this script.")
    # Stop the script if modules are missing
    bpy.ops.wm.quit_blender()

# --- SCENE MANAGEMENT ---

def clean_scene():
    """
    Deletes all objects in the current scene to start fresh.
    """
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    print("Scene cleaned.")

def setup_scene(fbx_path):
    """
    Sets up the basic scene by loading the model, creating a camera, and a light source.

    :param fbx_path: Path to the .fbx model file.
    :return: The imported model object and the camera object.
    """
    # Import the FBX model, deselecting everything first
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    model = bpy.context.selected_objects[0]
    model.name = "BrainModel"
    print(f"Loaded model: {model.name}")

    # Center the model's geometry and position at the world origin
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    model.location = (0, 0, 0)

    # Create and configure the camera
    bpy.ops.object.camera_add(location=(0, -12, 2))
    camera = bpy.context.active_object
    camera.name = "SceneCamera"

    # Create and configure a light source
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    light = bpy.context.active_object
    light.name = "SceneLight"
    light.data.energy = 3.0

    # Make the camera track the model
    cam_anim.setup_camera_focus(camera, model)

    return model, camera

def configure_render_settings(output_folder, duration_frames, file_format='PNG'):
    """
    Configures the global render settings for the scene.

    :param output_folder: The subfolder name for the rendered files.
    :param duration_frames: The total number of frames to render.
    :param file_format: The output file format ('PNG' for sequence, 'FFMPEG' for video).
    """
    scene = bpy.context.scene

    # Use Eevee for faster rendering and effects like bloom
    scene.render.engine = 'BLENDER_EEVEE'

    # Set output resolution and frame rate
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.fps = 24

    # Set animation length
    scene.frame_start = 1
    scene.frame_end = duration_frames

    # Set output path
    output_dir = os.path.join(script_dir, "render_outputs", output_folder)
    scene.render.filepath = output_dir

    # Set output format
    scene.render.image_settings.file_format = file_format
    if file_format == 'FFMPEG':
        scene.render.image_settings.color_mode = 'RGB'
        scene.render.ffmpeg.format = "MPEG4"
        scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# --- RENDER JOBS ---

def render_scene(job_name):
    """
    Renders the currently configured animation.

    :param job_name: A descriptive name for the render job for logging.
    """
    output_path = bpy.context.scene.render.filepath
    print(f"--- Starting Render Job: {job_name} ---")
    print(f"Outputting {bpy.context.scene.frame_end} frames to: {output_path}")
    bpy.ops.render.render(animation=True)
    print(f"--- Finished Render Job: {job_name} ---")

def run_all_jobs():
    """
    Executes a sequence of predefined render jobs.
    """
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    if not os.path.exists(base_fbx_path):
        print(f"CRITICAL ERROR: brain.fbx not found at {base_fbx_path}")
        return

    # JOB 1: Turntable with Procedural Texture
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    vfx.apply_procedural_texture(model)
    duration = 120
    cam_anim.create_turntable_animation(camera, model, duration)
    configure_render_settings("turntable_procedural", duration, file_format='FFMPEG')
    render_scene("Turntable Procedural")

    # JOB 2: Dolly Zoom with Glowing Material
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    vfx.apply_glowing_material(model, color=(0.1, 0.5, 1.0), strength=15)
    duration = 90
    cam_anim.create_dolly_animation(camera, duration, start_distance=-15, end_distance=-6)
    configure_render_settings("zoom_glow", duration, file_format='FFMPEG')
    render_scene("Dolly Zoom Glow")

    # JOB 3: Wireframe Flyover
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    vfx.apply_procedural_texture(model, material_name="BaseGrey") # Add a base material
    vfx.create_wireframe_overlay(model, thickness=0.015)
    duration = 150
    cam_anim.create_pitch_animation(camera, duration, angle_degrees=15)
    configure_render_settings("wireframe_flyover", duration, file_format='FFMPEG')
    render_scene("Wireframe Flyover")

    print("\n--- All Render Jobs Complete ---")

# --- EXECUTION ---

if __name__ == "__main__":
    # This line executes the entire suite of rendering jobs.
    # To run this script:
    # 1. Open Blender.
    # 2. Go to the "Scripting" workspace.
    # 3. Click "Open" and load this 'render_suite.py' file.
    # 4. Ensure 'brain.fbx', 'camera_animations.py', and 'visual_effects.py' are in the same directory.
    # 5. Click the "Run Script" button (play icon).
    run_all_jobs()
