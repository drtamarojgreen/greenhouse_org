import bpy
import math
import mathutils
import random
import os
import sys
import config
import animation_library_v6

# Ensure assets_v6 is in path for props_v6
V6_DIR = os.path.dirname(os.path.abspath(__file__))
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path:
    sys.path.append(ASSETS_V6_DIR)

from props_v6 import animate_blessing


class SylvanDirector:
    """Manages scene composition and cinematography, restored to v5 standards."""
    
    def __init__(self):
        self.scene = bpy.context.scene

    # ------------------------------------------------------------------
    # CINEMATICS
    # ------------------------------------------------------------------

    def setup_cinematics(self):
        """Builds the professional 3-camera cinematic rig matching v5 logic."""
        coll = (bpy.data.collections.get(config.COLL_CAMERAS)
                or bpy.data.collections.new(config.COLL_CAMERAS))
        if coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(coll)

        # 1. WIDE master (v5 standard)
        self._create_camera("WIDE", (0.0, -8.0, 2.0), (math.radians(90), 0, 0), coll, lens=35)

        # 2. OTS rigs (v5 targets: Herbaceous eye level at (-1.75, -0.3, 2.5), Arbor at (1.75, 0.3, 2.5))
        ots_targets = {
            "OTS1":         {"pos": ( 13.5,  11.0, 6.0), "target": (-1.75, -0.3, 2.5)},
            "OTS2":         {"pos": (-13.5, -11.0, 6.0), "target": ( 1.75,  0.3, 2.5)},
            "OTS_Static_1": {"pos": ( 13.5,  11.0, 6.0), "target": (-1.75, -0.3, 2.5)},
            "OTS_Static_2": {"pos": (-13.5, -11.0, 6.0), "target": ( 1.75,  0.3, 2.5)},
        }

        for name, data in ots_targets.items():
            self._create_camera(name, data["pos"], (0,0,0), coll, lens=50)
            cam = bpy.data.objects.get(name)
            if cam:
                vec = mathutils.Vector(data["target"]) - mathutils.Vector(data["pos"])
                cam.rotation_euler = vec.to_track_quat('-Z', 'Y').to_euler()
        
        # Set Active Camera
        if "WIDE" in bpy.data.objects:
            self.scene.camera = bpy.data.objects["WIDE"]

    def _create_camera(self, name, pos, rot, coll, lens=35):
        """Creates (or reuses) a camera and links it into the given collection."""
        cam_data = bpy.data.cameras.get(name) or bpy.data.cameras.new(name)
        cam_data.lens = lens

        obj = bpy.data.objects.get(name)
        if obj is None:
            obj = bpy.data.objects.new(name, cam_data)

        obj.location      = pos
        obj.rotation_euler = rot
        obj.scale          = (1, 1, 1)
        obj.parent         = None

        # Ensure full environment visibility (Point 142)
        cam_data.clip_end = 2000.0

        if obj.name not in coll.objects:
            coll.objects.link(obj)

        if name == config.CAMERA_NAME:
            self.scene.camera = obj

        return obj

    # ------------------------------------------------------------------
    # ENSEMBLE COMPOSITION
    # ------------------------------------------------------------------

    def compose_ensemble(self):
        """Algorithmically positions ensemble members in a cinematic fan."""
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if not coll:
            return

        spirits = sorted(
            [o for o in coll.objects if (".Rig" in o.name or (o.type == 'ARMATURE' and "Body" in o.name))
             and "Herbaceous" not in o.name and "Arbor" not in o.name],
            key=lambda o: o.name,
        )
        num = len(spirits)
        if num == 0:
            return

        for i, rig in enumerate(spirits):
            angle = (i / max(num - 1, 1)) * math.pi * 0.95 - math.pi * 0.475
            dist  = 12.0 + (i % 2) * 3.5 # Increased distance to prevent occlusion

            rig.location = (
                math.sin(angle) * dist,
                6.0 + math.cos(angle) * 4.0,
                0.0,
            )

            # Correct orientation: Face the origin/protagonists
            # Import offset fix: characters are faced to their right (90 deg Z)
            # We subtract 90 deg (pi/2) to compensate, then add the angle to face center
            # Fine-tuned for Scene 6:
            rig.rotation_euler[2] = (math.pi + angle) + (math.pi / 2)

            rig.keyframe_insert(data_path="location", frame=1)
            rig.keyframe_insert(data_path="rotation_euler", index=2, frame=1)
            rig.location.z = 1.5
            rig.keyframe_insert(data_path="location", frame=config.TOTAL_FRAMES)

    # ------------------------------------------------------------------
    # PROTAGONIST PLACEMENT
    # ------------------------------------------------------------------

    def position_protagonists(self):
        """Places Herbaceous and Arbor at v5-standard production coordinates."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS + ".Body") or bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR + ".Body") or bpy.data.objects.get(config.CHAR_ARBOR)
        
        if herb: herb.location = config.CHAR_HERBACEOUS_POS
        if arbor: arbor.location = config.CHAR_ARBOR_POS

    def apply_scene_animations(self):
        """Orchestrates Act IV storyline beats and varied animations."""
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if not coll: return

        # 1. Protagonists (The Conversation)
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR)

        if herb:
            animation_library_v6.apply_animation_by_tag(herb, "talking", 1, duration=config.TOTAL_FRAMES)
            animation_library_v6.apply_animation_by_tag(herb, "nod", 120)
            # Final Ascent synchronized finale (3000-4200)
            animation_library_v6.apply_animation_by_tag(herb, "dance", 3000, duration=1200)

        if arbor:
            animation_library_v6.apply_animation_by_tag(arbor, "talking", 60, duration=config.TOTAL_FRAMES)
            animation_library_v6.apply_animation_by_tag(arbor, "shake", 300)
            # Final Ascent synchronized finale (3000-4200)
            animation_library_v6.apply_animation_by_tag(arbor, "dance", 3000, duration=1200)

        # 2. Key Legendary Entities (Act IV Beats)
        majesty = next((o for o in coll.objects if "Sylvan_Majesty" in o.name and o.type == 'ARMATURE'), None)
        aura = next((o for o in coll.objects if "Radiant_Aura" in o.name and o.type == 'ARMATURE'), None)

        if majesty:
            # Act IV Beat 1: The Arrival (0-600)
            # Control mesh visibility for the "Arrival" effect
            for child in majesty.children:
                if child.type == 'MESH':
                    child.hide_render = True
                    child.keyframe_insert(data_path="hide_render", frame=1)
                    child.hide_render = False
                    child.keyframe_insert(data_path="hide_render", frame=300) # Appears half-way through arrival
            animation_library_v6.apply_animation_by_tag(majesty, "idle", 300, duration=2700)
            # Synchronized finale
            animation_library_v6.apply_animation_by_tag(majesty, "dance", 3000, duration=1200)

        if aura:
            # Act IV Beat 2: The Rite of Joy (600-1800)
            for child in aura.children:
                if child.type == 'MESH':
                    child.hide_render = True
                    child.keyframe_insert(data_path="hide_render", frame=1)
                    child.hide_render = False
                    child.keyframe_insert(data_path="hide_render", frame=600)
            # Performing a high-altitude "Spirit Dance"
            aura.location.z += 5.0
            aura.keyframe_insert(data_path="location", frame=600)
            animation_library_v6.apply_animation_by_tag(aura, "dance", 600, duration=2400)
            # Synchronized finale
            animation_library_v6.apply_animation_by_tag(aura, "dance", 3000, duration=1200)

        # 3. The Blessing (1800-3000)
        # Spirits interact with props, imbuing them with glowing essence
        can = bpy.data.objects.get("WaterCan")
        hose = bpy.data.objects.get("GardenHose")
        if can: animate_blessing(can, 1800, 3000)
        if hose: animate_blessing(hose, 1800, 3000)

        # 4. Spore Tag (Shadow_Weaver playful conflict)
        weaver = next((o for o in coll.objects if "Shadow_Weaver" in o.name and o.type == 'ARMATURE'), None)
        if weaver:
            # Playful "Gloom Puffs" interactions - represented by shake and movement
            animation_library_v6.apply_animation_by_tag(weaver, "shake", 100, duration=500)
            animation_library_v6.apply_animation_by_tag(weaver, "dance", 600, duration=2400)
            # Synchronized finale
            animation_library_v6.apply_animation_by_tag(weaver, "dance", 3000, duration=1200)

        # 5. Remaining Ensemble Spirits (Atmospheric Motion)
        spirits = [o for o in coll.objects if o.type == 'ARMATURE' and o not in [herb, arbor, majesty, aura, weaver]]
        tags = ["dance", "nod", "shake", "idle"]

        for i, spirit in enumerate(spirits):
            tag = random.choice(tags)
            start = 1 + (i * 24)
            animation_library_v6.apply_animation_by_tag(spirit, tag, start, duration=config.TOTAL_FRAMES)
            # Synchronized finale for everyone
            animation_library_v6.apply_animation_by_tag(spirit, "dance", 3000, duration=1200)
