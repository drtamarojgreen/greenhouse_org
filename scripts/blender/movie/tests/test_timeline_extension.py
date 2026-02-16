import bpy
import os
import sys

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator

def test_timeline_bounds():
    print("Testing timeline bounds...")
    master = silent_movie_generator.MovieMaster()
    scene = master.scene

    # Enhancement 1: Assert frame_end == 15000
    assert scene.frame_end == 15000, f"Expected frame_end 15000, got {scene.frame_end}"
    print("PASS: frame_end is 15000")

    # Enhancement 3: Assert credits start at 14501
    credits_range = silent_movie_generator.SCENE_MAP.get('credits')
    assert credits_range[0] == 14501, f"Expected credits to start at 14501, got {credits_range[0]}"
    print("PASS: credits start at 14501")

    # Enhancement 4: Assert credits end at 15000
    assert credits_range[1] == 15000, f"Expected credits to end at 15000, got {credits_range[1]}"
    print("PASS: credits end at 15000")

    # Additional check: No gaps or overlaps in SCENE_MAP (basic check)
    sorted_scenes = sorted(silent_movie_generator.SCENE_MAP.values())
    for i in range(len(sorted_scenes) - 1):
        assert sorted_scenes[i][1] + 1 == sorted_scenes[i+1][0], f"Gap or overlap detected between {sorted_scenes[i]} and {sorted_scenes[i+1]}"
    print("PASS: SCENE_MAP is contiguous")

if __name__ == "__main__":
    try:
        test_timeline_bounds()
        print("\nSUMMARY: 4 checks passed.")
        sys.exit(0)
    except AssertionError as e:
        print(f"\nFAIL: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)
