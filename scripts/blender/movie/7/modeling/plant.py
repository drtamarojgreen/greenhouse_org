import bpy
import bmesh
import mathutils
import math
import random
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from base import Modeler
from registry import registry

class OrganicPart:
    def __init__(self, rad1, rad2, h, loc, bname, mid_scale=1.0, rot=(0,0,0)):
        self.rad1, self.rad2, self.h, self.loc, self.bname, self.mid_scale, self.rot = rad1, rad2, h, loc, bname, mid_scale, rot
    def add_to_bmesh(self, bm, dlayer, mesh_obj):
        vg = mesh_obj.vertex_groups.get(self.bname) or mesh_obj.vertex_groups.new(name=self.bname)
        matrix = mathutils.Matrix.Translation(self.loc) @ mathutils.Euler(self.rot).to_matrix().to_4x4()
        ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=self.rad1, radius2=self.rad2, depth=self.h, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
            if self.mid_scale != 1.0:
                dist = (v.co - mathutils.Vector(self.loc)).length
                z_fact = 1.0 - abs(dist / (self.h / 2)); v.co = mathutils.Vector(self.loc) + (v.co - mathutils.Vector(self.loc)) * (1.0 + (self.mid_scale - 1.0) * max(0, z_fact))
        for f in bm.faces: f.smooth = True

class HeadSphere:
    def __init__(self, radius, location, bname): self.radius, self.location, self.bname = radius, location, bname
    def add_to_bmesh(self, bm, dlayer, mesh_obj):
        vg = mesh_obj.vertex_groups.get(self.bname) or mesh_obj.vertex_groups.new(name=self.bname)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=self.radius, matrix=mathutils.Matrix.Translation(self.location))
        for v in ret['verts']: v[dlayer][vg.index] = 1.0; v.smooth = True

class PlantModeler(Modeler):
    def build_mesh(self, char_id, params, rig=None):
        mesh_data = bpy.data.meshes.new(f"{char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{char_id}.Body", mesh_data); bpy.context.scene.collection.objects.link(mesh_obj)
        bm = bmesh.new(); dlayer = bm.verts.layers.deform.verify()
        dims = params.get("dimensions", {}); th, hr, nh = dims.get("torso_h", 1.5), dims.get("head_r", 0.4), dims.get("neck_h", 0.2); hcz = th + nh + hr

        parts = [OrganicPart(0.5, 0.25, th, (0,0,th/2), "Torso", mid_scale=1.2), OrganicPart(0.15, 0.12, nh, (0,0,th+nh/2), "Neck")]
        for side, sx in [("L", 1), ("R", -1)]:
            parts.extend([OrganicPart(0.14, 0.11, 0.4, (0.4*sx, 0, th*0.9-0.2), f"Arm.{side}", mid_scale=1.15), OrganicPart(0.11, 0.08, 0.4, (0.4*sx, 0, th*0.9-0.6), f"Elbow.{side}", mid_scale=1.1)])
            for f in range(1, 4): parts.append(OrganicPart(0.04, 0.01, 0.25, (0.4*sx+(f-2)*0.06, 0, th*0.9-0.9), f"Hand.{side}"))
            parts.extend([OrganicPart(0.2, 0.16, 0.5, (0.25*sx, 0, 0.1-0.25), f"Thigh.{side}", mid_scale=1.15), OrganicPart(0.16, 0.12, 0.5, (0.25*sx, 0, -0.4-0.25), f"Knee.{side}", mid_scale=1.1), OrganicPart(0.1, 0.15, 0.25, (sx*0.25, -0.15, -0.9), f"Foot.{side}", rot=(math.radians(90), 0, 0))])

        for p in parts: p.add_to_bmesh(bm, dlayer, mesh_obj)
        HeadSphere(hr, (0,0,hcz), "Head").add_to_bmesh(bm, dlayer, mesh_obj)

        f_cfg = params.get("foliage", {}); h_vg = mesh_obj.vertex_groups.get("Head")
        for i in range(f_cfg.get("density", 50)):
            angle = (i/f_cfg.get("density", 50))*math.pi*2; tilt = random.uniform(0.2, 0.8)
            loc = mathutils.Vector((0,0,hcz)) + mathutils.Vector((math.cos(angle)*hr*tilt, math.sin(angle)*hr*tilt, hr*0.5 + random.uniform(0, hr)))
            if loc.y > hcz - 0.05:
                dir_v = (loc - mathutils.Vector((0,0,hcz))).normalized(); b_len = random.uniform(0.4, 0.8)
                b_ret = bmesh.ops.create_cone(bm, segments=6, cap_ends=True, radius1=0.03, radius2=0.005, depth=b_len, matrix=(mathutils.Matrix.Translation(loc + dir_v*(b_len/2)) @ dir_v.to_track_quat('Z', 'Y').to_matrix().to_4x4()))
                for v in b_ret['verts']: v[dlayer][h_vg.index] = 1.0

        bm.to_mesh(mesh_data); bm.free()
        if rig:
            mesh_obj.parent = rig
            self._create_facial_props(char_id, mesh_obj, rig)
        return mesh_obj

    def _create_facial_props(self, char_id, body_mesh, rig):
        bark_mat, eye_r = (body_mesh.data.materials[0] if body_mesh.data.materials else None), 0.065
        def create_fm(pname, bone, radius, type='SPHERE', scale=(1,1,1), rot=(0,0,0)):
            m = bpy.data.meshes.new(f"{char_id}_{pname}"); o = bpy.data.objects.new(f"{char_id}_{pname}", m); bpy.context.scene.collection.objects.link(o)
            o.parent, o.parent_type, o.parent_bone, o.location = rig, 'BONE', bone, (0,0,0)
            bm = bmesh.new()
            if type == 'SPHERE': bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=radius)
            elif type == 'CONE': bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=radius, radius2=0, depth=radius*4)
            elif type == 'CUBE': bmesh.ops.create_cube(bm, size=radius*2)
            bmesh.ops.transform(bm, matrix=mathutils.Euler(rot).to_matrix().to_4x4() @ mathutils.Matrix.Diagonal((*scale, 1)), verts=bm.verts); bm.to_mesh(m); bm.free()
            for f in m.polygons: f.use_smooth = True
            return o
        for side in ("L", "R"):
            create_fm(f"Eye_{side}", f"Eye.{side}", eye_r); create_fm(f"Ear_{side}", f"Ear.{side}", 0.16, scale=(0.25, 0.5, 1.7))
            for part in ("Upper", "Lower"):
                l = create_fm(f"Lid_{part}_{side}", f"Eyelid.{part}.{side}", eye_r * 1.15)
                bm = bmesh.new(); bm.from_mesh(l.data); to_del = [v for v in bm.verts if (v.co.z < 0.01 if part == "Upper" else v.co.z > -0.01)]; bmesh.ops.delete(bm, geom=to_del, context='VERTS'); bm.to_mesh(l.data); bm.free()
                if bark_mat: l.data.materials.append(bark_mat)
        create_fm("Lip_Upper", "Lip.Upper", 0.045, scale=(4.4, 0.4, 1.3)); create_fm("Lip_Lower", "Lip.Lower", 0.045, scale=(4.4, 0.4, 1.3))
        n = create_fm("Nose", "Nose", 0.045, type='CONE', scale=(1.1, 1.0, 0.8), rot=(math.radians(90), 0, 0))
        if bark_mat: n.data.materials.append(bark_mat)
        t = create_fm("Teeth", "Head", 0.05, type='CUBE', scale=(1.4, 0.1, 0.2)); t.location = (0, -0.36, -0.18)
        if "Arbor" in char_id:
            m = bpy.data.meshes.new(f"{char_id}_SapMole"); o = bpy.data.objects.new(f"{char_id}_SapMole", m); bpy.context.scene.collection.objects.link(o)
            o.parent, o.parent_type, o.parent_bone, o.location = rig, 'BONE', "Head", (0.18, -0.38, 0.08)
            bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.015); bm.to_mesh(m); bm.free()

registry.register_modeling("PlantModeler", PlantModeler)
