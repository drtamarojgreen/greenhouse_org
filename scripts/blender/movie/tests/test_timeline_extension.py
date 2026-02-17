import bpy
import os
import sys

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

from silent_movie_generator import MovieMaster
from constants import SCENE_MAP

def test_timeline_bounds():
    print("Testing timeline bounds (Requirements 1-10)...")
    master = MovieMaster()
    # master.setup_engine() is called inside run, but we just need the instance for now
    # or we call setup_engine explicitly if run() is too heavy
    master.setup_engine()
    scene = master.scene

    # 1. Assert frame_end == 15000
    assert scene.frame_end == 15000, f"R1 FAIL: Expected frame_end 15000, got {scene.frame_end}"
    print("R1 PASS: frame_end is 15000")

    # 2. Assert frame_start == 1
    assert scene.frame_start == 1, f"R2 FAIL: Expected frame_start 1, got {scene.frame_start}"
    print("R2 PASS: frame_start is 1")

    credits_range = SCENE_MAP.get('scene12_credits')
    # 3. Assert credits start at 14501
    assert credits_range[0] == 14501, f"R3 FAIL: Expected credits to start at 14501, got {credits_range[0]}"
    print("R3 PASS: credits start at 14501")

    # 4. Assert credits end at 15000
    assert credits_range[1] == 15000, f"R4 FAIL: Expected credits to end at 15000, got {credits_range[1]}"
    print("R4 PASS: credits end at 15000")

    # 7. Check if new scene keys (16-22) are present
    new_scenes = [f'scene{i}_dialogue' for i in range(16, 22)] + ['scene22_retreat']
    for s in new_scenes:
        assert s in SCENE_MAP, f"R7 FAIL: {s} missing from SCENE_MAP"
    print("R7 PASS: New scene keys 16-22 present")

    # 5, 6, 8, 9, 10: Contiguous and ascending checks
    scene_items = sorted(SCENE_MAP.items(), key=lambda x: x[1][0])

    last_end = 0
    for i, (name, (start, end)) in enumerate(scene_items):
        # 8. Ascending start frames
        assert start > last_end, f"R8/R5 FAIL: Scene {name} start {start} not after previous end {last_end}"

        # 9. Ascending end frames
        assert end >= start, f"R9 FAIL: Scene {name} end {end} before start {start}"

        # 6. No gaps (Point 56: Verify contiguity)
        if i > 0:
            assert start == last_end + 1, f"R6 FAIL: Gap detected before {name} (expected {last_end + 1}, got {start})"

        last_end = end

    print("R5, R6, R8, R9 PASS: Contiguous, no overlaps, ascending order")

    # 10. Contiguous handoff between interaction and scene 16
    interaction_range = SCENE_MAP.get('scene15_interaction')
    scene16_range = SCENE_MAP.get('scene16_dialogue')
    assert interaction_range[1] + 1 == scene16_range[0], f"R10 FAIL: Handoff gap between interaction ({interaction_range[1]}) and scene16 ({scene16_range[0]})"
    print("R10 PASS: Contiguous handoff between interaction and scene16")

if __name__ == "__main__":
    try:
        test_timeline_bounds()
        print("\nSUMMARY: Requirements 1-10 passed.")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nFAIL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)
