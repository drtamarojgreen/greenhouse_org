import bpy
import math
import os
import sys
import mathutils
import random

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

    # Timeline settings (2100 frames @ 24fps ~= 87.5 seconds)
    scene.frame_start = 1
    scene.frame_end = 2100

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
    """Sets up post-processing for B&W, high contrast, vignette, and film grain."""
    bpy.context.scene.use_nodes = True
    tree = bpy.context.scene.node_tree
    for node in tree.nodes:
        tree.nodes.remove(node)

    rl = tree.nodes.new('CompositorNodeRLayers')
    composite = tree.nodes.new('CompositorNodeComposite')

    # 1. RGB to BW
    bw = tree.nodes.new('CompositorNodeRGBToBW')

    # 2. Bright/Contrast with Flicker
    bright = tree.nodes.new('CompositorNodeBrightContrast')
    bright.inputs['Contrast'].default_value = 1.6
    # Animate Brightness for flicker effect
    for f in range(1, 2101, 2):
        bright.inputs['Bright'].default_value = random.uniform(-0.02, 0.02)
        bright.inputs['Bright'].keyframe_insert(data_path="default_value", frame=f)

    # 3. Film Grain (Noise Texture)
    noise = tree.nodes.new('CompositorNodeTexture')
    # Create a procedural noise texture
    if "FilmNoise" not in bpy.data.textures:
        tex = bpy.data.textures.new("FilmNoise", type='NOISE')
    noise.texture = bpy.data.textures["FilmNoise"]

    mix_grain = tree.nodes.new('CompositorNodeMixRGB')
    mix_grain.blend_type = 'OVERLAY'
    mix_grain.inputs[0].default_value = 0.15 # Factor

    # 4. Vertical Scratches (Musgrave)
    if "Scratches" not in bpy.data.textures:
        stex = bpy.data.textures.new("Scratches", type='MUSGRAVE')
        stex.musgrave_type = 'FBM'
        stex.noise_scale = 10.0
    scratches = tree.nodes.new('CompositorNodeTexture')
    scratches.texture = bpy.data.textures["Scratches"]

    mix_scratches = tree.nodes.new('CompositorNodeMixRGB')
    mix_scratches.blend_type = 'MULTIPLY'
    mix_scratches.inputs[0].default_value = 0.1

    # 5. Vignette
    mask = tree.nodes.new('CompositorNodeEllipseMask')
    mask.width = 0.95
    mask.height = 0.85
    blur = tree.nodes.new('CompositorNodeBlur')
    blur.size_x = 250
    blur.size_y = 250
    mix_vignette = tree.nodes.new('CompositorNodeMixRGB')
    mix_vignette.blend_type = 'MULTIPLY'

    # Connections
    tree.links.new(rl.outputs['Image'], bw.inputs['Image'])
    tree.links.new(bw.outputs['Val'], bright.inputs['Image'])
    tree.links.new(bright.outputs['Image'], mix_grain.inputs[1])
    tree.links.new(noise.outputs['Value'], mix_grain.inputs[2])

    tree.links.new(mix_grain.outputs['Image'], mix_scratches.inputs[1])
    tree.links.new(scratches.outputs['Value'], mix_scratches.inputs[2])

    tree.links.new(mask.outputs['Mask'], blur.inputs['Image'])
    tree.links.new(mix_scratches.outputs['Image'], mix_vignette.inputs[1])
    tree.links.new(blur.outputs['Image'], mix_vignette.inputs[2])
    tree.links.new(mix_vignette.outputs['Image'], composite.inputs['Image'])

def animate_camera():
    """Sets up and animates the camera across scenes."""
    bpy.ops.object.camera_add(location=(0, -20, 0), rotation=(math.radians(90), 0, 0))
    camera = bpy.context.object
    bpy.context.scene.camera = camera

    # Static position for Titles
    title_loc = (0, -8, 0)
    title_rot = (math.radians(90), 0, 0)

    # 1. Intro Card (1-100)
    camera.location = title_loc
    camera.rotation_euler = title_rot
    camera.keyframe_insert(data_path="location", frame=1)
    camera.keyframe_insert(data_path="rotation_euler", frame=1)

    # 2. Intertitle (101-200)
    camera.keyframe_insert(data_path="location", frame=101)

    # 3. Brain Turntable (201-400)
    camera.location = (0, -25, 5)
    camera.rotation_euler = (math.radians(75), 0, 0)
    camera.keyframe_insert(data_path="location", frame=201)
    camera.keyframe_insert(data_path="rotation_euler", frame=201)
    camera.location = (0, -30, 8)
    camera.keyframe_insert(data_path="location", frame=400)

    # 4. Intertitle (401-500)
    camera.location = title_loc
    camera.rotation_euler = title_rot
    camera.keyframe_insert(data_path="location", frame=401)
    camera.keyframe_insert(data_path="rotation_euler", frame=401)

    # 5. Garden Scene (501-650)
    camera.location = (2, -15, 2)
    camera.rotation_euler = (math.radians(85), 0, 0)
    camera.keyframe_insert(data_path="location", frame=501)
    camera.keyframe_insert(data_path="rotation_euler", frame=501)
    camera.location = (-2, -12, 1)
    camera.keyframe_insert(data_path="location", frame=650)

    # 6. Intertitle (651-750)
    camera.location = title_loc
    camera.rotation_euler = title_rot
    camera.keyframe_insert(data_path="location", frame=651)
    camera.keyframe_insert(data_path="rotation_euler", frame=651)

    # 7. Socratic Dialogue (751-950)
    camera.location = (0, -10, 2)
    camera.rotation_euler = (math.radians(80), 0, 0)
    camera.keyframe_insert(data_path="location", frame=751)
    camera.keyframe_insert(data_path="rotation_euler", frame=751)
    camera.location = (0, -12, 3)
    camera.keyframe_insert(data_path="location", frame=950)

    # 8. Intertitle (951-1050)
    camera.location = title_loc
    camera.keyframe_insert(data_path="location", frame=951)

    # 9. Scroll Exchange (1051-1250)
    camera.location = (1.5, -8, 1.5)
    camera.rotation_euler = (math.radians(85), 0, math.radians(10))
    camera.keyframe_insert(data_path="location", frame=1051)
    camera.keyframe_insert(data_path="rotation_euler", frame=1051)
    camera.location = (-1.5, -8, 1.5)
    camera.keyframe_insert(data_path="location", frame=1250)

    # 10. Intertitle (1251-1350)
    camera.location = title_loc
    camera.rotation_euler = title_rot
    camera.keyframe_insert(data_path="location", frame=1251)
    camera.keyframe_insert(data_path="rotation_euler", frame=1251)

    # 11. Stoic Forge (1351-1500)
    camera.location = (0, -5, 0)
    camera.rotation_euler = (math.radians(90), 0, 0)
    camera.keyframe_insert(data_path="location", frame=1351)
    camera.keyframe_insert(data_path="rotation_euler", frame=1351)
    camera.location = (0, -4, 0)
    camera.keyframe_insert(data_path="location", frame=1500)

    # 12. Intertitle (1501-1600)
    camera.location = title_loc
    camera.keyframe_insert(data_path="location", frame=1501)

    # 13. Synaptic Bridge (1601-1800)
    camera.location = (10, -25, 10)
    camera.rotation_euler = (math.radians(70), 0, math.radians(20))
    camera.keyframe_insert(data_path="location", frame=1601)
    camera.keyframe_insert(data_path="rotation_euler", frame=1601)
    camera.location = (5, -20, 5)
    camera.keyframe_insert(data_path="location", frame=1800)

    # 14. Intertitle (1801-1900)
    camera.location = title_loc
    camera.rotation_euler = title_rot
    camera.keyframe_insert(data_path="location", frame=1801)
    camera.keyframe_insert(data_path="rotation_euler", frame=1801)

    # 15. Neuron Fly-by (1901-2000)
    camera.location = (5, -10, 5)
    camera.rotation_euler = (math.radians(60), 0, math.radians(30))
    camera.keyframe_insert(data_path="location", frame=1901)
    camera.location = (-5, -20, -5)
    camera.keyframe_insert(data_path="location", frame=2000)

    # 16. Outro Card (2001-2100)
    camera.location = title_loc
    camera.rotation_euler = title_rot
    camera.keyframe_insert(data_path="location", frame=2001)
    camera.keyframe_insert(data_path="rotation_euler", frame=2001)

def create_environment():
    """Creates a simple philosophical garden environment."""
    # Floor
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -1))
    floor = bpy.context.object
    floor.name = "GardenFloor"
    mat = bpy.data.materials.new(name="FloorMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.2, 0.2, 1)
    floor.data.materials.append(mat)

    # Pillars
    for x in [-5, 5]:
        for y in [-5, 5]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=5, location=(x, y, 1.5))
            pillar = bpy.context.object
            pillar.name = f"Pillar_{x}_{y}"
            pillar.data.materials.append(mat)

def main():
    scene = setup_scene()
    brain, neuron = load_meshes()
    create_environment()

    # Plant Humanoids
    h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-1, 0, 0)), height_scale=0.8, seed=42)
    h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((1, 1, 0)), height_scale=1.3, seed=123)
    scroll = plant_humanoid.create_scroll(mathutils.Vector((0.8, 1.0, 1.2)))

    # Bushes
    plant_humanoid.create_procedural_bush(mathutils.Vector((-3, 2, 0)), name="Bush1", size=1.2)
    plant_humanoid.create_procedural_bush(mathutils.Vector((4, -3, 0)), name="Bush2", size=0.8)

    # Group plant humanoid parts and props
    plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["Herbaceous", "Arbor", "Scroll", "Bush"])]
    for p in plants:
        p.hide_render = True
        p.hide_viewport = True
        # Visible in Garden (501), Socratic (751), Exchange (1051), and Bridge (1601) scenes
        p.keyframe_insert(data_path="hide_render", frame=500)
        p.hide_render = False
        p.hide_viewport = False
        p.keyframe_insert(data_path="hide_render", frame=501)
        p.hide_render = True
        p.hide_viewport = True
        p.keyframe_insert(data_path="hide_render", frame=651)

        p.hide_render = False
        p.hide_viewport = False
        p.keyframe_insert(data_path="hide_render", frame=751)
        p.hide_render = True
        p.hide_viewport = True
        p.keyframe_insert(data_path="hide_render", frame=951)

        p.hide_render = False
        p.hide_viewport = False
        p.keyframe_insert(data_path="hide_render", frame=1051)
        p.hide_render = True
        p.hide_viewport = True
        p.keyframe_insert(data_path="hide_render", frame=1251)

        p.hide_render = False
        p.hide_viewport = False
        p.keyframe_insert(data_path="hide_render", frame=1601)
        p.hide_render = True
        p.hide_viewport = True
        p.keyframe_insert(data_path="hide_render", frame=1801)

        # Apply Silent movie material override
        if p.material_slots and p.material_slots[0].material:
            mat = p.material_slots[0].material
            if mat.use_nodes:
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    bsdf.inputs["Base Color"].default_value = (0.7, 0.7, 0.7, 1)

    # Animate Scroll Exchange
    scroll.location = mathutils.Vector((0.8, 1.0, 1.2)) # Arbor's hand area
    scroll.keyframe_insert(data_path="location", frame=1051)
    scroll.location = mathutils.Vector((-0.8, 0.0, 1.0)) # Herbaceous's hand area
    scroll.keyframe_insert(data_path="location", frame=1150)
    scroll.keyframe_insert(data_path="location", frame=1250)

    # Animate characters in Socratic Dialogue and Exchange
    h1.rotation_euler = (0, 0, 0)
    h1.keyframe_insert(data_path="rotation_euler", frame=751)
    h1.rotation_euler = (0, 0, math.radians(-30))
    h1.keyframe_insert(data_path="rotation_euler", frame=850)
    h1.rotation_euler = (0, 0, 0)
    h1.keyframe_insert(data_path="rotation_euler", frame=950)

    h2.rotation_euler = (0, 0, 0)
    h2.keyframe_insert(data_path="rotation_euler", frame=1051)
    h2.rotation_euler = (0, 0, math.radians(45))
    h2.keyframe_insert(data_path="rotation_euler", frame=1150)
    h2.rotation_euler = (0, 0, 0)
    h2.keyframe_insert(data_path="rotation_euler", frame=1250)

    # Scene sequencing
    # Intro: GreenhouseMD
    create_intertitle("GreenhouseMD\nPresents", 1, 100)

    # Intertitle: Stoic Reason
    create_intertitle("The Seat of\nStoic Reason", 101, 200)

    # Brain: Stoic Reason
    if brain:
        brain.hide_render = True
        brain.hide_viewport = True
        # Visible in Brain (201), Socratic (751), Forge (1351) and Bridge (1601)
        brain.keyframe_insert(data_path="hide_render", frame=200)
        brain.hide_render = False
        brain.hide_viewport = False
        brain.keyframe_insert(data_path="hide_render", frame=201)
        brain.hide_render = True
        brain.hide_viewport = True
        brain.keyframe_insert(data_path="hide_render", frame=401)

        brain.keyframe_insert(data_path="hide_render", frame=750)
        brain.hide_render = False
        brain.hide_viewport = False
        brain.keyframe_insert(data_path="hide_render", frame=751)
        brain.hide_render = True
        brain.hide_viewport = True
        brain.keyframe_insert(data_path="hide_render", frame=951)

        brain.keyframe_insert(data_path="hide_render", frame=1350)
        brain.hide_render = False
        brain.hide_viewport = False
        brain.keyframe_insert(data_path="hide_render", frame=1351)
        brain.hide_render = True
        brain.hide_viewport = True
        brain.keyframe_insert(data_path="hide_render", frame=1501)

        brain.keyframe_insert(data_path="hide_render", frame=1600)
        brain.hide_render = False
        brain.hide_viewport = False
        brain.keyframe_insert(data_path="hide_render", frame=1601)
        brain.hide_render = True
        brain.hide_viewport = True
        brain.keyframe_insert(data_path="hide_render", frame=1801)

        # Rotation
        brain.rotation_euler = (0, 0, 0)
        brain.keyframe_insert(data_path="rotation_euler", frame=201)
        brain.rotation_euler = (0, 0, math.pi * 2)
        brain.keyframe_insert(data_path="rotation_euler", frame=400)

        # Thought Pulsing in Forge
        mat = brain.data.materials[0]
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1351)
        bsdf.inputs["Emission Strength"].default_value = 5.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1425)
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1500)

    # Narrative Intertitles
    create_intertitle("The Garden of\nThe Mind", 401, 500)
    create_intertitle("The Dialectic of\nGrowth", 651, 750)
    create_intertitle("The Exchange of\nKnowledge", 951, 1050)
    create_intertitle("The Forge of\nFortitude", 1251, 1350)
    create_intertitle("The Bridge of\nConnectivity", 1501, 1600)
    create_intertitle("The Architecture of\nConnectivity", 1801, 1900)

    # Neuron: Connecting the Mind
    if neuron:
        neuron.hide_render = True
        neuron.hide_viewport = True
        # Visible in Bridge (1601) and Fly-by (1901)
        neuron.keyframe_insert(data_path="hide_render", frame=1600)
        neuron.hide_render = False
        neuron.hide_viewport = False
        neuron.keyframe_insert(data_path="hide_render", frame=1601)
        neuron.hide_render = True
        neuron.hide_viewport = True
        neuron.keyframe_insert(data_path="hide_render", frame=1801)

        neuron.keyframe_insert(data_path="hide_render", frame=1900)
        neuron.hide_render = False
        neuron.hide_viewport = False
        neuron.keyframe_insert(data_path="hide_render", frame=1901)
        neuron.hide_render = True
        neuron.hide_viewport = True
        neuron.keyframe_insert(data_path="hide_render", frame=2001)
        neuron.scale = (5, 5, 5)

    # Outro: Fin
    create_intertitle("The Greenhouse for\nMental Health Development\n\nFin", 2001, 2100)

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
