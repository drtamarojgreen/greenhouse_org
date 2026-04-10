import bpy
import os
import time
import config
from asset_manager_v6 import SylvanEnsembleManager

class DialogueSceneV6:
    """Manages character interaction and animation for Scene 6."""
    
    def __init__(self, characters, dialogue_lines):
        self.characters = characters 
        self.dialogue_lines = dialogue_lines
        self.asset_manager = SylvanEnsembleManager()

    def setup_scene(self, cameras=None, use_fbx=False):
        """Assembles the production scene with modular managers."""
        start_t = time.time()
        print("\n[DIAGNOSTIC] Commencing Scene 6 Production Assembly...")
        
        # 1. Assets (The Sylvan Ensemble)
        if use_fbx:
            self.asset_manager.import_fbx_ensemble()
        else:
            self.asset_manager.link_ensemble()

        self.asset_manager.renormalize_objects()
        self.asset_manager.repair_materials()
        
        # 2. Dialogue & Keyframing
        self.apply_dialogue_sequence()
        
        print(f"[DIAGNOSTIC] Scene 6 assembly complete in {time.time() - start_t:.2f}s")

    def apply_dialogue_sequence(self):
        """Maps dialogue lines to character armatures."""
        print(f"[DIAGNOSTIC] Applying dialogue sequence for {len(self.dialogue_lines)} lines...")
        for line in self.dialogue_lines:
            c_id = line["speaker_id"]
            char_info = self.characters.get(c_id)
            if not char_info: continue
            
            rig = bpy.data.objects.get(char_info["rig_name"])
            if not rig: continue
            
            # Keyframe active visibility/transforms during speaking block
            rig.keyframe_insert(data_path="location", frame=line["start_frame"])
            rig.keyframe_insert(data_path="location", frame=line["end_frame"])

    def _link_spirit_assets(self):
        """Regression wrapper for asset manager's linking sequence."""
        from generate_scene6 import standardize_ensemble_heights
        from director_v6 import SylvanDirector

        self.asset_manager.link_ensemble()
        self.asset_manager.renormalize_objects()
        self.asset_manager.repair_materials()
        standardize_ensemble_heights()

        # Position characters to satisfy spatial audits in tests
        director = SylvanDirector()
        director.position_protagonists()
        director.compose_ensemble()
