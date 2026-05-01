import unittest
import os
import json
import sys

# Add script directory to path
M9_ROOT = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/9"
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)

class TestMovie9ConfigCoverage(unittest.TestCase):
    def test_frame_range_coverage(self):
        """Validates that for every frame in [1, 4800], there is a corresponding scene configuration."""
        config_path = os.path.join(M9_ROOT, "movie_config.json")
        with open(config_path, 'r') as f:
            master_cfg = json.load(f)
        
        total_frames = master_cfg.get("total_frames", 4800)
        scene_dir = os.path.join(M9_ROOT, "scene_configs")
        
        # Track covered frames
        covered = [False] * (total_frames + 1)
        
        # 1. Master config storyline coverage
        beats = master_cfg.get("ensemble", {}).get("storyline", master_cfg.get("storyline", []))
        for i, beat in enumerate(beats):
            start = beat.get("start", 1)
            # Assume beat covers until next beat or end of movie
            next_start = beats[i+1].get("start", total_frames + 1) if i+1 < len(beats) else total_frames + 1
            
            for f in range(start, next_start):
                if 1 <= f <= total_frames: covered[f] = True
        
        # 2. Per-scene JSON coverage
        if os.path.exists(scene_dir):
            for filename in os.listdir(scene_dir):
                if filename.endswith(".json"):
                    with open(os.path.join(scene_dir, filename), 'r') as f:
                        s_cfg = json.load(f)
                        s, e = s_cfg.get("start_frame"), s_cfg.get("end_frame")
                        if s and e:
                            for f in range(s, min(e + 1, total_frames + 1)):
                                covered[f] = True
        
        # 3. Extended scenes coverage (if any in master)
        for scene_path in master_cfg.get("extended_scenes", []):
             full_path = os.path.join(M9_ROOT, scene_path)
             if os.path.exists(full_path):
                 with open(full_path, 'r') as f:
                     ex_cfg = json.load(f)
                     s, e = ex_cfg.get("start_frame"), ex_cfg.get("end_frame")
                     if s and e:
                         for f in range(s, min(e + 1, total_frames + 1)):
                             covered[f] = True

        uncovered_ranges = []
        start = None
        for f in range(1, total_frames + 1):
            if not covered[f]:
                if start is None: start = f
            else:
                if start is not None:
                    uncovered_ranges.append((start, f - 1))
                    start = None
        if start is not None:
            uncovered_ranges.append((start, total_frames))
            
        self.assertEqual(len(uncovered_ranges), 0, f"Uncovered frame ranges found: {uncovered_ranges}")

if __name__ == "__main__":
    unittest.main()
