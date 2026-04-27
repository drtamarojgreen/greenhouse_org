import bpy
import bmesh
import math
import mathutils
import random
from base import Modeler
from environment.vegetation_utils import create_bush, apply_mat

class GreenhouseMobileModeler(Modeler):
    """Procedural modeler for the GreenhouseMobile vehicle with high-detail wheels and functional doors."""

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("7b.ENVIRONMENT") or bpy.data.collections.new("7b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children.keys():
            bpy.context.scene.collection.children.link(coll)
        
        struct = params.get("structure", {})
        L = struct.get("body_length", 6.0)
        W = struct.get("body_width", 2.8)
        H = struct.get("body_height", 2.5)
        
        # 1. Main Body
        mesh = bpy.data.meshes.new(f"{char_id}_Body")
        obj = bpy.data.objects.new(char_id, mesh)
        coll.objects.link(obj)
        
        bm = bmesh.new()
        # Chassis Base
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(L, W, 0.6), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(0, 0, 0.3), verts=bm.verts)
        
        # Sculpt Hood and Bed
        for v in bm.verts:
            if v.co.x > L/4: # Front hood slope
                dist_front = (v.co.x - L/4) / (L/4)
                v.co.z -= dist_front * 0.4
            if v.co.x < -L/4: # Rear bed cutout
                if v.co.z > 0.4 and abs(v.co.y) < W*0.4:
                    v.co.z = 0.4
        
        # Greenhouse Cabin
        cw, cl, ch = W * 0.8, L * 0.3, 0.7
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0.1*L, 0, 0.6 + ch/2)) @ 
                             mathutils.Matrix.Scale(cl, 4, (1,0,0)) @ 
                             mathutils.Matrix.Scale(cw, 4, (0,1,0)) @ 
                             mathutils.Matrix.Scale(ch, 4, (0,0,1)))
        
        # Add Rear View Mirrors (Restored with Chrome)
        for side in [-1, 1]:
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0.2*L, side * (cw/2 + 0.1), 0.8)) @ 
                                 mathutils.Matrix.Scale(0.1, 4, (1,0,0)) @ 
                                 mathutils.Matrix.Scale(0.2, 4, (0,1,0)) @ 
                                 mathutils.Matrix.Scale(0.1, 4, (0,0,1)))

        # Subdivide and Bevel for sleek look
        bmesh.ops.bevel(bm, geom=bm.edges, offset=0.08, segments=2)
        
        # Material Indexing for Body/Glass/Chrome
        for poly in bm.faces:
            poly.smooth = True
            c = poly.calc_center_median()
            # Glass for cabin
            if c.z > 0.7 and c.x > -0.05*L and abs(c.y) < cw*0.5:
                poly.material_index = 1 
            # Chrome for mirrors (Small parts near the front cabin)
            elif 0.15*L < c.x < 0.25*L and abs(c.y) > cw*0.49:
                poly.material_index = 2
            else:
                poly.material_index = 0 
            
        bm.to_mesh(mesh); bm.free()
        
        # Apply Materials
        m_body = apply_mat(obj, "mat_gm_body", [0.02, 0.12, 0.02], metallic=1.0, roughness=0.1)
        m_glass = apply_mat(obj, "mat_gm_glass", [0.7, 0.9, 1.0], alpha=True, emission=0.2)
        m_chrome = apply_mat(obj, "mat_gm_chrome", [0.95, 0.95, 0.95], metallic=1.0, roughness=0.05)
        m_tire = apply_mat(obj, "mat_gm_tire", [0.05, 0.05, 0.05], roughness=0.9)

        # 2. Doors (Functional for Director actions)
        self._create_door(f"{char_id}_Door", L*0.15, 0.1, 1.2, obj, coll, m_body)

        # 3. Procedural Muscle Wheels
        rw, ww = struct.get("wheel_radius", 0.6), struct.get("wheel_width", 0.8)
        for i, (lx, ly) in enumerate([(-L/3, -W/2), (-L/3, W/2), (L/3, -W/2), (L/3, W/2)]):
            w_obj = self._create_muscle_wheel(f"{char_id}_Wheel_{i}", rw, ww, coll, m_tire, m_chrome)
            w_obj.parent = obj
            w_obj.location = (lx, ly, rw)

        # 4. Greenhouse Bed Plants
        for _ in range(12):
            px, py = random.uniform(-L/2 + 0.5, -L/10), random.uniform(-W/3, W/3)
            plt = create_bush(f"{char_id}_BedPlant", (px, py, 0.5), 0.35, coll, [[0.1, 0.7, 0.1], [0.3, 0.2, 0.5]])
            if plt: plt.parent = obj
        
        return obj

    def _create_muscle_wheel(self, name, radius, thickness, coll, tire_mat, rim_mat):
        """Creates a high-detail procedural muscle car wheel with deep dish rim."""
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        bm = bmesh.new()
        rot = mathutils.Matrix.Rotation(math.radians(90), 4, 'X')
        
        # Tire Main
        bmesh.ops.create_cone(bm, segments=32, radius1=radius, radius2=radius, depth=thickness, matrix=rot)
        
        # Deep Dish Inset
        rim_r = radius * 0.7
        side_faces = [f for f in bm.faces if abs(f.normal.y) > 0.9]
        ret = bmesh.ops.inset_individual(bm, faces=side_faces, thickness=radius - rim_r)
        for f in ret['faces']:
            direction = -1 if f.normal.y > 0 else 1
            bmesh.ops.translate(bm, verts=f.verts, vec=(0, direction * thickness * 0.3, 0))
            
        # Hub detail
        bmesh.ops.create_cone(bm, segments=12, radius1=rim_r*0.3, radius2=rim_r*0.4, depth=thickness*0.2, matrix=rot)
        
        for face in bm.faces:
            face.smooth = True
            face.material_index = 1 if face.calc_center_median().xz.length < rim_r * 1.05 else 0
                
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(tire_mat)
        obj.data.materials.append(rim_mat)
        return obj

    def _create_door(self, name, x_pos, thickness, height, parent, coll, mat):
        """Creates a door object with pivot at the hinge for animation."""
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        
        bm = bmesh.new()
        # Pivot is at X positive edge (hinge)
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(0.8, thickness, height), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(-0.4, 0, height/2), verts=bm.verts)
        bm.to_mesh(mesh); bm.free()
        
        obj.parent = parent
        obj.location = (x_pos, parent.dimensions.y/2 + thickness, 0.3)
        obj.data.materials.append(mat)
        return obj

from registry import registry
registry.register_modeling("GreenhouseMobileModeler", GreenhouseMobileModeler)
