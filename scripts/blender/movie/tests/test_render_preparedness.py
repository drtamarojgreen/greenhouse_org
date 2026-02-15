import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style

class TestRenderPreparedness(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Run the movie master to generate the scene
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()
        cls.results = []

    def log_result(self, name, status, details=""):
        self.results.append({"name": name, "status": status, "details": details})

    def test_01_assets_exist(self):
        """Check if all major characters and structures are in the scene."""
        required_objs = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "ExpressionistFloor", "CamTarget", "GazeTarget"]
        for obj_name in required_objs:
            with self.subTest(obj=obj_name):
                exists = obj_name in bpy.data.objects
                status = "PASS" if exists else "FAIL"
                self.log_result(f"Asset: {obj_name}", status, "Object found in bpy.data.objects" if exists else "Object MISSING")
                self.assertTrue(exists)

    def test_02_materials_integrity(self):
        """Check for specific material enhancements (Moss, Rust, Venation)."""
        mats_to_check = {
            "GH_Iron": "Mossy Iron",
            "GloomGnome_MatGloom": "Rusted Staff",
            "LeafMat_Herbaceous": "Leaf Venation",
            "CheckeredMarble": "Organic Floor Craters"
        }
        for mat_name, desc in mats_to_check.items():
            with self.subTest(mat=mat_name):
                exists = mat_name in bpy.data.materials
                if exists:
                    mat = bpy.data.materials[mat_name]
                    # Check for nodes (procedural enhancements)
                    has_nodes = mat.use_nodes and len(mat.node_tree.nodes) > 2
                    status = "PASS" if has_nodes else "WARNING"
                    details = f"Nodes found: {len(mat.node_tree.nodes)}" if has_nodes else "Material exists but has NO procedural nodes"
                else:
                    status = "FAIL"
                    details = "Material MISSING"

                self.log_result(f"Material: {mat_name} ({desc})", status, details)
                self.assertTrue(exists)

    def test_03_compositor_setup(self):
        """Check if compositor nodes for effects are present."""
        if not bpy.context.scene.use_nodes:
            self.log_result("Compositor", "FAIL", "use_nodes is FALSE")
            self.fail("Compositor not enabled")

        # Safe access for node tree (Blender 4.x vs 5.0 compatibility)
        scene = bpy.context.scene
        tree = style.get_compositor_node_tree(scene)
        if not tree:
            # Diagnostic info for debugging Blender 5.0 API shifts
            self.fail(f"Compositor node tree not found. Scene attributes: {[a for a in dir(scene) if 'node' in a]}")
        
        nodes = tree.nodes
        # Critical nodes for rendering
        critical_nodes = ["Composite", "R_Layers"] # Names might vary, check types usually, but names are set in generator
        # Effect nodes (non-critical but desired)
        effect_nodes = ["ChromaticAberration", "GlobalSaturation", "Bright/Contrast", "GlowTrail", "Vignette"]
        
        for node_name in effect_nodes:
            with self.subTest(node=node_name):
                exists = node_name in nodes
                # Effects are WARNING level if missing, not FAIL
                status = "PASS" if exists else "WARNING"
                self.log_result(f"Compositor Node: {node_name}", status, "Node found" if exists else "Node MISSING")
                # We don't assert True here to allow test to proceed, just log warning

    def test_04_animation_presence(self):
        """Check if objects have animation data (secondary motion)."""
        objs_with_anim = ["Herbaceous_Torso", "Arbor_Torso", "GazeTarget", "CamTarget"]
        for name in objs_with_anim:
            obj = bpy.data.objects.get(name)
            if obj:
                has_anim = obj.animation_data is not None
                status = "PASS" if has_anim else "FAIL"
                self.log_result(f"Animation: {name}", status, "Animation data present" if has_anim else "NO animation data")
                self.assertTrue(has_anim)

    def test_05_hierarchy_and_materials(self):
        """Edge Case: Check if children of complex assets have materials assigned."""
        parents = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso"]
        for p_name in parents:
            parent = bpy.data.objects.get(p_name)
            if parent:
                for child in parent.children:
                    if child.type == 'MESH':
                        with self.subTest(child=child.name):
                            has_mat = len(child.data.materials) > 0
                            status = "PASS" if has_mat else "WARNING"
                            self.log_result(f"Hierarchy: {child.name} material", status, "Material assigned" if has_mat else "Mesh child has NO material")
                            # We don't assert true because it's a warning level check

    def test_06_engine_mode_switching(self):
        """Edge Case: Test initialization in UNITY_PREVIEW mode."""
        # This test is destructive (clears scene). We must restore state for subsequent tests.
        try:
            unity_master = MovieMaster(mode='UNITY_PREVIEW')
            engine = unity_master.scene.render.engine
            valid_engines = ['BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT']
            status = "PASS" if engine in valid_engines else "FAIL"
            self.log_result("Mode Switch: UNITY_PREVIEW", status, f"Engine is {engine}")
            self.assertIn(engine, valid_engines)
        finally:
            # Restore the main scene for remaining tests (e.g. test_07)
            self.master = MovieMaster(mode='SILENT_FILM')
            self.master.run()

    def test_07_volume_scatter_config(self):
        """Edge Case: Verify volume scatter density is within safe ranges."""
        world = bpy.context.scene.world
        vol = world.node_tree.nodes.get("Volume Scatter")
        if vol:
            density = vol.inputs['Density'].default_value
            # Shadow scene usually sets it higher, but global default should be low
            is_sane = 0.0 < density < 0.1
            status = "PASS" if is_sane else "WARNING"
            self.log_result("Volume Density", status, f"Density is {density}")
        else:
            self.log_result("Volume Density", "FAIL", "Volume Scatter node MISSING in world")

    def test_08_large_frame_range(self):
        """Edge Case: Check if scene frame range matches the 5000 frame plan."""
        scene = bpy.context.scene
        is_correct = scene.frame_start == 1 and scene.frame_end == 5000
        status = "PASS" if is_correct else "FAIL"
        self.log_result("Frame Range", status, f"Range: {scene.frame_start}-{scene.frame_end}")
        self.assertTrue(is_correct)

    def test_09_visibility_check(self):
        """Check if major assets are ever visible during the render range."""
        required_objs = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "BrainGroup", "NeuronGroup"]
        
        for obj_name in required_objs:
            obj = bpy.data.objects.get(obj_name)
            if not obj:
                continue # Already failed in test_01
            
            with self.subTest(obj=obj_name):
                # Check default state
                is_visible = not obj.hide_render
                
                # Check animation data if hidden by default
                if not is_visible and obj.animation_data and obj.animation_data.action:
                    for fcurve in style.get_action_curves(obj.animation_data.action):
                        if "hide_render" in fcurve.data_path:
                            # Check keyframes for any 'False' (0.0) value
                            for kp in fcurve.keyframe_points:
                                if kp.co[1] < 0.5: # 0.0 is visible
                                    is_visible = True
                                    break
                
                status = "PASS" if is_visible else "WARNING"
                details = "Object is visible at some point" if is_visible else "Object is HIDDEN for entire render"
                self.log_result(f"Visibility: {obj_name}", status, details)

    def test_10_lighting_check(self):
        """Ensure there are active light sources."""
        lights = [o for o in bpy.data.objects if o.type == 'LIGHT']
        visible_lights = [l for l in lights if not l.hide_render]
        
        # Check emission materials as fallback
        emissive_mats = []
        for mat in bpy.data.materials:
            if mat.use_nodes:
                for node in mat.node_tree.nodes:
                    if hasattr(node, 'inputs') and 'Emission Strength' in node.inputs and node.inputs['Emission Strength'].default_value > 0:
                        emissive_mats.append(mat.name)

        has_light = len(visible_lights) > 0 or len(emissive_mats) > 0
        status = "PASS" if has_light else "FAIL"
        details = f"Lights: {len(visible_lights)}, Emissive Mats: {len(emissive_mats)}"
        self.log_result("Lighting Check", status, details)
        self.assertTrue(has_light, "Scene has no visible lights or emissive materials")

    def test_11_detailed_hierarchy(self):
        """Verify existence of specific character body parts."""
        chars = {
            "Herbaceous": ["Head", "Arm_L", "Arm_R", "Leg_L", "Leg_R", "Eye_L", "Eye_R"],
            "Arbor": ["Head", "Arm_L", "Arm_R", "Leg_L", "Leg_R", "Eye_L", "Eye_R"],
            "GloomGnome": ["Hat", "Beard", "Cloak", "Eye_L", "Eye_R"]
        }
        
        for char_name, parts in chars.items():
            for part in parts:
                full_name = f"{char_name}_{part}"
                with self.subTest(part=full_name):
                    obj = bpy.data.objects.get(full_name)
                    exists = obj is not None
                    status = "PASS" if exists else "FAIL"
                    self.log_result(f"Part: {full_name}", status, "Found" if exists else "MISSING")
                    self.assertTrue(exists, f"Character part {full_name} is missing")

    def test_12_texture_validation(self):
        """Verify that key materials contain procedural texture nodes."""
        # Map Material Name -> Expected Node Type (partial name ok)
        expectations = {
            "GH_Iron": "Noise",
            "GH_Glass": "Noise", # Scratches
            "LeafMat_Herbaceous": ["Noise", "Wave"], # Venation/Fuzz
            "CheckeredMarble": ["Checker", "Noise"],
            "GloomGnome_MatCloak": "Wave", # Weave
            "GloomGnome_MatGloom": "Noise" # Rust/Runes
        }

        for mat_name, expected_types in expectations.items():
            if not isinstance(expected_types, list): expected_types = [expected_types]
            
            mat = bpy.data.materials.get(mat_name)
            if not mat or not mat.use_nodes:
                self.log_result(f"Texture: {mat_name}", "FAIL", "Material missing or no nodes")
                continue

            found_types = []
            for node in mat.node_tree.nodes:
                for exp in expected_types:
                    if exp in node.name or exp in node.type or (hasattr(node, 'texture') and exp in node.texture.name):
                        found_types.append(exp)
            
            # Check if we found at least one of the expected texture types
            found_any = len(set(found_types) & set(expected_types)) > 0
            status = "PASS" if found_any else "WARNING"
            self.log_result(f"Texture: {mat_name}", status, f"Found {list(set(found_types))}")

    def test_13_camera_tracking(self):
        """Ensure camera is tracking the target."""
        cam = bpy.context.scene.camera
        has_track = any(c.type == 'TRACK_TO' and c.target and c.target.name == "CamTarget" for c in cam.constraints)
        self.log_result("Camera Tracking", "PASS" if has_track else "FAIL", "Track To constraint found" if has_track else "Missing tracking")
        self.assertTrue(has_track)

    @classmethod
    def tearDownClass(cls):
        print("\n" + "="*50)
        print("RENDER PREPAREDNESS SUMMARY")
        print("="*50)
        passes = 0
        fails = 0
        warnings = 0
        for r in cls.results:
            icon = "✓" if r["status"] == "PASS" else ("✗" if r["status"] == "FAIL" else "!")
            print(f"[{icon}] {r['name']:<40} : {r['status']}")
            if r['details']:
                print(f"    Details: {r['details']}")

            if r["status"] == "PASS": passes += 1
            elif r["status"] == "FAIL": fails += 1
            else: warnings += 1

        print("="*50)
        print(f"TOTAL: {len(cls.results)} | PASS: {passes} | FAIL: {fails} | WARNING: {warnings}")
        if fails == 0:
            print("STATUS: READY FOR RENDER")
        else:
            print("STATUS: NOT READY - CRITICAL FAILURES DETECTED")
        print("="*50 + "\n")

if __name__ == "__main__":
    # Filter out Blender arguments so unittest doesn't fail
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)
