import bpy
import unittest
import mathutils
import math

class TestRestorationComprehensive(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        pass

    def test_animation_tags_presence(self):
        """Verifies that all Movie 6 emotional tags are handled by AnimationHandler."""
        from animation_handler import AnimationHandler
        handler = AnimationHandler()
        obj = bpy.data.objects.get("Herbaceous.Rig")
        if not obj: return
        
        tags = ["joyful", "worry", "stretch", "wiggle", "reach_out", "bend_down", "walk", "shiver", "droop", "smile", "sit", "stand"]
        for tag in tags:
            start_f = bpy.context.scene.frame_current
            handler.apply_animation(obj, tag, start_f, duration=10)
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
            
            if "Calligraphy" in light.name: continue
            
            for con in light.constraints:
                self.assertNotEqual(con.type, 'TRACK_TO', f"Light {light.name} should not have tracking constraints")

    def test_vehicle_physics_and_orientation(self):
        """Verifies GreenhouseMobile X-Forward orientation and wheel grounding."""
        mobile = bpy.data.objects.get("GreenhouseMobile.Rig") or bpy.data.objects.get("GreenhouseMobile")
        if mobile:
            wheels = [c for c in mobile.children_recursive if "wheel" in c.name.lower()]
            self.assertGreaterEqual(len(wheels), 4, "Mobile missing wheels")
            bpy.context.view_layer.update()
            for wheel in wheels:
                world_z = (wheel.matrix_world @ mathutils.Vector((0,0,0))).z
                # Procedural mobile wheels are at height 0.6
                self.assertLess(abs(world_z - 0.6), 0.1, f"Wheel {wheel.name} center at Z={world_z} (expected 0.6)")

    def test_camera_closeness_ots(self):
        """Verifies OTS cameras are brought closer to characters."""
        for cam_id in ["Ots1", "Ots2"]:
            cam = bpy.data.objects.get(cam_id)
            if cam:
                dist = cam.location.length
                self.assertLess(dist, 10.0, f"Camera {cam_id} is still too far away")

    def test_camera_wide_bounce(self):
        """Verifies Wide camera has bounce keyframes."""
        wide = bpy.data.objects.get("Wide")
        if wide and wide.animation_data and wide.animation_data.action:
            action = wide.animation_data.action
            fcurves_list = []
            if hasattr(action, "fcurves") and len(action.fcurves) > 0:
                fcurves_list.extend(list(action.fcurves))
            
            if hasattr(action, "slots"):
                for slot in action.slots:
                    # Support both legacy fcurves and Blender 5.1+ curves
                    slot_curves = getattr(slot, "curves", getattr(slot, "fcurves", []))
                    if slot_curves:
                        fcurves_list.extend(list(slot_curves))
                    # Recursive check for nested slotted actions in Blender 5.1+
                    if hasattr(slot, "action") and slot.action:
                        for s in getattr(slot.action, "slots", []):
                            fcurves_list.extend(list(getattr(s, "curves", [])))
            
            if hasattr(action, "layers"):
                for layer in action.layers:
                    if hasattr(layer, "channels"):
                        for chan in layer.channels:
                            if hasattr(chan, "fcurve"):
                                fcurves_list.append(chan.fcurve)
                    if hasattr(layer, "fcurves"):
                        fcurves_list.extend(list(layer.fcurves))

            if not fcurves_list and hasattr(wide.animation_data, "action_slot"):
                slot = wide.animation_data.action_slot
                # Support both legacy fcurves and Blender 5.1+ curves
                slot_curves = getattr(slot, "curves", getattr(slot, "fcurves", []))
                if slot_curves:
                    fcurves_list.extend(list(slot_curves))
            
            fcurve = next((fc for fc in fcurves_list if fc.data_path == "location" and fc.array_index == 0), None)
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
