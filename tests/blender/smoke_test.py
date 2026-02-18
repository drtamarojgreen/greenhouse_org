import bpy
import os
import sys

# Add movie scripts to path
MOVIE_ROOT = os.path.join(os.getcwd(), "scripts", "blender", "movie")
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

def run_smoke_test():
    """Enhancement #75: Automated Production Smoke Test."""
    print("Starting production smoke test...")

    try:
        import silent_movie_generator
        master = silent_movie_generator.MovieMaster(quality='test')
        master.load_assets()
        master.setup_lighting()
        master._setup_camera()
        master.setup_compositor()
        master._animate_characters()
        master._animate_props()
        master.animate_master()

        # 1. Verify characters
        chars = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso"]
        for c in chars:
            if c not in bpy.data.objects:
                print(f"FAILED: Character {c} missing")
                return False

        # 2. Verify camera
        if master.scene.camera is None:
            print("FAILED: No active camera")
            return False

        # 3. Verify keyframes exist
        if not master.scene.camera.animation_data or not master.scene.camera.animation_data.action:
            print("FAILED: No camera animation")
            return False

        # 4. Verify markers
        if len(master.scene.timeline_markers) < 10:
            print("FAILED: Timeline markers missing")
            return False

        print("Smoke test PASSED.")
        return True

    except Exception as e:
        print(f"FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if run_smoke_test():
        sys.exit(0)
    else:
        sys.exit(1)
