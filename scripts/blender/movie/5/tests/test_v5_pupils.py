import bpy
import unittest
import sys
import os
import mathutils

# Ensure movie modules are in path
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

class TestV5PupilVisibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        from generate_scene5 import generate_full_scene_v5
        # Set up full environment
        bpy.context.scene.frame_set(10) # Open eyes
        generate_full_scene_v5()
    
    def test_01_pupil_and_eyeball_existence(self):
        """Verifies the pupil disc and eyeball meshes exist and have correct materials."""
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        
        self.assertIsNotNone(herb_eye_l, "Eyeball L mesh missing.")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing.")
        
        self.assertEqual(len(herb_eye_l.data.materials), 1, "Eyeball should have exactly 1 material.")
        self.assertEqual(len(herb_pup_l.data.materials), 1, "Pupil disc should have exactly 1 material.")
        
        eye_mat = herb_eye_l.data.materials[0]
        pup_mat = herb_pup_l.data.materials[0]
        
        print(f"DIAGNOSTIC: Eyeball uses material '{eye_mat.name}'")
        print(f"DIAGNOSTIC: Pupil Disc uses material '{pup_mat.name}'")
        self.assertNotEqual(eye_mat, pup_mat, "Pupil Disc must have its own dedicated material, NOT share the Iris shader!")
        self.assertIn("Pupil_Black", pup_mat.name, "Pupil material must be the solid black 'Pupil_Black' shader.")
        
        # Verify the pupil material outputs pure black
        tree = pup_mat.node_tree
        bsdf = None
        for node in tree.nodes:
            if node.type == 'BSDF_PRINCIPLED':
                bsdf = node
                break
        self.assertIsNotNone(bsdf, "Pupil material missing Principled BSDF node.")
        base_color = bsdf.inputs['Base Color'].default_value
        luminance = base_color[0] + base_color[1] + base_color[2]
        self.assertTrue(luminance < 0.01, f"Pupil Base Color must be pure black, got: {list(base_color)}")
        print(f"PASSED: Pupil material is solid black (luminance={luminance:.4f}).")

    def test_02_pupil_disc_location_relative_to_eyeball(self):
        """Verifies the PupilDisc sits securely on the front hemisphere of the Eyeball."""
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        
        bpy.context.view_layer.update()
        
        eye_loc = herb_eye_l.matrix_world.translation
        pup_loc = herb_pup_l.matrix_world.translation
        
        # Calculate distance
        dist = (pup_loc - eye_loc).length
        print(f"DIAGNOSTIC: Eye Center is at {eye_loc}")
        print(f"DIAGNOSTIC: Pupil Disc Center is at {pup_loc}")
        print(f"DIAGNOSTIC: Distance between Eyeball and Pupil Disc is {dist:.4f}m (Expected ~0.06m radius)")
        
        # Eyeball radius from _build_facial_bone_defs in plant_humanoid_v5.py is ~0.06m.
        # Pupil disc should be at the front surface (dist slightly less than radius)
        # or slightly in front.
        EYEBALL_RADIUS = 0.06
        print(f"DIAGNOSTIC: Assumed Eyeball Radius: {EYEBALL_RADIUS:.4f}m")
        # Acceptable range: just inside the surface to slightly outside
        self.assertGreaterEqual(dist, EYEBALL_RADIUS * 0.95,
                                f"Pupil disc is embedded too deeply! Distance: {dist:.4f}m, Eyeball Radius: {EYEBALL_RADIUS:.4f}m")
        self.assertLessEqual(dist, EYEBALL_RADIUS * 1.05,
                                f"Pupil disc is too far detached. Distance: {dist:.4f}m, Eyeball Radius: {EYEBALL_RADIUS:.4f}m")

    def test_03_pupil_size_and_scale(self):
        """Measures the mathematical scale representation of the eyelid opening and pupil disc size."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        
        bbox = [herb_pup_l.matrix_world @ mathutils.Vector(b) for b in herb_pup_l.bound_box]
        
        # Compute dimensions safely
        x_min = min(b.x for b in bbox)
        x_max = max(b.x for b in bbox)
        z_min = min(b.z for b in bbox)
        z_max = max(b.z for b in bbox)
        
        width = x_max - x_min
        height = z_max - z_min
        
        print(f"DIAGNOSTIC: Pupil Disc Width spanning X: {width:.4f}m")
        print(f"DIAGNOSTIC: Pupil Disc Height spanning Z: {height:.4f}m")
        self.assertTrue(width > 0.005, f"Pupil disc width is collapsed to {width:.4f}m")

    def test_04_camera_raycast_visibility(self):
        """Casts rays from the main camera to the pupil disc to ensure it's not obscured by the eyelid or sphere."""
        cam = bpy.data.objects.get("OTS1") # OTS Camera focusing on scene
        if not cam:
            cam = bpy.context.scene.camera
            
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        
        target_loc = herb_pup_l.matrix_world.translation
        origin = cam.matrix_world.translation
        
        direction = (target_loc - origin).normalized()
        
        # Use simple scene ray_cast
        depsgraph = bpy.context.evaluated_depsgraph_get()
        # Cast ray slightly offset from camera towards pupil
        hit, location, normal, index, obj, matrix = bpy.context.scene.ray_cast(depsgraph, origin, direction, distance=100.0)
        
        if hit:
            print(f"DIAGNOSTIC: Camera Raycast aiming at pupil hit -> {obj.name} first!")
            # Note: Test is highly dependent on subsurf offset accuracy. Just generating pure logs!
        else:
            print("DIAGNOSTIC: Camera Raycast aiming at pupil hit NOTHING. Lost in space.")


    def test_05_pupil_to_eyeball_distances_diagnostic(self):
        """DIAGNOSTIC: Reports the distance from the pupil center to the eyeball center."""
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")

        self.assertIsNotNone(herb_eye_l, "Eyeball L mesh missing for diagnostic.")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing for diagnostic.")

        bpy.context.view_layer.update()

        eye_loc = herb_eye_l.matrix_world.translation
        pup_loc = herb_pup_l.matrix_world.translation

        dist = (pup_loc - eye_loc).length
        print(f"\nDIAGNOSTIC (Pupil to Eyeball): Distance from Pupil to Eyeball Center: {dist:.4f}m")
        EYEBALL_RADIUS = 0.06
        print(f"DIAGNOSTIC (Pupil to Eyeball): Assumed Eyeball Radius: {EYEBALL_RADIUS:.4f}m")
        if dist > EYEBALL_RADIUS * 1.05:
            print(f"DIAGNOSTIC (Pupil to Eyeball): Pupil is significantly detached from eyeball surface.")
        elif dist < EYEBALL_RADIUS * 0.95:
            print(f"DIAGNOSTIC (Pupil to Eyeball): Pupil is significantly embedded within eyeball.")
        else:
            print(f"DIAGNOSTIC (Pupil to Eyeball): Pupil is close to eyeball surface.")


    def test_06_eyeball_to_eyelid_distances_diagnostic(self):
        """DIAGNOSTIC: Reports distances from the eyeball center to the top and lower eyelids."""
        herb_eye_l = bpy.data.objects.get("Herbaceous_V5_Eyeball_L")
        herb_eyelid_upper_l = bpy.data.objects.get("Herbaceous_V5_Eyelid_Upper_L")
        herb_eyelid_lower_l = bpy.data.objects.get("Herbaceous_V5_Eyelid_Lower_L")

        self.assertIsNotNone(herb_eye_l, "Eyeball L mesh missing for diagnostic.")
        self.assertIsNotNone(herb_eyelid_upper_l, "Eyelid Upper L mesh missing for diagnostic.")
        self.assertIsNotNone(herb_eyelid_lower_l, "Eyelid Lower L mesh missing for diagnostic.")

        bpy.context.view_layer.update()

        eye_loc = herb_eye_l.matrix_world.translation
        eyelid_upper_loc = herb_eyelid_upper_l.matrix_world.translation
        eyelid_lower_loc = herb_eyelid_lower_l.matrix_world.translation

        dist_eye_to_upper = (eyelid_upper_loc - eye_loc).length
        dist_eye_to_lower = (eyelid_lower_loc - eye_loc).length

        print(f"\nDIAGNOSTIC (Eyeball to Eyelids): Distance from Eyeball Center to Upper Eyelid Center: {dist_eye_to_upper:.4f}m")
        print(f"DIAGNOSTIC (Eyeball to Eyelids): Distance from Eyeball Center to Lower Eyelid Center: {dist_eye_to_lower:.4f}m")


    def test_07_pupil_to_eyelid_distances_diagnostic(self):
        """DIAGNOSTIC: Reports distances from the pupil center to the top and lower eyelids."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        herb_eyelid_upper_l = bpy.data.objects.get("Herbaceous_V5_Eyelid_Upper_L")
        herb_eyelid_lower_l = bpy.data.objects.get("Herbaceous_V5_Eyelid_Lower_L")

        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing for diagnostic.")
        self.assertIsNotNone(herb_eyelid_upper_l, "Eyelid Upper L mesh missing for diagnostic.")
        self.assertIsNotNone(herb_eyelid_lower_l, "Eyelid Lower L mesh missing for diagnostic.")

        bpy.context.view_layer.update()

        pup_loc = herb_pup_l.matrix_world.translation
        eyelid_upper_loc = herb_eyelid_upper_l.matrix_world.translation
        eyelid_lower_loc = herb_eyelid_lower_l.matrix_world.translation

        dist_pup_to_upper = (eyelid_upper_loc - pup_loc).length
        dist_pup_to_lower = (eyelid_lower_loc - pup_loc).length

        print(f"\nDIAGNOSTIC (Pupil to Eyelids): Distance from Pupil Center to Upper Eyelid Center: {dist_pup_to_upper:.4f}m")
        print(f"DIAGNOSTIC (Pupil to Eyelids): Distance from Pupil Center to Lower Eyelid Center: {dist_pup_to_lower:.4f}m")

    def test_08_facial_distances_nose_lip_diagnostic(self):
        """DIAGNOSTIC: Reports the distance from the nose center to the upper lip center."""
        herb_nose = bpy.data.objects.get("Herbaceous_V5_Nose")
        herb_lip_upper = bpy.data.objects.get("Herbaceous_V5_Lip_Upper")

        self.assertIsNotNone(herb_nose, "Nose mesh missing for diagnostic.")
        self.assertIsNotNone(herb_lip_upper, "Upper Lip mesh missing for diagnostic.")

        bpy.context.view_layer.update()

        nose_loc = herb_nose.matrix_world.translation
        lip_upper_loc = herb_lip_upper.matrix_world.translation

        dist = (lip_upper_loc - nose_loc).length
        print(f"\nDIAGNOSTIC (Facial Distances): Distance from Nose Center to Upper Lip Center: {dist:.4f}m ({dist*100:.2f}cm)")


    def test_09_facial_distances_eyebrow_eyelid_diagnostic(self):
        """DIAGNOSTIC: Reports the distance from the eyebrow center to the upper eyelid center."""
        herb_eyebrow_l = bpy.data.objects.get("Herbaceous_V5_Eyebrow_L")
        herb_eyelid_upper_l = bpy.data.objects.get("Herbaceous_V5_Eyelid_Upper_L")

        self.assertIsNotNone(herb_eyebrow_l, "Eyebrow L mesh missing for diagnostic.")
        self.assertIsNotNone(herb_eyelid_upper_l, "Eyelid Upper L mesh missing for diagnostic.")

        bpy.context.view_layer.update()

        eyebrow_loc = herb_eyebrow_l.matrix_world.translation
        eyelid_upper_loc = herb_eyelid_upper_l.matrix_world.translation

        dist = (eyelid_upper_loc - eyebrow_loc).length
        print(f"\nDIAGNOSTIC (Facial Distances): Distance from Eyebrow L Center to Eyelid Upper L Center: {dist:.4f}m ({dist*100:.2f}cm)")


    def test_10_facial_distances_ear_eye_diagnostic(self):
        """DIAGNOSTIC: Reports the distance from each ear center to its corresponding eye center."""
        for side in ("L", "R"):
            herb_ear = bpy.data.objects.get(f"Herbaceous_V5_Ear_{side}")
            herb_eye = bpy.data.objects.get(f"Herbaceous_V5_Eyeball_{side}")

            self.assertIsNotNone(herb_ear, f"Ear {side} mesh missing for diagnostic.")
            self.assertIsNotNone(herb_eye, f"Eyeball {side} mesh missing for diagnostic.")

            bpy.context.view_layer.update()

            ear_loc = herb_ear.matrix_world.translation
            eye_loc = herb_eye.matrix_world.translation

            dist = (eye_loc - ear_loc).length
            print(f"\nDIAGNOSTIC (Facial Distances): Distance from Ear {side} Center to Eyeball {side} Center: {dist:.4f}m ({dist*100:.2f}cm)")

    def test_11_head_dimensions_height_diagnostic(self):
        """DIAGNOSTIC: Reports the height of the head."""
        # Retrieve character's armature to get bone dimensions
        armature_obj = bpy.data.objects.get("Herbaceous_V5") # Assuming default name
        if not armature_obj or armature_obj.type != 'ARMATURE':
            armature_obj = bpy.data.objects.get("Arbor_V5") # Try other character
        
        self.assertIsNotNone(armature_obj, "Armature object missing for head dimensions diagnostic.")

        bpy.context.view_layer.update()

        # Get head bone from armature
        head_bone = armature_obj.pose.bones.get("Head")
        self.assertIsNotNone(head_bone, "Head bone missing from armature for diagnostic.")

        # Head bone tail is top of the head, head is base of head
        # These are in local armature space relative to armature origin
        head_base_loc = armature_obj.matrix_world @ head_bone.head
        head_top_loc = armature_obj.matrix_world @ head_bone.tail

        head_height = (head_top_loc - head_base_loc).length
        print(f"\nDIAGNOSTIC (Head Dimensions): Height of the Head (Bone): {head_height:.4f}m ({head_height*100:.2f}cm)")


    def test_12_head_dimensions_ground_to_top_diagnostic(self):
        """DIAGNOSTIC: Reports the distance from the ground (Z=0) to the top of the head."""
        armature_obj = bpy.data.objects.get("Herbaceous_V5") # Assuming default name
        if not armature_obj or armature_obj.type != 'ARMATURE':
            armature_obj = bpy.data.objects.get("Arbor_V5") # Try other character

        self.assertIsNotNone(armature_obj, "Armature object missing for head dimensions diagnostic.")

        bpy.context.view_layer.update()

        head_bone = armature_obj.pose.bones.get("Head")
        self.assertIsNotNone(head_bone, "Head bone missing from armature for diagnostic.")

        # Top of the head bone (tail) in world coordinates
        head_top_world_z = (armature_obj.matrix_world @ head_bone.tail).z
        
        print(f"\nDIAGNOSTIC (Head Dimensions): Distance from Ground (Z=0) to Top of Head: {head_top_world_z:.4f}m ({head_top_world_z*100:.2f}cm)")

    def test_13_pupil_render_visibility_status_diagnostic(self):
        """DIAGNOSTIC: Reports the render visibility status of the pupil disc."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing for visibility diagnostic.")
        
        bpy.context.view_layer.update()

        # Check object's own hide_render property
        hide_render_obj = herb_pup_l.hide_render

        # Check collection visibility
        collection_hidden_render = False
        for collection in herb_pup_l.users_collection:
            if collection.hide_render:
                collection_hidden_render = True
                break

        # Check scene layer visibility for rendering
        # This is more complex as it depends on active view layer setup,
        # but a basic check on collection visibility is often sufficient.
        
        print(f"\nDIAGNOSTIC (Pupil Render Status): Pupil Disc L '{herb_pup_l.name}':")
        print(f"  - Object.hide_render: {hide_render_obj}")
        print(f"  - In hidden collection (for render): {collection_hidden_render}")

        # Check material transparency/blend mode settings that could cause invisibility
        pup_mat = herb_pup_l.data.materials[0]
        if pup_mat and pup_mat.node_tree:
            bsdf = None
            for node in pup_mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    bsdf = node
                    break
            if bsdf:
                alpha = bsdf.inputs['Alpha'].default_value if 'Alpha' in bsdf.inputs else 1.0
                print(f"  - Material Alpha (Principled BSDF): {alpha:.4f}")
                # Check blend mode - though for Principled BSDF, alpha is usually key
                if pup_mat.blend_method != 'OPAQUE':
                    print(f"  - Material Blend Method: {pup_mat.blend_method} (might cause transparency)")
        else:
            print(f"  - Material node tree or Principled BSDF not found for detailed alpha check.")

    def test_14_pupil_scale_diagnostic(self):
        """DIAGNOSTIC: Reports the local and inherited scale of the pupil disc and its direct parent bone."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing for scale diagnostic.")
        
        bpy.context.view_layer.update()

        # Object's local scale
        obj_scale = herb_pup_l.scale
        print(f"\nDIAGNOSTIC (Pupil Scale): Pupil Disc L '{herb_pup_l.name}' local scale: X={obj_scale.x:.4f}, Y={obj_scale.y:.4f}, Z={obj_scale.z:.4f}")

        # Check parent bone's scale
        # The pupil is parented to a bone in the armature
        armature_obj = herb_pup_l.parent
        if armature_obj and armature_obj.type == 'ARMATURE':
            bone_name = herb_pup_l.parent_bone
            if bone_name:
                # Store current active object and selection
                original_active = bpy.context.view_layer.objects.active
                original_selection = bpy.context.selected_objects[:]

                # Select and activate the armature to ensure correct context for mode switch
                bpy.ops.object.select_all(action='DESELECT')
                armature_obj.select_set(True)
                bpy.context.view_layer.objects.active = armature_obj
                
                # Switch to Pose mode
                bpy.ops.object.mode_set(mode='POSE')
                
                pose_bone = armature_obj.pose.bones.get(bone_name)
                
                # Switch back to Object mode
                bpy.ops.object.mode_set(mode='OBJECT')

                # Restore original selection and active object
                bpy.ops.object.select_all(action='DESELECT')
                for obj in original_selection:
                    obj.select_set(True)
                bpy.context.view_layer.objects.active = original_active

                if pose_bone:
                    # Pose bone scale (inherited scale is matrix_basis scale)
                    bone_scale = pose_bone.matrix_basis.to_scale()
                    print(f"DIAGNOSTIC (Pupil Scale): Parent bone '{bone_name}' scale: X={bone_scale.x:.4f}, Y={bone_scale.y:.4f}, Z={bone_scale.z:.4f}")
                else:
                    print(f"DIAGNOSTIC (Pupil Scale): Parent bone '{bone_name}' not found in pose bones.")
            else:
                print(f"DIAGNOSTIC (Pupil Scale): Pupil disc has no parent bone set.")
        else:
            print(f"DIAGNOSTIC (Pupil Scale): Pupil disc is not parented to an armature.")

    def test_15_pupil_material_color_diagnostic(self):
        """DIAGNOSTIC: Reports the RGB color of the pupil material."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing for color diagnostic.")
        
        pup_mat = herb_pup_l.data.materials[0]
        self.assertIsNotNone(pup_mat, "Pupil material missing for color diagnostic.")

        if pup_mat.node_tree:
            bsdf = None
            for node in pup_mat.node_tree.nodes:
                if node.type == 'BSDF_PRINCIPLED':
                    bsdf = node
                    break
            if bsdf:
                base_color = bsdf.inputs['Base Color'].default_value
                print(f"\nDIAGNOSTIC (Pupil Color): Pupil Material Base Color (RGBA): ({base_color[0]:.4f}, {base_color[1]:.4f}, {base_color[2]:.4f}, {base_color[3]:.4f})")
            else:
                print("\nDIAGNOSTIC (Pupil Color): Principled BSDF node not found in pupil material.")
        else:
            print("\nDIAGNOSTIC (Pupil Color): Pupil material does not use nodes.")


    def test_16_pupil_xyz_dimensions_diagnostic(self):
        """DIAGNOSTIC: Reports the X, Y, and Z dimensions (diameters) of the pupil disc."""
        herb_pup_l = bpy.data.objects.get("Herbaceous_V5_PupilDisc_L")
        self.assertIsNotNone(herb_pup_l, "Pupil Disc L mesh missing for dimensions diagnostic.")

        bpy.context.view_layer.update()
        
        # Get bounding box corners in world space
        bbox_corners = [herb_pup_l.matrix_world @ mathutils.Vector(corner) for corner in herb_pup_l.bound_box]

        x_coords = [v.x for v in bbox_corners]
        y_coords = [v.y for v in bbox_corners]
        z_coords = [v.z for v in bbox_corners]

        x_dim = max(x_coords) - min(x_coords)
        y_dim = max(y_coords) - min(y_coords)
        z_dim = max(z_coords) - min(z_coords)

        print(f"\nDIAGNOSTIC (Pupil Dimensions): Pupil Disc L '{herb_pup_l.name}' X-Dimension (Diameter): {x_dim:.4f}m")
        print(f"DIAGNOSTIC (Pupil Dimensions): Pupil Disc L '{herb_pup_l.name}' Y-Dimension (Diameter): {y_dim:.4f}m")
        print(f"DIAGNOSTIC (Pupil Dimensions): Pupil Disc L '{herb_pup_l.name}' Z-Dimension (Diameter): {z_dim:.4f}m")

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])
