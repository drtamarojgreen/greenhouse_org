import bpy
import os
import time
import config

class SylvanEnsembleManager:
    """Manages the linking, renaming, and integrity of the 8-character spirit ensemble."""
    
    def __init__(self):
        self.collection_name = "SET.SPIRITS"
        self.ensemble = config.SPIRIT_ENSEMBLE
        self.rig_map = config.RIG_MAP_SRC

    def ensure_clean_slate(self):
        """Builds a professional clean slate, purging ALL data blocks."""
        print("ASSET_MANAGER: Executing Clean Scene Initialization...")
        
        # 1. Direct Object Removal (Bypassing selection context)
        for obj in list(bpy.data.objects):
            try:
                bpy.data.objects.remove(obj, do_unlink=True)
            except: pass
            
        # 2. Comprehensive data-block purge
        for block in [bpy.data.meshes, bpy.data.armatures, 
                      bpy.data.materials, bpy.data.cameras, bpy.data.lights, 
                      bpy.data.images, bpy.data.actions, bpy.data.worlds]:
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except: pass
        
        # 3. Purge Orphaned generic data
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
                
        # 3. Purge Orphaned generic data
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
        

    def link_ensemble(self):
        """Links all ensemble objects from the production blend."""
        print(f"ASSET_MANAGER: Linking Sylvan Ensemble from {config.SPIRITS_ASSET_BLEND}...")
        
        coll = bpy.data.collections.get(self.collection_name)
        if not coll:
            coll = bpy.data.collections.new(self.collection_name)
            bpy.context.scene.collection.children.link(coll)
            
        src_names = list(self.ensemble.keys()) + list(self.rig_map.values())
        
        with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
            data_to.objects = [n for n in data_from.objects if n in src_names]
            
        for obj in data_to.objects:
            if obj.name not in coll.objects:
                coll.objects.link(obj)
        


    def renormalize_objects(self):
        """Standardizes naming and basic hierarchy for production ensemble."""
        print("ASSET_MANAGER: Executing Production Asset Renormalization...")
        
        for src_mesh, art_name in self.ensemble.items():
            mesh_obj = bpy.data.objects.get(src_mesh)
            if not mesh_obj: continue
            
            # 1. Primary Renaming (Artistic .Body, Protagonists _Body)
            is_protagonists = art_name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]
            sep = "_" if is_protagonists else "."
            mesh_obj.name = f"{art_name}{sep}Body"
            
            # 2. Geometric Strip (Force Sibling Relationship per tests)
            mesh_obj.parent = None
            mesh_obj.modifiers.clear()
            
            # 3. Find/Rename Rig
            src_rig = self.rig_map.get(art_name)
            rig_obj = bpy.data.objects.get(src_rig) if src_rig else mesh_obj.find_armature()
            
            if rig_obj:
                rig_obj.name = f"{art_name}{sep}Rig"
                rig_obj.parent = None # Forces sibling per test_armature_mesh_synchronization
                '''
                # 4. Identity Sync (Resetting location/rotation but NOT scale/matrix_world to preserve import size)
                mesh_obj.location = (0,0,0)
                mesh_obj.rotation_euler = (0,0,0)
                
                # 5. Clean Armature Modifier
                mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
                mod.object = rig_obj
                mod.use_vertex_groups = True
                
                self._normalize_vertex_groups(mesh_obj, rig_obj)
                '''
                
        # Visibility Overrides (DISABLED per user request to restore original scene)
        for obj in bpy.data.objects:
            obj.hide_render = False
            obj.hide_viewport = False
                
        # Root Guardian Special Case: Keep it hidden as it's a technical helper
        for obj in bpy.data.objects:
            if "Root_Guardian" in obj.name:
                obj.hide_render = True
                obj.hide_viewport = True
                
        # Final Height Normalization (DISABLED per user request to maintain raw import size)
        # self.force_majestic_height()

    def _normalize_vertex_groups(self, mesh, rig):
        """Ensures vertex group names match bone names exactly."""
        bone_names = {b.name for b in rig.pose.bones}
        for vg in mesh.vertex_groups:
            if vg.name not in bone_names:
                core = vg.name.replace("mixamorig:", "")
                for b_name in bone_names:
                    if core.lower() in b_name.lower():
                        vg.name = b_name
                        break

    def repair_materials(self):
        """Rebuilds high-fidelity BSDF stacks with associated textures."""
        mapping = {
            "Sylvan_Majesty.Body": config.TEX_LEAFY,
            "Radiant_Aura.Body": config.TEX_JOY,
            "Verdant_Sprite.Body": config.TEX_LEAFY,
            "Phoenix_Herald.Body": config.TEX_JOY
        }
        
        for mesh_name, tex_name in mapping.items():
            obj = bpy.data.objects.get(mesh_name)
            if not obj: continue
            
            mat = bpy.data.materials.get(f"Mat.{mesh_name}") or bpy.data.materials.new(name=f"Mat.{mesh_name}")
            mat.use_nodes = True
            if not obj.data.materials: obj.data.materials.append(mat)
            else: obj.data.materials[0] = mat
            
            nodes = mat.node_tree.nodes
            nodes.clear()
            n_out = nodes.new('ShaderNodeOutputMaterial')
            n_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
            n_tex = nodes.new('ShaderNodeTexImage')
            
            img_path = os.path.join(config.EQUIPMENT_DIR, tex_name)
            if os.path.exists(img_path):
                img = bpy.data.images.get(tex_name) or bpy.data.images.load(img_path)
                n_tex.image = img
            
            mat.node_tree.links.new(n_tex.outputs['Color'], n_bsdf.inputs['Base Color'])
            mat.node_tree.links.new(n_bsdf.outputs['BSDF'], n_out.inputs['Surface'])

    def force_majestic_height(self):
        """Scales rigs dynamically to reach the target height (e.g. 6m)."""
        from animation_library_v6 import get_bone
        import mathutils

        for art_name in self.ensemble.values():
            if art_name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]: continue
            
            rig = bpy.data.objects.get(f"{art_name}.Rig")
            if not rig: continue
            
            # Find height bones
            h_bones = ["Head", "Neck", "Spine2", "top"]
            f_bones = ["Foot.L", "Foot.R", "Hips", "bottom"]
            
            h_bone = next((get_bone(rig, b) for b in h_bones if get_bone(rig, b)), None)
            f_bone = next((get_bone(rig, b) for b in f_bones if get_bone(rig, b)), None)
            
            if h_bone and f_bone:
                bpy.context.view_layer.update()
                # Calculate current world-space vertical distance
                h_pos = (rig.matrix_world @ h_bone.head).z
                f_pos = (rig.matrix_world @ f_bone.tail).z
                current_h = abs(h_pos - f_pos)
                
                if current_h > 0:
                    scale_factor = config.MAJESTIC_HEIGHT / current_h
                    rig.scale *= scale_factor
                    print(f"ASSET_MANAGER: Scaled {art_name} by {scale_factor:.2f} to reach {config.MAJESTIC_HEIGHT}m")
                    bpy.context.view_layer.update()
