import bpy
import style
from assets import brain_neuron

def animate_all_props(master):
    """Orchestrates animation and visibility for environmental props."""

    # 1. Greenhouse Sway and Visibility
    if hasattr(master, 'greenhouse') and master.greenhouse:
        for obj in master.greenhouse.objects:
            style.insert_looping_noise(obj, "rotation_euler", strength=0.01, scale=50.0, frame_start=1, frame_end=15000)

    gh_objs = [obj for obj in bpy.context.scene.objects
               if any(k in obj.name for k in ["GH_", "Greenhouse_Structure", "Pane", "Greenhouse_Main"])]
    gh_ranges = [(401, 650), (2901, 3500), (3901, 4100), (9501, 14500)]
    master._set_visibility(gh_objs, gh_ranges)

    # 2. Volumetric Light Beam
    if hasattr(master, 'beam') and master.beam:
        master._set_visibility([master.beam], [(401, 650), (3801, 4100), (4101, 4500)])

    # 3. Brain and Neuron Animation (Delegated to specialized module)
    brain_neuron.animate_brain_neuron(master)

    # 4. Specific Prop Animations
    if master.flower:
        # Mental Bloom growth
        master.flower.keyframe_insert(data_path="matrix_world", frame=2899)
        master.flower.scale = (0.01, 0.01, 0.01)
        master.flower.keyframe_insert(data_path="scale", frame=2900)
        master.flower.scale = (1, 1, 1)
        master.flower.keyframe_insert(data_path="scale", frame=3200)
