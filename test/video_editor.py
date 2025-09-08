#!/usr/bin/env python3
import argparse
import math
import os
import re
import shutil
import subprocess
import sys
from datetime import timedelta
from lxml import etree

# ----------------------------
# Config for your sample file
# ----------------------------
CONFIG = {
    # Silence detection
    "silence_threshold_db": -30,   # e.g., -30 dB
    "silence_min_d": 0.5,          # minimum silence duration in seconds

    # Track/playlist mapping (from your attached MLT)
    # Video tracks (V1..V6): map to playlist ids that hold the video entries
    "video_playlists": {
        "V1": "playlist6",   # main replacement video
        "V2": "playlist8",   # push to end
        "V3": "playlist10",  # push to end
        "V4": "playlist12",  # LOGO layer -> extend across full length
        "V5": "playlist14",  # push to end
        "V6": "playlist16",  # move last component to end
    },
    # Primary audio timeline playlist (A1)
    "audio_playlist": "playlist4",

    # The producer id for the LOGO image (to make sure we extend its out)
    "logo_producer_id": "producer1",  # from your file (greenhouse_mental_health_logo_change1.png)

    # Where to put intermediate files
    "work_dir": "_auto_edit_work"
}

# ----------------------------
# Helpers: time formatting
# ----------------------------
def to_smpte(seconds: float) -> str:
    if seconds < 0:
        seconds = 0.0
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def to_seconds(smpte: str) -> float:
    # Accept HH:MM:SS(.ms)
    parts = smpte.split(":")
    if len(parts) != 3:
        raise ValueError(f"Invalid SMPTE: {smpte}")
    h, m = int(parts[0]), int(parts[1])
    s = float(parts[2])
    return h*3600 + m*60 + s

# ----------------------------
# FFmpeg utilities
# ----------------------------
def run(cmd):
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{proc.stdout}")
    return proc.stdout

def ffprobe_duration(path) -> float:
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
               "-of", "default=noprint_wrappers=1:nokey=1", path]).strip()
    return float(out)

def detect_silence_points(input_video, thr_db, min_d):
    # Returns (start_trim, end_trim) in seconds based on leading/trailing silence
    log = run(["ffmpeg", "-i", input_video,
               "-af", f"silencedetect=noise={thr_db}dB:d={min_d}",
               "-f", "null", "-"])
    # Parse leading and trailing silence
    sil_starts = []
    sil_ends = []
    for line in log.splitlines():
        m1 = re.search(r"silence_start:\s*([0-9.]+)", line)
        m2 = re.search(r"silence_end:\s*([0-9.]+)", line)
        if m1:
            sil_starts.append(float(m1.group(1)))
        if m2:
            sil_ends.append(float(m2.group(1)))

    # Heuristic:
    # - Leading trim: first silence_end if silence starts near 0
    # - Trailing trim: last silence_start near the end
    duration = ffprobe_duration(input_video)

    start_trim = 0.0
    if sil_ends and "silence_start: 0" in log.replace(".000",""):
        start_trim = sil_ends[0]

    end_trim = duration
    if sil_starts:
        # choose last silence start that occurs late
        candidates = [t for t in sil_starts if t > duration*0.5]
        if candidates:
            end_trim = max(candidates)

    # Clamp
    start_trim = max(0.0, min(start_trim, duration))
    end_trim = max(start_trim, min(end_trim, duration))
    return start_trim, end_trim

def trim_leading_trailing(input_video, start_trim, end_trim, out_path):
    # Stream copy to preserve quality when possible
    run([
        "ffmpeg", "-y",
        "-i", input_video,
        "-ss", f"{start_trim:.3f}",
        "-to", f"{end_trim:.3f}",
        "-c", "copy",
        out_path
    ])

def remove_internal_silence(input_video, thr_db, min_d, out_path):
    # Remove internal silent gaps in audio while copying video
    run([
        "ffmpeg", "-y",
        "-i", input_video,
        "-af", f"silenceremove=start_periods=1:start_threshold={thr_db}dB:start_silence={min_d}:"
               f"stop_periods=1:stop_threshold={thr_db}dB:stop_silence={min_d}",
        "-c:v", "copy",
        out_path
    ])

def extract_audio(input_video, out_audio_path):
    run(["ffmpeg", "-y", "-i", input_video, "-vn", "-acodec", "copy", out_audio_path])

def clip_audio(input_audio, dur_s, out_audio_path):
    run(["ffmpeg", "-y", "-i", input_audio, "-t", f"{dur_s:.3f}", "-c", "copy", out_audio_path])

# ----------------------------
# XML (MLT) utilities
# ----------------------------
def load_xml(path):
    parser = etree.XMLParser(remove_blank_text=False)
    tree = etree.parse(path, parser)
    return tree

def save_xml(tree, path):
    tree.write(path, pretty_print=True, xml_declaration=True, encoding="utf-8")

def find_playlist(tree, playlist_id):
    xp = f"//playlist[@id='{playlist_id}']"
    node = tree.xpath(xp)
    return node[0] if node else None

def find_producer(tree, producer_id):
    xp = f"//producer[@id='{producer_id}']"
    node = tree.xpath(xp)
    return node[0] if node else None

def set_producer_resource(tree, producer_id, resource_path):
    prod = find_producer(tree, producer_id)
    if prod is None:
        raise ValueError(f"Producer {producer_id} not found")
    res = prod.xpath("./property[@name='resource']")
    if not res:
        # Some entries (chains) use <chain> with resource; support both
        res = prod.xpath("./property[@name='resource']")
    if res:
        res[0].text = resource_path
    else:
        # Create if missing
        prop = etree.Element("property", name="resource")
        prop.text = resource_path
        prod.append(prop)

def playlist_duration_seconds(pl):
    # Sum of entries (out - in); blanks count as their length
    total = 0.0
    for child in pl:
        if child.tag == "entry":
            in_s = to_seconds(child.get("in", "00:00:00.000"))
            out_s = to_seconds(child.get("out", "00:00:00.000"))
            total += max(0.0, out_s - in_s)
        elif child.tag == "blank":
            total += to_seconds(child.get("length"))
    return total

def entry_duration_seconds(entry):
    return to_seconds(entry.get("out","00:00:00.000")) - to_seconds(entry.get("in","00:00:00.000"))

def clamp_playlist_to_duration(pl, target_s):
    # Ensure total timeline length equals target_s by trimming/removing from the end,
    # or by adding leading blank (we’ll handle specific cases separately).
    current = playlist_duration_seconds(pl)
    if abs(current - target_s) < 0.001:
        return
    if current > target_s:
        # Trim from the end
        remaining = target_s
        new_children = []
        for child in pl:
            if child.tag == "entry":
                dur = entry_duration_seconds(child)
                if remaining <= 0:
                    continue
                if dur <= remaining + 1e-6:
                    new_children.append(child)
                    remaining -= dur
                else:
                    # trim this entry
                    new_out = to_smpte(to_seconds(child.get("in")) + remaining)
                    child.set("out", new_out)
                    new_children.append(child)
                    remaining = 0
            elif child.tag == "blank":
                dur = to_seconds(child.get("length"))
                if remaining <= 0:
                    continue
                if dur <= remaining + 1e-6:
                    new_children.append(child)
                    remaining -= dur
                else:
                    # shrink the blank
                    child.set("length", to_smpte(remaining))
                    new_children.append(child)
                    remaining = 0
        # Replace children
        for c in list(pl):
            pl.remove(c)
        for c in new_children:
            pl.append(c)
    else:
        # current < target_s: add a blank at the end (generic clamp)
        pad = etree.Element("blank")
        pad.set("length", to_smpte(target_s - current))
        pl.append(pad)

def add_leading_blank_to_push_content_to_end(pl, target_s):
    # Compute content length, then add a leading blank so its end aligns at target_s
    content_len = playlist_duration_seconds(pl)
    lead = max(0.0, target_s - content_len)
    # Clear existing leading blanks for deterministic result
    children = list(pl)
    while children and children[0].tag == "blank":
        pl.remove(children.pop(0))
    if lead > 0:
        blank = etree.Element("blank")
        blank.set("length", to_smpte(lead))
        pl.insert(0, blank)
    # Optionally trim if overflowed
    clamp_playlist_to_duration(pl, target_s)

def move_last_entry_to_end(pl, target_s):
    # Keep last "entry" and push it so its OUT == target_s. Remove other entries/blanks.
    entries = [c for c in pl if c.tag == "entry"]
    if not entries:
        # nothing to move, just clamp
        clamp_playlist_to_duration(pl, target_s)
        return
    last = entries[-1]
    dur = entry_duration_seconds(last)
    # New start for last entry:
    new_in = max(0.0, target_s - dur)
    # Rebuild playlist: leading blank then last entry trimmed/positioned
    for c in list(pl):
        pl.remove(c)
    lead = etree.Element("blank")
    lead.set("length", to_smpte(new_in))
    pl.append(lead)

    last.set("in", to_smpte(0.0))  # keep clip local in/out, playlist timing is via blanks
    last.set("out", to_smpte(dur))
    pl.append(last)
    # Final clamp (should be exact)
    clamp_playlist_to_duration(pl, target_s)

def replace_v1_with_processed_video(tree, v1_playlist_id, new_video_path, new_duration_s):
    pl = find_playlist(tree, v1_playlist_id)
    if pl is None:
        raise ValueError(f"Playlist {v1_playlist_id} not found")
    # Clear playlist, insert a single entry that spans the whole timeline from 0..T
    for c in list(pl):
        pl.remove(c)
    # We will reuse the existing producer that V1 was pointing to (first entry's producer),
    # but since entries reference producers by id, we need that id. If none, we create one.
    # Simpler: keep the original entry but update its in/out and ensure its producer's resource is updated.
    # If no original entry exists, we can create a new entry referencing a known video producer/chain.
    # Here we’ll create a new <entry> and assume the original video producer id existed on V1.
    # Find any previous entry to capture its producer ref:
    # If none found, we’ll fallback to a generic chain producer search.
    # For robustness across projects, we create a new "chain" producer that points to new_video_path.

    # Create a new chain producer
    new_chain_id = "auto_chain_v1"
    # If exists, remove and recreate
    for n in tree.xpath(f"//chain[@id='{new_chain_id}']"):
        n.getparent().remove(n)
    chain = etree.Element("chain", id=new_chain_id)
    prop_len = etree.Element("property", name="length")
    # rough frames = duration*fps (assume 30 fps if unknown)
    prop_len.text = str(int(round(new_duration_s * 30)))
    chain.append(prop_len)
    prop_res = etree.Element("property", name="resource")
    prop_res.text = new_video_path
    chain.append(prop_res)
    prop_srv = etree.Element("property", name="mlt_service")
    prop_srv.text = "avformat-novalidate"
    chain.append(prop_srv)
    # You can add more metadata if needed
    # Attach to root
    root = tree.getroot()
    root.append(chain)

    entry = etree.Element("entry")
    entry.set("producer", new_chain_id)
    entry.set("in", "00:00:00.000")
    entry.set("out", to_smpte(new_duration_s))
    pl.append(entry)

def duplicate_audio_after_existing_clip(tree, audio_playlist_id, source_audio_path, video_len_s):
    pl = find_playlist(tree, audio_playlist_id)
    if pl is None:
        raise ValueError(f"Audio playlist {audio_playlist_id} not found")

    # Build or reuse an audio producer for the duplicated audio
    dup_id = "auto_audio_dup"
    # Remove existing dup producer if present
    for n in tree.xpath(f"//producer[@id='{dup_id}']"):
        n.getparent().remove(n)

    prod = etree.Element("producer", id=dup_id)
    prop_len = etree.Element("property", name="length")
    prop_len.text = "2147483647"
    prop_res = etree.Element("property", name="resource")
    prop_res.text = source_audio_path
    prop_srv = etree.Element("property", name="mlt_service")
    prop_srv.text = "avformat-novalidate"
    prod.extend([prop_len, prop_res, prop_srv])
    tree.getroot().append(prod)

    # Determine current playlist duration before adding duplicate
    current_len = playlist_duration_seconds(pl)

    # Create an entry for the duplicate audio from 0..video_len_s (local in/out)
    dup_entry = etree.Element("entry")
    dup_entry.set("producer", dup_id)
    dup_entry.set("in", "00:00:00.000")
    dup_entry.set("out", to_smpte(video_len_s))

    # Append it after existing audio (contiguously).
    # If you need it strictly right-after existing content, just append; we’ll clamp later.
    pl.append(dup_entry)

    # Finally, clamp the audio playlist total timeline to exactly video_len_s
    clamp_playlist_to_duration(pl, video_len_s)

def extend_logo_for_duration(tree, logo_producer_id, v4_playlist_id, video_len_s):
    # Ensure the logo layer playlist spans full duration (either by repeating entries or a persistent entry)
    pl = find_playlist(tree, v4_playlist_id)
    if pl is None:
        # If playlist missing, nothing to do
        return
    # Strategy: add a blank at start if needed and clamp to T; if there is a single entry (logo image),
    # set its in/out to fill entire duration (some image producers can be held for long time).
    # Simplest robust approach: if playlist has at least one image entry, rebuild as a single held image entry.

    # Create a dedicated still-image producer entry
    # We will reference the existing producer1 (logo), but many timelines keep it in another playlist.
    # So just create a new entry pointing to producer1 that spans 0..T.

    # Clear existing
    for c in list(pl):
        pl.remove(c)
    entry = etree.Element("entry")
    entry.set("producer", logo_producer_id)
    entry.set("in", "00:00:00.000")
    entry.set("out", to_smpte(video_len_s))
    pl.append(entry)

def process(project_path, new_video_path, out_project_path):
    os.makedirs(CONFIG["work_dir"], exist_ok=True)

    # 1) Detect silence, trim start/end
    s_trim, e_trim = detect_silence_points(
        new_video_path,
        CONFIG["silence_threshold_db"],
        CONFIG["silence_min_d"]
    )
    trimmed = os.path.join(CONFIG["work_dir"], "trimmed.mp4")
    trim_leading_trailing(new_video_path, s_trim, e_trim, trimmed)

    # 2) Remove internal silence
    no_silence = os.path.join(CONFIG["work_dir"], "no_silence.mp4")
    remove_internal_silence(trimmed, CONFIG["silence_threshold_db"], CONFIG["silence_min_d"], no_silence)

    # 3) Compute final duration T
    T = ffprobe_duration(no_silence)

    # 4) Extract audio from no_silence for duplication
    audio_full = os.path.join(CONFIG["work_dir"], "audio_full.aac")
    extract_audio(no_silence, audio_full)

    # 5) Clip audio to T (safety)
    audio_clip = os.path.join(CONFIG["work_dir"], "audio_clip.aac")
    clip_audio(audio_full, T, audio_clip)

    # 6) Load Kdenlive project XML
    tree = load_xml(project_path)

    # 7) Replace V1 content with processed video and move to start (0..T)
    replace_v1_with_processed_video(tree, CONFIG["video_playlists"]["V1"], no_silence, T)

    # 8) Extend logo (V4) across full duration
    extend_logo_for_duration(tree, CONFIG["logo_producer_id"], CONFIG["video_playlists"]["V4"], T)

    # 9) Push V2, V3, V5 content to end (so they finish at T)
    for vkey in ("V2", "V3", "V5"):
        pl = find_playlist(tree, CONFIG["video_playlists"][vkey])
        if pl is not None:
            add_leading_blank_to_push_content_to_end(pl, T)

    # 10) Move the last component on V6 to end at T
    pl_v6 = find_playlist(tree, CONFIG["video_playlists"]["V6"])
    if pl_v6 is not None:
        move_last_entry_to_end(pl_v6, T)

    # 11) Duplicate audio after existing audio, then clamp/remove anything beyond T
    duplicate_audio_after_existing_clip(tree, CONFIG["audio_playlist"], audio_clip, T)

    # 12) Save updated project
    save_xml(tree, out_project_path)

    print(f"Updated project saved to: {out_project_path}")
    print(f"Processed video length: {T:.3f}s")
    print("You can render with:")
    print(f"  kdenlive_render --project \"{out_project_path}\" --render \"final.mp4\" --profile=MP4-H264/AAC")
    print("…or:")
    print(f"  melt \"{out_project_path}\" -consumer avformat:final.mp4 vcodec=libx264 acodec=aac")

def main():
    ap = argparse.ArgumentParser(description="Automate Kdenlive project: silence trim, replace V1, push layers to end, duplicate audio, clamp to V1 length.")
    ap.add_argument("--project", required=True, help="Path to .kdenlive (MLT) project")
    ap.add_argument("--new-video", required=True, help="Path to new raw video to process")
    ap.add_argument("--out-project", required=True, help="Path to save updated .kdenlive")
    ap.add_argument("--silence-threshold-db", type=float, default=CONFIG["silence_threshold_db"])
    ap.add_argument("--silence-min-d", type=float, default=CONFIG["silence_min_d"])
    args = ap.parse_args()

    CONFIG["silence_threshold_db"] = args.silence_threshold_db
    CONFIG["silence_min_d"] = args.silence_min_d

    process(args.project, args.new_video, args.out_project)

if __name__ == "__main__":
    main()
