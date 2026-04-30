# generate_mental_health_assets.py - Procedural asset generation for Movie 8 environments

import bpy
import bmesh
import math
import mathutils

class MentalHealthAssetGenerator:
    """Generates procedural assets based on psychological principles."""

    def __init__(self):
        # Create a collection for these new assets
        self.coll = bpy.data.collections.get("8c.MENTAL_HEALTH")
        if not self.coll:
            self.coll = bpy.data.collections.new("8c.MENTAL_HEALTH")
            bpy.context.scene.collection.children.link(self.coll)

    def generate_all(self):
        print("Generating specialized mental health assets...")
        self.create_clinical_desk()
        self.create_wellness_trellis()
        self.create_mountain_forest_path()
        self.create_beach_gazebo()
        self.create_library_shelf()
        print("Asset generation complete.")

    def create_clinical_desk(self):
        """Psychiatric Office: Represents structure and analytical support."""
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        desk = bpy.context.active_object
        desk.name = "ClinicalDesk"
        desk.scale = (2.0, 1.0, 0.05)
        desk.location = (0, 0, 0.75)

        # Add legs
        for x, y in [(-1.8, -0.8), (1.8, -0.8), (-1.8, 0.8), (1.8, 0.8)]:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.75, location=(x/2, y/2, 0.375))
            leg = bpy.context.active_object
            leg.parent = desk

        self.coll.objects.link(desk)

    def create_wellness_trellis(self):
        """Wellness Garden: Represents neuroplasticity and growth networks."""
        # Create a branching structure using BMesh
        mesh = bpy.data.meshes.new("WellnessTrellis")
        obj = bpy.data.objects.new("WellnessTrellis", mesh)
        self.coll.objects.link(obj)

        bm = bmesh.new()
        # Create a base ring
        bmesh.ops.create_circle(bm, cap_ends=False, radius=1.0, segments=8)

        # Extrude upwards with some 'neural' branching logic
        for i in range(5):
            r = 0.5 + (0.1 * i)
            ext = bmesh.ops.extrude_edge_only(bm, edges=bm.edges)
            verts = [v for v in ext['geom'] if isinstance(v, bmesh.types.BMVert)]
            for v in verts:
                v.co.z += 0.5
                v.co.x *= 1.1 # Organic flare
                v.co.y *= 1.1

        bm.to_mesh(mesh)
        bm.free()

        # Add a skin modifier for thickness
        obj.modifiers.new(name="Skin", type='SKIN')
        obj.modifiers.new(name="Subdiv", type='SUBSURF')

    def create_beach_gazebo(self):
        """Beach Gazebo: Represents clarity and a shelter for the subconscious."""
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=2.0, depth=0.1, location=(0,0,0.05))
        base = bpy.context.active_object
        base.name = "BeachGazebo"

        # Pillars
        for i in range(8):
            angle = (i / 8) * 2 * math.pi
            x = math.cos(angle) * 1.8
            y = math.sin(angle) * 1.8
            bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=2.0, location=(x, y, 1.0))
            pillar = bpy.context.active_object
            pillar.parent = base

        # Roof (Cone)
        bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=2.2, depth=1.0, location=(0,0,2.5))
        roof = bpy.context.active_object
        roof.parent = base

        self.coll.objects.link(base)

    def create_mountain_forest_path(self):
        """Mountain Forest Path: Represents resilience and upward progress."""
        # Create a rugged path mesh
        mesh = bpy.data.meshes.new("ResiliencePath")
        obj = bpy.data.objects.new("ResiliencePath", mesh)
        self.coll.objects.link(obj)

        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=10, y_segments=2, size=5.0)

        # Add 'rugged' noise for resilience metaphor
        for v in bm.verts:
            v.co.z += (math.sin(v.co.x * 2) * 0.2) + (math.cos(v.co.y * 5) * 0.1)

        bm.to_mesh(mesh)
        bm.free()

        # Add simple pine trees as sentinels
        for i in range(3):
            bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=0.5, depth=1.5, location=(i*3 - 3, 1.5, 0.75))
            tree = bpy.context.active_object
            tree.name = f"Pine_Sentinel_{i}"
            tree.parent = obj

    def create_library_shelf(self):
        """Meditation Library: Represents structured cognitive storage."""
        bpy.ops.mesh.primitive_cube_add(size=1.0)
        shelf = bpy.context.active_object
        shelf.name = "LibraryShelf_Logic"
        shelf.scale = (2.0, 0.3, 3.0)
        shelf.location = (0, 0, 1.5)

        # Subtract inner volumes for shelves using Boolean or just add boxes
        for i in range(5):
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            slot = bpy.context.active_object
            slot.name = f"ShelfSlot_{i}"
            slot.scale = (1.8, 0.25, 0.4)
            slot.location = (0, 0, 0.5 + i*0.6)
            slot.parent = shelf

        self.coll.objects.link(shelf)

if __name__ == "__main__":
    generator = MentalHealthAssetGenerator()
    generator.generate_all()
