import bpy
import math
import os
import sys
import mathutils

# Import plant humanoid generator
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import plant_humanoid

def setup_scene():
    """Initializes the scene with Cycles engine and high-contrast settings."""
    # Clear existing objects
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 128
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.fps = 24

    # Disable denoising if OIDN is not available
    scene.cycles.use_denoising = False

    # Timeline settings (900 frames @ 24fps ~= 37 seconds)
    scene.frame_start = 1
    scene.frame_end = 900

    # Dark world for high contrast
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs[0].default_value = (0, 0, 0, 1)

    return scene

def load_meshes():
    """Loads the brain and neuron FBX models."""
    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    brain_path = os.path.join(base_path, "brain.fbx")
    neuron_path = os.path.join(base_path, "neuron.fbx")

    # Load Brain
    brain = None
    if os.path.exists(brain_path):
        bpy.ops.import_scene.fbx(filepath=brain_path)
        brain = bpy.context.selected_objects[0]
        brain.name = "Brain"
        brain.location = (0, 0, 0)
        # Apply a simple white material for B&W contrast
        mat = bpy.data.materials.new(name="SilentMeshMat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1)
            bsdf.inputs["Roughness"].default_value = 0.4
        brain.data.materials.append(mat)
    else:
        print(f"Error: brain.fbx not found at {brain_path}")

    # Load Neuron
    neuron = None
    if os.path.exists(neuron_path):
        bpy.ops.import_scene.fbx(filepath=neuron_path)
        neuron = bpy.context.selected_objects[0]
        neuron.name = "Neuron"
        neuron.location = (0, 0, 0)
        if len(neuron.data.materials) == 0:
            neuron.data.materials.append(bpy.data.materials.get("SilentMeshMat"))
        neuron.hide_render = True
        neuron.hide_viewport = True
    else:
        print(f"Error: neuron.fbx not found at {neuron_path}")

    return brain, neuron

def create_intertitle(text, frame_start, frame_end):
    """Creates a classic silent movie intertitle card."""
    bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
    text_obj = bpy.context.object
    text_obj.name = f"Text_{frame_start}"
    text_obj.data.body = text
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    text_obj.data.size = 1.0
    text_obj.data.extrude = 0.05

    # Material for text
    mat = bpy.data.materials.new(name=f"TextMat_{frame_start}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
        bsdf.inputs["Emission Strength"].default_value = 1.0
    text_obj.data.materials.append(mat)

    # Visibility Keyframes
    # Hidden initially
    text_obj.hide_render = True
    text_obj.hide_viewport = True
    text_obj.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    text_obj.keyframe_insert(data_path="hide_viewport", frame=frame_start - 1)

    # Visible during range
    text_obj.hide_render = False
    text_obj.hide_viewport = False
    text_obj.keyframe_insert(data_path="hide_render", frame=frame_start)
    text_obj.keyframe_insert(data_path="hide_viewport", frame=frame_start)

    # Hidden after range
    text_obj.hide_render = True
    text_obj.hide_viewport = True
    text_obj.keyframe_insert(data_path="hide_render", frame=frame_end)
    text_obj.keyframe_insert(data_path="hide_viewport", frame=frame_end)

    return text_obj

def setup_compositor():
    """Sets up post-processing for B&W, high contrast, and vignette."""
    bpy.context.scene.use_nodes = True
    tree = bpy.context.scene.node_tree
    for node in tree.nodes:
        tree.nodes.remove(node)

    rl = tree.nodes.new('CompositorNodeRLayers')
    composite = tree.nodes.new('CompositorNodeComposite')

    # RGB to BW
    bw = tree.nodes.new('CompositorNodeRGBToBW')

    # Bright/Contrast
    bright = tree.nodes.new('CompositorNodeBrightContrast')
    bright.inputs['Bright'].default_value = 0.0
    bright.inputs['Contrast'].default_value = 1.5

    # Vignette
    mask = tree.nodes.new('CompositorNodeEllipseMask')
    mask.width = 0.9
    mask.height = 0.8

    blur = tree.nodes.new('CompositorNodeBlur')
    blur.size_x = 200
    blur.size_y = 200

    mix = tree.nodes.new('CompositorNodeMixRGB')
    mix.blend_type = 'MULTIPLY'
    mix.inputs[0].default_value = 1.0 # Factor

    # Connections
    tree.links.new(rl.outputs['Image'], bw.inputs['Image'])
    tree.links.new(bw.outputs['Val'], bright.inputs['Image'])

    tree.links.new(mask.outputs['Mask'], blur.inputs['Image'])
    # Mix node has two 'Image' inputs in Blender 4.0
    tree.links.new(bright.outputs['Image'], mix.inputs[1])
    tree.links.new(blur.outputs['Image'], mix.inputs[2])
    tree.links.new(mix.outputs['Image'], composite.inputs['Image'])

def animate_camera():
    """Sets up and animates the camera across scenes."""
    bpy.ops.object.camera_add(location=(0, -20, 0), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    bpy.context.scene.camera = camera

    # 1. Intro Card (1-100)
    camera.location = (0, -8, 0)
    camera.keyframe_insert(data_path="location", frame=1)

    # 2. Brain Turntable (101-300)
    camera.location = (0, -25, 5)
    camera.rotation_euler = (math.radians(75), 0, 0)
    camera.keyframe_insert(data_path="location", frame=101)
    camera.keyframe_insert(data_path="rotation_euler", frame=101)

    camera.location = (0, -30, 8)
    camera.keyframe_insert(data_path="location", frame=300)

    # 3. Intertitle (301-400)
    camera.location = (0, -8, 0)
    camera.rotation_euler = (math.radians(90), 0, 0)
    camera.keyframe_insert(data_path="location", frame=301)
    camera.keyframe_insert(data_path="rotation_euler", frame=301)

    # 4. Garden Scene (401-550)
    camera.location = (2, -15, 2)
    camera.rotation_euler = (math.radians(85), 0, 0)
    camera.keyframe_insert(data_path="location", frame=401)
    camera.keyframe_insert(data_path="rotation_euler", frame=401)

    camera.location = (-2, -12, 1)
    camera.keyframe_insert(data_path="location", frame=550)

    # 5. Intertitle (551-650)
    camera.location = (0, -8, 0)
    camera.rotation_euler = (math.radians(90), 0, 0)
    camera.keyframe_insert(data_path="location", frame=551)
    camera.keyframe_insert(data_path="rotation_euler", frame=551)

    # 6. Neuron Fly-by (651-800)
    camera.location = (5, -10, 5)
    camera.rotation_euler = (math.radians(60), 0, math.radians(30))
    camera.keyframe_insert(data_path="location", frame=651)
    camera.keyframe_insert(data_path="rotation_euler", frame=651)

    camera.location = (-5, -20, -5)
    camera.rotation_euler = (math.radians(120), 0, math.radians(-30))
    camera.keyframe_insert(data_path="location", frame=800)
    camera.keyframe_insert(data_path="rotation_euler", frame=800)

    # 7. Outro Card (801-900)
    camera.location = (0, -8, 0)
    camera.rotation_euler = (math.radians(90), 0, 0)
    camera.keyframe_insert(data_path="location", frame=801)
    camera.keyframe_insert(data_path="rotation_euler", frame=801)

def main():
    scene = setup_scene()
    brain, neuron = load_meshes()

    # Plant Humanoids
    h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-1, 0, 0)))
    h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((1, 0, 0)))

    # Group plant humanoid parts for easier visibility control
    plants = [obj for obj in bpy.context.scene.objects if "Herbaceous" in obj.name or "Arbor" in obj.name]
    for p in plants:
        p.hide_render = True
        p.hide_viewport = True
        p.keyframe_insert(data_path="hide_render", frame=400)
        p.hide_render = False
        p.hide_viewport = False
        p.keyframe_insert(data_path="hide_render", frame=401)
        p.hide_render = True
        p.hide_viewport = True
        p.keyframe_insert(data_path="hide_render", frame=551)

        # Apply Silent movie material override
        if len(p.data.materials) > 0:
            p.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.7, 0.7, 0.7, 1)

    # Animate characters in Garden scene
    h1.rotation_euler = (0, 0, 0)
    h1.keyframe_insert(data_path="rotation_euler", frame=401)
    h1.rotation_euler = (0, 0, math.radians(15))
    h1.keyframe_insert(data_path="rotation_euler", frame=475)
    h1.rotation_euler = (0, 0, 0)
    h1.keyframe_insert(data_path="rotation_euler", frame=550)

    # Scene sequencing
    # Intro: GreenhouseMD
    create_intertitle("GreenhouseMD\nPresents", 1, 100)

    # Brain: Stoic Reason
    if brain:
        brain.hide_render = True
        brain.hide_viewport = True
        brain.keyframe_insert(data_path="hide_render", frame=100)

        brain.hide_render = False
        brain.hide_viewport = False
        brain.keyframe_insert(data_path="hide_render", frame=101)

        brain.hide_render = True
        brain.hide_viewport = True
        brain.keyframe_insert(data_path="hide_render", frame=301)

        # Rotation
        brain.rotation_euler = (0, 0, 0)
        brain.keyframe_insert(data_path="rotation_euler", frame=101)
        brain.rotation_euler = (0, 0, math.pi * 2)
        brain.keyframe_insert(data_path="rotation_euler", frame=300)

    # Intertitle: The Architecture of Thought
    create_intertitle("The Architecture of\nStoic Reason", 301, 400)

    # Garden: The Living Mind
    # (Plants are handled above in the loop)

    # Intertitle 2
    create_intertitle("The Garden of\nThe Mind", 551, 650)

    # Neuron: Connecting the Mind
    if neuron:
        neuron.hide_render = True
        neuron.hide_viewport = True
        neuron.keyframe_insert(data_path="hide_render", frame=650)

        neuron.hide_render = False
        neuron.hide_viewport = False
        neuron.keyframe_insert(data_path="hide_render", frame=651)

        neuron.hide_render = True
        neuron.hide_viewport = True
        neuron.keyframe_insert(data_path="hide_render", frame=801)

        # Scale neuron up if it's too small
        neuron.scale = (5, 5, 5)

    # Outro: Fin
    create_intertitle("The Greenhouse for\nMental Health Development\n\nFin", 801, 900)

    animate_camera()
    setup_compositor()

    # Lighting: High contrast spot and sun
    bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
    sun = bpy.context.object
    sun.data.energy = 2.0

    bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10))
    spot = bpy.context.object
    spot.data.energy = 1000
    spot.data.spot_size = math.radians(45)

    # CLI Support for single frame and full animation rendering
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]

        if "--render-output" in args:
            out_idx = args.index("--render-output") + 1
            scene.render.filepath = args[out_idx]
            scene.render.image_settings.file_format = 'FFMPEG'
            scene.render.ffmpeg.format = 'MPEG4'
            scene.render.ffmpeg.codec = 'H264'
            scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

        if "--frame" in args:
            frame_idx = args.index("--frame") + 1
            frame_num = int(args[frame_idx])
            scene.frame_set(frame_num)
            # If render-output was provided, use it as a directory for frames, else use current dir
            if "--render-output" in args:
                out_dir = os.path.dirname(scene.render.filepath)
                frame_path = os.path.join(out_dir, f"frame_{frame_num:03d}.png")
            else:
                frame_path = os.path.join(os.getcwd(), f"silent_movie_frame_{frame_num}.png")

            scene.render.filepath = frame_path
            bpy.ops.render.render(write_still=True)
            print(f"Rendered frame {frame_num} to {frame_path}")

        if "--render-anim" in args:
            print(f"Starting animation render to {scene.render.filepath}...")
            bpy.ops.render.render(animation=True)
            print("Animation render complete.")

if __name__ == "__main__":
    main()
