"""
Blender API compatibility helpers for Greenhouse Movie Production.
Isolates deprecated property access (like .use_nodes) to single fallback locations.
(Point 160)
"""
import bpy

def ensure_material_node_tree(mat):
    """Return a material node tree without hard dependency on Material.use_nodes."""
    if mat is None:
        return None

    tree = getattr(mat, "node_tree", None)
    if tree:
        return tree

    # Blender <= 5.x fallback (property still exists but deprecated)
    if hasattr(mat, "use_nodes"):
        try:
            mat.use_nodes = True
        except Exception:
            pass

    # Blender 6+ expectation: node_tree should exist by default or after internal lazy init
    return getattr(mat, "node_tree", None)

def ensure_compositor_tree(scene):
    """Return a compositor node tree without hard dependency on Scene.use_nodes."""
    if scene is None:
        return None

    # Check for node_tree first
    tree = getattr(scene, "node_tree", None)
    if tree:
        return tree

    # Blender <= 5.x fallback (property still exists but deprecated)
    if hasattr(scene, "use_nodes"):
        try:
            scene.use_nodes = True
        except Exception:
            pass

    # Re-check node_tree after attempted enable
    tree = getattr(scene, "node_tree", None)

    # Optional: trigger operator if still missing in some 4.x/5.x versions
    if not tree:
        try:
            bpy.ops.node.new_node_tree(type='CompositorNodeTree', name="Compositing")
            tree = getattr(scene, "node_tree", None)
        except Exception:
            pass

    return tree

def ensure_world_node_tree(world):
    """Return a world node tree without hard dependency on World.use_nodes."""
    if world is None:
        return None

    tree = getattr(world, "node_tree", None)
    if tree:
        return tree

    # Blender <= 5.x fallback
    if hasattr(world, "use_nodes"):
        try:
            world.use_nodes = True
        except Exception:
            pass

    return getattr(world, "node_tree", None)
