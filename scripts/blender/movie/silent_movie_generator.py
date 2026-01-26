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

    # Timeline settings (2500 frames @ 24fps ~= 104 seconds)
    scene.frame_start = 1
    scene.frame_end = 2500

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
        imported_objs = bpy.context.selected_objects
        if imported_objs:
            # Create a container empty if there are multiple parts
            brain = bpy.data.objects.new("BrainContainer", None)
            bpy.context.scene.collection.objects.link(brain)
            for o in imported_objs:
                o.parent = brain
                o.matrix_parent_inverse = brain.matrix_world.inverted()

            # Apply a simple white material for B&W contrast
            mat = bpy.data.materials.new(name="SilentMeshMat")
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1)
                bsdf.inputs["Roughness"].default_value = 0.4
            for o in imported_objs:
                if o.type == 'MESH': o.data.materials.append(mat)
    else:
        print(f"Error: brain.fbx not found at {brain_path}")

    # Load Neuron
    neuron = None
    if os.path.exists(neuron_path):
        bpy.ops.import_scene.fbx(filepath=neuron_path)
        imported_objs = bpy.context.selected_objects
        if imported_objs:
            neuron = bpy.data.objects.new("NeuronContainer", None)
            bpy.context.scene.collection.objects.link(neuron)
            for o in imported_objs:
                o.parent = neuron
                o.matrix_parent_inverse = neuron.matrix_world.inverted()
                if o.type == 'MESH' and len(o.data.materials) == 0:
                    o.data.materials.append(bpy.data.materials.get("SilentMeshMat"))
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
    text_obj.hide_render = True
    text_obj.hide_viewport = True
    text_obj.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    text_obj.keyframe_insert(data_path="hide_viewport", frame=frame_start - 1)

    text_obj.hide_render = False
    text_obj.hide_viewport = False
    text_obj.keyframe_insert(data_path="hide_render", frame=frame_start)
    text_obj.keyframe_insert(data_path="hide_viewport", frame=frame_start)

    text_obj.hide_render = True
    text_obj.hide_viewport = True
    text_obj.keyframe_insert(data_path="hide_render", frame=frame_end)
    text_obj.keyframe_insert(data_path="hide_viewport", frame=frame_end)

    return text_obj

def setup_compositor():
    """Sets up post-processing for B&W, flicker, grain, and scratches."""
    bpy.context.scene.use_nodes = True
    tree = bpy.context.scene.node_tree
    for node in tree.nodes:
        tree.nodes.remove(node)

    rl = tree.nodes.new('CompositorNodeRLayers')
    composite = tree.nodes.new('CompositorNodeComposite')

    bw = tree.nodes.new('CompositorNodeRGBToBW')

    bright = tree.nodes.new('CompositorNodeBrightContrast')
    bright.inputs['Contrast'].default_value = 1.6
    for f in range(1, 2501, 2):
        bright.inputs['Bright'].default_value = random.uniform(-0.02, 0.02)
        bright.inputs['Bright'].keyframe_insert(data_path="default_value", frame=f)

    noise = tree.nodes.new('CompositorNodeTexture')
    if "FilmNoise" not in bpy.data.textures:
        bpy.data.textures.new("FilmNoise", type='NOISE')
    noise.texture = bpy.data.textures["FilmNoise"]

    mix_grain = tree.nodes.new('CompositorNodeMixRGB')
    mix_grain.blend_type = 'OVERLAY'
    mix_grain.inputs[0].default_value = 0.15

    if "Scratches" not in bpy.data.textures:
        stex = bpy.data.textures.new("Scratches", type='MUSGRAVE')
        stex.musgrave_type = 'FBM'
        stex.noise_scale = 10.0
    scratches = tree.nodes.new('CompositorNodeTexture')
    scratches.texture = bpy.data.textures["Scratches"]

    mix_scratches = tree.nodes.new('CompositorNodeMixRGB')
    mix_scratches.blend_type = 'MULTIPLY'
    mix_scratches.inputs[0].default_value = 0.1

    mask = tree.nodes.new('CompositorNodeEllipseMask')
    mask.width = 0.95
    mask.height = 0.85
    blur = tree.nodes.new('CompositorNodeBlur')
    blur.size_x = 250
    blur.size_y = 250
    mix_vignette = tree.nodes.new('CompositorNodeMixRGB')
    mix_vignette.blend_type = 'MULTIPLY'

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

    title_loc = (0, -8, 0)
    title_rot = (math.radians(90), 0, 0)

    # Sequence
    frames = [
        (1, 100, title_loc, title_rot),       # Intro
        (101, 200, title_loc, title_rot),     # Title 1
        (201, 400, (0,-25,5), (75,0,0), (0,-30,8), (75,0,0)), # Brain
        (401, 500, title_loc, title_rot),     # Title 2
        (501, 650, (2,-15,2), (85,0,0), (-2,-12,1), (85,0,0)), # Garden
        (651, 750, title_loc, title_rot),     # Title 3
        (751, 950, (0,-10,2), (80,0,0), (0,-12,3), (80,0,0)), # Dialogue
        (951, 1050, title_loc, title_rot),    # Title 4
        (1051, 1250, (1.5,-8,1.5), (85,0,10), (-1.5,-8,1.5), (85,0,10)), # Exchange
        (1251, 1350, title_loc, title_rot),    # Title 5
        (1351, 1500, (0,-5,0), (90,0,0), (0,-4,0), (90,0,0)), # Forge
        (1501, 1600, title_loc, title_rot),    # Title 6
        (1601, 1800, (10,-25,10), (70,0,20), (5,-20,5), (70,0,20)), # Bridge
        (1801, 1900, title_loc, title_rot),    # Title 7
        (1901, 2000, (5,-10,5), (60,0,30), (-5,-20,-5), (120,0,-30)), # Neuron
        (2001, 2100, title_loc, title_rot),    # Title 8
        (2101, 2400, (0,-40,15), (70,0,0), (0,-35,12), (70,0,0)), # Finale
        (2401, 2500, title_loc, title_rot),    # Outro
    ]

    for item in frames:
        f_start = item[0]
        loc = item[2]
        rot = (math.radians(item[3][0]), math.radians(item[3][1]), math.radians(item[3][2]))

        camera.location = loc
        camera.rotation_euler = rot
        camera.keyframe_insert(data_path="location", frame=f_start)
        camera.keyframe_insert(data_path="rotation_euler", frame=f_start)

        if len(item) > 4:
            f_end = item[1]
            loc_end = item[4]
            rot_end = (math.radians(item[5][0]), math.radians(item[5][1]), math.radians(item[5][2]))
            camera.location = loc_end
            camera.rotation_euler = rot_end
            camera.keyframe_insert(data_path="location", frame=f_end)
            camera.keyframe_insert(data_path="rotation_euler", frame=f_end)
        else:
            f_end = item[1]
            camera.keyframe_insert(data_path="location", frame=f_end)
            camera.keyframe_insert(data_path="rotation_euler", frame=f_end)

def create_environment():
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1))
    floor = bpy.context.object
    mat = bpy.data.materials.new(name="FloorMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.2, 0.2, 1)
    floor.data.materials.append(mat)

    pillar_locs = [(-8, -8), (-8, 8), (8, -8), (8, 8), (-12, 0), (12, 0)]
    for x, y in pillar_locs:
        plant_humanoid.create_inscribed_pillar(mathutils.Vector((x, y, 0)), name=f"Pillar_{x}_{y}")

def create_thought_spark(start_loc, end_loc, frame_start, frame_end):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05, location=start_loc)
    spark = bpy.context.object
    mat = bpy.data.materials.new(name="SparkMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
    bsdf.inputs["Emission Strength"].default_value = 10.0
    spark.data.materials.append(mat)

    spark.hide_render = True
    spark.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
    spark.hide_render = False
    spark.keyframe_insert(data_path="hide_render", frame=frame_start)
    spark.hide_render = True
    spark.keyframe_insert(data_path="hide_render", frame=frame_end)

    spark.location = start_loc
    spark.keyframe_insert(data_path="location", frame=frame_start)
    spark.location = end_loc
    spark.keyframe_insert(data_path="location", frame=frame_end)
    return spark

def main():
    scene = setup_scene()
    brain, neuron = load_meshes()
    create_environment()

    h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42)
    h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123)
    scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))
    plant_humanoid.create_procedural_bush(mathutils.Vector((-4, 3, 0)), name="Bush1", size=1.2)
    plant_humanoid.create_procedural_bush(mathutils.Vector((5, -4, 0)), name="Bush2", size=0.8)

    plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["Herbaceous", "Arbor", "Scroll", "Bush"])]
    ranges = [(501, 650), (751, 950), (1051, 1250), (1601, 1800), (2101, 2400)]
    for p in plants:
        p.hide_render = True
        p.hide_viewport = True
        for r_start, r_end in ranges:
            p.keyframe_insert(data_path="hide_render", frame=r_start - 1)
            p.hide_render = False
            p.keyframe_insert(data_path="hide_render", frame=r_start)
            p.hide_render = True
            p.keyframe_insert(data_path="hide_render", frame=r_end)

        if p.material_slots and p.material_slots[0].material:
            mat = p.material_slots[0].material
            if mat.use_nodes:
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf: bsdf.inputs["Base Color"].default_value = (0.7, 0.7, 0.7, 1)

    scroll.location = mathutils.Vector((1.8, 1.0, 1.2))
    scroll.keyframe_insert(data_path="location", frame=1051)
    scroll.location = mathutils.Vector((-1.8, 0.0, 1.0))
    scroll.keyframe_insert(data_path="location", frame=1150)
    scroll.keyframe_insert(data_path="location", frame=1250)

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

    create_thought_spark(h1.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 760, 800)
    create_thought_spark(h2.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 1060, 1100)

    create_intertitle("GreenhouseMD\nPresents", 1, 100)
    create_intertitle("The Seat of\nStoic Reason", 101, 200)
    create_intertitle("The Garden of\nThe Mind", 401, 500)
    create_intertitle("The Dialectic of\nGrowth", 651, 750)
    create_intertitle("The Exchange of\nKnowledge", 951, 1050)
    create_intertitle("The Forge of\nFortitude", 1251, 1350)
    create_intertitle("The Bridge of\nConnectivity", 1501, 1600)
    create_intertitle("The Architecture of\nConnectivity", 1801, 1900)
    create_intertitle("The Resonance of\nLogos", 2001, 2100)
    create_intertitle("The Greenhouse for\nMental Health Development\n\nFin", 2401, 2500)

    if brain:
        brain.hide_render = True
        brain_ranges = [(201,400), (751,950), (1351,1500), (1601,1800), (2101,2400)]
        for rs, re in brain_ranges:
            brain.keyframe_insert(data_path="hide_render", frame=rs - 1)
            brain.hide_render = False
            brain.keyframe_insert(data_path="hide_render", frame=rs)
            brain.hide_render = True
            brain.keyframe_insert(data_path="hide_render", frame=re)

        brain.rotation_euler = (0, 0, 0)
        brain.keyframe_insert(data_path="rotation_euler", frame=201)
        brain.rotation_euler = (0, 0, math.pi * 2)
        brain.keyframe_insert(data_path="rotation_euler", frame=400)

        # Find material for pulsing
        mat = None
        for o in brain.children:
            if o.type == 'MESH' and o.data.materials:
                mat = o.data.materials[0]
                break

        if not mat:
             mat = bpy.data.materials.get("SilentMeshMat")

        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1351)
        bsdf.inputs["Emission Strength"].default_value = 5.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1425)
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1500)

        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2101)
        bsdf.inputs["Emission Strength"].default_value = 10.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2250)
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2400)

    if neuron:
        neuron.hide_render = True
        neuron_ranges = [(1601,1800), (1901,2000)]
        for rs, re in neuron_ranges:
            neuron.keyframe_insert(data_path="hide_render", frame=rs - 1)
            neuron.hide_render = False
            neuron.keyframe_insert(data_path="hide_render", frame=rs)
            neuron.hide_render = True
            neuron.keyframe_insert(data_path="hide_render", frame=re)
        neuron.scale = (5, 5, 5)

    animate_camera()
    setup_compositor()

    bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
    bpy.context.object.data.energy = 2.0
    bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10))
    bpy.context.object.data.energy = 1000

    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
        if "--render-output" in args:
            out_idx = args.index("--render-output") + 1
            scene.render.filepath = args[out_idx]
            scene.render.image_settings.file_format = 'FFMPEG'
            scene.render.ffmpeg.format = 'MPEG4'
            scene.render.ffmpeg.codec = 'H264'
        if "--frame" in args:
            frame_idx = args.index("--frame") + 1
            frame_num = int(args[frame_idx])
            scene.frame_set(frame_num)
            if "--render-output" in args:
                out_dir = os.path.dirname(scene.render.filepath)
                frame_path = os.path.join(out_dir, f"frame_{frame_num:03d}.png")
            else:
                frame_path = os.path.join(os.getcwd(), f"silent_movie_frame_{frame_num}.png")
            scene.render.filepath = frame_path
            bpy.ops.render.render(write_still=True)
            print(f"Rendered frame {frame_num} to {frame_path}")
        if "--render-anim" in args:
            bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()
