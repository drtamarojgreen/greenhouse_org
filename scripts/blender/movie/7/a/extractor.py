import bpy
import os
import sys
import json
import shutil

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from asset_manager import AssetManager

class AssetExtractor:
    """OO Asset Extractor for Phase A, matching Movie 6 decoupling standards."""

    def __init__(self, config_path):
        with open(config_path, 'r') as f:
            self.cfg = json.load(f)
        self.manager = AssetManager()
        self.output_dir = self.cfg["export"]["output_dir"]
        os.makedirs(self.output_dir, exist_ok=True)
        # Load decimation policy if exists
        self.policy_path = os.path.join(M7_ROOT, "decimate_policy.json")
        self.policy = {}
        if os.path.exists(self.policy_path):
            with open(self.policy_path, 'r') as f: self.policy = json.load(f)

    def run(self):
        print("PHASE A: OO MODULAR ASSET EXTRACTION")
        self.manager.clear_scene()

        for source in self.cfg["sources"]:
            self._process_source(source)

        self._decouple_textures()
        print("PHASE A COMPLETE.")

    def _process_source(self, source):
        path, mapping = source["path"], source["mapping"]
        targets = []
        for mesh_name, info in mapping.items():
            targets.append(mesh_name)
            if info.get("rig") and info["rig"] not in targets: targets.append(info["rig"])

        objs = self.manager.link_assets(path, targets)
        processed_objs = set()

        for mesh_src, info in mapping.items():
            char_id, rig_src, is_prot = info["id"], info.get("rig"), info.get("is_protagonist", False)
            body = next((o for o in objs if o.name.startswith(mesh_src)), None)
            rig = next((o for o in objs if rig_src and o.name.startswith(rig_src)), None)

            if not body and not rig: continue

            if rig and rig in processed_objs:
                new_rig = rig.copy(); new_rig.data = rig.data.copy()
                bpy.context.scene.collection.objects.link(new_rig); rig = new_rig
                if body:
                    mod = next((m for m in body.modifiers if m.type == 'ARMATURE'), None)
                    if mod: mod.object = rig

            sep = "_" if is_prot else "."
            if rig: rig.name = f"{char_id}{sep}Rig"; processed_objs.add(rig)
            if body and body not in processed_objs:
                body.name = f"{char_id}{sep}Body"
                processed_objs.add(body)
                self._apply_decimation(body, mesh_src)

            self._export_character(char_id, body, rig)

    def _apply_decimation(self, obj, src_name):
        if not self.policy: return
        ratio = self.policy.get("per_object", {}).get(src_name, {}).get("ratio", self.policy.get("default_ratio", 1.0))
        if ratio < 1.0 and len(obj.data.vertices) > self.policy.get("min_vertices", 0):
            mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
            mod.ratio = ratio
            if self.policy.get("apply_modifier", True):
                bpy.context.view_layer.objects.active = obj
                bpy.ops.object.modifier_apply(modifier=mod.name)

    def _decouple_textures(self):
        print(f"Decoupling textures to: {self.output_dir}")
        for obj in bpy.data.objects:
            if not hasattr(obj.data, "materials"): continue
            for mat in obj.data.materials:
                if not mat or not mat.use_nodes: continue
                for node in mat.node_tree.nodes:
                    if node.type == 'TEX_IMAGE' and node.image:
                        src = bpy.path.abspath(node.image.filepath)
                        if os.path.exists(src):
                            dest = os.path.join(self.output_dir, os.path.basename(src))
                            if not os.path.exists(dest): shutil.copy2(src, dest)

    def _export_character(self, char_id, body, rig):
        fbx_path = os.path.join(self.output_dir, f"{char_id}.fbx")
        bpy.ops.object.select_all(action='DESELECT')
        if body:
            body.select_set(True)
            for c in body.children_recursive: c.select_set(True)
        if rig:
            rig.select_set(True)
            for c in rig.children_recursive: c.select_set(True)
            bpy.context.view_layer.objects.active = rig
        try:
            bpy.ops.export_scene.fbx(filepath=fbx_path, **self.cfg["export"]["params"])
            print(f"  SUCCESS: {char_id} -> {fbx_path}")
        except Exception as e: print(f"  ERROR: Export failed for {char_id}: {e}")
