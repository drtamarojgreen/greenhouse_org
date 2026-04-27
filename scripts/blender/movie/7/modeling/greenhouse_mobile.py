import bpy
import bmesh
import math
import mathutils
import random
from base import Modeler
from environment.vegetation_utils import create_bush, apply_mat

class GreenhouseMobileModeler(Modeler):
    """Procedural modeler for the GreenhouseMobile vehicle."""

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("7b.ENVIRONMENT") or bpy.data.collections.new("7b.ENVIRONMENT")
        
        struct = params.get("structure", {})
        mats = params.get("parameters", {}).get("materials", {})
        
        L = struct.get("body_length", 6.0)
        W = struct.get("body_width", 2.8)
        H = struct.get("body_height", 2.5)
        
        # 1. Verdant El Camino Body (Streamlined Coupe Utility)
        mesh = bpy.data.meshes.new(f"{char_id}_Body")
        obj = bpy.data.objects.new(char_id, mesh)
        coll.objects.link(obj)
        
        bm = bmesh.new()
        # Main Body Slab (Aerodynamic Wedge)
        # Create a grid and deform it into a car shape
        bmesh.ops.create_cube(bm, size=1.0)
        # Scale to rough car dimensions
        bmesh.ops.scale(bm, vec=(L, W, 0.6), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(0, 0, 0.3), verts=bm.verts)
        
        # Sculpt the hood (Front X positive)
        for v in bm.verts:
            if v.co.x > L/4: # Front half
                # Slope hood down
                dist_front = (v.co.x - L/4) / (L/4)
                v.co.z -= dist_front * 0.4
            if v.co.x < -L/4: # Rear half (the bed)
                # Cut out the bed
                if v.co.z > 0.4 and abs(v.co.y) < W*0.4:
                    v.co.z = 0.4
        
        # Cabin (The Greenhouse)
        # Create a smaller cube for the cabin
        cw, cl, ch = W * 0.8, L * 0.3, 0.7
        ret_cab = bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0.1*L, 0, 0.6 + ch/2)) @ mathutils.Matrix.Scale(cl, 4, (1,0,0)) @ mathutils.Matrix.Scale(cw, 4, (0,1,0)) @ mathutils.Matrix.Scale(ch, 4, (0,0,1)))
        
        # Slope Windshield (Front of cabin)
        for v in ret_cab['verts']:
            if v.co.x > 0.1*L + cl/4: # Front cabin verts
                v.co.x -= (v.co.z - 0.6) * 0.5 # Slant back
        
        # Add Rear View Mirrors
        for side in [-1, 1]:
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0.2*L, side * (cw/2 + 0.1), 0.8)) @ mathutils.Matrix.Scale(0.1, 4, (1,0,0)) @ mathutils.Matrix.Scale(0.2, 4, (0,1,0)) @ mathutils.Matrix.Scale(0.1, 4, (0,0,1)))

        # Subdivide and Bevel for sleekness
        bmesh.ops.bevel(bm, geom=bm.edges, offset=0.08, segments=2)
        
        # Assign Materials
        for poly in bm.faces:
            poly.smooth = True
            c = poly.calc_center_median()
            # Windows and Sunroof logic
            if c.z > 0.7 and c.x > -0.05*L and abs(c.y) < cw*0.5:
                poly.material_index = 1 # Glass
            else:
                poly.material_index = 0 # Body
        
        # Open cabin top for heads
        to_delete = [f for f in bm.faces if f.calc_center_median().z > 1.2 and 0 < f.calc_center_median().x < 0.2*L and abs(f.calc_center_median().y) < W/5]
        bmesh.ops.delete(bm, geom=to_delete, context='FACES')
        
        bm.to_mesh(mesh); bm.free()
        
        # Materials (High-End Automotive)
        apply_mat(obj, "mat_gm_body", [0.02, 0.12, 0.02], metallic=1.0, roughness=0.1) # Racing Green Chrome
        apply_mat(obj, "mat_gm_glass", [0.7, 0.9, 1.0], alpha=True, emission=0.1)
        apply_mat(obj, "mat_gm_chrome", [0.95, 0.95, 0.95], metallic=1.0, roughness=0.05)
        apply_mat(obj, "mat_gm_tire", [0.05, 0.05, 0.05], roughness=0.9)
        
        # 4. Chrome Muscle Wheels
        rw, ww = 0.6, 0.4
        for lx in [-L/3, L/3]:
            for ly in [-W/2, W/2]:
                w_mesh = bpy.data.meshes.new(f"{char_id}_Wheel")
                w_obj = bpy.data.objects.new(f"{char_id}_Wheel", w_mesh)
                coll.objects.link(w_obj); w_obj.parent = obj
                w_obj.location = (lx, ly, rw*0.75); w_obj.rotation_euler[0] = math.radians(90)
                
                bm_w = bmesh.new()
                bmesh.ops.create_cone(bm_w, segments=32, radius1=rw, radius2=rw, depth=ww)
                # Deep Rim Detail
                bmesh.ops.create_cone(bm_w, segments=16, radius1=rw*0.6, radius2=rw*0.8, depth=ww + 0.05)
                for poly in bm_w.faces:
                    poly.smooth = True
                    poly.material_index = 2 if abs(poly.normal.z) > 0.9 and poly.center.length < rw*0.8 else 3
                bm_w.to_mesh(w_mesh); bm_w.free()
                w_obj.data.materials.append(obj.data.materials[3]) # Tire
                w_obj.data.materials.append(obj.data.materials[2]) # Chrome Rim
                for poly in w_obj.data.polygons: poly.material_index = 1 if poly.material_index == 2 else 0
                
        # 6. The "Greenhouse" Bed
        for _ in range(12):
            px = random.uniform(-L/2 + 0.5, -L/10)
            py = random.uniform(-W/3, W/3)
            plt = create_bush(f"{char_id}_BedPlant", (px, py, 0.5), 0.35, coll, [[0.1, 0.7, 0.1], [0.3, 0.2, 0.5]])
            if plt: plt.parent = obj
        
        return obj

from registry import registry
registry.register_modeling("GreenhouseMobileModeler", GreenhouseMobileModeler)
