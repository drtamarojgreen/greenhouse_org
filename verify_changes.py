import sys
import unittest
import os
from unittest.mock import MagicMock, patch

# Mock Blender modules
sys.modules['bpy'] = MagicMock()
sys.modules['mathutils'] = MagicMock()
sys.modules['bpy_extras'] = MagicMock()
sys.modules['bpy_extras.anim_utils'] = MagicMock()

# Setup Path
current_dir = os.getcwd()
sys.path.append(os.path.join(current_dir, "scripts", "blender", "movie"))
sys.path.append(os.path.join(current_dir, "scripts", "blender", "movie", "6"))

import bpy
import mathutils

# Setup Mock Data Structures
class MockObject:
    def __init__(self, name, type='MESH'):
        self._name = name
        self.type = type
        self.parent = None
        self.location = mathutils.Vector(0, 0, 0)
        self.rotation_euler = mathutils.Vector(0, 0, 0)
        self.scale = mathutils.Vector(1, 1, 1)
        self.children = []
        self.modifiers = MagicMock()
        self.modifiers.new = MagicMock()
        self.modifiers.__iter__ = lambda s: iter([])
        self.constraints = MagicMock()
        self.hide_render = False
        self.hide_viewport = False
        self.animation_data = MagicMock()
        self.matrix_world = MagicMock()
        self.matrix_world.to_translation.return_value = self.location

    @property
    def name(self):
        return self._name

    @name.setter
    def name(self, value):
        # Update our store if we were tracked there
        if hasattr(self, '_store') and self._name in self._store:
             obj = self._store.pop(self._name)
             self._name = value
             self._store[value] = obj
        else:
             self._name = value

    def find_armature(self):
        return None

class MockVector:
    def __init__(self, *args):
        if len(args) == 1 and isinstance(args[0], (list, tuple)):
            self.vals = list(args[0])
        else:
            self.vals = list(args)
    @property
    def x(self): return self.vals[0]
    @property
    def y(self): return self.vals[1]
    @property
    def z(self): return self.vals[2]
    @property
    def length(self): return sum(x**2 for x in self.vals)**0.5
    def __getitem__(self, i): return self.vals[i]
    def __len__(self): return len(self.vals)
    def __sub__(self, other): return MockVector([a - b for a, b in zip(self.vals, other)])
    def __repr__(self): return f"Vector({self.vals})"
    def __eq__(self, other):
        if isinstance(other, (list, tuple)):
             return self.vals == list(other)
        if isinstance(other, MockVector):
             return self.vals == other.vals
        return False

mathutils.Vector = MockVector

class TestV6Fixes(unittest.TestCase):

    def test_renormalization_logic_whitelist(self):
        """Verifies that all 10 characters in the whitelist are processed."""
        from asset_manager_v6 import SylvanEnsembleManager
        import config

        manager = SylvanEnsembleManager()
        # Initialize with real config values for accuracy
        manager.ensemble = config.SPIRIT_ENSEMBLE.copy()
        manager.rig_map = config.RIG_MAP_SRC.copy()

        objects_store = {}

        # Create mock objects based on config
        # 1. Spirits from ensemble
        for src_mesh, art_name in manager.ensemble.items():
             # Root_Guardian uses 'skeleton', Phoenixes use 'skeleton' and 'skeleton.001'
             is_skel = art_name in ["Root_Guardian", "Phoenix_Herald", "Golden_Phoenix"]
             obj_type = 'ARMATURE' if is_skel else 'MESH'
             obj = MockObject(src_mesh, obj_type)
             obj._store = objects_store
             objects_store[src_mesh] = obj

        # 2. Rigs from rig_map
        for art_name, src_rig in manager.rig_map.items():
             if src_rig not in objects_store:
                  obj = MockObject(src_rig, 'ARMATURE')
                  obj._store = objects_store
                  objects_store[src_rig] = obj

        # 3. Protagonists
        for char in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
             m_name = f"{char}_Body"
             r_name = f"{char}_Rig"
             mesh = MockObject(m_name, 'MESH')
             rig = MockObject(r_name, 'ARMATURE')
             mesh._store = objects_store
             rig._store = objects_store
             objects_store[m_name] = mesh
             objects_store[r_name] = rig

        mock_coll = MagicMock()
        mock_coll.objects = list(objects_store.values())

        def mock_get(name):
            return objects_store.get(name)

        with patch('bpy.data.collections.get', return_value=mock_coll), \
             patch('bpy.data.objects.get', side_effect=mock_get):

            manager.renormalize_objects()

            # Verify all 10 are renamed correctly
            for art_name in config.RENORM_WHITELIST:
                 is_p = art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)
                 sep = "_" if is_p else "."
                 t_mesh_name = f"{art_name}{sep}Body"

                 self.assertIn(t_mesh_name, objects_store, f"{t_mesh_name} missing from store")
                 obj = objects_store[t_mesh_name]
                 self.assertEqual(obj.name, t_mesh_name)

                 # Check for skeleton-based assets
                 is_skeleton = any(art_name == name for name in ["Root_Guardian", "Phoenix_Herald", "Golden_Phoenix"])

                 if is_skeleton:
                      self.assertEqual(obj.type, 'ARMATURE')
                      # Verify NO modifiers.new called for ARMATURE
                      self.assertEqual(obj.modifiers.new.call_count, 0)
                 else:
                      t_rig_name = f"{art_name}{sep}Rig"
                      self.assertIn(t_rig_name, objects_store, f"{t_rig_name} missing from store")
                      rig = objects_store[t_rig_name]
                      self.assertEqual(obj.parent, rig)
                      # Verify modifiers.new CALLED for MESH
                      self.assertGreaterEqual(obj.modifiers.new.call_count, 1)

            print("ASSET_MANAGER: All 10 whitelist characters renormalized successfully without crash.")

if __name__ == "__main__":
    unittest.main()
