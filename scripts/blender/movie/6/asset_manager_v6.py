import bpy
import os
import time
import config

class SylvanEnsembleManager:
    """Manages the linking and naming of the spirit ensemble."""
    
    def __init__(self):
        self.collection_name = "SET.SPIRITS"
        self.ensemble = config.SPIRIT_ENSEMBLE
        self.rig_map = config.RIG_MAP_SRC

    def ensure_clean_slate(self):
        """Builds a professional clean slate, purging ALL data blocks."""
        print("ASSET_MANAGER: Executing Clean Scene Initialization...")
        
        for obj in list(bpy.data.objects):
            try:
                bpy.data.objects.remove(obj, do_unlink=True)
            except: pass
            
        for block in [bpy.data.meshes, bpy.data.armatures, 
                      bpy.data.materials, bpy.data.cameras, bpy.data.lights, 
                      bpy.data.images, bpy.data.actions, bpy.data.worlds]:
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except: pass
        
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    def link_ensemble(self):
        """Links all ensemble objects and renames them for production."""
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

        # Production Renaming
        for src_mesh, art_name in self.ensemble.items():
            mesh_obj = bpy.data.objects.get(src_mesh)
            if mesh_obj:
                mesh_obj.name = f"{art_name}.Body"
                
                # Find associated rig
                src_rig = self.rig_map.get(art_name)
                rig_obj = bpy.data.objects.get(src_rig) if src_rig else mesh_obj.find_armature()
                if rig_obj:
                    rig_obj.name = f"{art_name}.Rig"

    def repair_materials(self):
        """Rebuilds BSDF stacks with associated textures."""
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
