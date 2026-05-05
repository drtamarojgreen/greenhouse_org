import bpy
import bmesh
import mathutils
import math
import random
import os
import sys
import json

from base import Modeler
from registry import registry

class PlantModeler(Modeler):
    """
    Specific Modeler for Procedural Plant Humanoids.
    Now strictly data-driven via plant.json.
    """

    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "plant.json")
        with open(config_path, 'r') as f:
            self.p_cfg = json.load(f)

    def build_mesh(self, char_id, params, rig=None):
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

        if rig: mesh_obj.parent = rig

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
        for v in bm.verts: # Simplified head VG assignment
            if (v.co - mathutils.Vector((0, 0, torso_h+neck_h+head_r))).length < head_r * 1.1:
                v[dlayer][head_vg.index] = 1.0

        # Limbs
        l_cfg = self.p_cfg["limbs"]
        for side, sx in [("L", 1), ("R", -1)]:
            # Arms
            # Shoulder position should match the rig's shoulder height
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
            # Ensure hips are scaled if height_scale is significant
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

            # Fingers (Simplified for modular rig compatibility)
            # Offset to tail of hand bone
            fing_base_z = h_loc[2] - 0.15 
            for i in range(1, 4):
                f_name = f"Finger.{i}.{side}"
                self._add_organic_part(bm, mesh_obj, dlayer, 0.03, 0.01, 0.15, (h_loc[0] + (i-2)*0.05, h_loc[1], fing_base_z - 0.07), f_name, rot=(math.radians(0), 0, 0))
            
            # Toes
            # Offset to tail of foot bone
            toe_base_y = f_loc[1] - 0.15
            for i in range(1, 4):
                t_name = f"Toe.{i}.{side}"
                self._add_organic_part(bm, mesh_obj, dlayer, 0.04, 0.02, 0.12, (f_loc[0] + (i-2)*0.06, toe_base_y - 0.06, f_loc[2]), t_name, rot=(math.radians(90), 0, 0))

        # Facial Features (Eyes/Iris/Pupil for High-Fidelity Test)
        head_c = mathutils.Vector((0, 0, torso_h+neck_h+head_r))
        for side, sx in [("L", 1), ("R", -1)]:
            eye_pos = head_c + mathutils.Vector((0.15*sx, -head_r*0.9, 0.1))
            num_faces = len(bm.faces)
            bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=12, radius=0.08, matrix=mathutils.Matrix.Translation(eye_pos))
            bm.faces.ensure_lookup_table()
            for i in range(num_faces, len(bm.faces)):
                bm.faces[i].material_index = 2 # Iris
            
            pupil_pos = eye_pos + mathutils.Vector((0, -0.07, 0))
            num_faces = len(bm.faces)
            bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.03, matrix=mathutils.Matrix.Translation(pupil_pos))
            bm.faces.ensure_lookup_table()
            for i in range(num_faces, len(bm.faces)):
                bm.faces[i].material_index = 3 # Pupil

        # Foliage Algorithm
        f_cfg = self.p_cfg["foliage"]
        head_center = mathutils.Vector((0, 0, torso_h+neck_h+head_r))
        foliage_vg = (mesh_obj.vertex_groups.get("Foliage") or mesh_obj.vertex_groups.new(name="Foliage"))

        for i in range(f_cfg["head_count"]):
            angle = (i/f_cfg["head_count"])*math.pi*2
            tilt = random.uniform(*f_cfg["head_tilt_range"])
            loc = head_center + mathutils.Vector((math.cos(angle)*head_r*tilt, math.sin(angle)*head_r*tilt, head_r*0.5 + random.uniform(0, head_r)))

            b_len = random.uniform(*f_cfg["branch_len_range"])
            matrix = mathutils.Matrix.Translation(loc) @ mathutils.Matrix.Rotation(angle, 4, 'Z')
            ret = bmesh.ops.create_cone(bm, segments=6, radius1=0.04, radius2=0, depth=b_len, matrix=matrix)
            for v in ret['verts']:
                v[dlayer][foliage_vg.index] = 1.0

        # Limb Foliage (Limbs and Leaves logic ported from Movie 7)
        limbs_foliage = ["Arm.L", "Arm.R", "Elbow.L", "Elbow.R", "Thigh.L", "Thigh.R", "Knee.L", "Knee.R"]
        density = f_cfg.get("limb_foliage_density", 6)
        for bone_name in limbs_foliage:
            vg = mesh_obj.vertex_groups.get(bone_name)
            if not vg: continue
            vg_verts = [v for v in bm.verts if vg.index in v[dlayer] and v[dlayer][vg.index] > 0.5]
            if not vg_verts: continue
            for _ in range(density):
                v_target = random.choice(vg_verts)
                l_loc = v_target.co + v_target.normal * 0.04
                l_size = random.uniform(*f_cfg.get("leaf_size_range", [0.2, 0.4]))
                l_rot = mathutils.Euler((random.random()*6, 0, random.random()*6)).to_matrix().to_4x4()
                l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=l_size, matrix=mathutils.Matrix.Translation(l_loc) @ l_rot)
                for v in l_ret['verts']:
                    v[dlayer][vg.index] = 1.0
                    v[dlayer][foliage_vg.index] = 0.6

        # Material Index Assignment for Shading (0: Bark, 1: Foliage/Leaf)

        for face in bm.faces:
            is_foliage = any(v[dlayer].get(foliage_vg.index, 0) > 0.5 for v in face.verts)
            face.material_index = 1 if is_foliage else 0

        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.004)
        bm.to_mesh(mesh_data); bm.free()

        # Modifiers
        m_cfg = self.p_cfg["modifiers"]
        disp = mesh_obj.modifiers.new(name="BarkBump", type='DISPLACE')
        disp.strength = m_cfg["bark_bump_strength"]
        
        wave = mesh_obj.modifiers.new(name="WindSway", type='WAVE')
        wave.height = m_cfg["wind_sway"]["height"]
        wave.width = m_cfg["wind_sway"]["width"]
        wave.speed = m_cfg["wind_sway"]["speed"]
        wave.vertex_group = "Foliage"

        return mesh_obj

    def _add_organic_part(self, bm, mesh_obj, dlayer, rad1, rad2, height, loc, bname, mid_scale=1.1, rot=(0,0,0)):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = (mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4())
        ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=height, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
            dist_from_center = (v.co - mathutils.Vector(loc)).length
            z_fact = 1.0 - abs(dist_from_center / (height / 2))
            factor = 1.0 + (mid_scale - 1.0) * max(0, z_fact)
            v.co = mathutils.Vector(loc) + (v.co - mathutils.Vector(loc)) * factor
        for v in ret['verts']:
            for face in v.link_faces:
                face.smooth = True
        return ret

    def _add_joint_bulb(self, bm, mesh_obj, dlayer, loc, rad, bname):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = mathutils.Matrix.Translation(loc)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=rad, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
            for face in v.link_faces:
                face.smooth = True

registry.register_modeling("PlantModeler", PlantModeler)
