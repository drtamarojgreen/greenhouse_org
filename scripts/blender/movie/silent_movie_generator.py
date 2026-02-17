import bpy
import math
import os
import sys
import mathutils
import random
import logging

from master import BaseMaster
from constants import SCENE_MAP
import plant_humanoid
import gnome_antagonist
import library_props
import futuristic_props
import greenhouse_structure
import environment_props
import unity_exporter
import style

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
from scene15_interaction import scene_logic as scene15
try:
    from scene_brain import scene_logic as scene_brain
except ImportError:
    scene_brain = None

# New scenes 16-22
def safe_import_scene(name):
    try:
        module = __import__(f"{name}.scene_logic", fromlist=['scene_logic'])
        return module
    except ImportError as e:
        # Point 9: Log the actual exception
        logging.warning(f"Failed to import {name}: {e}")
        return None

scene16 = safe_import_scene("scene16_dialogue")
scene17 = safe_import_scene("scene17_dialogue")
scene18 = safe_import_scene("scene18_dialogue")
scene19 = safe_import_scene("scene19_dialogue")
scene20 = safe_import_scene("scene20_dialogue")
scene21 = safe_import_scene("scene21_dialogue")
scene22 = safe_import_scene("scene22_retreat")

class MovieMaster(BaseMaster):
    def __init__(self, mode='SILENT_FILM'):
        super().__init__(mode=mode, total_frames=15000)

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
            bsdf.inputs["Base Color"].default_value = (0.439, 0.259, 0.078, 1) # #704214
            bsdf.inputs["Emission Strength"].default_value = 5.0
        text_obj.data.materials.append(mat)

        # Point 17: Absolute values for rotation
        text_obj.rotation_euler[1] = 0
        text_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame_start)
        text_obj.rotation_euler[1] = math.radians(360)
        text_obj.keyframe_insert(data_path="rotation_euler", index=1, frame=frame_start + 24)

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
        bsdf.inputs["Emission Strength"].default_value = 15.0

        char_spacing = 0.8
        start_x = -((len(text_content) - 1) * char_spacing) / 2

        objs = []
        for i, char in enumerate(text_content):
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
                for fcurve in style.get_action_curves(text_obj.animation_data.action):
                    if fcurve.data_path == "rotation_euler" and fcurve.array_index == rot_axis:
                        for kp in fcurve.keyframe_points:
                            kp.interpolation = 'ELASTIC'
                            kp.easing = 'EASE_OUT'

            self._set_visibility([text_obj], [(frame_start, frame_end)])
            objs.append(text_obj)
        return objs

    def load_assets(self):
        """Loads models and characters."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        self.greenhouse = greenhouse_structure.create_greenhouse_structure()

        # Structural Vine Sway
        for obj in self.greenhouse.objects:
            style.insert_looping_noise(obj, "rotation_euler", strength=0.01, scale=50.0, frame_start=1, frame_end=15000)

        self.gnome = gnome_antagonist.create_gnome("GloomGnome", mathutils.Vector((5, 5, 0)))

        # Load Brain
        brain_path = os.path.join(base_path, "brain.fbx")
        if os.path.exists(brain_path):
            style.patch_fbx_importer()
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
                    bsdf = mat.node_tree.nodes.get("Principled BSDF")
                    node_veins = mat.node_tree.nodes.new(type='ShaderNodeTexNoise')
                    node_veins.inputs['Scale'].default_value = 20.0
                    node_veins_color = mat.node_tree.nodes.new(type='ShaderNodeValToRGB')
                    # Point 77: Swap elements for correct anatomical representation
                    node_veins_color.color_ramp.elements[0].color = (1, 0.8, 0.8, 1) # Tissue
                    node_veins_color.color_ramp.elements[1].color = (1, 0, 0, 1) # Veins
                    mat.node_tree.links.new(node_veins.outputs['Fac'], node_veins_color.inputs['Fac'])
                    mat.node_tree.links.new(node_veins_color.outputs['Color'], bsdf.inputs['Base Color'])
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
        # Point 48: Removed permanent parenting to avoid movement during bloom

        # Point 19: Assign book and pedestal
        self.book = library_props.create_open_book(mathutils.Vector((0, 0, 1.3)))
        self.pedestal = library_props.create_pedestal(mathutils.Vector((0, 0, 0)))

        environment_props.create_stage_floor()
        environment_props.setup_volumetric_haze()
        style.animate_dust_particles(mathutils.Vector((0,0,2)), density=30)

        pillar_locs = [(-8, -8), (8, 8), (-12, 0), (12, 0)]
        for x, y in pillar_locs:
            plant_humanoid.create_inscribed_pillar(mathutils.Vector((x, y, 0)))

    def _animate_characters(self):
        """Point 1: Extracted character animation logic."""
        if self.gnome:
            # Point 90: Gnome idle animation
            style.animate_breathing(self.gnome, 1, 15000, cycle=80, amplitude=0.01)

            style.animate_gnome_stumble(self.gnome, 2200)
            cloak = bpy.data.objects.get("GloomGnome_Cloak")
            if cloak: style.animate_cloak_sway(cloak, 1, 15000)
            self.gnome.location = (2, 2, 0)
            self.gnome.keyframe_insert(data_path="location", frame=2600)
            self.gnome.location = (10, 10, 0)
            self.gnome.keyframe_insert(data_path="location", frame=2800)

        for char in [self.h1, self.h2]:
            if not char: continue
            gait_mode = 'HEAVY' if "Arbor" in char.name else 'LIGHT'
            style.animate_gait(char, mode=gait_mode, frame_start=3901, frame_end=4100)
            style.animate_breathing(char, 1, 15000, cycle=64, amplitude=0.02)
            style.insert_looping_noise(char, "rotation_euler", index=2, strength=0.02, scale=15.0)
            style.animate_shoulder_shrug(char, 1, 15000)

            char_name = char.name.split('_')[0]
            head = bpy.data.objects.get(f"{char_name}_Head")
            if head:
                leaves = [c for c in head.children if "Leaf" in c.name]
                style.animate_leaf_twitches(leaves, 1, 15000)
                for child in head.children:
                    if "Eye" in child.name:
                        style.animate_blink(child, 1, 15000)
                    if "Pupil" in child.name:
                        style.animate_dynamic_pupils([child], None, 1, 15000)

            if "Arbor" in char.name:
                fingers = [c for c in char.children if "Finger" in c.name or "Vine" in c.name]
                style.animate_finger_tapping(fingers, 1, 15000)

            staff = bpy.data.objects.get(f"{char_name}_ReasonStaff")
            if staff:
                style.insert_looping_noise(staff, "rotation_euler", index=0, strength=0.02, scale=10.0, frame_start=1, frame_end=15000)

            mouth = bpy.data.objects.get(f"{char_name}_Mouth")
            if mouth:
                style.animate_breathing(mouth, 1, 15000, cycle=8, amplitude=0.5)

        # Character Visibility
        plant_keywords = ["Herbaceous", "Arbor", "Scroll", "Bush", "Eye", "Mouth", "Pupil", "Brow", "ShoulderPlate"]
        plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in plant_keywords) and "GloomGnome" not in obj.name]
        p_ranges = [(501, 650), (751, 950), (1051, 1250), (1601, 1800), (2101, 2500), (2601, 2800), (2901, 3400), (3901, 4100), (4501, 14500)]
        self._set_visibility(plants, p_ranges)

        gnomes = [obj for obj in bpy.context.scene.objects if "GloomGnome" in obj.name]
        # Point 46: Foreshadowing glimpses (frames 1800-2100)
        g_ranges = [(1800, 1820), (1950, 1970), (2101, 2500), (2601, 2800), (10901, 14500)]
        self._set_visibility(gnomes, g_ranges)

    def _animate_props(self):
        """Point 1: Extracted prop animation logic."""
        gh_objs = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in ["GH_", "Greenhouse_Structure", "Pane"])]
        gh_ranges = [(401, 650), (2901, 3500), (3901, 4100), (9501, 14500)]
        self._set_visibility(gh_objs, gh_ranges)

        if self.beam:
            self._set_visibility([self.beam], [(401, 650), (3801, 4100), (4101, 4500)])

        if self.neuron:
            self._set_visibility([self.neuron], [(1251, 1500), (1601, 1800), (1901, 2000), (3001, 3500)])
            self.neuron.scale = (1, 1, 1)
            self.neuron.keyframe_insert(data_path="scale", frame=1251)
            self.neuron.scale = (3, 3, 3)
            self.neuron.keyframe_insert(data_path="scale", frame=1425)
            self.neuron.scale = (1, 1, 1)
            self.neuron.keyframe_insert(data_path="scale", frame=1500)
            # Neuron Glow Logic...

        if self.brain:
            style.animate_pulsing_emission(self.brain, 1, 15000, base_strength=1.0, pulse_amplitude=2.0)
            style.insert_looping_noise(self.brain, "location", index=2, strength=0.1, scale=50.0, frame_start=1, frame_end=15000)
            self._set_visibility([self.brain], [(201, 400), (751, 950), (1351, 1500), (1601, 1800), (3001, 3500)])
            # Brain Rotation...

        if self.flower:
            # Point 48: Unparent before bloom to ensure stable world position
            self.flower.keyframe_insert(data_path="matrix_world", frame=2899)

            self.flower.scale = (0.01, 0.01, 0.01)
            self.flower.keyframe_insert(data_path="scale", frame=2900)
            self.flower.scale = (1, 1, 1)
            self.flower.keyframe_insert(data_path="scale", frame=3200)

    def _setup_gaze_system(self):
        """Point 1 & 13: Refactored gaze system."""
        bpy.ops.object.empty_add(type='PLAIN_AXES')
        gaze = bpy.context.object
        gaze.name = "GazeTarget"
        for char_name in ["Herbaceous", "Arbor"]:
            head = bpy.data.objects.get(f"{char_name}_Head")
            if head:
                for eye in head.children:
                    if "Eye" in eye.name:
                        plant_humanoid.add_tracking_constraint(eye, gaze)
                        style.animate_saccadic_movement(eye, gaze, 1, 15000)

        gaze.location = (0, 0, 5)
        gaze.keyframe_insert(data_path="location", frame=1)
        gaze.location = (2, 0, 2)
        gaze.keyframe_insert(data_path="location", frame=751)
        gaze.location = (-2, 0, 2)
        gaze.keyframe_insert(data_path="location", frame=1051)

        # Point 13: Do not parent. Animate location instead.
        if self.gnome:
            gaze.location = self.gnome.location + mathutils.Vector((0,0,1))
            gaze.keyframe_insert(data_path="location", frame=2101)

    def _setup_camera(self):
        """Point 1: Camera setup."""
        bpy.ops.object.camera_add(location=(0, -8, 0))
        cam = bpy.context.object
        self.scene.camera = cam

        bpy.ops.object.empty_add(type='PLAIN_AXES')
        target = bpy.context.object
        target.name = "CamTarget"

        con = cam.constraints.new(type='TRACK_TO')
        con.target = target
        con.track_axis = 'TRACK_NEGATIVE_Z'
        con.up_axis = 'UP_Y'

        if self.mode == 'SILENT_FILM':
            style.apply_camera_shake(cam, 1, 15000, strength=0.02)

        self.setup_camera_keyframes(cam, target)

    def animate_master(self):
        """Point 1: Orchestrates sub-animation methods."""
        self._animate_characters()
        self._animate_props()
        self._setup_gaze_system()
        self._setup_camera()

        # Global Effects
        style.apply_thermal_transition(self, 1, 15000, color_start=(0.4, 0.5, 0.8), color_end=(0.1, 0.05, 0.2))

        # Scene Dispatch
        scenes = [scene00, scene01, scene_brain, scene02, scene03, scene04, scene05,
                  scene06, scene07, scene08, scene09, scene10, scene11, scene15,
                  scene16, scene17, scene18, scene19, scene20, scene21, scene22, scene12]
        for s in scenes:
            if s: s.setup_scene(self)

    def run(self):
        self.load_assets()
        self.setup_lighting()
        self.setup_compositor()
        self.animate_master()

    def setup_camera_keyframes(self, cam, target):
        """Point 31 & 41: Consolidated camera keyframes using SCENE_MAP and establishing shot."""
        title_loc = (0, -12, 0)
        origin = (0, 0, 0)
        high_target = (0, 0, 1.5)

        def kf(frame, cam_loc, target_loc):
            cam.location = cam_loc
            target.location = target_loc
            cam.keyframe_insert(data_path="location", frame=frame)
            target.keyframe_insert(data_path="location", frame=frame)

        # Branding (1 - 100)
        kf(1, title_loc, origin)
        kf(SCENE_MAP['branding'][1], title_loc, origin)

        # Intro / Establishing Shot (Point 41) (101 - 200)
        kf(SCENE_MAP['intro'][0], (0, -30, 10), origin) # Wide outside
        kf(SCENE_MAP['intro'][1], (0, -15, 5), origin) # Dolly inside

        # Brain (201 - 400)
        kf(SCENE_MAP['brain'][0], (0,-30,8), origin)
        kf(SCENE_MAP['brain'][1], (0,-35,10), origin)

        # Garden (401 - 650)
        kf(401, title_loc, origin)
        kf(500, title_loc, origin)
        kf(SCENE_MAP['garden'][0] + 100, (5,-20,4), (-2, 0, 1.5))
        kf(SCENE_MAP['garden'][1], (-5,-15,3), (2, 0, 1.5))

        # Socratic (651 - 950)
        kf(651, title_loc, origin)
        kf(750, title_loc, origin)
        kf(751, (0,-15,4), high_target)
        kf(950, (0,-18,5), high_target)

        # Exchange (951 - 1250)
        kf(951, title_loc, origin)
        kf(1051, (6,-12,3), (0, 0, 1.5))
        kf(1250, (-6,-12,3), (0, 0, 1.5))

        # Interaction (4501 - 9500)
        s_int = SCENE_MAP['interaction']
        kf(s_int[0], (0,-15,4), (-3, 0, 1.5))
        kf(6000, (5,-12,3), (2, 0, 1.5))
        kf(6200, (1,-5,2), (0, 0, 1.5))
        kf(6800, (-1,-5,2.5), (-2, 0, 1.8))
        kf(s_int[1], (0,-20,8), (0, 0, 1))

        # Credits (14501 - 15000)
        kf(SCENE_MAP['credits'][0], (0,-10,0), (0, 0, 5))
        kf(SCENE_MAP['credits'][1], (0,-10,0), (0, 0, 15))

    def setup_compositor(self):
        tree = style.get_compositor_node_tree(self.scene)
        if tree is None: return
        for node in tree.nodes: tree.nodes.remove(node)
        
        rl = tree.nodes.new('CompositorNodeRLayers')
        composite = tree.nodes.new('CompositorNodeComposite')

        if self.mode == 'SILENT_FILM':
            # Point 18: One bright node
            bright = tree.nodes.new('CompositorNodeBrightContrast')
            bright.name = "Bright/Contrast"
            bright.inputs['Contrast'].default_value = 1.3

            style.apply_film_flicker(self.scene, 1, 15000, strength=0.05)
            distort = style.setup_chromatic_aberration(self.scene, strength=0.02)
            huesat = style.setup_saturation_control(self.scene)
            blur = style.apply_glow_trails(self.scene)

            tree.links.new(rl.outputs['Image'], huesat.inputs['Image'])
            tree.links.new(huesat.outputs['Image'], blur.inputs['Image'])
            tree.links.new(blur.outputs['Image'], distort.inputs['Image'])
            tree.links.new(distort.outputs['Image'], bright.inputs['Image'])
            tree.links.new(bright.outputs['Image'], composite.inputs['Image'])
        else:
            tree.links.new(rl.outputs['Image'], composite.inputs['Image'])

def main():
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []
    mode = 'SILENT_FILM'
    if '--unity' in args: mode = 'UNITY_PREVIEW'
    master = MovieMaster(mode=mode)

    if '--scene' in args:
        scene_name = args[args.index('--scene') + 1]
        if scene_name in SCENE_MAP:
            master.scene.frame_start, master.scene.frame_end = SCENE_MAP[scene_name]

    master.run()
    if '--render-anim' in args:
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()
