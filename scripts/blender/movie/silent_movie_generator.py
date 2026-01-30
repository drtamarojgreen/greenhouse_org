import bpy
import math
import os
import sys
import mathutils
import random

# Ensure numpy and other dependencies are found even when Blender's environment is constrained
def ensure_dependencies():
    import site
    # Include user site-packages and system site-packages
    paths = site.getsitepackages()
    if hasattr(site, 'getusersitepackages'):
        paths.append(site.getusersitepackages())

    for p in paths:
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
import greenhouse_structure
import environment_props
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
        self.greenhouse = None

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
            scene.cycles.samples = 32
            scene.cycles.use_denoising = False
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0, 0, 0, 1)
        else: # UNITY_PREVIEW (Eevee)
            scene.render.engine = 'BLENDER_EEVEE'
            scene.eevee.taa_render_samples = 64
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0.05, 0.05, 0.1, 1)

        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        return scene

    def create_intertitle(self, text, frame_start, frame_end):
        """Creates a classic silent movie intertitle card."""
        if self.mode != 'SILENT_FILM': return

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

    def create_spinning_logo(self, text_content, frame_start, frame_end):
        """Creates ELASTIC spinning 3D letters for branding."""
        mat = bpy.data.materials.new(name="GH_Logo_Mat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (1, 1, 1, 1)
        bsdf.inputs["Emission Strength"].default_value = 1.0

        char_spacing = 0.8
        start_x = -((len(text_content) - 1) * char_spacing) / 2

        objs = []
        for i, char in enumerate(text_content):
            # Move logo letters to Y=0 so they are in front of camera at Y=-8
            bpy.ops.object.text_add(location=(start_x + i * char_spacing, 0, 0))
            text_obj = bpy.context.object
            text_obj.name = f"LogoChar_{i}_{char}"
            text_obj.data.body = char
            text_obj.data.extrude = 0.1
            text_obj.data.align_x = 'CENTER'
            text_obj.data.align_y = 'CENTER'
            text_obj.data.materials.append(mat)
            text_obj.rotation_euler[0] = math.radians(90)

            rot_axis = 2
            num_rotations = random.uniform(1, 2)
            total_angle = math.radians(360 * num_rotations)

            text_obj.keyframe_insert(data_path="rotation_euler", index=rot_axis, frame=frame_start)
            text_obj.rotation_euler[rot_axis] += total_angle
            text_obj.keyframe_insert(data_path="rotation_euler", index=rot_axis, frame=frame_end)

            if text_obj.animation_data and text_obj.animation_data.action:
                for fcurve in text_obj.animation_data.action.fcurves:
                    if fcurve.data_path == "rotation_euler" and fcurve.array_index == rot_axis:
                        for kp in fcurve.keyframe_points:
                            kp.interpolation = 'ELASTIC'
                            kp.easing = 'EASE_OUT'

            text_obj.hide_render = True
            text_obj.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
            text_obj.hide_render = False
            text_obj.keyframe_insert(data_path="hide_render", frame=frame_start)
            text_obj.hide_render = True
            text_obj.keyframe_insert(data_path="hide_render", frame=frame_end)
            objs.append(text_obj)
        return objs

    def load_assets(self):
        """Loads models and characters."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        self.greenhouse = greenhouse_structure.create_greenhouse_structure()
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
                    bpy.ops.object.select_all(action='DESELECT')
                    o.select_set(True)
                    bpy.context.view_layer.objects.active = o
                    bpy.ops.object.shade_smooth()
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
                    bpy.ops.object.select_all(action='DESELECT')
                    o.select_set(True)
                    bpy.context.view_layer.objects.active = o
                    bpy.ops.object.shade_smooth()
                    mat = bpy.data.materials.new(name="NeuronMat")
                    mat.use_nodes = True
                    o.data.materials.append(mat)

        self.h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42)
        self.h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123)
        self.scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))
        self.flower = plant_humanoid.create_flower(self.h1.location + mathutils.Vector((0, 0, 2.2)))
        self.flower.parent = self.h1
        self.flower.matrix_parent_inverse = self.h1.matrix_world.inverted()

        environment_props.create_stage_floor()
        environment_props.setup_volumetric_haze()

        pillar_locs = [(-8, -8), (8, 8), (-12, 0), (12, 0)]
        for x, y in pillar_locs:
            plant_humanoid.create_inscribed_pillar(mathutils.Vector((x, y, 0)))

    def animate_master(self):
        """Global animation and scene visibility logic."""
        if self.gnome:
            self.gnome.location = (2, 2, 0)
            self.gnome.keyframe_insert(data_path="location", frame=2600)
            self.gnome.location = (10, 10, 0)
            self.gnome.keyframe_insert(data_path="location", frame=2800)

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
        p_ranges = [(501, 650), (751, 950), (1051, 1250), (1601, 1800), (2101, 2500), (2601, 2800), (2901, 3400), (3901, 4100)]
        set_visibility(plants, p_ranges)

        gh_objs = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["GH_", "Greenhouse_Structure", "Pane"])]
        gh_ranges = [(401, 650), (2901, 3500), (3901, 4100)]
        set_visibility(gh_objs, gh_ranges)

        gnomes = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["GloomGnome", "Mouth", "Cloak", "Staff"])]
        g_ranges = [(2101, 2500), (2601, 2800)]
        set_visibility(gnomes, g_ranges)

        if self.neuron:
            self.neuron.hide_render = True
            n_ranges = [(1251, 1500), (1601, 1800), (1901, 2000), (3001, 3500)]
            for rs, re in n_ranges:
                self.neuron.keyframe_insert(data_path="hide_render", frame=rs-1)
                self.neuron.hide_render = False
                self.neuron.keyframe_insert(data_path="hide_render", frame=rs)
                self.neuron.hide_render = True
                self.neuron.keyframe_insert(data_path="hide_render", frame=re)

            self.neuron.scale = (1, 1, 1)
            self.neuron.keyframe_insert(data_path="scale", frame=1251)
            self.neuron.scale = (3, 3, 3)
            self.neuron.keyframe_insert(data_path="scale", frame=1425)
            self.neuron.scale = (1, 1, 1)
            self.neuron.keyframe_insert(data_path="scale", frame=1500)

            self.neuron.scale = (5, 5, 5)
            self.neuron.keyframe_insert(data_path="scale", frame=3000)
            self.neuron.scale = (8, 8, 8)
            self.neuron.keyframe_insert(data_path="scale", frame=3250)
            self.neuron.scale = (5, 5, 5)
            self.neuron.keyframe_insert(data_path="scale", frame=3500)

            mat = bpy.data.materials.get("NeuronMat")
            if mat:
                bsdf = mat.node_tree.nodes["Principled BSDF"]
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3001)
                bsdf.inputs["Emission Strength"].default_value = 15.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3250)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3500)

        self.create_thought_spark(self.h1.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 760, 800)
        self.create_thought_spark(self.h2.location + mathutils.Vector((0,0,2)), mathutils.Vector((0,0,0)), 1060, 1100)
        self.create_spinning_logo("GreenhouseMD", 1, 100)

        if self.brain:
            b_loc = self.brain.location
            self.create_diagnostic_highlight("Thalamus", b_loc + mathutils.Vector((0, 0.5, 0.5)), 3620, 3680, color=(0, 0.5, 1, 1))
            self.create_diagnostic_highlight("Hypothalamus", b_loc + mathutils.Vector((0, -0.5, 0)), 3700, 3760, color=(1, 0.5, 0, 1))

        bpy.ops.object.empty_add(type='PLAIN_AXES')
        gaze = bpy.context.object
        gaze.name = "GazeTarget"
        for char_name in ["Herbaceous", "Arbor"]:
            head = bpy.data.objects.get(f"{char_name}_Head")
            if head:
                for eye in head.children:
                    if "Eye" in eye.name:
                        plant_humanoid.add_tracking_constraint(eye, gaze)

        gaze.location = (0, 0, 5)
        gaze.keyframe_insert(data_path="location", frame=1)
        gaze.location = (2, 0, 2)
        gaze.keyframe_insert(data_path="location", frame=751)
        gaze.location = (-2, 0, 2)
        gaze.keyframe_insert(data_path="location", frame=1051)
        if self.gnome:
            gaze.location = (0, 0, 0)
            gaze.parent = self.gnome
            gaze.keyframe_insert(data_path="location", frame=2101)

        if self.h1:
            self.h1.rotation_euler[0] = 0
            self.h1.keyframe_insert(data_path="rotation_euler", frame=750, index=0)
            self.h1.rotation_euler[0] = math.radians(15)
            self.h1.keyframe_insert(data_path="rotation_euler", frame=850, index=0)
            self.h1.rotation_euler[0] = 0
            self.h1.keyframe_insert(data_path="rotation_euler", frame=950, index=0)

        # Lifelike breathing animation
        for char in [self.h1, self.h2]:
            if not char: continue
            base_z = char.scale.z
            for f in range(1, 5001, 72): # ~3 seconds per breath
                char.scale.z = base_z
                char.keyframe_insert(data_path="scale", frame=f, index=2)
                char.scale.z = base_z * 1.02
                char.keyframe_insert(data_path="scale", frame=f + 36, index=2)

        scene00.setup_scene(self)
        scene01.setup_scene(self)

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

        self.scroll.location = mathutils.Vector((1.8, 1.0, 1.2))
        self.scroll.keyframe_insert(data_path="location", frame=1051)
        self.scroll.location = mathutils.Vector((-1.8, 0.0, 1.0))
        self.scroll.keyframe_insert(data_path="location", frame=1150)
        self.scroll.keyframe_insert(data_path="location", frame=1250)

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

        if self.brain:
            self.brain.hide_render = True
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

            mat = bpy.data.materials.get("BrainMat")
            if mat:
                bsdf = mat.node_tree.nodes["Principled BSDF"]
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=751)
                bsdf.inputs["Emission Strength"].default_value = 3.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=850)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=950)

                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1351)
                bsdf.inputs["Emission Strength"].default_value = 5.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1425)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=1500)

                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2601)
                bsdf.inputs["Emission Strength"].default_value = 4.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2700)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2800)

                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=2901)
                bsdf.inputs["Emission Strength"].default_value = 10.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3150)
                bsdf.inputs["Emission Strength"].default_value = 0.0
                bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3400)

        bpy.ops.object.camera_add(location=(0, -8, 0), rotation=(math.radians(90), 0, 0))
        cam = bpy.context.object
        self.scene.camera = cam

        if self.mode == 'SILENT_FILM':
            if not cam.animation_data: cam.animation_data_create()
            if not cam.animation_data.action: cam.animation_data.action = bpy.data.actions.new(name="CamShake")
            for axis in range(3):
                fcurve = cam.animation_data.action.fcurves.new(data_path="rotation_euler", index=axis)
                noise = fcurve.modifiers.new(type='NOISE')
                noise.strength = 0.005
                noise.scale = 2.0

        self.setup_camera_keyframes(cam)

    def create_diagnostic_highlight(self, name, location, frame_start, frame_end, color=(1,1,1,1)):
        """Creates a localized glowing sphere on the brain."""
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.5, location=location)
        scan = bpy.context.object
        scan.name = f"Diag_{name}"
        mat = bpy.data.materials.new(name=f"Mat_{name}")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Emission Strength"].default_value = 0.0
        mat.blend_method = 'BLEND'
        scan.data.materials.append(mat)
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=frame_start)
        bsdf.inputs["Emission Strength"].default_value = 10.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=(frame_start+frame_end)//2)
        bsdf.inputs["Emission Strength"].default_value = 0.0
        bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=frame_end)
        scan.hide_render = True
        scan.keyframe_insert(data_path="hide_render", frame=frame_start - 1)
        scan.hide_render = False
        scan.keyframe_insert(data_path="hide_render", frame=frame_start)
        scan.hide_render = True
        scan.keyframe_insert(data_path="hide_render", frame=frame_end)
        return scan

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

    def animate_iris(self, frame_start, frame_end, mode='OUT'):
        """Animates the iris mask and Chemical Burn in the compositor."""
        if self.mode != 'SILENT_FILM': return
        tree = self.scene.node_tree
        iris = tree.nodes.get("IrisMask")
        burn = tree.nodes.get("BurnMix")
        if not iris: return

        if mode == 'OUT':
            iris.width = 2.0
            iris.height = 2.0
            iris.keyframe_insert(data_path="width", frame=frame_start)
            iris.keyframe_insert(data_path="height", frame=frame_start)
            iris.width = 0.0
            iris.height = 0.0
            iris.keyframe_insert(data_path="width", frame=frame_end)
            iris.keyframe_insert(data_path="height", frame=frame_end)
            if burn:
                burn.inputs[0].default_value = 0.0
                burn.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)
                burn.inputs[0].default_value = 0.8
                burn.inputs[0].keyframe_insert(data_path="default_value", frame=(frame_start+frame_end)//2)
                burn.inputs[0].default_value = 0.0
                burn.inputs[0].keyframe_insert(data_path="default_value", frame=frame_end)
        else:
            iris.width = 0.0
            iris.height = 0.0
            iris.keyframe_insert(data_path="width", frame=frame_start)
            iris.keyframe_insert(data_path="height", frame=frame_start)
            iris.width = 2.0
            iris.height = 2.0
            iris.keyframe_insert(data_path="width", frame=frame_end)
            iris.keyframe_insert(data_path="height", frame=frame_end)
            if burn:
                burn.inputs[0].default_value = 0.0
                burn.inputs[0].keyframe_insert(data_path="default_value", frame=frame_start)
                burn.inputs[0].default_value = 0.8
                burn.inputs[0].keyframe_insert(data_path="default_value", frame=(frame_start+frame_end)//2)
                burn.inputs[0].default_value = 0.0
                burn.inputs[0].keyframe_insert(data_path="default_value", frame=frame_end)

    def setup_camera_keyframes(self, cam):
        title_loc = (0, -8, 0)
        def kf(frame, loc, rot_deg):
            cam.location = loc
            cam.rotation_euler = (math.radians(rot_deg[0]), math.radians(rot_deg[1]), math.radians(rot_deg[2]))
            cam.keyframe_insert(data_path="location", frame=frame)
            cam.keyframe_insert(data_path="rotation_euler", frame=frame)

        kf(1, title_loc, (90,0,0))
        kf(100, title_loc, (90,0,0))
        kf(101, title_loc, (90,0,0))
        kf(200, title_loc, (90,0,0))
        kf(201, (0,-25,5), (75,0,0))
        kf(400, (0,-30,8), (75,0,0))
        kf(401, title_loc, (90,0,0))
        kf(500, title_loc, (90,0,0))
        kf(501, (2,-15,2), (85,0,0))
        kf(650, (-2,-12,1), (85,0,0))
        kf(651, title_loc, (90,0,0))
        kf(750, title_loc, (90,0,0))
        kf(751, (0,-10,2), (80,0,0))
        kf(950, (0,-12,3), (80,0,0))
        kf(951, title_loc, (90,0,0))
        kf(1050, title_loc, (90,0,0))
        kf(1051, (1.5,-8,1.5), (85,0,10))
        kf(1250, (-1.5,-8,1.5), (85,0,10))
        kf(1251, title_loc, (90,0,0))
        kf(1350, title_loc, (90,0,0))
        kf(1351, (0,-5,0), (90,0,0))
        kf(1500, (0,-4,0), (90,0,0))
        kf(1501, title_loc, (90,0,0))
        kf(1600, title_loc, (90,0,0))
        kf(1601, (10,-25,10), (70,0,20))
        kf(1800, (5,-20,5), (70,0,20))
        kf(1801, title_loc, (90,0,0))
        kf(1900, title_loc, (90,0,0))
        kf(1901, (0,-15,5), (70,0,0))
        kf(2100, (0,-12,3), (70,0,0))
        kf(2101, (10, 10, 5), (75, 0, 45)) # Wider shot of Gnome entrance
        kf(2300, (6, 6, 3), (80, 0, 45))
        kf(2301, (6, 6, 3), (80, 0, 45)) # Confrontation
        kf(2500, (4, 4, 2), (85, 0, 45))
        kf(2501, title_loc, (90,0,0))
        kf(2600, title_loc, (90,0,0))
        kf(2601, (0,-3,1.5), (80,0,0))
        kf(2800, (0,-2,1.5), (80,0,0))
        kf(2801, (0,-8,5), (85,0,0))
        kf(2900, (0,-8,5), (85,0,0))
        kf(2901, title_loc, (90,0,0))
        kf(3000, title_loc, (90,0,0))
        kf(3001, (0,-15,2), (85,0,0))
        kf(3500, (0,-10,3), (85,0,0))
        kf(3501, title_loc, (90,0,0))
        kf(3600, title_loc, (90,0,0))
        kf(3601, (0,-5,2), (85,0,0))
        kf(3800, (0,-4,2), (85,0,0))
        kf(3801, title_loc, (90,0,0))
        kf(3900, title_loc, (90,0,0))
        kf(3901, (0,-15,5), (70,0,0))
        kf(4100, (0,-12,3), (70,0,0))
        kf(4101, (0,-40,15), (70,0,0))
        kf(4500, (0,-35,12), (70,0,0))
        kf(4501, (0,-10,0), (90,0,0))
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
            bright.inputs['Contrast'].default_value = 2.5
            for f in range(1, 5001, 2):
                bright.inputs['Bright'].default_value = random.uniform(-0.02, 0.02)
                bright.inputs['Bright'].keyframe_insert(data_path="default_value", frame=f)
            if "FilmNoise" not in bpy.data.textures: bpy.data.textures.new("FilmNoise", type='NOISE')
            noise = tree.nodes.new('CompositorNodeTexture')
            noise.texture = bpy.data.textures["FilmNoise"]
            mix_grain = tree.nodes.new('CompositorNodeMixRGB')
            mix_grain.blend_type = 'OVERLAY'
            mix_grain.inputs[0].default_value = 0.15
            if "Scratches" not in bpy.data.textures:
                stex = bpy.data.textures.new("Scratches", type='MUSGRAVE')
                stex.noise_scale = 10.0
            scratches = tree.nodes.new('CompositorNodeTexture')
            scratches.texture = bpy.data.textures["Scratches"]
            mix_scratches = tree.nodes.new('CompositorNodeMixRGB')
            mix_scratches.blend_type = 'MULTIPLY'
            mix_scratches.inputs[0].default_value = 0.1
            mask = tree.nodes.new('CompositorNodeEllipseMask')
            mask.width, mask.height = 0.95, 0.85
            blur = tree.nodes.new('CompositorNodeBlur')
            blur.size_x = blur.size_y = 250
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
            iris_mask = tree.nodes.new('CompositorNodeEllipseMask')
            iris_mask.name = "IrisMask"
            iris_mask.width = 2.0
            iris_mask.height = 2.0
            mix_iris = tree.nodes.new('CompositorNodeMixRGB')
            mix_iris.blend_type = 'MULTIPLY'
            mix_iris.inputs[0].default_value = 1.0
            tree.links.new(mix_vignette.outputs['Image'], mix_iris.inputs[1])
            tree.links.new(iris_mask.outputs['Mask'], mix_iris.inputs[2])
            if "ChemicalBurn" not in bpy.data.textures:
                burn_tex = bpy.data.textures.new("ChemicalBurn", type='MUSGRAVE')
                burn_tex.noise_scale = 2.0
            else:
                burn_tex = bpy.data.textures["ChemicalBurn"]
            burn_node = tree.nodes.new('CompositorNodeTexture')
            burn_node.texture = burn_tex
            mix_burn = tree.nodes.new('CompositorNodeMixRGB')
            mix_burn.blend_type = 'ADD'
            mix_burn.inputs[0].default_value = 0.0
            mix_burn.name = "BurnMix"
            tree.links.new(mix_iris.outputs['Image'], mix_burn.inputs[1])
            tree.links.new(burn_node.outputs['Value'], mix_burn.inputs[2])
            tree.links.new(mix_burn.outputs['Image'], composite.inputs['Image'])
        else:
            self.scene.eevee.use_bloom = True
            self.scene.eevee.use_gtao = True
            tree.links.new(rl.outputs['Image'], composite.inputs['Image'])

    def setup_lighting(self):
        """Sets up a robust three-point lighting system with high-contrast character focus."""
        # Key Light (Sun)
        bpy.ops.object.light_add(type='SUN', location=(10,-10,20))
        sun = bpy.context.object
        sun.name = "Sun"
        sun.data.energy = 5.0
        sun.rotation_euler = (math.radians(45), 0, math.radians(45))

        # Fill Light (Point) - To lift the shadows slightly for texture visibility
        bpy.ops.object.light_add(type='POINT', location=(-10, -10, 10))
        fill = bpy.context.object
        fill.name = "FillLight"
        fill.data.energy = 2000

        # Rim Light (Area) - To separate characters from the dark background
        bpy.ops.object.light_add(type='AREA', location=(0, 15, 5))
        rim = bpy.context.object
        rim.name = "RimLight"
        rim.scale = (10, 10, 1)
        rim.data.energy = 5000
        rim.rotation_euler = (math.radians(-45), 0, 0)

        # Spot Light for specific focus
        bpy.ops.object.light_add(type='SPOT', location=(0,-15,10))
        spot = bpy.context.object
        spot.name = "Spot"
        spot.data.energy = 10000
        spot.data.spot_size = math.radians(45)

    def run(self):
        self.load_assets()
        self.setup_lighting()
        self.setup_compositor()
        self.animate_master()

def main():
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []
    mode = 'SILENT_FILM'
    if '--unity' in args: mode = 'UNITY_PREVIEW'
    master = MovieMaster(mode=mode)
    start_frame = int(args[args.index('--start-frame') + 1]) if '--start-frame' in args else None
    end_frame = int(args[args.index('--end-frame') + 1]) if '--end-frame' in args else None
    master.run()
    if start_frame is not None: master.scene.frame_start = start_frame
    if end_frame is not None: master.scene.frame_end = end_frame
    if '--export-unity' in args: unity_exporter.run_unity_pipeline()
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
        if '--render-output' not in args: master.scene.render.filepath = f"frame_{f_num}.png"
        bpy.ops.render.render(write_still=True)
    if '--render-anim' in args:
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()
