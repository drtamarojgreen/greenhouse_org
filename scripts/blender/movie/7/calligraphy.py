import bpy
import os
import re
import math
import mathutils


class CalligraphyDirector:
    """Creates/animates intro-outro calligraphy text and dedicated lettering lights."""

    def __init__(self, lc_cfg, total_frames, root_dir):
        self.lc_cfg = lc_cfg
        self.total_frames = total_frames
        self.root_dir = root_dir

    def apply(self):
        cfg = self.lc_cfg.get("calligraphy", {})
        if not cfg:
            return

        text_obj = self._ensure_text_object(cfg)
        intro_start, intro_end = cfg.get("intro_frames", [1, 5])
        outro_start, outro_end = cfg.get("outro_frames", [self.total_frames - 4, self.total_frames])

        intro_cam = self._camera_for_segment("intro", default="Exterior")
        outro_cam = self._camera_for_segment("outro", default="Exterior")
        self._keyframe_text_segment(text_obj, intro_cam, intro_start, intro_end, cfg)
        self._keyframe_text_segment(text_obj, outro_cam, outro_start, outro_end, cfg)
        self._hide_outside_ranges(text_obj, intro_start, intro_end, outro_start, outro_end)
        self._setup_letter_lights(cfg, text_obj, intro_start, intro_end, outro_start, outro_end)

    def _camera_for_segment(self, segment, default="Exterior"):
        cam_name = self.lc_cfg.get("sequencing", {}).get(segment, {}).get("camera", default)
        return bpy.data.objects.get(cam_name) or bpy.data.objects.get(default)

    def _ensure_text_object(self, cfg):
        name = cfg.get("name", "GreenhouseMD_Calligraphy")
        obj = bpy.data.objects.get(name)
        if obj and obj.type == 'FONT':
            return obj

        curve = bpy.data.curves.new(name=name, type='FONT')
        curve.body = cfg.get("text", "GreenhouseMD")
        curve.align_x = 'CENTER'
        curve.align_y = 'CENTER'
        curve.size = cfg.get("size", 0.7)
        obj = bpy.data.objects.new(name, curve)
        bpy.context.scene.collection.objects.link(obj)

        theme_colors = self._load_theme_colors()
        mat = bpy.data.materials.new(name=f"{name}_Mat")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        out = nodes.new(type='ShaderNodeOutputMaterial')
        emit = nodes.new(type='ShaderNodeEmission')
        emit.inputs['Color'].default_value = (*theme_colors[0], 1.0)
        emit.inputs['Strength'].default_value = cfg.get("emission_strength", 9.0)
        mat.node_tree.links.new(emit.outputs['Emission'], out.inputs['Surface'])
        curve.materials.append(mat)
        return obj

    def _keyframe_text_segment(self, text_obj, cam_obj, frame_start, frame_end, cfg):
        if not cam_obj:
            return
        offset = mathutils.Vector(cfg.get("offset", [0.0, 2.6, -0.35]))
        for frame in range(frame_start, frame_end + 1):
            scene = bpy.context.scene
            scene.frame_set(frame)
            world_offset = cam_obj.matrix_world.to_3x3() @ offset
            text_obj.location = cam_obj.matrix_world.translation + world_offset
            text_obj.rotation_euler = cam_obj.rotation_euler
            text_obj.keyframe_insert(data_path="location", frame=frame)
            text_obj.keyframe_insert(data_path="rotation_euler", frame=frame)

    def _hide_outside_ranges(self, text_obj, i0, i1, o0, o1):
        key_data = [
            (1, True),
            (i0, False),
            (i1 + 1, True),
            (o0, False),
            (o1 + 1, True),
        ]
        for frame, hidden in key_data:
            text_obj.hide_render = hidden
            text_obj.hide_viewport = hidden
            text_obj.keyframe_insert(data_path="hide_render", frame=frame)
            text_obj.keyframe_insert(data_path="hide_viewport", frame=frame)

    def _setup_letter_lights(self, cfg, text_obj, i0, i1, o0, o1):
        theme_colors = self._load_theme_colors()
        light_defs = cfg.get("lighting", [])
        if not light_defs:
            light_defs = [
                {"id": "Calligraphy_Key", "type": "AREA", "energy": 320.0, "color_index": 0, "offset": [0.0, 1.8, 0.7]},
                {"id": "Calligraphy_Fill", "type": "POINT", "energy": 180.0, "color_index": 1, "offset": [0.7, 2.0, 0.2]},
            ]

        for ld in light_defs:
            l_data = bpy.data.lights.get(ld["id"]) or bpy.data.lights.new(ld["id"], ld.get("type", "POINT"))
            l_obj = bpy.data.objects.get(ld["id"]) or bpy.data.objects.new(ld["id"], l_data)
            if l_obj.name not in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.link(l_obj)
            l_obj.location = text_obj.location + mathutils.Vector(ld.get("offset", [0, 2, 0.5]))
            l_data.color = theme_colors[ld.get("color_index", 0) % len(theme_colors)]
            self._animate_light_curve(l_data, ld.get("energy", 240.0), i0, i1, o0, o1)

    def _animate_light_curve(self, light_data, base_energy, i0, i1, o0, o1):
        for frame in range(1, self.total_frames + 1):
            enabled = (i0 <= frame <= i1) or (o0 <= frame <= o1)
            energy = base_energy * (0.65 + 0.35 * math.sin((frame - i0) * 0.9)) if enabled else 0.0
            light_data.energy = max(0.0, energy)
            light_data.keyframe_insert(data_path="energy", frame=frame)

    def _load_theme_colors(self):
        css_dir = os.path.join(self.root_dir, "..", "..", "..", "..", "docs", "css")
        css_files = [os.path.join(css_dir, "style.css"), os.path.join(css_dir, "panel.css")]
        found = []
        for path in css_files:
            if not os.path.exists(path):
                continue
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                txt = f.read()
            found.extend(re.findall(r"#([0-9a-fA-F]{6})", txt))

        preferred = ["357438", "732751", "66bb6a"]
        palette = []
        for hex_code in preferred:
            if hex_code in found:
                palette.append(tuple(int(hex_code[i:i+2], 16) / 255.0 for i in (0, 2, 4)))
        if not palette:
            palette = [(0.208, 0.455, 0.220), (0.451, 0.153, 0.318)]
        return palette
