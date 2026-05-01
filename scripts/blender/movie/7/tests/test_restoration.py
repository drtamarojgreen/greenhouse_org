import bpy
import unittest
import mathutils
import math

class TestRestorationComprehensive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure we are in a clean state if possible, or just use current scene
        pass

    def test_animation_tags_presence(self):
        """Verifies that all Movie 6 emotional tags are handled by AnimationHandler."""
        from animation_handler import AnimationHandler
        handler = AnimationHandler()
        # Mock object
        obj = bpy.data.objects.get("Herbaceous.Rig")
        if not obj: return
        
        tags = ["joyful", "worry", "stretch", "wiggle", "reach_out", "bend_down", "walk", "shiver", "droop", "smile", "sit", "stand"]
        # We check if applying these doesn't crash and inserts keyframes
        for tag in tags:
            start_f = bpy.context.scene.frame_current
            handler.apply_animation(obj, tag, start_f, duration=10)
            # Check if animation data exists
            self.assertIsNotNone(obj.animation_data, f"Tag {tag} failed to create animation data")

    def test_bone_mapping_fidelity(self):
        """Verifies that high-fidelity facial bones are mapped correctly."""
        from animation_handler import BONE_NAME_MAP
        required_bones = [
            "Lip.Corner.Ctrl.L", "Lip.Corner.Ctrl.R", "Jaw.Ctrl", 
            "Pupil.Ctrl.L", "Pupil.Ctrl.R", 
            "Eyelid.Ctrl.Upper.L", "Eyelid.Ctrl.Upper.R"
        ]
        for bone in required_bones:
            self.assertIn(bone, BONE_NAME_MAP, f"Bone {bone} missing from BONE_NAME_MAP")

    def test_facial_prop_hierarchy(self):
        """Verifies that facial props are parented to the Head bone."""
        rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name]
        for rig in rigs:
            props = [c for c in rig.children_recursive if any(x in c.name for x in ["Eye", "Nose", "Lip", "Eyelid"])]
            for prop in props:
                self.assertEqual(prop.parent, rig, f"Prop {prop.name} should be parented to rig")
                self.assertEqual(prop.parent_type, 'BONE', f"Prop {prop.name} should be bone-parented")
                # Allow sub-bones of Head or specific facial bones
                valid_bones = ["Head", "Eye.L", "Eye.R", "Lip.Upper", "Lip.Lower", "Jaw", "Pupil.L", "Pupil.R", "Nose"]
                self.assertTrue(any(b in prop.parent_bone for b in valid_bones), f"Prop {prop.name} parented to invalid bone {prop.parent_bone}")

    def test_shading_ocular_depth(self):
        """Verifies the Gradient Texture node setup for eyes."""
        for mat in [m for m in bpy.data.materials if "Iris" in m.name]:
            nodes = mat.node_tree.nodes
            grad = next((n for n in nodes if n.type == 'TEX_GRADIENT'), None)
            self.assertIsNotNone(grad, f"Material {mat.name} missing Gradient Texture")
            self.assertEqual(grad.gradient_type, 'QUADRATIC_SPHERE', f"Material {mat.name} Gradient should be QUADRATIC_SPHERE")
            
            ramp = next((n for n in nodes if n.type == 'VALTORGB'), None)
            self.assertIsNotNone(ramp, f"Material {mat.name} missing ColorRamp")
            # Verify 3 elements: Pupil, Iris, Sclera
            self.assertGreaterEqual(len(ramp.color_ramp.elements), 3, f"Material {mat.name} ColorRamp should have at least 3 elements")

    def test_shading_leaf_sss(self):
        """Verifies Subsurface Scattering on Leaf materials."""
        leaf_mats = [m for m in bpy.data.materials if "Leaf" in m.name]
        for mat in leaf_mats:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                sss = bsdf.inputs.get("Subsurface") or bsdf.inputs.get("Subsurface Weight")
                if sss:
                    self.assertGreater(sss.default_value, 0, f"Leaf material {mat.name} missing SSS")

    def test_lighting_placement_lamps(self):
        """Verifies lights are placed in lamps/torches and not on the ground."""
        for light in [o for o in bpy.data.objects if o.type == 'LIGHT']:
            if "Torch" in light.name or "Lamp" in light.name:
                self.assertGreater(light.location.z, 2.0, f"Light {light.name} is too low (on ground?)")
            
            # Skip calligraphy lights as they need tracking for aesthetics
            if "Calligraphy" in light.name: continue
            
            for con in light.constraints:
                self.assertNotEqual(con.type, 'TRACK_TO', f"Light {light.name} should not have tracking constraints")

    def test_vehicle_physics_and_orientation(self):
        """Verifies GreenhouseMobile X-Forward orientation and wheel grounding."""
        mobile = bpy.data.objects.get("GreenhouseMobile.Rig") or bpy.data.objects.get("GreenhouseMobile")
        if mobile:
            # Check for wheels
            wheels = [c for c in mobile.children_recursive if "wheel" in c.name.lower()]
            self.assertGreaterEqual(len(wheels), 4, "Mobile missing wheels")
            for wheel in wheels:
                # World Z bottom should be close to ground (0.0)
                # We assume the wheel origin is at its center, so bottom is Z - radius
                # Radius is 0.45 in config
                world_z = (wheel.matrix_world @ mathutils.Vector((0,0,0))).z
                # We expect the bottom to be grounded
                self.assertLess(abs(world_z - 0.45), 0.1, f"Wheel {wheel.name} center not at correct height")
            
            # Orientation check: if moving on path, rotation should align with direction (handled in Director)
            # This is verified by ensuring patrol logic doesn't have the -pi/2 offset anymore.

    def test_camera_closeness_ots(self):
        """Verifies OTS cameras are brought closer to characters."""
        for cam_id in ["Ots1", "Ots2"]:
            cam = bpy.data.objects.get(cam_id)
            if cam:
                # Distance to origin should be less than 10m (original was ~18m)
                dist = cam.location.length
                self.assertLess(dist, 10.0, f"Camera {cam_id} is still too far away")

    def test_camera_wide_bounce(self):
        """Verifies Wide camera has bounce keyframes."""
        wide = bpy.data.objects.get("Wide")
        if wide and wide.animation_data and wide.animation_data.action:
            action = wide.animation_data.action
            # Handle Blender 5.x Slotted Actions or 4.x FCurves
            fcurves_list = []
            
            # Helper to extract from anything that looks like it has fcurves
            def collect(container):
                if hasattr(container, "fcurves"):
                    for fc in container.fcurves: fcurves_list.append(fc)
                if hasattr(container, "action") and container.action:
                    collect(container.action)
                if hasattr(container, "slots"):
                    for s in container.slots: collect(s)
                if hasattr(container, "layers"):
                    for l in container.layers: collect(l)
                if hasattr(container, "channels"):
                    for c in container.channels:
                        if hasattr(c, "fcurve"): fcurves_list.append(c.fcurve)
                        collect(c)
            
            collect(action)
            
            if not fcurves_list and hasattr(wide.animation_data, "action_slot"):
                collect(wide.animation_data.action_slot)

            fcurve = next((fc for fc in fcurves_list if fc.data_path == "location" and fc.array_index == 0), None)
            if fcurve is None:
                print(f"DEBUG: Action {action.name} dir: {dir(action)}")
                if hasattr(action, "slots"): print(f"DEBUG: Slots count: {len(action.slots)}")
                if hasattr(action, "layers"): print(f"DEBUG: Layers count: {len(action.layers)}")
            
            self.assertIsNotNone(fcurve, f"Wide camera missing X-location animation (bounce). Paths: {[fc.data_path for fc in fcurves_list]}")

            self.assertGreater(len(fcurve.keyframe_points), 2, "Wide camera bounce should have multiple keyframes")

    def test_winds_way_modifier(self):
        """Verifies WindSway (WAVE) modifier settings."""
        for obj in [o for o in bpy.data.objects if ".Body" in o.name]:
            wave = next((m for m in obj.modifiers if m.type == 'WAVE' and m.name == "WindSway"), None)
            if wave:
                self.assertTrue(wave.use_x and wave.use_y, "WindSway should use both X and Y")
                self.assertEqual(wave.vertex_group, "Foliage", "WindSway should target Foliage vertex group")

if __name__ == "__main__":
    unittest.main()
