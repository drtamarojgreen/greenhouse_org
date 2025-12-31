
import bpy
import os
import sys
import math
import time
from datetime import datetime

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
    import custom_animation
    import neuron_physics
    import shutil
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
    print("--- In setup_scene ---")
    # Import the FBX model, deselecting everything first
    bpy.ops.object.select_all(action='DESELECT')
    print("Deselected all objects.")
    
    print(f"Attempting to import FBX: {fbx_path}")
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    print("FBX import call completed.")

    model = bpy.context.selected_objects[0]
    model.name = "BrainModel"
    print(f"Loaded model: {model.name}")

    # Center the model's geometry and position at the world origin
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    model.location = (0, 0, 0)
    print("Model centered and positioned.")

    # Create and configure the camera
    bpy.ops.object.camera_add(location=(0, -12, 2))
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    bpy.context.scene.camera = camera
    print("Camera created.")

    # Create and configure a light source
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    light = bpy.context.active_object
    light.name = "SceneLight"
    light.data.energy = 3.0
    print("Light created.")

    # Make the camera track the model
    cam_anim.setup_camera_focus(camera, model)
    print("Camera focus set.")
    print("--- Exiting setup_scene ---")

    return model, camera

def configure_render_settings(output_folder, duration_frames, file_format='PNG', engine='WORKBENCH'):
    """
    Configures the global render settings for the scene.

    :param output_folder: The subfolder name for the rendered files.
    :param duration_frames: The total number of frames to render.
    :param file_format: The output file format ('PNG' for sequence, 'FFMPEG' for video).
    """
    scene = bpy.context.scene
    
    # Map engine names to internal identifiers
    engine_map = {
        'WORKBENCH': 'BLENDER_WORKBENCH',
        'EEVEE': 'BLENDER_EEVEE_NEXT',
        'EEVEE_NEXT': 'BLENDER_EEVEE_NEXT',
        'CYCLES': 'CYCLES'
    }
    
    target_engine = engine_map.get(engine.upper(), 'BLENDER_EEVEE_NEXT')
    
    try:
        scene.render.engine = target_engine
    except:
        # Final fallback if EEVEE_NEXT fails
        scene.render.engine = 'BLENDER_WORKBENCH'
    
    # If Workbench is specifically being used
    if scene.render.engine == 'BLENDER_WORKBENCH':
        scene.render.engine = 'BLENDER_WORKBENCH'
        if hasattr(scene.display, "shading"):
            scene.display.shading.light = 'STUDIO'
            scene.display.shading.color_type = 'OBJECT'
            scene.display.shading.show_cavity = True
            scene.display.shading.cavity_type = 'BOTH'
            scene.display.shading.cavity_ridge_factor = 2.0
            scene.display.shading.cavity_valley_factor = 2.0

    # Set output resolution and frame rate
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.fps = 24

    # Set animation length
    scene.frame_start = 1
    scene.frame_end = duration_frames

    # Set output path
    output_temp_dir = os.path.join(script_dir, "render_outputs", output_folder)
    os.makedirs(output_temp_dir, exist_ok=True)
    # Use a fixed name 'render' to avoid frame number padding in multi-frame MKV if possible,
    # though Blender often appends frame ranges (e.g., render0001-0250.mkv).
    scene.render.filepath = os.path.join(output_temp_dir, "render") 

    # Set output format
    scene.render.image_settings.file_format = file_format
    if file_format == 'FFMPEG':
        scene.render.image_settings.color_mode = 'RGB'
    scene.render.ffmpeg.format = "MKV"  # Changed to MKV container
    scene.render.ffmpeg.codec = "H264"      # Using H.264 codec
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

# --- NEW HELPER FUNCTIONS for Region Highlighting ---

def find_object_by_name(name):
    """
    Finds an object in the scene by its exact name.

    :param name: The name of the object to find.
    :return: The Blender object or None if not found.
    """
    if name in bpy.data.objects:
        return bpy.data.objects[name]
    print(f"Warning: Object '{name}' not found in the scene.")
    return None

def apply_highlight_materials(target_object):
    """
    Applies a highlight material to the target object and a dim, transparent
    material to all other mesh objects.
    """
    # Define the highlight material (emissive)
    highlight_mat = bpy.data.materials.new(name="HighlightMaterial")
    highlight_mat.use_nodes = True
    bsdf = highlight_mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = (0.8, 0.05, 0.05, 1)
        elif 'Emission' in bsdf.inputs:
            # Check if it's a color socket
            socket = bsdf.inputs['Emission']
            if hasattr(socket, "default_value"):
                try: socket.default_value = (0.8, 0.05, 0.05, 1)
                except: pass
            
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = 10.0
        
        if 'Base Color' in bsdf.inputs:
            bsdf.inputs['Base Color'].default_value = (1, 0, 0, 1)

    # Define the base material (dim and transparent)
    base_mat = bpy.data.materials.new(name="BaseMaterial")
    base_mat.use_nodes = True
    bsdf_base = base_mat.node_tree.nodes.get('Principled BSDF')
    if bsdf_base:
        bsdf_base.inputs['Base Color'].default_value = (0.2, 0.2, 0.2, 1)
        bsdf_base.inputs['Alpha'].default_value = 0.2
    # Enable transparency
    base_mat.blend_method = 'BLEND'

    # Apply materials to objects
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            if obj == target_object:
                obj.data.materials.append(highlight_mat)
            else:
                obj.data.materials.append(base_mat)

def create_3d_text_label(text_content, target_object):
    """
    Creates and positions a 3D text label near the target object.
    """
    # Create the text object
    bpy.ops.object.text_add(enter_editmode=False, align='WORLD', location=(0, 0, 0))
    text_obj = bpy.context.active_object
    text_obj.data.body = text_content

    # Set text properties (geometry)
    text_obj.data.extrude = 0.02
    text_obj.data.size = 0.5

    # Center the text origin
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')

    # Position the text above the target object
    if target_object:
        target_location = target_object.location
        target_dims = target_object.dimensions
        # Position it slightly above and in front of the target
        text_obj.location = (target_location.x, target_location.y - target_dims.y / 2 - 1, target_location.z + target_dims.z)

    # Add a simple material to the text
    text_mat = bpy.data.materials.new(name="TextMaterial")
    text_mat.use_nodes = True
    bsdf = text_mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = (0.9, 0.9, 0.9, 1)
    text_obj.data.materials.append(text_mat)

    print(f"Created 3D text: '{text_content}'")
    print(f"Created 3D text: '{text_content}'")
    return text_obj

def create_greenhouse_logo():
    """
    Creates a stylized 3D 'Greenhouse' logo in the scene.
    """
    print("Creating Greenhouse logo...")
    # Create the text
    bpy.ops.object.text_add(location=(8, 0, 8))
    logo = bpy.context.active_object
    logo.name = "GreenhouseLogo"
    logo.data.body = "GREENHOUSE"
    logo.data.extrude = 0.1
    logo.data.bevel_depth = 0.02
    
    # Add a glowing green material
    mat = bpy.data.materials.new(name="LogoMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.1, 0.8, 0.1, 1) # Greenhouse Green
    emission.inputs['Strength'].default_value = 10.0
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    logo.data.materials.append(mat)
    
    # Position it nicely in the top-right corner of the view relative to the brain center
    logo.rotation_euler[0] = math.radians(90)
    logo.rotation_euler[2] = math.radians(180) # Face the camera
    
    return logo

def run_custom_zoom_animation(label_name):
    """
    Configures and runs a custom zoom animation to a specified brain region.
    """
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    
    # Load the brain model and set up camera/light
    model, camera = setup_scene(base_fbx_path)

    # Define file paths for the custom_animation script
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")

    # Call the custom animation creation function
    custom_animation.create_zoom_to_label_animation(
        label_name, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE
    )
    
    # Configure render settings
    duration = 300 # Hardcoded duration for now
    output_folder = f"custom_zoom_{label_name.replace(' ', '_')}"
    configure_render_settings(output_folder, duration, file_format='FFMPEG')
    
    # Render the animation
    render_scene(f"Custom Zoom Animation to {label_name}")
    log_execution(f"Custom Zoom Animation to {label_name}", start_time)

def run_job_brain_tour(label_names):
    """
    Configures and runs a brain tour animation through multiple regions.
    """
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    
    # Load the brain model and set up camera/light
    model, camera = setup_scene(base_fbx_path)

    # Create the Greenhouse logo
    create_greenhouse_logo()
    
    # User requested removal of "golf balls" (neuron cloud)
    # neuron_physics.create_neuron_cloud(count=150, radius=6.0)
    
    # Dim the main brain model so highlights pop
    model.color = (0.05, 0.05, 0.05, 1) # Dark charcoal
    neuron_physics.setup_neuron_materials()

    # Define file paths for the custom_animation script
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    
    # Use predicted labels if they exist
    LABELS_PRED = os.path.join(DATA_DIR, "labels_pred.npy")
    LABELS_FILE = LABELS_PRED if os.path.exists(LABELS_PRED) else os.path.join(DATA_DIR, "labels.npy")

    # Call the custom animation creation function with default modifiers
    duration = custom_animation.create_brain_tour_animation(
        label_names, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE
    )
    
    if duration > 0:
        # 1. Configure initial render path (temp)
        temp_output_dir = os.path.join(script_dir, "render_outputs", "temp")
        os.makedirs(temp_output_dir, exist_ok=True)
        configure_render_settings("temp", duration, file_format='FFMPEG', engine='WORKBENCH')
        
        # 2. Render the animation
        render_scene(f"Brain Tour: {', '.join(label_names)}")
        
        # 3. Rename and move to completed directory
        now = datetime.now()
        timestamp = now.strftime("%Y%m%d_%H%M")
        region_pref = "_".join([n.replace(" ", "_") for n in label_names[:3]])
        final_filename = f"{region_pref}_{timestamp}.mkv"
        
        # Use an absolute path for the completed directory
        completed_dir = os.path.abspath(os.path.join(script_dir, "completed"))
        os.makedirs(completed_dir, exist_ok=True)
        print(f"Ensuring completed directory exists at: {completed_dir}")
        
        # Robust check: look ONLY in temp_output_dir first
        print(f"Post-render: Searching for animations in {temp_output_dir}")
        mkv_files = [f for f in os.listdir(temp_output_dir) if f.endswith(".mkv")]
        
        if mkv_files:
            # Sort by creation time to find the newest in this specific folder
            mkv_files.sort(key=lambda x: os.path.getctime(os.path.join(temp_output_dir, x)), reverse=True)
            source_path = os.path.join(temp_output_dir, mkv_files[0])
            dest_path = os.path.join(completed_dir, final_filename)
            print(f"Moving found render: {source_path} -> {dest_path}")
            shutil.move(source_path, dest_path)
            print(f"Move successful. Final video: {dest_path}")
        else:
            print(f"Warning: No valid MKV found in {temp_output_dir}.")
            # Fallback search in all render_outputs just in case
            all_render_outputs = os.path.abspath(os.path.join(script_dir, "render_outputs"))
            for root, dirs, files in os.walk(all_render_outputs):
                if root == temp_output_dir: continue # Already checked
                for f in files:
                    if f.endswith(".mkv") and os.path.getsize(os.path.join(root, f)) > 0:
                        print(f"Found fallback in {root}: {f}")

        log_execution(f"Brain Tour", start_time)
        # Skip rmtree for now to allow manual debugging if it fails
        # try: shutil.rmtree(temp_output_dir)
        # except: pass


def log_execution(job_name, start_time):
    """
    Logs the execution time of a job to a file.
    """
    duration = time.time() - start_time
    log_dir = os.path.join(script_dir, "logs")
    try:
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "execution.log")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        with open(log_file, "a") as f:
            f.write(f"[{timestamp}] Job: {job_name} | Duration: {duration:.2f} seconds\n")
        print(f"Execution time logged: {duration:.2f}s")
    except Exception as e:
        print(f"Error writing to log file: {e}")


# --- RENDER JOBS ---

def render_scene(job_name):
    """
    Renders the currently configured animation.

    :param job_name: A descriptive name for the render job for logging.
    """
    output_path = bpy.context.scene.render.filepath
    print(f"--- Starting Render Job: {job_name} ---")
    print(f"Outputting {bpy.context.scene.frame_end} frames to: {output_path}")
    
    print("Calling bpy.ops.render.render(animation=True)...")
    bpy.ops.render.render(animation=True)
    print("bpy.ops.render.render(animation=True) call completed.")

    print(f"--- Finished Render Job: {job_name} ---")

def run_job_region_highlight(region_name, label_text, output_filename):
    """Configures and runs a render for a specific brain region."""
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    # The setup_scene function returns a single model object.
    # To highlight sub-regions, we rely on finding the named objects *after* import.
    _, camera = setup_scene(base_fbx_path)

    # Find the target region object within the imported hierarchy
    target_region_obj = find_object_by_name(region_name)
    if not target_region_obj:
        print(f"CRITICAL: Could not find region '{region_name}'. Aborting job.")
        # Quit blender with an error code if the region isn't found
        bpy.ops.wm.quit_blender()
        return

    # Apply materials and create text
    apply_highlight_materials(target_region_obj)
    create_3d_text_label(label_text, target_region_obj)

    # Set up animation and render settings
    duration = 120 # A standard 5-second turntable
    # We need a reference object for the camera to orbit. The main brain model is a good choice.
    main_model_object = find_object_by_name("BrainModel")
    if main_model_object:
        cam_anim.create_turntable_animation(camera, main_model_object, duration)

    # Configure render settings to output a single MKV file
    output_folder_base = os.path.join(script_dir, "render_outputs")
    os.makedirs(output_folder_base, exist_ok=True) # Ensure the base directory exists

    configure_render_settings("render_outputs", duration, file_format='FFMPEG', engine='WORKBENCH')

    # Set the final filename for the render output
    bpy.context.scene.render.filepath = os.path.join(script_dir, "render_outputs", output_filename)

    render_scene(f"Region Highlight: {region_name}")
    log_execution(f"Region Highlight: {region_name}", start_time)

def run_job_turntable_procedural():
    """Configures and runs the 'Turntable Procedural' job."""
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    vfx.apply_procedural_texture(model)
    duration = 120
    cam_anim.create_turntable_animation(camera, model, duration)
    configure_render_settings("turntable_procedural", duration, file_format='FFMPEG', engine='WORKBENCH')
    render_scene("Turntable Procedural")
    log_execution("turntable_procedural", start_time)

def run_job_zoom_glow():
    """Configures and runs the 'Dolly Zoom Glow' job."""
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    vfx.apply_glowing_material(model, color=(0.1, 0.5, 1.0), strength=15)
    duration = 90
    cam_anim.create_dolly_animation(camera, duration, start_distance=-15, end_distance=-6)
    configure_render_settings("zoom_glow", duration, file_format='FFMPEG', engine='WORKBENCH')
    render_scene("Dolly Zoom Glow")
    log_execution("zoom_glow", start_time)

def run_job_wireframe_flyover():
    """Configures and runs the 'Wireframe Flyover' job."""
    start_time = time.time()
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    clean_scene()
    model, camera = setup_scene(base_fbx_path)
    vfx.apply_procedural_texture(model, material_name="BaseGrey")
    vfx.create_wireframe_overlay(model, thickness=0.015)
    duration = 150
    cam_anim.create_pitch_animation(camera, duration, angle_degrees=15)
    configure_render_settings("wireframe_flyover", duration, file_format='FFMPEG', engine='WORKBENCH')
    render_scene("Wireframe Flyover")
    log_execution("wireframe_flyover", start_time)

def run_all_jobs():
    """Executes all defined render jobs sequentially."""
    start_time = time.time()
    run_job_turntable_procedural()
    run_job_zoom_glow()
    run_job_wireframe_flyover()
    print("\n--- All Render Jobs Complete ---")
    log_execution("all_jobs", start_time)

# --- EXECUTION ---

def main():
    """
    Parses command-line arguments to run specific render jobs.
    """
    # Blender command-line arguments for scripts are passed after '--'
    # Example: blender -b -P render_suite.py -- turntable_procedural
    try:
        args = sys.argv[sys.argv.index("--") + 1:]
    except ValueError:
        # If '--' is not present, no arguments were passed, or script is run from Blender UI
        args = []

    # Default to running all jobs if no specific job is requested
    job_name = args[0] if args else 'all'

    # Centralized check for the existence of the model file
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    if not os.path.exists(base_fbx_path):
        print(f"CRITICAL ERROR: brain.fbx not found at {base_fbx_path}")
        bpy.ops.wm.quit_blender()
        return # Exit if the model is missing

    # A dictionary mapping job names to the functions that run them
    jobs = {
        'turntable_procedural': run_job_turntable_procedural,
        'zoom_glow': run_job_zoom_glow,
        'wireframe_flyover': run_job_wireframe_flyover,
        'custom_zoom_animation': run_custom_zoom_animation,
    }

    # Handle the new region_highlight job, which has arguments
    if job_name == 'region_highlight':
        if len(args) == 4:
            # Expected args: job_name, region_name, label_text, output_filename
            _, region_name, label_text, output_filename = args
            run_job_region_highlight(region_name, label_text, output_filename)
        else:
            print("Error: 'region_highlight' job requires 3 arguments: <region_name> <label_text> <output_filename>")
            print(f"Received: {args[1:]}")
            bpy.ops.wm.quit_blender()
    elif job_name == 'custom_zoom_animation':
        if len(args) == 2:
            _, label_name = args
            run_custom_zoom_animation(label_name)
        else:
            print("Error: 'custom_zoom_animation' job requires 1 argument: <label_name>")
            print(f"Received: {args[1:]}")
            bpy.ops.wm.quit_blender()
    elif job_name == 'brain_tour':
        if len(args) >= 2:
            # Expected args: job_name, label1, label2, ...
            label_names = args[1:]
            run_job_brain_tour(label_names)
        else:
            print("Error: 'brain_tour' job requires at least 1 region name.")
            bpy.ops.wm.quit_blender()
    elif job_name == 'all':
        print("Executing all render jobs...")
        run_all_jobs()
    elif job_name in jobs:
        jobs[job_name]()
    else:
        print(f"Error: Unknown job name '{job_name}'")
        print("Available jobs: all, region_highlight, custom_zoom_animation, " + ", ".join(jobs.keys()))
        # In background mode, this will cause Blender to exit with an error status
        bpy.ops.wm.quit_blender()

if __name__ == "__main__":
    main()
