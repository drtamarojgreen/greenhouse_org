import bpy
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from silent_movie_generator import MovieMaster

def render_qa_stills():
    """
    Renders 18 specific audit stills as defined in Section 7 of the Pre-Render Test Plan.
    These frames are chosen to highlight critical narrative, technical, and artistic transitions.
    """
    
    # Audit frames from Section 7 of test_plan.md
    frames_to_render = [
        (50, "Branding_S00"),
        (150, "Intro_Establishing_S01"),
        (300, "Brain_Scene_S02"),
        (450, "Garden_Wide_S02"),
        (575, "Garden_Closeup_S02"),
        (850, "Socratic_Dialogue_S03"),
        (1150, "Knowledge_Exchange_S04"),
        (1700, "Synaptic_Bridge_S05"),
        (2250, "Shadow_Antagonist_S07"),
        (2450, "Gnome_Closeup_S07_S08"),
        (2700, "Library_S09"),
        (3650, "Futuristic_Lab_S10"),
        (4000, "Sanctuary_S11"),
        (4450, "Finale_S_Finale"),
        (9600, "Dialogue_Closeup_S16"),
        (11200, "Gnome_Reaction_S18"),
        (13900, "Retreat_Mid_Sprint_S22"),
        (14800, "Credits_S12"),
    ]

    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "renders", "qa_audit")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print("="*60)
    print("GREENHOUSE MD: QA STILL GENERATOR")
    print(f"Output Directory: {output_dir}")
    print("="*60)

    # Initialize and build the scene
    print("\n[1/3] Initializing Movie Master & Building Scene...")
    master = MovieMaster(mode='SILENT_FILM')
    master.run()

    # Configure render settings for fast audit
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 32  # Low samples for quick visual check
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    
    # Ensure high clip end for drone shots as per plan 2.1.6
    if scene.camera:
        scene.camera.data.clip_end = 1000.0

    print("\n[2/3] Starting Audit Render Sequence...")
    for frame, name in frames_to_render:
        scene.frame_set(frame)
        
        # Format filename
        filename = f"qa_f{frame:05d}_{name}.png"
        filepath = os.path.join(output_dir, filename)
        scene.render.filepath = filepath
        
        print(f" >> Rendering Frame {frame:<5} | Scene: {name}")
        
        # Render the frame
        # We use a try-except to catch any frame-specific logic failures
        try:
            bpy.ops.render.render(write_still=True)
        except Exception as e:
            print(f" [!] ERROR rendering frame {frame}: {e}")

    print("\n[3/3] Audit Complete.")
    print("="*60)
    print(f"STILLS SAVED TO: {output_dir}")
    print("PLEASE REVIEW THESE BEFORE COMMITTING TO PRODUCTION RENDER.")
    print("="*60)

if __name__ == "__main__":
    render_qa_stills()
