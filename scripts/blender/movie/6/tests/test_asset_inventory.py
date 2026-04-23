import bpy
import os
import sys
import unittest

# --- Path Injection ---
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

class TestAssetManifest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Load the master blend to inspect contents."""
        filepath = "scripts/blender/movie/6/MHD2_optimized.blend"
        if not bpy.ops.wm.open_mainfile(filepath=filepath):
            raise FileNotFoundError(f"Could not open {filepath}")

    def test_asset_inventory(self):
        """Audits the master blend for armatures, meshes, and textures."""
        print("\n" + "="*60)
        print("MASTER BLEND ASSET INVENTORY")
        print("="*60)

        # 1. Armatures
        armatures = [o.name for o in bpy.data.objects if o.type == 'ARMATURE']
        print(f"\nArmatures Found ({len(armatures)}):")
        for a in sorted(armatures):
            print(f"  - {a}")

        # 2. Textures (Images)
        images = [i.name for i in bpy.data.images]
        print(f"\nImages/Textures Found ({len(images)}):")
        for i in sorted(images):
            print(f"  - {i}")

        # 3. Meshes
        meshes = [o.name for o in bpy.data.objects if o.type == 'MESH']
        print(f"\nMeshes Found ({len(meshes)}):")
        # Just printing first 20 to avoid log spam
        for m in sorted(meshes)[:20]:
            print(f"  - {m}")
        if len(meshes) > 20: print(f"  ... and {len(meshes) - 20} more.")

        print("\n" + "="*60)

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)
