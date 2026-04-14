import bpy
import math
import mathutils
import random
import config
import animation_library_v6


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

        self.setup_camera_markers()

    def setup_camera_markers(self):
        """Binds cameras to timeline markers for automatic switching during render."""
        self.scene.timeline_markers.clear()

        switches = [
            (1,    "WIDE"),
            (600,  "OTS1"),
            (1800, "OTS2"),
            (3000, "WIDE"),
        ]

        for frame, cam_name in switches:
            cam = bpy.data.objects.get(cam_name)
            if cam:
                marker = self.scene.timeline_markers.new(f"Switch_{cam_name}", frame=frame)
                marker.camera = cam
                print(f"DIRECTOR: Camera switch to {cam_name} at frame {frame}")

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

        self.apply_gaze_interactions()

    def apply_gaze_interactions(self):
        """Adds Track To constraints so characters look at each other at key beats."""
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR)

        if herb and arbor:
            # Herbaceous looks at Arbor
            con_h = herb.constraints.get("Gaze_Arbor") or herb.constraints.new('TRACK_TO')
            con_h.name = "Gaze_Arbor"
            con_h.target = arbor
            con_h.track_axis = 'TRACK_NEGATIVE_Z'
            con_h.up_axis = 'UP_Y'
            con_h.influence = 0.8

            # Arbor looks at Herbaceous
            con_a = arbor.constraints.get("Gaze_Herb") or arbor.constraints.new('TRACK_TO')
            con_a.name = "Gaze_Herb"
            con_a.target = herb
            con_a.track_axis = 'TRACK_NEGATIVE_Z'
            con_a.up_axis = 'UP_Y'
            con_a.influence = 0.8

        # Ensemble spirits look at the protagonists
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if coll:
            midpoint = bpy.data.objects.get(config.LIGHTING_MIDPOINT)
            if not midpoint:
                midpoint = bpy.data.objects.new(config.LIGHTING_MIDPOINT, None)
                bpy.context.scene.collection.objects.link(midpoint)
                midpoint.location = (0, 0, 1.5)

            spirits = [o for o in coll.objects if o.type == 'ARMATURE' and o not in [herb, arbor]]
            for s in spirits:
                con = s.constraints.get("Gaze_Center") or s.constraints.new('TRACK_TO')
                con.name = "Gaze_Center"
                con.target = midpoint
                con.track_axis = 'TRACK_NEGATIVE_Z'
                con.up_axis = 'UP_Y'
                con.influence = 0.6

    def apply_scene_animations(self):
        """Orchestrates varied animations across all characters, including storyline beats."""
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if not coll: return

        # 1. Protagonists (The Conversation)
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR)

        if herb:
            # Ensure the armature is actually used for animation calls
            animation_library_v6.apply_animation_by_tag(herb, "talking", 1, duration=config.TOTAL_FRAMES)
            animation_library_v6.apply_animation_by_tag(herb, "nod", 120)
            # Act IV Beat 4: Finale Dance
            animation_library_v6.apply_animation_by_tag(herb, "dance", 3600, duration=600)

        if arbor:
            animation_library_v6.apply_animation_by_tag(arbor, "talking", 1, duration=config.TOTAL_FRAMES)
            animation_library_v6.apply_animation_by_tag(arbor, "shake", 300)
            # Act IV Beat 4: Finale Dance
            animation_library_v6.apply_animation_by_tag(arbor, "dance", 3600, duration=600)

        # 2. Key Spirits (Storyline Beats)
        majesty = bpy.data.objects.get("Sylvan_Majesty.Rig") or bpy.data.objects.get("Sylvan_Majesty")
        radiant = bpy.data.objects.get("Radiant_Aura.Rig") or bpy.data.objects.get("Radiant_Aura")

        if majesty:
            # Beat 1: The Arrival (manifests with idle sway)
            animation_library_v6.apply_animation_by_tag(majesty, "idle", 1, duration=config.TOTAL_FRAMES)
            # Spore Tag interaction at frame 1200
            animation_library_v6.apply_animation_by_tag(majesty, "spore_tag", 1200)

        if radiant:
            # Beat 2: The Rite of Joy (Spirit Dance)
            animation_library_v6.apply_animation_by_tag(radiant, "dance", 600, duration=1200)
            # Mid-scene idle
            animation_library_v6.apply_animation_by_tag(radiant, "idle", 1800, duration=1800)
            # Finale
            animation_library_v6.apply_animation_by_tag(radiant, "dance", 3600, duration=600)

        # 3. Ensemble Spirits (Atmospheric Motion & Spore Tag)
        spirits = [o for o in coll.objects if o.type == 'ARMATURE' and o not in [herb, arbor, majesty, radiant]]
        tags = ["dance", "nod", "shake", "idle"]

        for i, spirit in enumerate(spirits):
            tag = random.choice(tags)
            start = 1 + (i * 24)
            animation_library_v6.apply_animation_by_tag(spirit, tag, start, duration=config.TOTAL_FRAMES)

            # Random Spore Tag interactions
            tag_start = 1000 + (i * 400)
            if tag_start < 3600:
                animation_library_v6.apply_animation_by_tag(spirit, "spore_tag", tag_start)
