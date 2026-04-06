import bpy
import config

def switch_camera(camera_obj, frame):
    """Marker-based camera switching for Scene 4."""
    if not camera_obj: return
    scene = bpy.context.scene
    marker_name = f"Switch_{camera_obj.name}_{frame}"
    marker = scene.timeline_markers.new(marker_name, frame=frame)
    marker.camera = camera_obj

def setup_dialogue_camera_switching(dialogue_lines, camera_map):
    """
    Automates camera switching based on the speaker.
    Debug Mode: Frames 1 and 2 show the OTS cameras.
    """
    # Debug OTS views (User requested to see them in frames 1 and 2)
    if config.CHAR_HERBACEOUS in camera_map:
        switch_camera(camera_map[config.CHAR_HERBACEOUS], 1)
    if config.CHAR_ARBOR in camera_map:
        switch_camera(camera_map[config.CHAR_ARBOR], 2)
    
    # Baseline for rest of scene
    switch_camera(camera_map.get("WIDE"), 3)
    
    for line in dialogue_lines:
        speaker = line["speaker_id"]
        start_frame = line["start_frame"]
        
        # Switch to speaker's CU (offset by -12 frames for reaction)
        cam = camera_map.get(speaker, camera_map.get("WIDE"))
        switch_camera(cam, max(3, start_frame - 12))
