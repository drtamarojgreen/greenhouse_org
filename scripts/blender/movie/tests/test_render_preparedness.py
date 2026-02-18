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
                    # Robustness: Check for a connected Principled BSDF node
                    has_bsdf = False
                    if mat.use_nodes and mat.node_tree:
                        for n in mat.node_tree.nodes:
                            if n.type == 'BSDF_PRINCIPLED' and any(out.is_linked for out in n.outputs):
                                has_bsdf = True
                                break
                    status = "PASS" if has_bsdf else "FAIL"
                    details = "Has connected Principled BSDF" if has_bsdf else "MISSING or disconnected Principled BSDF"
                else:
                    status = "FAIL"
                    details = "Material MISSING"

                self.log_result(f"Material: {mat_name} ({desc})", status, details)
                self.assertTrue(exists and (has_bsdf if exists else False))

    def test_03_compositor_setup(self):
        """Check if compositor nodes for effects are present and connected."""
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
        required_nodes = ["ChromaticAberration", "GlobalSaturation", "Bright/Contrast", "GlowTrail", "Vignette"]
        for node_name in required_nodes:
            with self.subTest(node=node_name):
                node = nodes.get(node_name)
                exists = node is not None
                
                is_connected = False
                if exists:
                    has_input = any(socket.is_linked for socket in node.inputs)
                    has_output = any(socket.is_linked for socket in node.outputs)
                    is_connected = has_input and has_output

                status = "PASS" if is_connected else "FAIL"
                details = "Found and connected" if is_connected else ("Found but disconnected" if exists else "Node MISSING")
                self.log_result(f"Compositor Node: {node_name}", status, details)
                self.assertTrue(is_connected)

    def test_04_animation_presence(self):
        """Check if objects have animation data (secondary motion)."""
        objs_with_anim = ["Herbaceous_Torso", "Arbor_Torso", "GazeTarget", "CamTarget"]
        for name in objs_with_anim:
            obj = bpy.data.objects.get(name)
            if obj:
                # Robustness: Check for actual fcurves
                has_anim = False
                if obj.animation_data and obj.animation_data.action:
                    if len(obj.animation_data.action.fcurves) > 0:
                        has_anim = True

                status = "PASS" if has_anim else "FAIL"
                self.log_result(f"Animation: {name}", status, "Animation data with fcurves present" if has_anim else "NO animation data or fcurves")
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
        """Edge Case: Verify volume scatter density is within safe ranges and connected."""
        world = bpy.context.scene.world
        vol = world.node_tree.nodes.get("Volume Scatter")
        
        is_connected = False
        if vol:
            # Check connection to World Output
            world_output = world.node_tree.nodes.get("World Output")
            if world_output:
                for link in world.node_tree.links:
                    if link.from_node == vol and link.to_node == world_output:
                        is_connected = True
                        break

        if vol and is_connected:
            density = vol.inputs['Density'].default_value
            # Shadow scene usually sets it higher, but global default should be low
            is_sane = 0.0 < density < 0.1
            status = "PASS" if is_sane else "WARNING"
            self.log_result("Volume Density", status, f"Density is {density}")
        else:
            status = "FAIL"
            details = "Volume Scatter node MISSING" if not vol else "Volume Scatter disconnected"
            self.log_result("Volume Density", status, details)

    def test_08_large_frame_range(self):
        """Edge Case: Check if scene frame range matches the 15000 frame plan."""
        scene = bpy.context.scene
        is_correct = scene.frame_start == 1 and scene.frame_end == 15000
        status = "PASS" if is_correct else "FAIL"
        self.log_result("Frame Range", status, f"Range: {scene.frame_start}-{scene.frame_end}")
        self.assertTrue(is_correct)

    def test_09_credits_orientation(self):
        """Verify credits text object is rotated correctly (not upside down)."""
        credits = bpy.data.objects.get("CreditsText")
        if credits:
            # We expect a 90 degree rotation on X
            rot_x = math.degrees(credits.rotation_euler[0])
            is_correct = abs(rot_x - 90.0) < 0.1
            status = "PASS" if is_correct else "FAIL"
            self.log_result("Credits Orientation", status, f"Rotation X: {rot_x:.2f}")
            self.assertTrue(is_correct)
        else:
            self.log_result("Credits Orientation", "FAIL", "CreditsText NOT found")

    def test_10_interaction_scene_logic(self):
        """Verify the interaction scene is registered and has content."""
        from silent_movie_generator import SCENE_MAP
        exists = 'interaction' in SCENE_MAP
        if exists:
            start, end = SCENE_MAP['interaction']
            is_correct = start == 4501 and end == 9500
            status = "PASS" if is_correct else "FAIL"
            self.log_result("Interaction Scene Map", status, f"Range: {start}-{end}")
            self.assertTrue(is_correct)
        else:
            self.log_result("Interaction Scene Map", "FAIL", "interaction NOT in SCENE_MAP")

        self.assertEqual(len(missing_images), 0, f"Missing texture files: {missing_images}")

    def test_12_cpu_rendering_enforcement(self):
        """Level 4: Ensure Cycles is set to CPU and GPU compute is disabled."""
        scene = bpy.context.scene
        if scene.render.engine == 'CYCLES':
            is_cpu = scene.cycles.device == 'CPU'
            
            # Check cycles preferences for GPU
            cprefs = bpy.context.preferences.addons['cycles'].preferences
            gpu_disabled = cprefs.compute_device_type == 'NONE'
            
            status = "PASS" if (is_cpu and gpu_disabled) else "FAIL"
            details = f"Device: {scene.cycles.device}, Compute Type: {cprefs.compute_device_type}"
            self.log_result("CPU Enforcement", status, details)
            self.assertTrue(is_cpu, "Cycles device must be CPU")
            self.assertTrue(gpu_disabled, "GPU compute device must be NONE to prevent hardware conflicts")

    def test_13_memory_vertex_threshold(self):
        """Level 4: Verify total vertex count doesn't exceed safe CPU limits (1M)."""
        total_verts = sum(len(o.data.vertices) for o in bpy.data.objects if o.type == 'MESH')
        is_safe = total_verts < 1000000
        status = "PASS" if is_safe else "WARNING"
        details = f"Total Vertices: {total_verts:,}"
        self.log_result("Memory Threshold", status, details)
        # We use warning level as per plan
        if not is_safe:
            print(f"    WARNING: High vertex count ({total_verts:,}). Consider decimation.")

    def test_14_global_cinematic_state(self):
        """Level 5: Verify Filmic Color Management and Motion Blur gate."""
        scene = bpy.context.scene
        
        # Color Management
        view_transform = scene.view_settings.view_transform
        is_filmic = view_transform == 'Filmic'
        
        # Motion Blur
        use_blur = scene.render.use_motion_blur
        
        status = "PASS" if (is_filmic and use_blur) else "FAIL"
        details = f"View: {view_transform}, Motion Blur: {use_blur}"
        self.log_result("Global Cinematic State", status, details)
        
        self.assertTrue(is_filmic, "Production renders must use Filmic view transform")
        self.assertTrue(use_blur, "OUT-01 FAIL: Motion blur must be enabled for production gate")

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
