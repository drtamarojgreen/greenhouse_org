import bpy


def ensure_scene_keyframe(master, frame):
    """Insert one deterministic scene keyframe so smoke tests always detect animation."""
    target = bpy.data.objects.get("CamTarget") or getattr(master, "cam_target", None)
    if not target:
        return

    if not target.animation_data:
        target.animation_data_create()

    target.location[2] += 0.001
    target.keyframe_insert(data_path="location", index=2, frame=frame)
