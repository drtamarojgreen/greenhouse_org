import bpy
import bmesh
import mathutils
import math
import random
import os
import sys

from base import Modeler
from registry import registry

class PlantModeler(Modeler):
    """
    Specific Modeler for Procedural Plant Humanoids.
    Architecture Kept: The BMesh-based procedural generation from Movie 9 is
    retained to ensure that 'every component has conceptual justification'.
    Organic, branching structures represent neuroplasticity and growth.
    """

    def build_mesh(self, char_id, params, rig=None):
        height_scale = params.get("height_scale", 1.0)
        seed = params.get("seed", 42)
        random.seed(seed)

        torso_h = 1.5 * height_scale
        head_r  = 0.4
        neck_h  = 0.2

        mesh_data = bpy.data.meshes.new(f"{char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh_obj)

        if rig:
            mesh_obj.parent = rig

        bm = bmesh.new()
        dlayer = bm.verts.layers.deform.verify()

        # Torso
        self._add_organic_part(bm, mesh_obj, dlayer, 0.5, 0.25, torso_h, (0, 0, torso_h/2), "Torso", mid_scale=1.2)
        self._add_joint_bulb(bm, mesh_obj, dlayer, (0, 0, torso_h), 0.18, "Torso")

        # Neck
        self._add_organic_part(bm, mesh_obj, dlayer, 0.15, 0.12, neck_h, (0, 0, torso_h+neck_h/2), "Neck")

        # Head
        matrix_head = mathutils.Matrix.Translation((0, 0, torso_h+neck_h+head_r))
        ret_head = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=head_r, matrix=matrix_head)
        head_vg = mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head")
        for v in ret_head['verts']:
            v[dlayer][head_vg.index] = 1.0
            for face in v.link_faces:
                face.smooth = True
                face.material_index = 0

        # Limbs
        for side, sx in [("L", 1), ("R", -1)]:
            # Arms
            s_loc = (0.4*sx, 0, torso_h*0.9)
            e_loc = (0.4*sx, 0, torso_h*0.9-0.4)
            h_loc = (0.4*sx, 0, torso_h*0.9-0.8)
            self._add_joint_bulb(bm, mesh_obj, dlayer, s_loc, 0.16, f"Arm.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.14, 0.11, 0.4, (s_loc[0], s_loc[1], s_loc[2]-0.2), f"Arm.{side}", mid_scale=1.15)
            self._add_joint_bulb(bm, mesh_obj, dlayer, e_loc, 0.12, f"Elbow.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.11, 0.08, 0.4, (e_loc[0], e_loc[1], e_loc[2]-0.2), f"Elbow.{side}", mid_scale=1.1)
            self._add_joint_bulb(bm, mesh_obj, dlayer, h_loc, 0.1, f"Hand.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.08, 0.12, 0.15, (h_loc[0], h_loc[1], h_loc[2]-0.07), f"Hand.{side}")
            for f in range(1, 4):
                fx = h_loc[0] + (f-2)*0.06
                self._add_organic_part(bm, mesh_obj, dlayer, 0.04, 0.01, 0.25, (fx, h_loc[1], h_loc[2]-0.2), f"Finger.{f}.{side}")

            # Legs
            hi_loc = (0.25*sx, 0, 0.1)
            k_loc  = (0.25*sx, 0, -0.4)
            an_loc = (0.25*sx, 0, -0.9)
            self._add_joint_bulb(bm, mesh_obj, dlayer, hi_loc, 0.22, f"Thigh.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.2, 0.16, 0.5, (hi_loc[0], hi_loc[1], hi_loc[2]-0.25), f"Thigh.{side}", mid_scale=1.15)
            self._add_joint_bulb(bm, mesh_obj, dlayer, k_loc, 0.16, f"Knee.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.16, 0.12, 0.5, (k_loc[0], k_loc[1], k_loc[2]-0.25), f"Knee.{side}", mid_scale=1.1)
            self._add_joint_bulb(bm, mesh_obj, dlayer, an_loc, 0.12, f"Foot.{side}")
            self._add_organic_part(bm, mesh_obj, dlayer, 0.1, 0.15, 0.25, (an_loc[0], an_loc[1]-0.15, an_loc[2]), f"Foot.{side}", rot=(math.radians(90), 0, 0))
            for t in range(1, 4):
                tx = an_loc[0] + (t-2)*0.08
                self._add_organic_part(bm, mesh_obj, dlayer, 0.05, 0.02, 0.25, (tx, an_loc[1]-0.3, an_loc[2]), f"Toe.{t}.{side}", rot=(math.radians(90), 0, 0))

        # Foliage Algorithm
        foliage_vg = (mesh_obj.vertex_groups.get("Foliage") or mesh_obj.vertex_groups.new(name="Foliage"))
        head_center = mathutils.Vector((0, 0, torso_h+neck_h+head_r))

        for i in range(20):
            angle = (i/20)*math.pi*2
            tilt = random.uniform(0.2, 0.8)
            loc = head_center + mathutils.Vector((math.cos(angle)*head_r*tilt, math.sin(angle)*head_r*tilt, head_r*0.5 + random.uniform(0, head_r)))

            if loc.y < head_center.y - 0.05: continue

            dir_vec = (loc - head_center).normalized()
            b_len = random.uniform(0.4, 0.8)
            b_ret = bmesh.ops.create_cone(bm, segments=6, cap_ends=True, radius1=0.03, radius2=0.005, depth=b_len, matrix=(mathutils.Matrix.Translation(loc + dir_vec*(b_len/2)) @ dir_vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()))
            for v in b_ret['verts']: v[dlayer][head_vg.index] = 1.0

            for _ in range(8):
                l_loc = loc + dir_vec * random.uniform(b_len*0.6, b_len)
                l_size = random.uniform(0.25, 0.5)
                l_rot = mathutils.Euler((random.random()*3, random.random()*3, random.random()*3)).to_matrix().to_4x4()
                l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=l_size, matrix=mathutils.Matrix.Translation(l_loc) @ l_rot)
                for v in l_ret['verts']:
                    v[dlayer][head_vg.index] = 1.0
                    v[dlayer][foliage_vg.index] = 1.0
                    for face in v.link_faces:
                        face.material_index = 1
                        face.smooth = True

        limbs_foliage = ["Arm.L","Arm.R","Elbow.L","Elbow.R","Thigh.L","Thigh.R","Knee.L","Knee.R"]
        for bone_name in limbs_foliage:
            vg = mesh_obj.vertex_groups.get(bone_name)
            if not vg: continue
            vg_verts = [v for v in bm.verts if vg.index in v[dlayer]]
            if not vg_verts: continue
            for _ in range(6):
                v_target = random.choice(vg_verts)
                l_loc = v_target.co + v_target.normal * 0.04
                l_size = 0.18
                l_rot = mathutils.Euler((random.random()*6, 0, random.random()*6)).to_matrix().to_4x4()
                l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=l_size, matrix=mathutils.Matrix.Translation(l_loc) @ l_rot)
                for v in l_ret['verts']:
                    v[dlayer][vg.index] = 1.0
                    v[dlayer][foliage_vg.index] = 0.6
                    for face in v.link_faces:
                        face.material_index = 1
                        face.smooth = True

        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.004)
        for v in bm.verts:
            weights = v[dlayer]
            if len(weights) > 1:
                max_vg = max(weights.keys(), key=lambda k: weights[k])
                for vg_idx in list(weights.keys()):
                    if vg_idx != max_vg: v[dlayer][vg_idx] = 0.0
        for _ in range(8): bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.6)

        bm.to_mesh(mesh_data)
        bm.free()

        # Displacement modifier matching v6
        tex_bark = (bpy.data.textures.get("BarkBump") or bpy.data.textures.new("BarkBump", type='CLOUDS'))
        tex_bark.noise_scale = 0.04
        disp = mesh_obj.modifiers.new(name="BarkBump", type='DISPLACE')
        disp.texture = tex_bark; disp.strength = 0.055; disp.vertex_group = "Torso"

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
