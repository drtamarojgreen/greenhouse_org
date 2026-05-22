import os
import sys
import unittest

try:
    import bpy  # noqa: F401
except ImportError:
    bpy = None


TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))
M9_ROOT = os.path.abspath(os.path.join(M10_ROOT, "..", "9"))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)


def run_tests():
    if bpy is not None:
        for type_name, attr in (
            ("EXPORT_SCENE_OT_fbx", "use_space_transform"),
            ("IMPORT_SCENE_OT_fbx", "files"),
        ):
            cls = getattr(bpy.types, type_name, None)
            if cls is not None and not hasattr(cls, attr):
                setattr(cls, attr, None)
    try:
        import components
        components.initialize_registry()
    except Exception as exc:
        print(f"Warning: component registry initialization failed: {exc}")

    loader = unittest.TestLoader()
    suite = loader.discover(TEST_DIR, pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


if __name__ == "__main__":
    run_tests()
