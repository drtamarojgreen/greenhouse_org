import bpy
import bmesh
import mathutils
import math
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import base
from registry import registry

class ProceduralModeler(base.Modeler):
    """Universal Modeler that builds mesh from structure data."""

    def build_mesh(self, char_id, params, rig=None):
        # We use structure provided in params, fallback to None if not present
        structure = params.get("structure", {})
        if not structure:
             # Look for character config if not in params directly
             import config
             char_cfg = config.config.get_character_config(char_id)
             if char_cfg: structure = char_cfg.get("structure", {})

        mesh_data = bpy.data.meshes.new(f"{char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh_obj)

        bm = bmesh.new()
        dlayer = bm.verts.layers.deform.verify()

        for geo in structure.get("geometry", []):
            self._add_part(bm, dlayer, mesh_obj, geo)

        bm.to_mesh(mesh_data)
        bm.free()

        if rig:
            mesh_obj.parent = rig

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

registry.register_modeling("ProceduralModeler", ProceduralModeler)
