import bpy
import bmesh
import mathutils
import math
import os
import sys

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

import base
from registry import registry

class ProceduralModeler(base.Modeler):
    """
    Truly Universal Modeler that builds mesh and props from structure data.
    Architecture Kept: The recursive structure-to-geometry builder from Movie 9
    provides the high degree of modularity required for Movie 9's dynamic assets.
    """

    def build_mesh(self, char_id, params, rig=None):
        # 1. Use params for structure, decouple from singleton config
        structure = params.get("structure", {})

        mesh_data = bpy.data.meshes.new(f"{char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh_obj)

        bm = bmesh.new()
        dlayer = bm.verts.layers.deform.verify()

        # Build main geometry
        for geo in structure.get("geometry", []):
            self._add_part(bm, dlayer, mesh_obj, geo)

        bm.to_mesh(mesh_data)
        bm.free()

        # 2. Build props (attachments)
        if rig:
            mesh_obj.parent = rig
            for prop in structure.get("props", []):
                self._add_prop(char_id, rig, prop)

        return mesh_obj

    def _add_part(self, bm, dlayer, mesh_obj, geo):
        name = geo["name"]
        gtype = geo["type"]
        loc = geo["loc"]
        vg = mesh_obj.vertex_groups.get(name) or mesh_obj.vertex_groups.new(name=name)

        matrix = mathutils.Matrix.Translation(loc)
        if "rot" in geo:
            matrix @= mathutils.Euler(geo["rot"]).to_matrix().to_4x4()

        if gtype == "CONE":
            r1, r2, h = geo["params"]
            ret = bmesh.ops.create_cone(bm, segments=geo.get("segments", 24), cap_ends=True, radius1=r1, radius2=r2, depth=h, matrix=matrix)
        elif gtype == "SPHERE":
            r = geo["params"][0]
            ret = bmesh.ops.create_uvsphere(bm, u_segments=geo.get("segments", 32), v_segments=geo.get("segments", 32), radius=r, matrix=matrix)
        elif gtype == "CUBE":
            s = geo["params"][0]
            ret = bmesh.ops.create_cube(bm, size=s, matrix=matrix)
        else:
            return

        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
            if geo.get("mid_scale", 1.0) != 1.0 and gtype == "CONE":
                dist = (v.co - mathutils.Vector(loc)).length
                z_fact = 1.0 - abs(dist / (geo["params"][2] / 2))
                v.co = mathutils.Vector(loc) + (v.co - mathutils.Vector(loc)) * (1.0 + (geo["mid_scale"] - 1.0) * max(0, z_fact))

        for f in bm.faces:
            f.smooth = True

    def _add_prop(self, char_id, rig, prop):
        name = prop["name"]
        bone = prop["bone"]
        gtype = prop["type"]
        params = prop["params"]

        m = bpy.data.meshes.new(f"{char_id}_{name}")
        o = bpy.data.objects.new(f"{char_id}_{name}", m)
        bpy.context.scene.collection.objects.link(o)

        o.parent = rig
        o.parent_type = 'BONE'
        o.parent_bone = bone
        o.location = (0, 0, 0)

        bm = bmesh.new()
        matrix = mathutils.Matrix.Identity(4)
        if "scale" in prop:
            matrix @= mathutils.Matrix.Diagonal((*prop["scale"], 1))
        if "rot" in prop:
            matrix @= mathutils.Euler(prop["rot"]).to_matrix().to_4x4()

        if gtype == "SPHERE":
            bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=params[0], matrix=matrix)
        elif gtype == "CONE":
            bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=params[0], radius2=0, depth=params[0]*4, matrix=matrix)
        elif gtype == "CUBE":
            bmesh.ops.create_cube(bm, size=params[0], matrix=matrix)

        bm.to_mesh(m)
        bm.free()
        for f in m.polygons: f.use_smooth = True

        o["material_id"] = prop.get("material", "primary")

registry.register_modeling("ProceduralModeler", ProceduralModeler)
