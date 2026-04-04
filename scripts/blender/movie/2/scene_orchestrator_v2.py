import bpy
import constants

def orchestrate_v2(master):
    """
    Main Orchestration Loop for the Reboot.
    NO LEGACY CODE: 100% New scene handling.
    """
    # 1. Load Permanent Assets
    from assets import vault_geom, seed_logic, liana_guardian
    
    master.vault = vault_geom.create_vault_structure()
    master.seedling = seed_logic.create_seedling()
    master.blight = seed_logic.create_blight_blob(location=(3, 3, 0))
    master.liana = liana_guardian.create_guardian(location=(-5, -5, 0))
    
    # 2. Setup Visibility (Clean Frame Ranges)
    master.apply_visibility_transition(master.seedling, 1, constants.TOTAL_FRAMES)
    master.apply_visibility_transition(master.blight, 1, 6000)
    master.apply_visibility_transition(master.liana, 1501, constants.TOTAL_FRAMES)
    
    # 3. Trigger Scene Logic
    from scenes import s01_the_seed, s02_guardian_run, s03_the_bloom
    
    s01_the_seed.setup_scene(master)
    s02_guardian_run.setup_scene(master)
    s03_the_bloom.setup_scene(master)
    
    print("Orchestration 2.0 Complete.")
