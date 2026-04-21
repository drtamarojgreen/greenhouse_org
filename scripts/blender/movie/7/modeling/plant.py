import bpy
import bmesh
import mathutils
import math
import random
from ..base import Modeler
from ..registry import registry

class PlantModeler(Modeler):
    """High-fidelity production modeling logic implementing every Movie 6 detail."""

    def build_mesh(self, char_id, params):
        mesh_data = bpy.data.meshes.new(f"{char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh_obj)

        bm = bmesh.new()
        dlayer = bm.verts.layers.deform.verify()
        dims = params.get("dimensions", {})
        th, hr, nh = dims.get("torso_h", 1.5), dims.get("head_r", 0.4), dims.get("neck_h", 0.2)
        hcz = th + nh + hr

        def add_part(bm, rad1, rad2, h, loc, bname, mid_scale=1.0, rot=(0,0,0)):
            vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
            matrix = mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4()
            ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=h, matrix=matrix)
            for v in ret['verts']:
                v[dlayer][vg.index] = 1.0
                if mid_scale != 1.0:
                    dist = (v.co - mathutils.Vector(loc)).length
                    z_fact = 1.0 - abs(dist / (h / 2))
                    factor = 1.0 + (mid_scale - 1.0) * max(0, z_fact)
                    v.co = mathutils.Vector(loc) + (v.co - mathutils.Vector(loc)) * factor
            for f in bm.faces: f.smooth = True

        # 1. Body Segments with joint bulbs
        add_part(bm, 0.5, 0.25, th, (0, 0, th/2), "Torso", mid_scale=1.2)
        add_part(bm, 0.15, 0.12, nh, (0, 0, th+nh/2), "Neck")

        # 2. Head Spheroid
        ret_head = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=hr, matrix=mathutils.Matrix.Translation((0,0,hcz)))
        h_vg = mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head")
        for v in ret_head['verts']: v[dlayer][h_vg.index] = 1.0

        # 3. Limbs with joint bulbs matching Movie 6
        for side, sx in [("L", 1), ("R", -1)]:
            # Arms
            add_part(bm, 0.14, 0.11, 0.4, (0.4*sx, 0, th*0.9-0.2), f"Arm.{side}", mid_scale=1.15)
            add_part(bm, 0.11, 0.08, 0.4, (0.4*sx, 0, th*0.9-0.6), f"Elbow.{side}", mid_scale=1.1)
            # Digits
            for f in range(1, 4):
                fx = 0.4*sx + (f-2)*0.06
                add_part(bm, 0.04, 0.01, 0.25, (fx, 0, th*0.9-0.9), f"Hand.{side}")

            # Legs
            add_part(bm, 0.2, 0.16, 0.5, (0.25*sx, 0, 0.1-0.25), f"Thigh.{side}", mid_scale=1.15)
            add_part(bm, 0.16, 0.12, 0.5, (0.25*sx, 0, -0.4-0.25), f"Knee.{side}", mid_scale=1.1)
            add_part(bm, 0.1, 0.15, 0.25, (sx*0.25, -0.15, -0.9), f"Foot.{side}", rot=(math.radians(90), 0, 0))

        # 4. Foliage Algorithm (Parity with v6)
        f_cfg = params.get("foliage", {})
        for i in range(f_cfg.get("density", 50)):
            angle = (i/f_cfg.get("density", 50))*math.pi*2
            tilt = random.uniform(0.2, 0.8)
            loc = mathutils.Vector((0,0,hcz)) + mathutils.Vector((math.cos(angle)*hr*tilt, math.sin(angle)*hr*tilt, hr*0.5 + random.uniform(0, hr)))
            if loc.y > hcz - 0.05:
                dir_vec = (loc - mathutils.Vector((0,0,hcz))).normalized()
                b_len = random.uniform(0.4, 0.8)
                b_ret = bmesh.ops.create_cone(bm, segments=6, cap_ends=True, radius1=0.03, radius2=0.005, depth=b_len, matrix=(mathutils.Matrix.Translation(loc + dir_vec*(b_len/2)) @ dir_vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()))
                for v in b_ret['verts']: v[dlayer][h_vg.index] = 1.0

        bm.to_mesh(mesh_data); bm.free()

        # 5. Specialized Facial Detail Components
        self._create_facial_props(char_id, mesh_obj)
        if "Arbor" in char_id: self._create_sap_mole(char_id, mesh_obj)

        return mesh_obj

    def _create_facial_props(self, char_id, body_mesh):
        rig = body_mesh.parent
        bark_mat = body_mesh.data.materials[0] if body_mesh.data.materials else None
        eye_r = 0.065

        def create_facial_mesh(pname, bone, radius, type='SPHERE', scale=(1,1,1), rot=(0,0,0)):
            m = bpy.data.meshes.new(f"{char_id}_{pname}")
            o = bpy.data.objects.new(f"{char_id}_{pname}", m)
            bpy.context.scene.collection.objects.link(o)
            o.parent = rig; o.parent_type = 'BONE'; o.parent_bone = bone; o.location = (0,0,0)
            bm = bmesh.new()
            if type == 'SPHERE': bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=radius)
            elif type == 'CONE': bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=radius, radius2=0, depth=radius*4)
            elif type == 'CUBE': bmesh.ops.create_cube(bm, size=radius*2)

            matrix = mathutils.Euler(rot).to_matrix().to_4x4() @ mathutils.Matrix.Diagonal((*scale, 1))
            bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
            bm.to_mesh(m); bm.free()
            for f in m.polygons: f.use_smooth = True
            return o

        for side in ("L", "R"):
            # Eyeballs & Conch-shaped Ears
            create_facial_mesh(f"Eye_{side}", f"Eye.{side}", eye_r)
            create_facial_mesh(f"Ear_{side}", f"Ear.{side}", 0.16, scale=(0.25, 0.5, 1.7))

            # Eyelids with 'Blinker' curvature
            for part in ("Upper", "Lower"):
                l = create_facial_mesh(f"Lid_{part}_{side}", f"Eyelid.{part}.{side}", eye_r * 1.15)
                bm = bmesh.new(); bm.from_mesh(l.data)
                to_del = [v for v in bm.verts if (v.co.z < 0.01 if part == "Upper" else v.co.z > -0.01)]
                bmesh.ops.delete(bm, geom=to_del, context='VERTS')
                bm.to_mesh(l.data); bm.free()
                if bark_mat: l.data.materials.append(bark_mat)

        # Petal-curved Lips & Respiratory Core
        create_facial_mesh("Lip_Upper", "Lip.Upper", 0.045, scale=(4.4, 0.4, 1.3))
        create_facial_mesh("Lip_Lower", "Lip.Lower", 0.045, scale=(4.4, 0.4, 1.3))
        n = create_facial_mesh("Nose", "Nose", 0.045, type='CONE', scale=(1.1, 1.0, 0.8), rot=(math.radians(90), 0, 0))
        if bark_mat: n.data.materials.append(bark_mat)

        # Seed Teeth
        t = create_facial_mesh("Teeth", "Head", 0.05, type='CUBE', scale=(1.4, 0.1, 0.2))
        t.location = (0, -0.36, -0.18)

    def _create_sap_mole(self, char_id, body_mesh):
        """Character-specific distinguishing mark for Arbor."""
        m = bpy.data.meshes.new(f"{char_id}_SapMole")
        o = bpy.data.objects.new(f"{char_id}_SapMole", m)
        bpy.context.scene.collection.objects.link(o)
        o.parent = body_mesh.parent; o.parent_type = 'BONE'; o.parent_bone = "Head"
        bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.015)
        bm.to_mesh(m); bm.free()
        o.location = (0.18, -0.38, 0.08)

registry.register_modeling("PlantModeler", PlantModeler)
