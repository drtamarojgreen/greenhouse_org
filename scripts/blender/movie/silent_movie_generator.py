import bpy
import math
import os
import sys
import mathutils
import random

import sys
import os

# Ensure numpy and other dependencies are found even when Blender's environment is constrained
def ensure_dependencies():
    # Common paths for numpy (system and user)
    extra_paths = [
        "/usr/lib/python3/dist-packages",
        os.path.expanduser("~/.local/lib/python3.12/site-packages"),
        os.path.join(os.path.dirname(sys.executable), "lib", "python3.12", "site-packages"),
        os.path.join(os.path.dirname(sys.executable), "lib", "python3.12"),
    ]
    for p in extra_paths:
        if os.path.exists(p) and p not in sys.path:
            sys.path.append(p)

ensure_dependencies()

# Add movie root and assets to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS_ROOT = os.path.join(MOVIE_ROOT, "assets")
for p in [MOVIE_ROOT, ASSETS_ROOT]:
    if p not in sys.path:
        sys.path.append(p)

import plant_humanoid
import gnome_antagonist
import library_props
import futuristic_props
import unity_exporter

# Import scene modules
from scene00_branding import scene_logic as scene00
from scene01_intro import scene_logic as scene01
from scene02_garden import scene_logic as scene02
from scene03_socratic import scene_logic as scene03
from scene04_forge import scene_logic as scene04
from scene05_bridge import scene_logic as scene05
from scene06_resonance import scene_logic as scene06
from scene07_shadow import scene_logic as scene07
from scene08_confrontation import scene_logic as scene08
from scene09_library import scene_logic as scene09
from scene10_futuristic_lab import scene_logic as scene10
from scene11_nature_sanctuary import scene_logic as scene11
from scene12_credits import scene_logic as scene12

class MovieMaster:
    def __init__(self, mode='SILENT_FILM'):
        self.mode = mode # 'SILENT_FILM' or 'UNITY_PREVIEW'
        self.scene = self.setup_engine()
        self.brain = None
        self.neuron = None
        self.h1 = None
        self.h2 = None
        self.gnome = None
        self.scroll = None
        self.book = None
        self.pedestal = None
        self.flower = None

    def setup_engine(self):
        """Initializes the scene based on the desired aesthetic."""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = 5000
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
        if self.mode != 'SILENT_FILM': return

        # Centered at origin, facing the camera at Y=-8
        bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.pi/2, 0, 0))
        text_obj = bpy.context.object
        text_obj.name = f"Title_{frame_start}_{text[:5]}"
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

        # Antagonist
        self.gnome = gnome_antagonist.create_gnome("GloomGnome", mathutils.Vector((5, 5, 0)))

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
                    mat = bpy.data.materials.new(name="BrainMat")
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
                if o.type == 'MESH':
                    mat = bpy.data.materials.new(name="NeuronMat")
                    mat.use_nodes = True
                    o.data.materials.append(mat)

        # Characters
        self.h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42)
        self.h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123)
        self.scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))

        # Bloom Asset (Flower on Herbaceous's head)
        self.flower = plant_humanoid.create_flower(self.h1.location + mathutils.Vector((0, 0, 2.2)))
        self.flower.parent = self.h1
        self.flower.matrix_parent_inverse = self.h1.matrix_world.inverted()

        # Environment
        bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1))
        floor = bpy.context.object
        floor.name = "Floor"
        pillar_locs = [(-8, -8), (8, 8), (-12, 0), (12, 0)]
        for x, y in pillar_locs:
            plant_humanoid.create_inscribed_pillar(mathutils.Vector((x, y, 0)))

    def animate_master(self):
        """Global animation and scene visibility logic."""
        # Gnome retreat
        if self.gnome:
            self.gnome.location = (2, 2, 0)
            self.gnome.keyframe_insert(data_path="location", frame=2600)
            self.gnome.location = (10, 10, 0) # Running away
            self.gnome.keyframe_insert(data_path="location", frame=2800)

        # Visibility ranges for characters/bushes/props
        def set_visibility(objs, ranges):
            for obj in objs:
                obj.hide_render = True
                for rs, re in ranges:
                    obj.keyframe_insert(data_path="hide_render", frame=rs-1)
                    obj.hide_render = False
                    obj.keyframe_insert(data_path="hide_render", frame=rs)
                    obj.hide_render = True
                    obj.keyframe_insert(data_path="hide_render", frame=re)

        plant_keywords = ["Herbaceous", "Arbor", "Scroll", "Bush", "Eye", "ShoulderPlate"]
        plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in plant_keywords) and "GloomGnome" not in obj.name]
        p_ranges = [(501, 650), (751, 950), (1051, 1250), (1601, 1800), (2101, 2500), (2601, 2800), (2901, 3400)]
        set_visibility(plants, p_ranges)

        gnome_keywords = ["GloomGnome", "Mouth", "Cloak", "Staff"]
        gnomes = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in gnome_keywords)]
        g_ranges = [(2101, 2500), (2601, 2800)] # Shadow, Confrontation, and Retreat
        set_visibility(gnomes, g_ranges)

        # Neuron ranges
        if self.neuron:
            self.neuron.hide_render = True
            n_ranges = [(1601, 1800), (1901, 2000), (3001, 3500)]
            for rs, re in n_ranges:
                self.neuron.keyframe_insert(data_path="hide_render", frame=rs-1)
                self.neuron.hide_render = False
                self.neuron.keyframe_insert(data_path="hide_render", frame=rs)
                self.neuron.hide_render = True
                self.neuron.keyframe_insert(data_path="hide_render", frame=re)

            # Pulse and scale in Resonance scene
            self.neuron.scale = (5, 5, 5)
            self.neuron.keyframe_insert(data_path="scale", frame=3000)
            self.neuron.scale = (8, 8, 8)
            self.neuron.keyframe_insert(data_path="scale", frame=3250)
            self.neuron.scale = (5, 5, 5)
            self.neuron.keyframe_insert(data_path="scale", frame=3500)

            # Neuron Emission Pulse
            mat = bpy.data.materials.get("NeuronMat")
            if mat:
                bsdf = mat.node_tree.nodes["Principled BSDF"]
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3001)
                bsdf.inputs["Emission Strength"].default_value = 15.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3250)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3500)

        # Thought Sparks
        self.create_thought_spark(self.h1.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 760, 800)
        self.create_thought_spark(self.h2.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 1060, 1100)

        # Call scene modules
        scene00.setup_scene(self)
        scene01.setup_scene(self)

        # Iris Transitions - Master Timeline Alignment
        self.animate_iris(1, 48, mode='IN')
        self.animate_iris(90, 100, mode='OUT')
        self.animate_iris(101, 110, mode='IN')
        self.animate_iris(190, 200, mode='OUT')
        self.animate_iris(201, 210, mode='IN')
        self.animate_iris(390, 400, mode='OUT')
        self.animate_iris(401, 410, mode='IN')
        self.animate_iris(490, 500, mode='OUT')
        self.animate_iris(501, 510, mode='IN')
        self.animate_iris(640, 650, mode='OUT')
        self.animate_iris(651, 660, mode='IN')
        self.animate_iris(740, 750, mode='OUT')
        self.animate_iris(751, 760, mode='IN')
        self.animate_iris(940, 950, mode='OUT')
        self.animate_iris(951, 960, mode='IN')
        self.animate_iris(1040, 1050, mode='OUT')
        self.animate_iris(1051, 1060, mode='IN')
        self.animate_iris(1240, 1250, mode='OUT')
        self.animate_iris(1251, 1260, mode='IN')
        self.animate_iris(1340, 1350, mode='OUT')
        self.animate_iris(1351, 1360, mode='IN')
        self.animate_iris(1490, 1500, mode='OUT')
        self.animate_iris(1501, 1510, mode='IN')
        self.animate_iris(1590, 1600, mode='OUT')
        self.animate_iris(1601, 1610, mode='IN')
        self.animate_iris(1790, 1800, mode='OUT')
        self.animate_iris(1801, 1810, mode='IN')
        self.animate_iris(1890, 1900, mode='OUT')
        self.animate_iris(1901, 1910, mode='IN')
        self.animate_iris(2490, 2500, mode='OUT')
        self.animate_iris(2501, 2510, mode='IN')
        self.animate_iris(2590, 2600, mode='OUT')
        self.animate_iris(2601, 2610, mode='IN')
        self.animate_iris(2890, 2900, mode='OUT')
        self.animate_iris(2901, 2910, mode='IN')
        self.animate_iris(2990, 3000, mode='OUT')
        self.animate_iris(3001, 3010, mode='IN')
        self.animate_iris(3490, 3500, mode='OUT')
        self.animate_iris(3501, 3510, mode='IN')
        self.animate_iris(3590, 3600, mode='OUT')
        self.animate_iris(3601, 3610, mode='IN')
        self.animate_iris(3790, 3800, mode='OUT')
        self.animate_iris(3801, 3810, mode='IN')
        self.animate_iris(3890, 3900, mode='OUT')
        self.animate_iris(3901, 3910, mode='IN')
        self.animate_iris(4490, 4500, mode='OUT')
        self.animate_iris(4501, 4510, mode='IN')
        self.animate_iris(4990, 5000, mode='OUT')

        scene02.setup_scene(self)
        scene03.setup_scene(self)
        scene04.setup_scene(self)
        scene05.setup_scene(self)
        scene06.setup_scene(self)
        scene07.setup_scene(self)
        scene08.setup_scene(self)
        scene09.setup_scene(self)
        scene10.setup_scene(self)
        scene11.setup_scene(self)
        scene12.setup_scene(self)

        # Character animations
        # Bloom effect
        if self.flower:
            self.flower.scale = (0.01, 0.01, 0.01)
            self.flower.keyframe_insert(data_path="scale", frame=2900)
            self.flower.scale = (1, 1, 1)
            self.flower.keyframe_insert(data_path="scale", frame=3200)

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

        # Swaying animations for Herbaceous and Arbor
        garden_ranges = [(501, 650), (751, 950), (3901, 4100)]
        for char in [self.h1, self.h2]:
            if not char: continue
            for rs, re in garden_ranges:
                for f in range(rs, re + 1, 48):
                    char.rotation_euler[2] = math.radians(-5)
                    char.keyframe_insert(data_path="rotation_euler", frame=f, index=2)
                    if f + 24 <= re:
                        char.rotation_euler[2] = math.radians(5)
                        char.keyframe_insert(data_path="rotation_euler", frame=f + 24, index=2)
                char.rotation_euler[2] = 0
                char.keyframe_insert(data_path="rotation_euler", frame=re, index=2)

        # Asset visibility and basic movement
        if self.brain:
            self.brain.hide_render = True

            # Continuous Z-axis rotation (360 degrees every 400 frames)
            self.brain.rotation_euler[2] = 0
            self.brain.keyframe_insert(data_path="rotation_euler", frame=1, index=2)
            self.brain.rotation_euler[2] = math.radians(360 * (5000 / 400))
            self.brain.keyframe_insert(data_path="rotation_euler", frame=5000, index=2)

            ranges = [(201, 400), (751, 950), (1351, 1500), (1601, 1800), (3001, 3500)]
            for rs, re in ranges:
                self.brain.keyframe_insert(data_path="hide_render", frame=rs-1)
                self.brain.hide_render = False
                self.brain.keyframe_insert(data_path="hide_render", frame=rs)
                self.brain.hide_render = True
                self.brain.keyframe_insert(data_path="hide_render", frame=re)

            # Pulsing
            mat = bpy.data.materials.get("BrainMat")
            if mat:
                bsdf = mat.node_tree.nodes["Principled BSDF"]
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1351)
                bsdf.inputs["Emission Strength"].default_value = 5.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1425)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1500)

                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2901)
                bsdf.inputs["Emission Strength"].default_value = 10.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3150)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3400)

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

    def animate_suspense_flicker(self, frame_start, frame_end):
        """Intensifies flickering for suspenseful moments."""
        sun = bpy.data.objects.get("Sun")
        if not sun: return
        for f in range(frame_start, frame_end, 2):
            sun.data.energy = random.uniform(0.1, 1.5)
            sun.data.keyframe_insert(data_path="energy", frame=f)

    def animate_iris(self, frame_start, frame_end, mode='OUT'):
        """Animates the iris mask in the compositor."""
        if self.mode != 'SILENT_FILM': return
        tree = self.scene.node_tree
        iris = tree.nodes.get("IrisMask")
        if not iris: return

        if mode == 'OUT': # Close to black
            iris.width = 2.0
            iris.height = 2.0
            iris.keyframe_insert(data_path="width", frame=frame_start)
            iris.keyframe_insert(data_path="height", frame=frame_start)
            iris.width = 0.0
            iris.height = 0.0
            iris.keyframe_insert(data_path="width", frame=frame_end)
            iris.keyframe_insert(data_path="height", frame=frame_end)
        else: # IN: Open from black
            iris.width = 0.0
            iris.height = 0.0
            iris.keyframe_insert(data_path="width", frame=frame_start)
            iris.keyframe_insert(data_path="height", frame=frame_start)
            iris.width = 2.0
            iris.height = 2.0
            iris.keyframe_insert(data_path="width", frame=frame_end)
            iris.keyframe_insert(data_path="height", frame=frame_end)

    def setup_camera_keyframes(self, cam):
        title_loc = (0, -8, 0)

        def kf(frame, loc, rot_deg):
            cam.location = loc
            cam.rotation_euler = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))
            cam.keyframe_insert(data_path="location", frame=frame)
            cam.keyframe_insert(data_path="rotation_euler", frame=frame)

        kf(1, title_loc, (90,0,0)) # Title 00
        kf(100, title_loc, (90,0,0))
        kf(101, title_loc, (90,0,0)) # Title 01
        kf(200, title_loc, (90,0,0))
        kf(201, (0,-25,5), (75,0,0)) # Brain focus
        kf(400, (0,-30,8), (75,0,0))
        kf(401, title_loc, (90,0,0)) # Title 02
        kf(500, title_loc, (90,0,0))
        kf(501, (2,-15,2), (85,0,0)) # Garden Action
        kf(650, (-2,-12,1), (85,0,0))
        kf(651, title_loc, (90,0,0)) # Title 03
        kf(750, title_loc, (90,0,0))
        kf(751, (0,-10,2), (80,0,0)) # Socratic Action
        kf(950, (0,-12,3), (80,0,0))
        kf(951, title_loc, (90,0,0)) # Title 04a (Exchange)
        kf(1050, title_loc, (90,0,0))
        kf(1051, (1.5,-8,1.5), (85,0,10)) # Exchange Action
        kf(1250, (-1.5,-8,1.5), (85,0,10))
        kf(1251, title_loc, (90,0,0)) # Title 04b (Forge)
        kf(1350, title_loc, (90,0,0))
        kf(1351, (0,-5,0), (90,0,0)) # Forge Action
        kf(1500, (0,-4,0), (90,0,0))
        kf(1501, title_loc, (90,0,0)) # Title 05
        kf(1600, title_loc, (90,0,0))
        kf(1601, (10,-25,10), (70,0,20)) # Bridge Action / Neuron
        kf(1800, (5,-20,5), (70,0,20))
        kf(1801, title_loc, (90,0,0)) # Title 07
        kf(1900, title_loc, (90,0,0))
        kf(1901, (0,-15,5), (70,0,0)) # Gloom buildup
        kf(2100, (0,-12,3), (70,0,0))
        kf(2101, (5, 5, 2), (80, 0, 45)) # Gnome Entrance
        kf(2300, (2, 2, 1), (80, 0, 45))
        kf(2301, (2, 2, 1), (80, 0, 45)) # Confrontation
        kf(2500, (1, 1, 0.5), (85, 0, 45))
        kf(2501, title_loc, (90,0,0)) # Title 09
        kf(2600, title_loc, (90,0,0))
        kf(2601, (0,-3,1.5), (80,0,0)) # Library Action
        kf(2800, (0,-2,1.5), (80,0,0))
        kf(2801, (0,-8,5), (85,0,0)) # Transition to Resonance
        kf(2900, (0,-8,5), (85,0,0))
        kf(2901, title_loc, (90,0,0)) # Title 06
        kf(3000, title_loc, (90,0,0))
        kf(3001, (0,-15,2), (85,0,0)) # Resonance Action
        kf(3500, (0,-10,3), (85,0,0))
        kf(3501, title_loc, (90,0,0)) # Title 10
        kf(3600, title_loc, (90,0,0))
        kf(3601, (0,-5,2), (85,0,0)) # Lab Action
        kf(3800, (0,-4,2), (85,0,0))
        kf(3801, title_loc, (90,0,0)) # Title 11
        kf(3900, title_loc, (90,0,0))
        kf(3901, (0,-15,5), (70,0,0)) # Sanctuary Action
        kf(4100, (0,-12,3), (70,0,0))
        kf(4101, (0,-40,15), (70,0,0)) # Finale
        kf(4500, (0,-35,12), (70,0,0))
        kf(4501, (0,-10,0), (90,0,0)) # Credits
        kf(5000, (0,-10,0), (90,0,0))

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
            for f in range(1, 5001, 2):
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

            # 6. Iris Transition
            iris_mask = tree.nodes.new('CompositorNodeEllipseMask')
            iris_mask.name = "IrisMask"
            iris_mask.width = 2.0 # Default open
            iris_mask.height = 2.0
            mix_iris = tree.nodes.new('CompositorNodeMixRGB')
            mix_iris.blend_type = 'MULTIPLY'
            mix_iris.inputs[0].default_value = 1.0

            tree.links.new(mix_vignette.outputs['Image'], mix_iris.inputs[1])
            tree.links.new(iris_mask.outputs['Mask'], mix_iris.inputs[2])
            tree.links.new(mix_iris.outputs['Image'], composite.inputs['Image'])
        else:
            # Unity style (Simple Passthrough with Bloom in Eevee)
            self.scene.eevee.use_bloom = True
            self.scene.eevee.use_gtao = True
            tree.links.new(rl.outputs['Image'], composite.inputs['Image'])

    def run(self):
        self.load_assets()

        # Lighting (Created before animation logic needs them)
        bpy.ops.object.light_add(type='SUN', location=(10,-10,20))
        bpy.context.object.name = "Sun"
        bpy.ops.object.light_add(type='SPOT', location=(0,-15,10))
        bpy.context.object.name = "Spot"

        self.setup_compositor()
        self.animate_master()

def main():
    argv = sys.argv
    if "--" in argv:
        args = argv[argv.index("--") + 1:]
    else:
        args = []

    mode = 'SILENT_FILM'
    if '--unity' in args: mode = 'UNITY_PREVIEW'

    master = MovieMaster(mode=mode)

    # Check for range overrides
    start_frame = None
    end_frame = None
    if '--start-frame' in args:
        start_frame = int(args[args.index('--start-frame') + 1])
    if '--end-frame' in args:
        end_frame = int(args[args.index('--end-frame') + 1])

    master.run()

    # Apply frame range after run (which sets defaults)
    if start_frame is not None:
        master.scene.frame_start = start_frame
    if end_frame is not None:
        master.scene.frame_end = end_frame

    if '--export-unity' in args:
        unity_exporter.run_unity_pipeline()

    if '--render-output' in args:
        out_path = args[args.index('--render-output') + 1]
        master.scene.render.filepath = out_path
        if '--frame' not in args:
            master.scene.render.image_settings.file_format = 'FFMPEG'
            master.scene.render.ffmpeg.format = 'MPEG4'
            master.scene.render.ffmpeg.codec = 'H264'
            master.scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
        else:
            master.scene.render.image_settings.file_format = 'PNG'

    if '--frame' in args:
        f_num = int(args[args.index('--frame') + 1])
        master.scene.frame_set(f_num)
        if '--render-output' not in args:
            master.scene.render.filepath = f"frame_{f_num}.png"
        bpy.ops.render.render(write_still=True)

    if '--render-anim' in args:
        print(f"Starting animation render from {master.scene.frame_start} to {master.scene.frame_end} to {master.scene.render.filepath}...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")

if __name__ == "__main__":
    main()
