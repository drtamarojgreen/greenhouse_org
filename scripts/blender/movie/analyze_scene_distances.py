import math
import os
import sys
import importlib
import types

# 1. Setup Mock Blender environment (Self-contained)
mock_bpy = types.ModuleType("bpy")
mock_bpy.data = types.ModuleType("data")
mock_bpy.data.objects = {}
mock_bpy.data.cameras = types.ModuleType("cameras")
mock_bpy.data.materials = {}
mock_bpy.context = types.ModuleType("context")
mock_bpy.ops = types.ModuleType("ops")
sys.modules["bpy"] = mock_bpy

mock_mathutils = types.ModuleType("mathutils")
class MockVector:
    def __init__(self, tuple_val=(0,0,0)):
        if isinstance(tuple_val, (float, int)): self.x, self.y, self.z = tuple_val, tuple_val, tuple_val
        else: self.x, self.y, self.z = tuple_val
    def __sub__(self, other): return MockVector((self.x - other.x, self.y - other.y, self.z - other.z))
    def __add__(self, other): return MockVector((self.x + other.x, self.y + other.y, self.z + other.z))
    def __mul__(self, other): return MockVector((self.x * other, self.y * other, self.z * other))
    @property
    def length(self): return math.sqrt(self.x**2 + self.y**2 + self.z**2)
    def copy(self): return MockVector((self.x, self.y, self.z))
    @property
    def translation(self): return self
mock_mathutils.Vector = MockVector
sys.modules["mathutils"] = mock_mathutils

# 2. Mock Master and Analysis Logic
class MockObject:
    def __init__(self, name):
        self.name = name
        self.location = MockVector()
        self.matrix_world = MockVector() # Simplified for distance
        self.positions = {} # frame -> Vector
        self.type = 'MESH'
        self.children = []
    def keyframe_insert(self, data_path, frame, index=-1):
        if data_path == "location": self.positions[frame] = self.location.copy()

class MockMaster:
    def __init__(self):
        self.h1 = MockObject("Herbaceous")
        self.h2 = MockObject("Arbor")
        self.gnome = MockObject("GloomGnome")
        self.camera = MockObject("MovieCamera")
        self.objects = {"Herbaceous": self.h1, "Arbor": self.h2, "GloomGnome": self.gnome}
        self.cam_target = MockObject("CamTarget")
        self.scene_map = {}
        self.mode = 'SILENT_FILM'

    def place_character(self, char, location=None, rotation=None, frame=None):
        if char and location:
            char.location = MockVector(location)
            if frame is not None: char.positions[frame] = char.location.copy()

    def create_intertitle(self, *args): pass
    def _set_visibility(self, *args): pass

# 3. Dynamic Analysis Runner
def analyze():
    # Add root to sys.path
    ROOT = os.path.dirname(os.path.abspath(__file__))
    if ROOT not in sys.path: sys.path.append(ROOT)
    
    from constants import SCENE_MAP
    master = MockMaster()
    
    # Track Camera Keyframes (Discovery from camera_controls.py)
    # Since we can't easily dynamic-import and run setup_camera_keyframes without data,
    # we intercept the 'kf_eased' calls if we were running it.
    # For this static script, we'll parse the known camera paths.
    camera_positions = {
        1: (-14, -6, 6), 100: (-14, -6, 6),
        101: (-20, 10, 75.0), 180: (-12, -15, 18), 200: (-10, -20, 8),
        201: (18, -12, 14), 400: (14, -18, 12),
        401: (-40, -40, 71.1), 480: (40, 40, 71.1),
        951: (4, -8, 12), 1100: (8, -4, 14),
        1101: (-8, -8, 1.8), 1250: (-6, -10, 1.8),
        10901: (15, -20, 6), 11200: (10, 2, 2.0), 11500: (18, -25, 8),
        13701: (6, 6, 2), 14450: (15, -15, 5)
    }

    print("\n| Scene | Frame | Closest Object | Min Dist | Farthest Object | Max Dist | Status |")
    print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")

    for s_name, (start, end) in sorted(SCENE_MAP.items(), key=lambda x: x[1][0]):
        # Orchestrate Scene Logic
        try:
            # Discover module path
            for d in os.listdir(ROOT):
                if d.startswith(s_name) and os.path.isdir(os.path.join(ROOT, d)):
                    mod_name = f"{d}.scene_logic"
                    mod = importlib.import_module(mod_name)
                    if hasattr(mod, "setup_scene"):
                        mod.setup_scene(master)
        except Exception as e: pass

        # Sample and Analyze
        frames = [start, (start + end) // 2, end]
        # Include explicit camera keys
        for f in camera_positions:
            if start <= f <= end: frames.append(f)
        
        for f in sorted(list(set(frames))):
            cam_loc = MockVector(camera_positions.get(f, (0, -8, 4)))
            min_d, max_d = float('inf'), -1.0
            c_obj, f_obj = "None", "None"

            for name, obj in master.objects.items():
                if obj == master.camera: continue
                # Find position at this frame
                obj_loc = obj.location
                if obj.positions:
                    for k in sorted(obj.positions.keys()):
                        if k <= f: obj_loc = obj.positions[k]
                        else: break
                
                dist = (cam_loc - obj_loc).length
                if dist < min_d: min_d = dist; c_obj = name
                if dist > max_d: max_d = dist; f_obj = name

            status = "CRITICAL" if min_d < 2.5 else "OK" if min_d > 4.5 else "WARNING"
            s_short = s_name.replace("scene", "S")
            print(f"| {s_short} | {f} | {c_obj} | {min_d:.2f} | {f_obj} | {max_d:.2f} | {status} |")

if __name__ == "__main__":
    analyze()
