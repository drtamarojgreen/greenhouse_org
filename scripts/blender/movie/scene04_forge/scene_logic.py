import bpy
import math
import mathutils
from assets.wilderness_assets import create_proc_terrain, create_proc_rock_formation, create_proc_dead_tree
from scene_utils import place_random_prop
import random

def setup_scene(master):
    """
    The Exchange of Knowledge and Stoic Forge.
    Shot ID: S04
    Intent: Staging the forge metaphor with props and character interaction. (Point 43)
    """
    import math
    # MUSIC CUE: Rhythmic industrial banging (softened for piano).
    # Point 142: Correct frame range (951 - 1250)
    from constants import SCENE_MAP
    start_f, end_f = SCENE_MAP['scene04_forge']
    master.create_intertitle("The Exchange of\nKnowledge", start_f, start_f + 100)

    # Volcanic wasteland environment
    terrain_v = bpy.data.objects.get("Terrain_Volcano")
    if not terrain_v:
        terrain_v = create_proc_terrain((0, 0, -1), size=50.0, type="flat")
        terrain_v.name = "Terrain_Volcano"
        # Override material to dark basalt
        for mat in terrain_v.data.materials:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf: bsdf.inputs['Base Color'].default_value = (0.04, 0.04, 0.04, 1)

    # Point 142: Camera corridor clearance (Forge shot 1101-1250)
    cam_pos = (-6, -6, 1.4)
    target_pos = (0, 0, 2.0)
    
    for i in range(8):
        r_name = f"VolcanoRock_{i}"
        if not bpy.data.objects.get(r_name):
            r = place_random_prop(
                None,
                lambda l: create_proc_rock_formation(l, scale=random.uniform(1.0, 3.0), style_type="jagged"),
                (-10, 10), (-8, 8), (-0.8, -0.8),
                cam_pos, target_pos, seed=i
            )
            if r: r.name = r_name

    for i in range(4):
        dt_name = f"VolcanoDeadTree_{i}"
        if not bpy.data.objects.get(dt_name):
            dt = place_random_prop(
                None,
                lambda l: create_proc_dead_tree(l, scale=random.uniform(0.8, 1.5)),
                (-8, 8), (-8, 8), (-1, -1),
                cam_pos, target_pos, seed=i+10
            )
            if dt: dt.name = dt_name

    # Lava fissure: emissive planes on the ground
    import bmesh
    for i in range(4):
        lr_name = f"LavaFissure_{i}"
        if not bpy.data.objects.get(lr_name):
            def create_lava_plane(loc):
                mesh = bpy.data.meshes.new(f"{lr_name}_MeshData")
                obj = bpy.data.objects.new(lr_name, mesh)
                bpy.context.scene.collection.objects.link(obj)
                obj.location = loc
                obj.rotation_euler[2] = random.uniform(0, 3.14)
                bm_l = bmesh.new()
                bmesh.ops.create_grid(bm_l, x_segments=1, y_segments=1, size=1.0)
                for v in bm_l.verts:
                    v.co.x *= random.uniform(0.2, 0.5)
                    v.co.y *= random.uniform(1.0, 3.0)
                bm_l.to_mesh(mesh)
                bm_l.free()
                return obj

            fissure = place_random_prop(
                None, create_lava_plane,
                (-6, 6), (-6, 6), (-0.98, -0.98),
                cam_pos, target_pos, seed=i+20
            )
            lava_mat = bpy.data.materials.get("LavaMat") or bpy.data.materials.new("LavaMat")
            lava_mat.use_nodes = True
            bsdf = lava_mat.node_tree.nodes.get("Principled BSDF") or lava_mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
            bsdf.inputs['Base Color'].default_value = (1.0, 0.3, 0.0, 1)
            bsdf.inputs['Emission Color'].default_value = (1.0, 0.2, 0.0, 1)
            bsdf.inputs['Emission Strength'].default_value = 8.0
            if fissure:
                fissure.data.materials.append(lava_mat)

    # Point 43: Add simple anvil prop for the forge scene (BMesh)
    import bmesh
    anvil_data = bpy.data.meshes.new("Anvil_MeshData")
    anvil = bpy.data.objects.new("StoicAnvil", anvil_data)
    bpy.context.collection.objects.link(anvil)
    anvil.location = (0, 0, 0.25)
    
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=0.5)
    bm.to_mesh(anvil_data)
    bm.free()

    mat = bpy.data.materials.new(name="AnvilMat")
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
    anvil.data.materials.append(mat)

    master._set_visibility([anvil], [(start_f, end_f)])

    if master.h1:
        master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), start_f)
        
    if master.h1 and master.h1.type == 'ARMATURE':
        # Point 43: Hammering motion (Bone-based)
        torso = master.h1.pose.bones.get("Torso")
        if torso:
            for f in range(start_f + 100, end_f, 20):
                torso.rotation_euler[0] = 0
                torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
                torso.rotation_euler[0] = math.radians(20)
                torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 10)
