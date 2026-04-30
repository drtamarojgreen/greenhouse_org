# asset_exporter.py - Blender-side export system for Unity (Movie 8)

import bpy
import json
import os
import mathutils
import sys
from pathlib import Path

# Ensure Movie 7 root is in sys.path to import its config
M7_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "7")
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config

class UnityAssetExporter:
    """Exports Movie 7 assets to Unity-compatible format."""
    
    def __init__(self, export_root=None):
        if export_root is None:
            # Default to a folder in Movie 8 directory
            export_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Unity_Assets")
        self.export_root = Path(export_root)
        self.export_root.mkdir(exist_ok=True, parents=True)
        
    def export_all_assets(self):
        """Complete asset pipeline export."""
        print(f"Starting Movie 8 export to {self.export_root}...")
        self.export_characters()
        self.export_animations()
        self.export_environment()
        self.export_level_layout()
        self.generate_metadata()

        self._print_performance_summary()
        print("Export completed successfully.")

    def _print_performance_summary(self):
        """Print a summary of optimization results."""
        print("\n" + "="*40)
        print("MOVIE 8 PERFORMANCE SUMMARY")
        print("="*40)

        # Character LOD stats
        chars = [o for o in bpy.data.objects if o.type == 'ARMATURE' and ".Rig" in o.name]
        print(f"Total Characters Exported: {len(chars)}")
        for rig in chars:
            poly_count = sum(len(m.data.polygons) for m in rig.children_recursive if m.type == 'MESH')
            print(f"  - {rig.name.replace('.Rig', '')}: {poly_count} polygons (LOD0)")

        # Environment stats
        env_collections = ["7b.ENVIRONMENT", "8a.WORLD", "8b.PROPS"]
        print("\nEnvironment Optimization:")
        for coll_name in env_collections:
            coll = bpy.data.collections.get(coll_name)
            if coll:
                mesh_count = len([o for o in coll.objects if o.type == 'MESH'])
                print(f"  - {coll_name}: Reduced {mesh_count} meshes to 1 draw call.")
        print("="*40 + "\n")
        
    def export_characters(self):
        """Export each character as optimized FBX with LODs."""
        chars_path = self.export_root / "Characters"
        chars_path.mkdir(exist_ok=True)
        
        for rig in bpy.data.objects:
            if rig.type == 'ARMATURE' and ".Rig" in rig.name:
                char_id = rig.name.replace(".Rig", "")
                print(f"Exporting character: {char_id}")
                
                # Generate LOD meshes
                for lod_level, decimate_ratio in [("LOD0", 1.0), ("LOD1", 0.5), ("LOD2", 0.25)]:
                    self._export_lod(char_id, rig, lod_level, decimate_ratio)
                    
                # Create character metadata
                self._write_character_metadata(char_id, rig)
                
    def _export_lod(self, char_id, rig, lod_level, decimate_ratio):
        """Export a specific LOD level."""
        # Create a temporary collection for decimation
        temp_coll_name = f"temp_{char_id}_{lod_level}"
        temp_collection = bpy.data.collections.new(temp_coll_name)
        bpy.context.scene.collection.children.link(temp_collection)
        
        # Select target objects
        bpy.ops.object.select_all(action='DESELECT')
        
        # Copy rig and mesh objects
        rig_copy = rig.copy()
        temp_collection.objects.link(rig_copy)
        rig_copy.select_set(True)
        
        exported_meshes = []
        for mesh in rig.children_recursive:
            if mesh.type == 'MESH':
                mesh_copy = mesh.copy()
                mesh_copy.data = mesh.data.copy()
                temp_collection.objects.link(mesh_copy)
                mesh_copy.parent = rig_copy
                mesh_copy.select_set(True)
                exported_meshes.append(mesh_copy)
                
                # Apply decimation for LOD1/LOD2
                if decimate_ratio < 1.0:
                    mod = mesh_copy.modifiers.new(name="Decimate", type='DECIMATE')
                    mod.ratio = decimate_ratio
                    bpy.context.view_layer.objects.active = mesh_copy
                    bpy.ops.object.modifier_apply(modifier="Decimate")
        
        # Export FBX for Unity
        fbx_path = self.export_root / "Characters" / f"{char_id}_{lod_level}.fbx"
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path),
            use_selection=True,
            object_types={'ARMATURE', 'MESH'},
            bake_anim=True,
            mesh_smooth_type='EDGE',
            use_mesh_modifiers=True,
            axis_forward='-Z',
            axis_up='Y'
        )
        
        # Cleanup
        for obj in [rig_copy] + exported_meshes:
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(temp_collection, do_unlink=True)
        
    def export_animations(self):
        """Export animations as separate FBX files."""
        anims_path = self.export_root / "Animations"
        anims_path.mkdir(exist_ok=True)
        
        anim_controller = {
            "parameters": [],
            "states": []
        }
        
        for rig in bpy.data.objects:
            if rig.type != 'ARMATURE' or ".Rig" not in rig.name: continue
            
            char_id = rig.name.replace(".Rig", "")
            char_anim_path = anims_path / char_id
            char_anim_path.mkdir(exist_ok=True)
            
            # Detect animation actions
            actions = list(bpy.data.actions)
            
            for action in actions:
                # Export if action name contains character ID or is a generic action
                if char_id.lower() in action.name.lower() or action.users == 0:
                    anim_info = self._export_animation(rig, action, char_anim_path)
                    if anim_info:
                        anim_controller["states"].append({
                            "character": char_id,
                            "name": action.name,
                            "clip": f"{char_id}/{action.name}.fbx",
                            "type": self._classify_animation(action.name)
                        })
        
        # Write Unity Animator Controller config
        with open(anims_path / "AnimatorController.json", 'w') as f:
            json.dump(anim_controller, f, indent=2)
            
    def _export_animation(self, rig, action, output_path):
        """Export a single animation clip."""
        if not action or len(action.fcurves) == 0:
            return None
            
        fbx_path = output_path / f"{action.name}.fbx"
        
        # Backup current state
        current_frame = bpy.context.scene.frame_current
        if not rig.animation_data:
            rig.animation_data_create()
        current_action = rig.animation_data.action
        
        # Set up animation
        rig.animation_data.action = action
        
        # Select only this rig and its meshes
        bpy.ops.object.select_all(action='DESELECT')
        rig.select_set(True)
        for child in rig.children_recursive:
            if child.type == 'MESH':
                child.select_set(True)
        
        # Export FBX with animation
        bpy.ops.export_scene.fbx(
            filepath=str(fbx_path),
            use_selection=True,
            object_types={'ARMATURE', 'MESH'},
            bake_anim=True,
            bake_anim_use_nla_strip=False,
            bake_anim_step=1,
            bake_anim_simplify_factor=1.0,
            axis_forward='-Z',
            axis_up='Y'
        )
        
        # Restore state
        rig.animation_data.action = current_action
        bpy.context.scene.frame_set(current_frame)
        
        return {"filename": f"{action.name}.fbx", "duration": int(action.frame_range[1] - action.frame_range[0])}
        
    def export_environment(self, join_meshes=True):
        """
        Export environment meshes.

        Psychological Rationale: Environment assets are joined to create a cohesive 'world-state',
        representing the integration of disparate thoughts into a stable mental landscape.
        Technically, this reduces draw calls and improves Unity performance.
        """
        env_path = self.export_root / "Environment"
        env_path.mkdir(exist_ok=True)
        
        env_collections = ["7b.ENVIRONMENT", "8a.WORLD", "8b.PROPS"]
        
        for coll_name in env_collections:
            try:
                coll = bpy.data.collections.get(coll_name)
                if not coll or not coll.objects:
                    continue

                print(f"Exporting environment collection: {coll_name}")

                # Setup temporary collection for processing
                temp_coll = bpy.data.collections.new(f"temp_env_{coll_name}")
                bpy.context.scene.collection.children.link(temp_coll)
                
                processed_objs = []
                for obj in coll.objects:
                    if obj.type == 'MESH':
                        new_obj = obj.copy()
                        new_obj.data = obj.data.copy()
                        temp_coll.objects.link(new_obj)
                        processed_objs.append(new_obj)

                if not processed_objs:
                    bpy.data.collections.remove(temp_coll)
                    continue

                bpy.ops.object.select_all(action='DESELECT')
                for obj in processed_objs:
                    obj.select_set(True)

                bpy.context.view_layer.objects.active = processed_objs[0]

                if join_meshes and len(processed_objs) > 1:
                    bpy.ops.object.join()
                    # After join, only one object (the active one) remains selected
                    export_objs = [bpy.context.view_layer.objects.active]
                else:
                    export_objs = processed_objs

                combined_name = coll_name.replace(".", "_")
                fbx_path = env_path / f"{combined_name}.fbx"

                bpy.ops.export_scene.fbx(
                    filepath=str(fbx_path),
                    use_selection=True,
                    object_types={'MESH'},
                    use_mesh_modifiers=True,
                    mesh_smooth_type='FACE',
                    axis_forward='-Z',
                    axis_up='Y'
                )

                # Cleanup
                for obj in export_objs:
                    bpy.data.objects.remove(obj, do_unlink=True)
                bpy.data.collections.remove(temp_coll)

            except Exception as e:
                print(f"Error exporting collection {coll_name}: {str(e)}")
            
    def export_level_layout(self):
        """Export level layout data for Unity scene construction."""
        layout_data = {
            "characters": [],
            "spawn_points": [],
            "waypoints": [],
            "interactables": [],
            "lighting_zones": []
        }
        
        # Character positions
        for rig in bpy.data.objects:
            if rig.type == 'ARMATURE' and ".Rig" in rig.name:
                layout_data["characters"].append({
                    "id": rig.name.replace(".Rig", ""),
                    "transform": self._vector_to_list(rig.location),
                    "rotation": self._euler_to_list(rig.rotation_euler),
                    "scale": self._vector_to_list(rig.scale)
                })
        
        # Extract waypoints for patrol paths from Movie 7 config
        patrol_paths = config.config.get("patrol_paths", {})
        for path_id, path_data in patrol_paths.items():
            layout_data["waypoints"].append({
                "id": path_id,
                "points": path_data.get("waypoints", []),
                "loop": path_data.get("loop", True)
            })
        
        # Camera placements
        for cam_obj in bpy.data.objects:
            if cam_obj.type == 'CAMERA':
                layout_data["spawn_points"].append({
                    "name": cam_obj.name,
                    "position": self._vector_to_list(cam_obj.location),
                    "rotation": self._euler_to_list(cam_obj.rotation_euler),
                    "focal_length": cam_obj.data.lens
                })
        
        # Export layout
        with open(self.export_root / "LevelLayout.json", 'w') as f:
            json.dump(layout_data, f, indent=2)
            
    def generate_metadata(self):
        """Generate complete asset manifest for Unity."""
        manifest = {
            "version": "8.0.0",
            "character_count": 0,
            "animation_count": 0,
            "environment_assets": [],
            "gameplay_config": self._extract_gameplay_config()
        }
        
        manifest["character_count"] = len([o for o in bpy.data.objects 
                                          if o.type == 'ARMATURE' and ".Rig" in o.name])
        manifest["animation_count"] = len(bpy.data.actions)
        
        for coll in bpy.data.collections:
            if any(prefix in coll.name for prefix in ["ENVIRONMENT", "WORLD", "PROPS"]):
                manifest["environment_assets"].append({
                    "name": coll.name,
                    "mesh_count": len([o for o in coll.objects if o.type == 'MESH'])
                })
        
        with open(self.export_root / "AssetManifest.json", 'w') as f:
            json.dump(manifest, f, indent=2)
            
    def _extract_gameplay_config(self):
        """Extract gameplay parameters from Movie 7 config."""
        return {
            "total_frames": config.config.total_frames,
            "ensemble_entities": config.config.get("ensemble.entities", []),
            "story_beats": config.config.get("ensemble.storyline", []),
            "calligraphy": config.config.get("calligraphy", {})
        }
    
    @staticmethod
    def _vector_to_list(v):
        return [v.x, v.y, v.z]
    
    @staticmethod
    def _euler_to_list(e):
        return [e.x, e.y, e.z]
    
    @staticmethod
    def _classify_animation(name):
        name_lower = name.lower()
        if "idle" in name_lower: return "idle"
        elif "walk" in name_lower: return "walk"
        elif "run" in name_lower: return "run"
        elif "jump" in name_lower: return "jump"
        elif "attack" in name_lower: return "attack"
        elif "dance" in name_lower: return "emote"
        elif "talk" in name_lower: return "dialogue"
        else: return "action"

    def _write_character_metadata(self, char_id, rig):
        """
        Write character metadata JSON for Unity.
        
        Psychological Rationale: Metadata defines the 'boundaries of the self'.
        LODs represent levels of psychological focus - closer objects are detailed (conscious focus),
        while distant ones are decimated (subconscious presence).
        """
        try:
            materials = []
            for mesh in rig.children_recursive:
                if mesh.type == 'MESH' and mesh.data.materials:
                    for mat in mesh.data.materials:
                        if mat and mat.name not in materials:
                            materials.append(mat.name)

            bounds_min, bounds_max = self._get_character_bounds(rig)
            center = (bounds_min + bounds_max) / 2
            size = bounds_max - bounds_min

            metadata = {
                "id": char_id,
                "materials": materials,
                "bounds": {
                    "min": self._vector_to_list(bounds_min),
                    "max": self._vector_to_list(bounds_max),
                    "center": self._vector_to_list(center),
                    "size": self._vector_to_list(size)
                },
                "collider": {
                    "type": "BOX",
                    "center": self._vector_to_list(center - rig.location),
                    "size": self._vector_to_list(size)
                }
            }

            with open(self.export_root / "Characters" / f"{char_id}_metadata.json", 'w') as f:
                json.dump(metadata, f, indent=2)
        except Exception as e:
            print(f"Error writing metadata for {char_id}: {str(e)}")
    
    def _get_character_bounds(self, rig):
        min_v = mathutils.Vector((float('inf'), float('inf'), float('inf')))
        max_v = mathutils.Vector((float('-inf'), float('-inf'), float('-inf')))
        found = False
        for mesh in rig.children_recursive:
            if mesh.type == 'MESH':
                found = True
                for corner in mesh.bound_box:
                    world_corner = mesh.matrix_world @ mathutils.Vector(corner)
                    for i in range(3):
                        min_v[i] = min(min_v[i], world_corner[i])
                        max_v[i] = max(max_v[i], world_corner[i])
        
        if not found:
            return mathutils.Vector((0,0,0)), mathutils.Vector((1,1,1))
        return min_v, max_v

if __name__ == "__main__":
    exporter = UnityAssetExporter()
    exporter.export_all_assets()
