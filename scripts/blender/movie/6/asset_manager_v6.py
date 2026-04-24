import bpy
import os
import sys
import math
import mathutils

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

# prioritize assets_v6 for create_plant_humanoid_v6 etc.
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

# Robust import of config
try:
    import config
except ImportError:
    from . import config

import animation_library_v6
import asset_normalization_functions
from plant_humanoid_v6 import create_plant_humanoid_v6


class SylvanEnsembleManager:
    """Manages the linking, renaming, and integrity of the spirit ensemble."""

    def __init__(self):
        self.collection_name = config.COLL_ASSETS
        self.ensemble  = config.SPIRIT_ENSEMBLE
        self.rig_map   = config.RIG_MAP_SRC
        self.linked_objects_map = {}

    def ensure_clean_slate(self):
        """Purges ALL data-blocks for a reproducible clean start."""
        for obj in list(bpy.data.objects):
            try:
                bpy.data.objects.remove(obj, do_unlink=True)
            except: pass

        for block in (bpy.data.meshes, bpy.data.armatures,
                      bpy.data.materials, bpy.data.cameras, bpy.data.lights,
                      bpy.data.images, bpy.data.actions, bpy.data.worlds):
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except: pass

        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    def link_ensemble(self, source='FBX'):
        """Imports ensemble objects. source can be 'FBX' or 'BLEND'."""
        coll = bpy.data.collections.get(self.collection_name) or bpy.data.collections.new(self.collection_name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        if source == 'BLEND':
            self._link_from_blend(coll)
        else:
            self._link_from_fbx(coll)

    def _link_from_blend(self, coll):
        """Standard legacy linking from master blend."""
        src_mesh_names = list(self.ensemble.keys())
        src_rig_names  = list(self.rig_map.values())
        want = set(src_mesh_names + src_rig_names)

        with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
            data_to.objects = [n for n in want if n in data_from.objects]

        for obj in data_to.objects:
            if obj and obj.name not in coll.objects:
                coll.objects.link(obj)
                obj["source_name"] = obj.name
                self.linked_objects_map[obj.name] = obj
                for child in obj.children_recursive:
                    if child.name not in coll.objects:
                        coll.objects.link(child)
                        self.linked_objects_map[child.name] = child

    def _link_from_fbx(self, coll):
        """Imports from local FBX folder."""
        assets_dir = os.path.join(V6_DIR, "assets")
        if not os.path.exists(assets_dir): return

        fbx_files = sorted([f for f in os.listdir(assets_dir) if f.lower().endswith(".fbx")])
        for fbx_name in fbx_files:
            art_name = fbx_name.replace(".fbx", "")
            if "test_resilience" in art_name: continue
            
            print(f"DIRECTOR: Importing {art_name} from FBX...")
            fbx_path = os.path.join(assets_dir, fbx_name)
            pre_import = set(bpy.data.objects.keys())
            bpy.ops.import_scene.fbx(filepath=fbx_path)
            new_objs = [bpy.data.objects[n] for n in set(bpy.data.objects.keys()) - pre_import]
            
            for obj in new_objs:
                obj.hide_render = False
                obj.hide_viewport = False
                if obj.name not in coll.objects: coll.objects.link(obj)

            rig = next((o for o in new_objs if o.type == 'ARMATURE'), None)
            mesh = next((o for o in new_objs if (o.type == 'MESH' and "Body" in o.name)) or (o for o in new_objs if o.type == 'MESH'), None)
            
            if mesh and not rig:
                self._emergency_rig(mesh, art_name)
                rig = bpy.data.objects.get(f"{art_name}.Rig")

            if rig:
                rig.name = f"{art_name}.Rig"
                if mesh: mesh.name = f"{art_name}.Body"
                self.linked_objects_map[rig.name] = rig
                
                target_h = config.SPRITE_HEIGHT
                if "Majesty" in art_name or "Aura" in art_name: target_h = config.MAJESTIC_HEIGHT
                elif "Phoenix" in art_name: target_h = config.PHOENIX_HEIGHT
                self.normalize_character_scale(rig, target_h)

        #self.repair_materials()

    def _emergency_rig(self, mesh, art_name):
        """Creates a skeletal rig for mesh-only characters."""
        print(f"  - Generating skeleton for {art_name}...")
        bpy.ops.object.select_all(action='DESELECT')
        mesh.select_set(True)
        bpy.context.view_layer.objects.active = mesh
        bbox = [mathutils.Vector(v) for v in mesh.bound_box]
        height = max(v.z for v in bbox) - min(v.z for v in bbox)
        
        bpy.ops.object.armature_add(location=(mesh.location.x, mesh.location.y, mesh.location.z + min(v.z for v in bbox)))
        rig = bpy.context.active_object
        rig.name = f"{art_name}.Rig"
        
        bpy.ops.object.mode_set(mode='EDIT')
        eb = rig.data.edit_bones[0]
        eb.name = "Torso"; eb.head = (0,0,0); eb.tail = (0,0,height*0.5)
        bn = rig.data.edit_bones.new("Neck"); bn.parent = eb; bn.head = eb.tail; bn.tail = (0,0,height*0.8)
        bh = rig.data.edit_bones.new("Head"); bh.parent = bn; bh.head = bn.tail; bh.tail = (0,0,height)
        bpy.ops.object.mode_set(mode='OBJECT')
        
        mesh.select_set(True)
        bpy.context.view_layer.objects.active = rig
        #bpy.ops.object.parent_set(type='ARMATURE_AUTO')
        mesh.name = f"{art_name}.Body"

    def link_protagonists(self):
        """Creates procedural protagonists and enforces Armature modifiers."""
        create_plant_humanoid_v6(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS)
        create_plant_humanoid_v6(config.CHAR_ARBOR, config.CHAR_ARBOR_POS)
        
        #for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
        #    rig = bpy.data.objects.get(name)
        #    if rig: self.normalize_character_scale(rig, 2.5)

    def normalize_character_scale(self, rig, target_height):
        """Extreme Reset Normalization: Decouples meshes to ensure 1:1 local-world mapping before scaling."""
        if not rig: return
        bpy.context.view_layer.update()
        
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        if not meshes:
            print(f"   [Normalization] Skipping {rig.name}: No meshes found.")
            return
            
        for m in meshes:
            m.parent = None
            m.matrix_world = mathutils.Matrix.Identity(4)
        
        rig.location = (0, 0, 0)
        rig.rotation_euler = (0, 0, 0)
        rig.scale = (1, 1, 1)
        bpy.context.view_layer.update()
        
        # Measure unparented mesh collection
        metrics = asset_normalization_functions.get_normalization_metrics(meshes[0]) # Use first mesh for scale
        if not metrics or metrics['height'] < 0.01: 
            # Re-parent and abort
            for m in meshes: m.parent = rig; m.matrix_parent_inverse = mathutils.Matrix.Identity(4)
            return
        
        factor = target_height / metrics['height']
        
        for m in meshes:
            bpy.context.view_layer.objects.active = m
            m.scale *= factor
            bpy.ops.object.transform_apply(scale=True)
            
            bpy.context.view_layer.update()
            temp_metrics = asset_normalization_functions.get_normalization_metrics(m)
            if temp_metrics:
                m.location.z -= temp_metrics['ground_z']
            bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
            
            m.parent = rig
            m.matrix_parent_inverse = mathutils.Matrix.Identity(4)

        print(f"   [Normalization] {rig.name} absolute reset to {target_height}m")

    def renormalize_objects(self):
        """Syncs all child meshes to rigs and forces Armature modifiers or bone parenting."""
        for obj in list(bpy.data.objects):
            if obj.type == 'MESH':
                # Find the root armature in the hierarchy
                root = obj
                while root.parent: root = root.parent
                
                if root.type == 'ARMATURE':
                    rig = root
                    obj.hide_render = False
                    obj.hide_viewport = False
                    
                    # Armature Skinning logic
                    mod = next((m for m in obj.modifiers if m.type == 'ARMATURE'), None)
                    if not mod:
                        mod = obj.modifiers.new(name="Armature", type='ARMATURE')
                    mod.object = rig
                    
                    # Fix missing skinning: Auto-bind if no vertex groups exist
                    if len(rig.data.bones) > 1 and not obj.vertex_groups:
                        #print(f"DIRECTOR: Auto-binding {obj.name} to {rig.name} (Repairing Skinning)")
                        #bpy.context.view_layer.objects.active = obj
                        #bpy.ops.object.parent_set(type='ARMATURE_AUTO')
                        pass
                    
                    # Cleanup parenting transforms
                    if obj.parent == rig:
                        obj.matrix_parent_inverse = rig.matrix_world.inverted()
        
        # Polish ALL meshes in assets
        coll = bpy.data.collections.get(self.collection_name)
        if coll:
            for rig in [o for o in coll.objects if o.type == 'ARMATURE']:
                for mesh in [c for c in rig.children_recursive if c.type == 'MESH']:
                    self.polish_weights(mesh, rig)

    def polish_weights(self, mesh, rig):
        """Ensures weights are normalized to 1.0."""
        if not mesh or mesh.type != 'MESH': return
        bpy.context.view_layer.objects.active = mesh
        try:
            bpy.ops.object.mode_set(mode='OBJECT')
            bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
        except: pass

    def repair_materials(self):
        """Forces re-linking of materials to internal image data-blocks to solve pink blob issue."""
        print("DIRECTOR: Forcing texture re-link for all materials...")

        for mat in bpy.data.materials:
            if not mat.use_nodes: continue
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE':
                    # Search all loaded images for a match
                    for img in bpy.data.images:
                        img_name = img.name.lower()
                        # Direct match or partial match
                        if self._clean_mat_name(mat.name) in img_name or img_name in self._clean_mat_name(mat.name):
                            node.image = img
                            print(f"  - SUCCESS: Linked {mat.name} to {img.name}")
                            break

    def _clean_mat_name(self, name):
        """Helper to clean names for matching."""
        return name.split('.')[0].replace("_", "").lower()


