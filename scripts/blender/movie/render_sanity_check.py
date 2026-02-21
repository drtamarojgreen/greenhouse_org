import bpy
import os
import sys
from constants import SCENE_MAP

def get_luminance(color):
    # Standard luminance formula
    return 0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]

def check_luminance():
    print("--- Greenhouse Render Sanity Gate ---")
    scene = bpy.context.scene
    world = scene.world
    
    # We'll check the mid-frame of each scene
    passed_all = True
    for name, (start, end) in SCENE_MAP.items():
        mid = (start + end) // 2
        scene.frame_set(mid)
        
        # 1. World Background
        bg_node = world.node_tree.nodes.get("Background")
        bg_lum = 0
        if bg_node:
            bg_color = bg_node.inputs[0].default_value
            bg_lum = get_luminance(bg_color)
            
        # 2. Total Light Energy
        total_light_energy = 0
        for obj in scene.objects:
            if obj.type == 'LIGHT' and not obj.hide_render:
                energy = obj.data.energy
                # Area lights might have different units, but we'll use a simple sum for now
                total_light_energy += energy * get_luminance(obj.data.color)
        
        # 3. Compositor check (Vignette)
        tree = scene.compositing_node_group
        vig_factor = 0
        if tree:
            vig_node = tree.nodes.get("Vignette")
            if vig_node:
                # Factor input is usually [0]
                vig_factor = vig_node.inputs[0].default_value
        
        # Heuristic score
        # Very rough: bg_lum + total_light_energy / 10000
        # If score < 0.05, it's probably too dark
        score = bg_lum + (total_light_energy / 20000.0)
        
        # If high vignette, reduce score
        if vig_factor > 0.8:
            score *= 0.5
            
        status = "PASS" if score > 0.02 else "FAIL"
        if status == "FAIL": passed_all = False
        
        print(f"Scene {name:<20}: Score {score:.4f} -> {status}")

    if passed_all:
        print("\nOVERALL SANITY: PASSED")
        return 0
    else:
        print("\nOVERALL SANITY: FAILED (Possible underexposure detected)")
        return 1

if __name__ == "__main__":
    # Add script dir to path for constants
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    sys.exit(check_luminance())
