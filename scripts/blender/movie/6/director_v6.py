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

        # Create focal targets first
        env_coll = bpy.data.collections.get("6b_Environment") or bpy.data.collections.new("6b_Environment")
        if env_coll.name not in self.scene.collection.children:
            self.scene.collection.children.link(env_coll)
            
        herb_foc = bpy.data.objects.get(config.FOCUS_HERBACEOUS) or bpy.data.objects.new(config.FOCUS_HERBACEOUS, None)
        herb_foc.location = config.CHAR_HERBACEOUS_EYE
        
        arbor_foc = bpy.data.objects.get(config.FOCUS_ARBOR) or bpy.data.objects.new(config.FOCUS_ARBOR, None)
        arbor_foc.location = config.CHAR_ARBOR_EYE

        mid_foc = bpy.data.objects.get(config.LIGHTING_MIDPOINT) or bpy.data.objects.new(config.LIGHTING_MIDPOINT, None)
        mid_foc.location = (0, 0, 2.2)

        for foc in [herb_foc, arbor_foc, mid_foc]:
            if foc.name not in env_coll.objects:
                for mycoll in list(foc.users_collection):
                    mycoll.objects.unlink(foc)
                env_coll.objects.link(foc)

        # 1. Wide master (v5 standard)
        self._create_camera("Wide", (0.0, -8.0, 2.0), (math.radians(90), 0, 0), coll, lens=config.LENS_WIDE)

        # 2. Ots rigs (v5 targets: Herbaceous eye level at (-1.75, -0.3, 2.5), Arbor at (1.75, 0.3, 2.5))
        ots_targets = {
            "Ots1":         {"pos": ( 13.5,  11.0, 6.0), "target": config.CHAR_HERBACEOUS_EYE},
            "Ots2":         {"pos": (-13.5, -11.0, 6.0), "target": config.CHAR_ARBOR_EYE},
            "Ots_Static_1": {"pos": ( 13.5,  11.0, 6.0), "target": config.CHAR_HERBACEOUS_EYE},
            "Ots_Static_2": {"pos": (-13.5, -11.0, 6.0), "target": config.CHAR_ARBOR_EYE},
        }

        for name, data in ots_targets.items():
            cam = self._create_camera(name, data["pos"], (0,0,0), coll, lens=config.LENS_OTS)
            if cam:
                # Add Track To Native Constraint
                for c in cam.constraints:
                    if c.type == 'TRACK_TO': cam.constraints.remove(c)
                tc = cam.constraints.new(type='TRACK_TO')
                tc.target = herb_foc if "1" in name else arbor_foc
                tc.track_axis = 'TRACK_NEGATIVE_Z'
                tc.up_axis = 'UP_Y'

        # 3. Antag rigs (Improved lateral alignment for backdrop coverage)
        # 135mm lens provides tight cinematic portraits with guaranteed backdrop coverage
        self._create_camera("Antag1", config.CAM_ANTAG1_POS, (0,0,0), coll, lens=config.LENS_ANTAG)
        self._create_camera("Antag2", config.CAM_ANTAG2_POS, (0,0,0), coll, lens=config.LENS_ANTAG)
        self._create_camera("Antag3", config.CAM_ANTAG3_POS, (0,0,0), coll, lens=config.LENS_ANTAG)
        self._create_camera("Antag4", config.CAM_ANTAG4_POS, (0,0,0), coll, lens=config.LENS_ANTAG)

        # Set Active Camera
        if "Wide" in bpy.data.objects:
            self.scene.camera = bpy.data.objects["Wide"]

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
        cam_data.clip_end = getattr(config, "CAM_CLIP_END", 2000.0)

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
            angle = (i / max(num - 1, 1)) * math.pi * config.ENSEMBLE_FAN_WIDTH - math.pi * (config.ENSEMBLE_FAN_WIDTH / 2)
            dist  = config.ENSEMBLE_FAN_DIST + (i % 2) * config.ENSEMBLE_VAR_DIST # Increased distance to prevent occlusion

            rig.location = (
                math.sin(angle) * dist,
                config.ENSEMBLE_CENTER_Y + math.cos(angle) * 4.0,
                0.0,
            )

            # Reorientation: Face the Wide Camera instead of the center
            # Import offset fix: characters are faced to their right (90 deg Z)
            wide_pos = mathutils.Vector(config.CAM_WIDE_POS)
            vec_to_wide = wide_pos - rig.location
            rig.rotation_euler[2] = vec_to_wide.to_track_quat('Y', 'Z').to_euler().z + (math.pi / 2)

            rig.keyframe_insert(data_path="location", frame=1)
            rig.keyframe_insert(data_path="rotation_euler", index=2, frame=1)

    # ------------------------------------------------------------------
    # PROTAGONIST PLACEMENT
    # ------------------------------------------------------------------

    def setup_camera_paths(self):
        """Creates Bezier paths for each production camera matching Act IV beats."""
        # 1. WIDE Path (grounded entrance perspective)
        mid_foc = bpy.data.objects.get(config.LIGHTING_MIDPOINT)

        # 1. Wide Path (Diagnostic Pop-Out)
        # Sequence: Start -> Far (F12) -> Return Start (F15)
        wide_pts = [
            config.CAM_WIDE_POS,
            config.CAM_WIDE_FAR_POS,
            config.CAM_WIDE_POS
        ]
        self._create_path_animation("Wide", wide_pts, mid_foc, end_frame=12)

        # 2. Ots1 Path (Focus Herbaceous - orbital tension)
        ots1_pts = [
            (config.CAM_OTS1_POS[0],     config.CAM_OTS1_POS[1],     config.CAM_OTS1_POS[2]),
            (config.CAM_OTS1_POS[0] + 2.5, config.CAM_OTS1_POS[1] + 2.5, config.CAM_OTS1_POS[2] + 0.3)
        ]
        self._create_path_animation("Ots1", ots1_pts, config.FOCUS_HERBACEOUS)

        # 3. Ots2 Path (Focus Arbor - rising climax)
        ots2_pts = [
            (config.CAM_OTS2_POS[0],     config.CAM_OTS2_POS[1],     config.CAM_OTS2_POS[2]),
            (config.CAM_OTS2_POS[0] - 2.5, config.CAM_OTS2_POS[1] - 2.5, config.CAM_OTS2_POS[2] + 0.3)
        ]
        self._create_path_animation("Ots2", ots2_pts, config.FOCUS_ARBOR)

        # 4. Antagonist Paths (Explicitly defined in config with Dynamic Framing)
        antag_map = {
            "Antag1": {"rig": config.SPIRIT_ANTAGONISTS[0] + ".Rig", "focus": config.FOCUS_ANTAG1},
            "Antag2": {"rig": config.SPIRIT_ANTAGONISTS[1] + ".Rig", "focus": config.FOCUS_ANTAG2},
            "Antag3": {"rig": config.SPIRIT_ANTAGONISTS[2] + ".Rig", "focus": config.FOCUS_ANTAG3},
            "Antag4": {"rig": config.SPIRIT_ANTAGONISTS[3] + ".Rig", "focus": config.FOCUS_ANTAG4}
        }

        import asset_normalization_functions
        for cam_name, data in antag_map.items():
            rig = bpy.data.objects.get(data["rig"])
            
            # Default framing constants
            # Use Sentence_case access text (e.g. CAM_Antag1_POS)
            base_pos = mathutils.Vector(getattr(config, f"CAM_{cam_name.upper()}_POS", (0,-5,2)))
            
            # Apply dynamic offset: Scale the vector from character to camera
            dist_mult = getattr(config, "ANTAG_GLOBAL_OFFSET", 3.0)
            foc = bpy.data.objects.get(data["focus"])
            if foc:
                # Use Matrix World to account for characters moved into ensemble fan
                foc_world = foc.matrix_world.translation
                vec_to_camera = base_pos - foc_world
                dynamic_pos = foc_world + (vec_to_camera * dist_mult)
            else:
                dynamic_pos = base_pos

            cam_pts = [
                dynamic_pos,
                (dynamic_pos[0] * 1.1, dynamic_pos[1] + 1.0, dynamic_pos[2] + 0.3) # Subtle drift
            ]
            self._create_path_animation(cam_name, cam_pts, data["focus"])

        # 5. Cinematic Sequencing
        self._apply_camera_sequencing()

    def _apply_camera_sequencing(self):
        """Bind specific cameras using the 40/30/30 distribution mix logic."""
        self.scene.timeline_markers.clear()
        
        # 1. Diagnostic Start (Frames 1-3)
        diags = {1: "Wide", 2: "Ots1", 3: "Ots2"}
        for f, name in diags.items():
            cam_obj = bpy.data.objects.get(name)
            if cam_obj:
                m = self.scene.timeline_markers.new(f"Diag_{name}", frame=f)
                m.camera = cam_obj

        # 2. Character Debug Cycle (Frames 4-10)
        # Sequence: Synchronized with config.SPIRIT_ANTAGONISTS for diagnostic parity
        debug_chars = config.SPIRIT_ANTAGONISTS + ["Phoenix_Herald", "Golden_Phoenix"]
        
        # Create a dynamic diagnostic camera focus if not exists (lower_case)
        diag_focus = bpy.data.objects.get("diag_focus") or bpy.data.objects.new("diag_focus", None)
        if "SETTINGS.ENVIRONMENT" in bpy.data.collections:
            if diag_focus.name not in bpy.data.collections["SETTINGS.ENVIRONMENT"].objects:
                bpy.data.collections["SETTINGS.ENVIRONMENT"].objects.link(diag_focus)
        
        antag_cam1 = bpy.data.objects.get("Antag1")
        if antag_cam1:
            # Override Track-To for diagnostic frames
            for c in antag_cam1.constraints:
                if c.type == 'TRACK_TO': antag_cam1.constraints.remove(c)
            tc = antag_cam1.constraints.new(type='TRACK_TO')
            tc.target = diag_focus
            tc.track_axis = 'TRACK_NEGATIVE_Z'
            tc.up_axis = 'UP_Y'
            
            for i, name in enumerate(debug_chars):
                f = 4 + i
                char_obj = bpy.data.objects.get(f"{name}.Rig") or bpy.data.objects.get(name)
                if char_obj:
                    # Snap focus to character head
                    diag_focus.location = char_obj.location + mathutils.Vector((0, 0, 2.2))
                    diag_focus.keyframe_insert(data_path="location", frame=f)
                    
                    # Ensure Antag1 is active for this frame
                    m = self.scene.timeline_markers.new(f"Debug_{name}", frame=f)
                    m.camera = antag_cam1
        
        # 3. Actual Movie Sequence (Frame 11 onwards)
        frame = 11
        total = getattr(config, "TOTAL_FRAMES", 4200)
        
        # 2a. Initial Wide block (500 frames)
        wide_cam = bpy.data.objects.get("Wide")
        if wide_cam:
            m = self.scene.timeline_markers.new("Movie_Start_Wide", frame=frame)
            m.camera = wide_cam
            frame += 500

        # 2b. Cycle mix
        ots_cams = ["Ots1", "Ots2"]
        antag_cams = ["Antag1", "Antag2", "Antag3", "Antag4"]
        
        cycle_count = 0
        while frame < total:
            # Alternating Pattern: OTS (200) -> ANTAG (100) -> WIDE (250 to keep 40%)
            
            # OTS segment (200 frames)
            name = ots_cams[cycle_count % 2]
            cam_obj = bpy.data.objects.get(name)
            if cam_obj:
                m = self.scene.timeline_markers.new(f"Shot_OTS_{frame}", frame=frame)
                m.camera = cam_obj
            frame += 200
            
            # ANTAG segment (100 frames)
            name = antag_cams[cycle_count % 4]
            cam_obj = bpy.data.objects.get(name)
            if cam_obj:
                m = self.scene.timeline_markers.new(f"Shot_ANTAG_{frame}", frame=frame)
                m.camera = cam_obj
            frame += 100
            
            # Wide segment (250 frames)
            cam_obj = bpy.data.objects.get("Wide")
            if cam_obj:
                m = self.scene.timeline_markers.new(f"Shot_Wide_{frame}", frame=frame)
                m.camera = cam_obj
            frame += 250
            
            cycle_count += 1

    def _setup_antagonist_focus_targets(self):
        """Places focus empties on designated antagonist characters."""
        env_coll = bpy.data.collections.get("6b_Environment")
        if not env_coll: return

        antag_map = {
            config.FOCUS_ANTAG1: config.SPIRIT_ANTAGONISTS[0] + ".Rig",
            config.FOCUS_ANTAG2: config.SPIRIT_ANTAGONISTS[1] + ".Rig",
            config.FOCUS_ANTAG3: config.SPIRIT_ANTAGONISTS[2] + ".Rig",
            config.FOCUS_ANTAG4: config.SPIRIT_ANTAGONISTS[3] + ".Rig"
        }

        for focus_name, rig_name in antag_map.items():
            rig = bpy.data.objects.get(rig_name)
            if not rig: continue

            # Create or get focus empty
            foc = bpy.data.objects.get(focus_name) or bpy.data.objects.new(focus_name, None)
            if foc.name not in env_coll.objects:
                env_coll.objects.link(foc)
            
            # Position at configured eye-level offset
            foc.parent = rig
            foc.location = (0, 0, getattr(config, "EYE_FOCAL_OFFSET", 2.2))
            
            # Ensure cameras track these new targets
            # Map focus name (e.g. focus_antag3) to camera name (Antag3)
            cam_num = "".join(filter(str.isdigit, focus_name))
            cam_name = f"Antag{cam_num}"
            cam = bpy.data.objects.get(cam_name)
            if cam:
                for c in cam.constraints:
                    if c.type == 'TRACK_TO': cam.constraints.remove(c)
                tc = cam.constraints.new(type='TRACK_TO')
                tc.target = foc
                tc.track_axis = 'TRACK_NEGATIVE_Z'
                tc.up_axis = 'UP_Y'

    def _create_path_animation(self, cam_name, points, target_name, end_frame=None):
        """Internal helper to bind a camera to a new curve path."""
        cam = bpy.data.objects.get(cam_name)
        target = bpy.data.objects.get(target_name) if isinstance(target_name, str) else target_name
        if not cam: return

        # 1. Create Curve
        curve_data = bpy.data.curves.new(name=f"Path_{cam_name}", type='CURVE')
        curve_data.dimensions = '3D'
        curve_obj = bpy.data.objects.new(f"Path_{cam_name}", curve_data)

        coll = bpy.data.collections.get(config.COLL_CAMERAS)
        if coll: coll.objects.link(curve_obj)
        else: bpy.context.scene.collection.objects.link(curve_obj)

        spline = curve_data.splines.new('BEZIER')
        spline.bezier_points.add(len(points) - 1)
        for i, pt in enumerate(points):
            spline.bezier_points[i].co = pt
            spline.bezier_points[i].handle_left_type = 'AUTO'
            spline.bezier_points[i].handle_right_type = 'AUTO'

        # 2. Add Follow Path
        # Clear local location so it snaps exactly to curve evaluation
        cam.location = (0, 0, 0)
        con = cam.constraints.new(type='FOLLOW_PATH')
        con.target = curve_obj
        con.use_fixed_location = True

        # Animate offset factor using standard keyframes
        con.offset_factor = 0.0
        con.keyframe_insert(data_path="offset_factor", frame=1)
        
        if len(points) > 2 and end_frame:
            # Multi-point path (e.g. Start -> Far -> Start)
            mid_frame = end_frame
            con.offset_factor = 0.5
            con.keyframe_insert(data_path="offset_factor", frame=mid_frame)
            
            con.offset_factor = 1.0
            con.keyframe_insert(data_path="offset_factor", frame=mid_frame + 3) # Fast return
        else:
            con.offset_factor = 1.0
            con.keyframe_insert(data_path="offset_factor", frame=end_frame if end_frame else config.TOTAL_FRAMES)

        # 3. Add Zoom-In Effect (Lens Animation)
        # Start at base lens (from setup_cinematics) and zoom in slightly (+15mm)
        base_lens = cam.data.lens
        cam.data.keyframe_insert(data_path="lens", frame=1)
        cam.data.lens = base_lens + 15.0
        cam.data.keyframe_insert(data_path="lens", frame=config.TOTAL_FRAMES)

        # 4. Add Track To
        if target:
            # Resolve string names into actual objects if necessary
            target_obj = bpy.data.objects.get(target) if isinstance(target, str) else target
            if target_obj:
                tcon = cam.constraints.new(type='TRACK_TO')
                tcon.target = target_obj
                tcon.track_axis = 'TRACK_NEGATIVE_Z'
                tcon.up_axis = 'UP_Y'

    def position_protagonists(self):
        """Places Herbaceous and Arbor at v5-standard production coordinates.
        CRITICAL: Moves the Armature Rig, not just the mesh, to keep components synchronized.
        """
        herb_rig = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor_rig = bpy.data.objects.get(config.CHAR_ARBOR)
        
        if herb_rig and arbor_rig:
            vec_to_arbor = mathutils.Vector(config.CHAR_ARBOR_POS) - mathutils.Vector(config.CHAR_HERBACEOUS_POS)
            vec_to_herb  = mathutils.Vector(config.CHAR_HERBACEOUS_POS) - mathutils.Vector(config.CHAR_ARBOR_POS)
            
            herb_rig.location = config.CHAR_HERBACEOUS_POS
            herb_rig.rotation_euler = vec_to_arbor.to_track_quat('Y', 'Z').to_euler()
            herb_rig.rotation_euler.z += math.pi # Flip to face target (compensating for rig forward basis)

            arbor_rig.location = config.CHAR_ARBOR_POS
            arbor_rig.rotation_euler = vec_to_herb.to_track_quat('Y', 'Z').to_euler()
            arbor_rig.rotation_euler.z += math.pi # Flip to face target

        # Ensure meshes are at origin relative to their parents
        # Finalize focus targets for antagonists
        self._setup_antagonist_focus_targets()

        # Final keyframing for protagonists
        for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
            body = bpy.data.objects.get(f"{name}_Body")
            if body:
                body.location = (0, 0, 0)
                body.rotation_euler = (0, 0, 0)
                
        # Native Grounding Logic
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if coll:
            for obj in coll.objects:
                if obj.type == 'ARMATURE':
                    min_z = float('inf')
                    for child in obj.children:
                        if child.type == 'MESH':
                            bbox_corners = [child.matrix_world @ mathutils.Vector(corner) for corner in child.bound_box]
                            min_z = min(min_z, min(v.z for v in bbox_corners))
                    if min_z != float('inf'):
                        obj.location.z -= min_z
        bpy.context.view_layer.update()

    def ensure_animation_data(self):
        """Ensure all ensemble members have animation data."""
        for obj in bpy.data.objects:
            if obj.type in ['ARMATURE', 'MESH']:
                if not obj.animation_data:
                    obj.animation_data_create()
                if not obj.animation_data.action:
                    action_name = f"{obj.name}_Action"
                    if action_name not in bpy.data.actions:
                        bpy.data.actions.new(action_name)
                    obj.animation_data.action = bpy.data.actions[action_name]

    def apply_scene_animations(self):
        """Orchestrates Act IV storyline beats and varied animations."""
        self.ensure_animation_data()
        
        coll = bpy.data.collections.get(config.COLL_ASSETS)
        if not coll: return

        # 1. Protagonists (The Conversation)
        herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        arbor = bpy.data.objects.get(config.CHAR_ARBOR)

        if herb:
            animation_library_v6.apply_animation_by_tag(herb, "talking", 1, duration=3000)
            animation_library_v6.apply_animation_by_tag(herb, "nod", 120)
            # Final Ascent synchronized finale (3000-4200)
            animation_library_v6.apply_animation_by_tag(herb, "dance", 3000, duration=1200)

        if arbor:
            animation_library_v6.apply_animation_by_tag(arbor, "talking", 1, duration=2999)
            animation_library_v6.apply_animation_by_tag(arbor, "shake", 300)
            # Final Ascent synchronized finale (3000-4200)
            animation_library_v6.apply_animation_by_tag(arbor, "dance", 3000, duration=1200)

        # 2. Key Legendary Entities (Act IV Beats)
        majesty = next((o for o in coll.objects if "Sylvan_Majesty" in o.name and o.type == 'ARMATURE'), None)
        aura = next((o for o in coll.objects if "Radiant_Aura" in o.name and o.type == 'ARMATURE'), None)

        if majesty:
            # Act IV Beat 1: The Arrival (0-600)
            # Control mesh visibility for the "Arrival" effect
            for child in majesty.children_recursive:
                if child.type == 'MESH':
                    child.hide_render = True
                    child.hide_viewport = True
                    child.keyframe_insert(data_path="hide_render", frame=1)
                    child.keyframe_insert(data_path="hide_viewport", frame=1)
                    child.hide_render = False
                    child.hide_viewport = False
                    child.keyframe_insert(data_path="hide_render", frame=300)
                    child.keyframe_insert(data_path="hide_viewport", frame=300)
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
            aura.location.z = 5.0
            aura.keyframe_insert(data_path="location", index=2, frame=1)
            aura.location.z = 10.0
            aura.keyframe_insert(data_path="location", index=2, frame=600)
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
            animation_library_v6.apply_animation_by_tag(weaver, "shake", 1, duration=599)
            animation_library_v6.apply_animation_by_tag(weaver, "dance", 600, duration=2400)
            # Synchronized finale
            animation_library_v6.apply_animation_by_tag(weaver, "dance", 3000, duration=1200)

        # 5. Remaining Ensemble Spirits (Atmospheric Motion)
        spirits = [o for o in coll.objects if o.type == 'ARMATURE' and o not in [herb, arbor, majesty, aura, weaver]]
        tags = ["dance", "nod", "shake", "idle"]

        for i, spirit in enumerate(spirits):
            tag = random.choice(tags)
            start = 1
            # Duration should cover until the finale starts
            mid_duration = 2999
            animation_library_v6.apply_animation_by_tag(spirit, tag, start, duration=mid_duration)
            # Synchronized finale for everyone
            animation_library_v6.apply_animation_by_tag(spirit, "dance", 3000, duration=1200)
