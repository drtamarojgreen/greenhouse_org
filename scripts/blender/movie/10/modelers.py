try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

import math
import random
import json
import os

try:
    from .base import Modeler
    from .registry import registry
except (ImportError, ValueError):
    try:
        from base import Modeler
        from registry import registry
    except ImportError:
        Modeler = object
        registry = None

class PlantModeler(Modeler):
    """
    Specific Modeler for Procedural Plant Humanoids.
    Modularized for Movie 10 with High-Fidelity features.
    """

    def __init__(self, config_path=None):
        self.p_cfg = None
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                self.p_cfg = json.load(f)

        if self.p_cfg is None:
            default_path = os.path.join(os.path.dirname(__file__), "modeling", "plant.json")
            if os.path.exists(default_path):
                with open(default_path, 'r') as f:
                    self.p_cfg = json.load(f)
            else:
                self.p_cfg = self._get_default_config()

    def build_mesh(self, char_id, params, rig=None):
        if not bpy or not bmesh:
            print(f"Skipping mesh build for {char_id} (Blender modules not available)")
            return None

        height_scale = params.get("height_scale", 1.0)
        seed = params.get("seed", 42)
        random.seed(seed)

        prop = self.p_cfg["proportions"]
        torso_h = prop["torso_h"] * height_scale
        head_r  = prop["head_r"]
        neck_h  = prop["neck_h"]

        mesh_data = bpy.data.meshes.new(f"{char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh_obj)

        if rig:
            mesh_obj.parent = rig
            mesh_obj.matrix_parent_inverse.identity()

        bm = bmesh.new()
        dlayer = bm.verts.layers.deform.verify()

        # Torso
        self._add_organic_part(bm, mesh_obj, dlayer, 0.5, 0.25, torso_h, (0, 0, torso_h/2), "Torso", mid_scale=1.2)
        self._add_joint_bulb(bm, mesh_obj, dlayer, (0, 0, torso_h), 0.18, "Torso")

        # Neck
        self._add_organic_part(bm, mesh_obj, dlayer, 0.15, 0.12, neck_h, (0, 0, torso_h+neck_h/2), "Neck")

        # Head
        matrix_head = mathutils.Matrix.Translation((0, 0, torso_h+neck_h+head_r))
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=head_r, matrix=matrix_head)
        head_vg = mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head")
        for v in bm.verts:
            if (v.co - mathutils.Vector((0, 0, torso_h+neck_h+head_r))).length < head_r * 1.1:
                v[dlayer][head_vg.index] = 1.0

        # Limbs
        l_cfg = self.p_cfg["limbs"]
        for side, sx in [("L", 1), ("R", -1)]:
            # Arms
            s_loc = [l_cfg["arm_shoulder_pos"][0] * sx, l_cfg["arm_shoulder_pos"][1], l_cfg["arm_shoulder_pos"][2] * torso_h]
            seg = l_cfg["arm_segments"]
            self._add_joint_bulb(bm, mesh_obj, dlayer, s_loc, 0.16, f"Arm.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.14, 0.11, seg[0], (s_loc[0], s_loc[1], s_loc[2]-seg[0]/2), f"Arm.{side}")

            e_loc = (s_loc[0], s_loc[1], s_loc[2]-seg[0])
            self._add_joint_bulb(bm, mesh_obj, dlayer, e_loc, 0.14, f"Elbow.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.11, 0.08, seg[1], (e_loc[0], e_loc[1], e_loc[2]-seg[1]/2), f"Elbow.{side}")

            h_loc = (e_loc[0], e_loc[1], e_loc[2]-seg[1])
            self._add_joint_bulb(bm, mesh_obj, dlayer, h_loc, 0.12, f"Hand.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.08, 0.04, seg[2], (h_loc[0], h_loc[1], h_loc[2]-seg[2]/2), f"Hand.{side}")

            # Legs
            hip_loc = [l_cfg["leg_hip_pos"][0] * sx, l_cfg["leg_hip_pos"][1], l_cfg["leg_hip_pos"][2]]
            hip_loc[2] *= height_scale
            lseg = l_cfg["leg_segments"]
            self._add_joint_bulb(bm, mesh_obj, dlayer, hip_loc, 0.18, f"Thigh.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.16, 0.13, lseg[0], (hip_loc[0], hip_loc[1], hip_loc[2]-lseg[0]/2), f"Thigh.{side}")

            k_loc = (hip_loc[0], hip_loc[1], hip_loc[2]-lseg[0])
            self._add_joint_bulb(bm, mesh_obj, dlayer, k_loc, 0.15, f"Knee.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.13, 0.10, lseg[1], (k_loc[0], k_loc[1], k_loc[2]-lseg[1]/2), f"Knee.{side}")

            f_loc = (k_loc[0], k_loc[1], k_loc[2]-lseg[1])
            self._add_joint_bulb(bm, mesh_obj, dlayer, f_loc, 0.13, f"Foot.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.10, 0.06, lseg[2], (f_loc[0], f_loc[1]-lseg[2]/2, f_loc[2]), f"Foot.{side}", rot=(math.radians(90), 0, 0))

            # Fingers
            fing_base_z = h_loc[2] - 0.15
            for i in range(1, 4):
                f_name = f"Finger.{i}.{side}"
                self._add_organic_part(bm, mesh_obj, dlayer, 0.03, 0.01, 0.15, (h_loc[0] + (i-2)*0.05, h_loc[1], fing_base_z - 0.07), f_name, rot=(math.radians(0), 0, 0))

            # Toes
            toe_base_y = f_loc[1] - 0.15
            for i in range(1, 4):
                t_name = f"Toe.{i}.{side}"
                self._add_organic_part(bm, mesh_obj, dlayer, 0.04, 0.02, 0.12, (f_loc[0] + (i-2)*0.06, toe_base_y - 0.06, f_loc[2]), t_name, rot=(math.radians(90), 0, 0))

        # Facial Features (Eyes)
        head_c = mathutils.Vector((0, 0, torso_h+neck_h+head_r))
        for side, sx in [("L", 1), ("R", -1)]:
            eye_pos = head_c + mathutils.Vector((0.15*sx, -head_r*0.9, 0.1))
            bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=12, radius=0.08, matrix=mathutils.Matrix.Translation(eye_pos))
            # Tag faces for Iris material (index 2)
            for face in bm.faces:
                if face.material_index == 0 and (face.calc_center_median() - eye_pos).length < 0.1:
                    face.material_index = 2

        # Foliage
        f_cfg = self.p_cfg["foliage"]
        foliage_vg = (mesh_obj.vertex_groups.get("Foliage") or mesh_obj.vertex_groups.new(name="Foliage"))

        bm.to_mesh(mesh_data)
        bm.free()

        for poly in mesh_data.polygons:
            poly.use_smooth = True

        return mesh_obj

    def _add_organic_part(self, bm, mesh_obj, dlayer, rad1, rad2, height, loc, bname, mid_scale=1.1, rot=(0,0,0)):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = (mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4())
        ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=height, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
        return ret

    def _add_joint_bulb(self, bm, mesh_obj, dlayer, loc, rad, bname):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = mathutils.Matrix.Translation(loc)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=rad, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0

    def _get_default_config(self):
        return {
            "proportions": {"torso_h": 1.5, "head_r": 0.4, "neck_h": 0.2},
            "limbs": {
                "arm_shoulder_pos": [0.4, 0, 0.9],
                "arm_segments": [0.4, 0.4, 0.15],
                "leg_hip_pos": [0.25, 0, 0.1],
                "leg_segments": [0.5, 0.5, 0.25]
            },
            "foliage": { "head_count": 20, "head_tilt_range": [0.2, 0.8], "branch_len_range": [0.4, 0.8] }
        }

if registry:
    registry.register_modeling("PlantModeler", PlantModeler)
