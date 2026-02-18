import json
import os

def generate_descriptive_audio_script(scene_map, intertitles):
    """Point 91: Descriptive Audio Script Generation."""
    script = []
    for scene, frames in scene_map.items():
        script.append({
            "start_frame": frames[0],
            "end_frame": frames[1],
            "description": f"Scene {scene} starts. Ambient atmosphere changes."
        })

    output_path = "renders/descriptive_audio.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump(script, f, indent=2)
    print(f"Descriptive audio script generated at {output_path}")

def export_subtitle_srt(intertitles):
    """Point 93: Subtitle Track Export with realistic timestamps."""
    srt_content = ""
    fps = 24
    for i, item in enumerate(intertitles):
        start_sec = item['start_frame'] / fps
        end_sec = item['end_frame'] / fps

        def format_time(seconds):
            h = int(seconds // 3600)
            m = int((seconds % 3600) // 60)
            s = int(seconds % 60)
            ms = int((seconds * 1000) % 1000)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

        srt_content += f"{i+1}\n{format_time(start_sec)} --> {format_time(end_sec)}\n{item['text']}\n\n"

    with open("renders/subtitles.srt", 'w') as f:
        f.write(srt_content)
    print("Subtitles exported to renders/subtitles.srt")

def embed_chapter_markers(scene_map):
    """Point 94: Scene Chapter Markers in Output Video (FFmpeg metadata)."""
    with open("renders/chapters.txt", 'w') as f:
        f.write(";FFMETADATA1\n")
        for scene, frames in scene_map.items():
            f.write(f"[CHAPTER]\nTIMEBASE=1/24\nSTART={frames[0]}\nEND={frames[1]}\ntitle={scene}\n\n")
    print("Chapter markers generated at renders/chapters.txt")
