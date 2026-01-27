import bpy
import math
import os
import sys
import mathutils
import random

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.abspath(__file__))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import plant_humanoid
import unity_exporter

# Import scene modules
from scene01_intro import scene_logic as scene01
from scene02_garden import scene_logic as scene02
from scene03_socratic import scene_logic as scene03
from scene04_forge import scene_logic as scene04
from scene05_bridge import scene_logic as scene05
from scene06_resonance import scene_logic as scene06

class MovieMaster:
    def __init__(self, mode='SILENT_FILM'):
        self.mode = mode # 'SILENT_FILM' or 'UNITY_PREVIEW'
        self.scene = self.setup_engine()
        self.brain = None
        self.neuron = None
        self.h1 = None
        self.h2 = None
        self.scroll = None

    def setup_engine(self):
        """Initializes the scene based on the desired aesthetic."""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = 2500
        scene.render.fps = 24

        if self.mode == 'SILENT_FILM':
            scene.render.engine = 'CYCLES'
            scene.cycles.device = 'CPU'
            scene.cycles.samples = 128
            scene.cycles.use_denoising = False
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0, 0, 0, 1)
        else: # UNITY_PREVIEW (Eevee)
            scene.render.engine = 'BLENDER_EEVEE'
            scene.eevee.taa_render_samples = 64
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0.05, 0.05, 0.1, 1) # Dark blue sky

        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        return scene

    def create_intertitle(self, text, frame_start, frame_end):
        """Creates a classic silent movie intertitle card."""
        if self.mode != 'SILENT_FILM': return # Skip intertitles in Unity mode maybe?

        bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
        text_obj = bpy.context.object
        text_obj.name = f"Title_{frame_start}"
        text_obj.data.body = text
        text_obj.data.align_x = 'CENTER'
        text_obj.data.align_y = 'CENTER'
        text_obj.data.size = 1.0
        text_obj.data.extrude = 0.05

        mat = bpy.data.materials.new(name=f"TextMat_{frame_start}")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
            bsdf.inputs["Emission Strength"].default_value = 1.0
        text_obj.data.materials.append(mat)

        text_obj.hide_render = True
        text_obj.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        text_obj.hide_render = False
        text_obj.keyframe_insert(data_path="hide_render", frame=frame_start)
        text_obj.hide_render = True
        text_obj.keyframe_insert(data_path="hide_render", frame=frame_end)

    def load_assets(self):
        """Loads models and characters."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # Load Brain
        brain_path = os.path.join(base_path, "brain.fbx")
        if os.path.exists(brain_path):
            bpy.ops.import_scene.fbx(filepath=brain_path)
            imported = bpy.context.selected_objects
            self.brain = bpy.data.objects.new("BrainGroup", None)
            bpy.context.scene.collection.objects.link(self.brain)
            for o in imported:
                o.parent = self.brain
                o.matrix_parent_inverse = self.brain.matrix_world.inverted()
                if o.type == 'MESH':
                    mat = bpy.data.materials.new(name="MeshMat")
                    mat.use_nodes = True
                    o.data.materials.append(mat)

        # Load Neuron
        neuron_path = os.path.join(base_path, "neuron.fbx")
        if os.path.exists(neuron_path):
            bpy.ops.import_scene.fbx(filepath=neuron_path)
            imported = bpy.context.selected_objects
            self.neuron = bpy.data.objects.new("NeuronGroup", None)
            bpy.context.scene.collection.objects.link(self.neuron)
            for o in imported:
                o.parent = self.neuron
                o.matrix_parent_inverse = self.neuron.matrix_world.inverted()

        # Characters
        self.h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42)
        self.h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123)
        self.scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))

        # Environment
        bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1))
        floor = bpy.context.object
        floor.name = "Floor"
        pillar_locs = [(-8, -8), (8, 8), (-12, 0), (12, 0)]
        for x, y in pillar_locs:
            plant_humanoid.create_inscribed_pillar(mathutils.Vector((x, y, 0)))

    def animate_master(self):
        """Global animation and scene visibility logic."""
        # Visibility ranges for characters/bushes
        plant_objs = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["Herbaceous", "Arbor", "Scroll", "Bush"])]
        p_ranges = [(501, 650), (751, 950), (1051, 1250), (1601, 1800), (2101, 2400)]
        for p in plant_objs:
            p.hide_render = True
            for rs, re in p_ranges:
                p.keyframe_insert(data_path="hide_render", frame=rs-1)
                p.hide_render = False
                p.keyframe_insert(data_path="hide_render", frame=rs)
                p.hide_render = True
                p.keyframe_insert(data_path="hide_render", frame=re)

        # Neuron ranges
        if self.neuron:
            self.neuron.hide_render = True
            n_ranges = [(1601, 1800), (1901, 2000)]
            for rs, re in n_ranges:
                self.neuron.keyframe_insert(data_path="hide_render", frame=rs-1)
                self.neuron.hide_render = False
                self.neuron.keyframe_insert(data_path="hide_render", frame=rs)
                self.neuron.hide_render = True
                self.neuron.keyframe_insert(data_path="hide_render", frame=re)
            self.neuron.scale = (5, 5, 5)

        # Thought Sparks
        self.create_thought_spark(self.h1.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 760, 800)
        self.create_thought_spark(self.h2.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 1060, 1100)

        # Call scene modules
        scene01.setup_scene(self)
        scene02.setup_scene(self)
        scene03.setup_scene(self)
        scene04.setup_scene(self)
        scene05.setup_scene(self)
        scene06.setup_scene(self)

        # Character animations
        self.h1.rotation_euler = (0, 0, 0)
        self.h1.keyframe_insert(data_path="rotation_euler", frame=751)
        self.h1.rotation_euler = (0, 0, math.radians(-30))
        self.h1.keyframe_insert(data_path="rotation_euler", frame=850)
        self.h1.rotation_euler = (0, 0, 0)
        self.h1.keyframe_insert(data_path="rotation_euler", frame=950)

        self.h2.rotation_euler = (0, 0, 0)
        self.h2.keyframe_insert(data_path="rotation_euler", frame=1051)
        self.h2.rotation_euler = (0, 0, math.radians(45))
        self.h2.keyframe_insert(data_path="rotation_euler", frame=1150)
        self.h2.rotation_euler = (0, 0, 0)
        self.h2.keyframe_insert(data_path="rotation_euler", frame=1250)

        # Scroll
        self.scroll.location = mathutils.Vector((1.8, 1.0, 1.2))
        self.scroll.keyframe_insert(data_path="location", frame=1051)
        self.scroll.location = mathutils.Vector((-1.8, 0.0, 1.0))
        self.scroll.keyframe_insert(data_path="location", frame=1150)
        self.scroll.keyframe_insert(data_path="location", frame=1250)

        # Asset visibility and basic movement
        if self.brain:
            self.brain.hide_render = True
            ranges = [(201, 400), (751, 950), (1351, 1500), (1601, 1800), (2101, 2400)]
            for rs, re in ranges:
                self.brain.keyframe_insert(data_path="hide_render", frame=rs-1)
                self.brain.hide_render = False
                self.brain.keyframe_insert(data_path="hide_render", frame=rs)
                self.brain.hide_render = True
                self.brain.keyframe_insert(data_path="hide_render", frame=re)

            # Pulsing
            mat = bpy.data.materials.get("SilentMeshMat")
            if mat:
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

        # Camera sequence (simplified version for modularity)
        bpy.ops.object.camera_add(location=(0, -8, 0), rotation=(math.radians(90), 0, 0))
        cam = bpy.context.object
        self.scene.camera = cam
        # ... (Include the camera keyframes from the previous version here) ...
        # For brevity, I will re-implement the camera sequence in a helper
        self.setup_camera_keyframes(cam)

    def create_thought_spark(self, start_loc, end_loc, frame_start, frame_end):
        """Creates a small emissive spark that travels."""
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.05, location=start_loc)
        spark = bpy.context.object
        spark.name = "ThoughtSpark"

        mat = bpy.data.materials.new(name="SparkMat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
        bsdf.inputs["Emission Strength"].default_value = 10.0
        spark.data.materials.append(mat)

        # Visibility
        spark.hide_render = True
        spark.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        spark.hide_render = False
        spark.keyframe_insert(data_path="hide_render", frame=frame_start)
        spark.hide_render = True
        spark.keyframe_insert(data_path="hide_render", frame=frame_end)

        # Motion
        spark.location = start_loc
        spark.keyframe_insert(data_path="location", frame=frame_start)
        spark.location = end_loc
        spark.keyframe_insert(data_path="location", frame=frame_end)
        return spark

    def setup_camera_keyframes(self, cam):
        title_loc = (0, -8, 0)
        title_rot = (math.radians(90), 0, 0)

        # Keyframe helper
        def kf(frame, loc, rot_deg):
            cam.location = loc
            cam.rotation_euler = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))
            cam.keyframe_insert(data_path="location", frame=frame)
            cam.keyframe_insert(data_path="rotation_euler", frame=frame)

        kf(1, title_loc, (90,0,0))
        kf(500, title_loc, (90,0,0))

        # Garden
        kf(501, (2,-15,2), (85,0,0))
        kf(650, (-2,-12,1), (85,0,0))

        # Dialogue
        kf(751, (0,-10,2), (80,0,0))
        kf(950, (0,-12,3), (80,0,0))

        # Exchange
        kf(1051, (1.5,-8,1.5), (85,0,10))
        kf(1250, (-1.5,-8,1.5), (85,0,10))

        # Forge
        kf(1351, (0,-5,0), (90,0,0))
        kf(1500, (0,-4,0), (90,0,0))

        # Bridge
        kf(1601, (10,-25,10), (70,0,20))
        kf(1800, (5,-20,5), (70,0,20))

        # Finale
        kf(2101, (0,-40,15), (70,0,0))
        kf(2400, (0,-35,12), (70,0,0))

        kf(2401, title_loc, (90,0,0))
        kf(2500, title_loc, (90,0,0))

    def setup_compositor(self):
        self.scene.use_nodes = True
        tree = self.scene.node_tree
        for node in tree.nodes: tree.nodes.remove(node)

        rl = tree.nodes.new('CompositorNodeRLayers')
        composite = tree.nodes.new('CompositorNodeComposite')

        if self.mode == 'SILENT_FILM':
            bw = tree.nodes.new('CompositorNodeRGBToBW')
            bright = tree.nodes.new('CompositorNodeBrightContrast')
            bright.inputs['Contrast'].default_value = 1.6
            for f in range(1, 2501, 2):
                bright.inputs['Bright'].default_value = random.uniform(-0.02, 0.02)
                bright.inputs['Bright'].keyframe_insert(data_path="default_value", frame=f)

            # Film Grain
            if "FilmNoise" not in bpy.data.textures: bpy.data.textures.new("FilmNoise", type='NOISE')
            noise = tree.nodes.new('CompositorNodeTexture')
            noise.texture = bpy.data.textures["FilmNoise"]
            mix_grain = tree.nodes.new('CompositorNodeMixRGB')
            mix_grain.blend_type = 'OVERLAY'
            mix_grain.inputs[0].default_value = 0.15

            # Scratches
            if "Scratches" not in bpy.data.textures:
                stex = bpy.data.textures.new("Scratches", type='MUSGRAVE')
                stex.noise_scale = 10.0
            scratches = tree.nodes.new('CompositorNodeTexture')
            scratches.texture = bpy.data.textures["Scratches"]
            mix_scratches = tree.nodes.new('CompositorNodeMixRGB')
            mix_scratches.blend_type = 'MULTIPLY'
            mix_scratches.inputs[0].default_value = 0.1

            # Vignette
            mask = tree.nodes.new('CompositorNodeEllipseMask')
            mask.width, mask.height = 0.95, 0.85
            blur = tree.nodes.new('CompositorNodeBlur')
            blur.size_x = blur.size_y = 250
            mix_vignette = tree.nodes.new('CompositorNodeMixRGB')
            mix_vignette.blend_type = 'MULTIPLY'

            # Links
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
        else:
            # Unity style (Simple Passthrough with Bloom in Eevee)
            self.scene.eevee.use_bloom = True
            self.scene.eevee.use_gtao = True
            tree.links.new(rl.outputs['Image'], composite.inputs['Image'])

    def run(self):
        self.load_assets()
        self.animate_master()
        self.setup_compositor()

        # Lighting
        bpy.ops.object.light_add(type='SUN', location=(10,-10,20))
        bpy.ops.object.light_add(type='SPOT', location=(0,-15,10))

def main():
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = []

    mode = 'SILENT_FILM'
    if '--unity' in args: mode = 'UNITY_PREVIEW'

    master = MovieMaster(mode=mode)
    master.run()

    if '--export-unity' in args:
        unity_exporter.run_unity_pipeline()

    if '--render-output' in args:
        out_path = args[args.index('--render-output') + 1]
        master.scene.render.filepath = out_path
        master.scene.render.image_settings.file_format = 'FFMPEG'
        master.scene.render.ffmpeg.format = 'MPEG4'
        master.scene.render.ffmpeg.codec = 'H264'
        master.scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'

    if '--frame' in args:
        f_num = int(args[args.index('--frame') + 1])
        master.scene.frame_set(f_num)
        if '--render-output' not in args:
            master.scene.render.filepath = f"frame_{f_num}.png"
        bpy.ops.render.render(write_still=True)

    if '--render-anim' in args:
        print(f"Starting full animation render to {master.scene.render.filepath}...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")

if __name__ == "__main__":
    main()
