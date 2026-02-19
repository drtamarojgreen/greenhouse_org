import bpy
import math

def setup_scene(master):
    """
    The Exchange of Knowledge and Stoic Forge.
    Shot ID: S04
    Intent: Staging the forge metaphor with props and character interaction. (Point 43)
    """
    # MUSIC CUE: Rhythmic industrial banging (softened for piano).
    master.create_intertitle("The Exchange of\nKnowledge", 951, 1050)
    master.create_intertitle("The Forge of\nFortitude", 1251, 1350)

    # Point 43: Add simple anvil prop for the forge scene
    bpy.ops.mesh.primitive_cube_add(size=0.5, location=(0, 0, 0.25))
    anvil = bpy.context.object
    anvil.name = "StoicAnvil"
    mat = bpy.data.materials.new(name="AnvilMat")
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
    anvil.data.materials.append(mat)

    master._set_visibility([anvil], [(1351, 1500)])

    if master.h1:
        # Point 43: Hammering motion
        for f in range(1351, 1500, 20):
            master.h1.rotation_euler[0] = 0
            master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            master.h1.rotation_euler[0] = math.radians(20)
            master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=f + 10)
