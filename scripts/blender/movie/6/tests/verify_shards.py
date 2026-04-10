
import sys
import os
from unittest.mock import MagicMock

# Mock bpy and other blender modules
mock_bpy = MagicMock()
sys.modules["bpy"] = mock_bpy
sys.modules["mathutils"] = MagicMock()
sys.modules["bpy_extras"] = MagicMock()

# Mock internal modules
sys.modules["config"] = MagicMock()

# Add script path
os.chdir("scripts/blender/movie/6")
sys.path.append(".")

from asset_manager_v6 import SylvanEnsembleManager

def test_sanitize_shards_logic():
    print("Testing sanitize_shards logic...")

    manager = SylvanEnsembleManager()

    # 1. Setup Mock Mesh
    mesh_obj = MagicMock()
    mesh_obj.type = 'MESH'
    mesh_obj.name = "TestMesh"

    v1 = MagicMock()
    v1.co = MagicMock()
    v1.co.length = 1.0 # Normal vertex

    v2 = MagicMock()
    v2.co = MagicMock()
    v2.co.length = 15.0 # Shard vertex (> 10m threshold)

    mesh_obj.data.vertices = [v1, v2]

    # Mock depsgraph/evaluated mesh
    # By default, we'll just test the rest position logic first
    mock_bpy.context.evaluated_depsgraph_get.side_effect = Exception("No DG")

    manager.sanitize_shards(mesh_obj, threshold=10.0)

    # Check results
    # v1.co should NOT have been reassigned
    # v2.co SHOULD have been reassigned to (0,0,0)

    # Since we can't easily check assignments on mocked objects without more setup,
    # let's look at what sanitize_shards does: v.co = (0, 0, 0)

    print(f"Vertex 1 co: {v1.co}")
    print(f"Vertex 2 co: {v2.co}")

    # In Mock-land, assigning v2.co = (0,0,0) replaces the mock object with the tuple
    if v2.co == (0, 0, 0):
        print("SUCCESS: Shard vertex v2 snapped to origin.")
    else:
        print("FAILED: Shard vertex v2 not snapped.")
        sys.exit(1)

    if v1.co != (0, 0, 0):
        print("SUCCESS: Normal vertex v1 preserved.")
    else:
        print("FAILED: Normal vertex v1 was incorrectly snapped.")
        sys.exit(1)

if __name__ == "__main__":
    try:
        test_sanitize_shards_logic()
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
