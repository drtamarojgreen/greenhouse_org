import os
import re
import sys

# Define expected light names based on current rig
VALID_LIGHTS = {
    "HerbaceousKeyLight", "ArborKeyLight", "GnomeKeyLight",
    "DomeFill", "Sun", "LightShaftBeam", "IntroLight", "GloomOrbLight"
}

# Add local path for imports
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

try:
    from constants import SCENE_MAP
except ImportError:
    SCENE_MAP = {}

def lint_pipeline():
    print("--- Greenhouse Pipeline Static Linter ---")
    errors = 0

    # 1. Check scene modules for legacy light names or unmapped keys
    scene_dirs = [d for d in os.listdir(script_dir) if d.startswith("scene")]

    for scene_dir in scene_dirs:
        logic_path = os.path.join(script_dir, scene_dir, "scene_logic.py")
        if not os.path.exists(logic_path): continue

        with open(logic_path, "r") as f:
            content = f.read()

            # Check for legacy light names
            legacy_names = ["RimLight", "FillLight", "Spot"]
            for name in legacy_names:
                if f'"{name}"' in content or f"'{name}'" in content:
                    print(f"ERROR: Legacy light name '{name}' found in {scene_dir}/scene_logic.py")
                    errors += 1

            # Check for unmapped SCENE_MAP keys if they use the dict
            # Look for SCENE_MAP['key']
            matches = re.findall(r"SCENE_MAP\[['\"](.+?)['\"]\]", content)
            for key in matches:
                if key not in SCENE_MAP:
                    print(f"ERROR: Unmapped SCENE_MAP key '{key}' found in {scene_dir}/scene_logic.py")
                    errors += 1

    # 2. Check camera_controls.py
    cam_ctrl_path = os.path.join(script_dir, "camera_controls.py")
    if os.path.exists(cam_ctrl_path):
        with open(cam_ctrl_path, "r") as f:
            content = f.read()
            # Similar light name check
            for name in ["RimLight", "FillLight", "Spot"]:
                if f'"{name}"' in content or f"'{name}'" in content:
                    print(f"ERROR: Legacy light name '{name}' found in camera_controls.py")
                    errors += 1

    if errors == 0:
        print("\nLINTER STATUS: PASSED")
        return 0
    else:
        print(f"\nLINTER STATUS: FAILED ({errors} errors found)")
        return 1

if __name__ == "__main__":
    sys.exit(lint_pipeline())
