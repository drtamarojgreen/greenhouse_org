import xml.etree.ElementTree as ET
from pathlib import Path
import config_loader
import mlt_utils

# Fallback config if yaml loading fails or for easy access in tests
CONFIG = {
    "film_title":        "The Greenhouse",
    "studio_name":       "GreenhouseMD Production Studio",
    "co_production":     "GreenhouseMD / GreenhouseMHD Production",
    "year":              2026,
    "fps":               25,
    "width":             1920,
    "height":            1080,
    "output_dir":        "output",
    "header_segment_a_duration": 12,
    "header_segment_b_duration": 15,
    "header_segment_c_duration": 15,
    "background_dark":   "#1a1a1a",
    "background_black":  "#000000",
}

def generate_header(config_path=None):
    # Load configuration
    try:
        full_config = config_loader.load_config(config_path)
        prod_cfg = config_loader.get_production_settings(full_config)
        header_cfg = config_loader.get_header_config(full_config)
    except Exception as e:
        print(f"Warning: Configuration loading failed ({e}). Using hardcoded defaults.")
        prod_cfg = CONFIG
        header_cfg = {
            "segments": {
                "a": {"duration": 12, "background": "#1a1a1a", "text": [
                    {"id": "a1", "content": "GreenhouseMD", "size": 120, "weight": "bold", "geometry": "0=10%/40%:80%x30%:0; 50=0/40%:100%x30%:100"},
                    {"id": "a2", "content": "Production Studio", "size": 48, "weight": "normal", "geometry": "0=0/60%:100%x10%:0; 75=0/60%:100%x10%:100"}
                ]},
                "b": {"duration": 15, "background": "#000000", "text": [
                    {"id": "b1", "content": "GreenhouseMD Production Studio presents...\nA GreenhouseMD / GreenhouseMHD Production", "size": 60, "weight": "normal", "geometry": "0=0/44%:100%x30%:0; 25=0/44%:100%x30%:100; 374=0/42%:100%x30%:100"}
                ]},
                "c": {"duration": 15, "background": "#000000", "text": [
                    {"id": "c_title", "content": "The Greenhouse", "size": 144, "weight": "bold", "geometry": "0=0/30%:100%x40%:100"}
                ]}
            }
        }

    width, height, fps = prod_cfg["width"], prod_cfg["height"], prod_cfg["fps"]
    root = mlt_utils.create_mlt_root("main_tractor")
    mlt_utils.add_profile(root, width, height, fps)

    overlap = fps
    durations = {k: v["duration"] * fps for k, v in header_cfg["segments"].items()}
    
    # Producers
    for seg_id, seg_cfg in header_cfg["segments"].items():
        dur_frames = durations[seg_id]
        mlt_utils.add_color_producer(root, f"bg_{seg_id}", seg_cfg["background"], dur_frames - 1)
        for t in seg_cfg["text"]:
            mlt_utils.add_pango_producer(root, t["id"], t["content"], t["size"], t["weight"], dur_frames, width)

    # Segment Tractors
    for seg_id, seg_cfg in header_cfg["segments"].items():
        dur_frames = durations[seg_id]
        tractor = mlt_utils.add_tractor(root, f"tractor_{seg_id}", dur_frames - 1)
        mlt_utils.add_track(tractor, f"bg_{seg_id}")
        for i, t in enumerate(seg_cfg["text"]):
            mlt_utils.add_track(tractor, t["id"])
            mlt_utils.add_transition(tractor, "composite", 0, i + 1, 0, dur_frames - 1, t["geometry"])

    # Main Assembly (Optimized for standard A-B-C structure)
    if all(k in durations for k in ["a", "b", "c"]):
        total_dur = durations["a"] + (durations["b"] - overlap) + durations["c"]
        main_tractor = mlt_utils.add_tractor(root, "main_tractor", total_dur - 1)

        playlist0 = mlt_utils.add_track(main_tractor)
        ET.SubElement(playlist0, "entry", {"producer": "tractor_a", "in": "0", "out": str(durations["a"] - 1)})
        ET.SubElement(playlist0, "blank", {"length": str(durations["b"] - overlap)})
        ET.SubElement(playlist0, "entry", {"producer": "tractor_c", "in": "0", "out": str(durations["c"] - 1)})

        playlist1 = mlt_utils.add_track(main_tractor)
        ET.SubElement(playlist1, "blank", {"length": str(durations["a"] - overlap)})
        ET.SubElement(playlist1, "entry", {"producer": "tractor_b", "in": "0", "out": str(durations["b"] - 1)})

        # Transitions
        mlt_utils.add_transition(main_tractor, "luma", 0, 1, durations["a"] - overlap, durations["a"])
        mlt_utils.add_transition(main_tractor, "luma", 1, 0, durations["a"] + durations["b"] - overlap, durations["a"] + durations["b"])
    else:
        # Fallback for custom segment structures
        total_dur = sum(durations.values())
        main_tractor = mlt_utils.add_tractor(root, "main_tractor", total_dur - 1)
        for seg_id in sorted(durations.keys()):
            track = mlt_utils.add_track(main_tractor)
            ET.SubElement(track, "entry", {"producer": f"tractor_{seg_id}", "in": "0", "out": str(durations[seg_id] - 1)})

    # Global filters
    if "filters" in header_cfg:
        for f in header_cfg["filters"]:
            props = {k: v for k, v in f.items() if k != "type"}
            mlt_utils.add_filter(main_tractor, f["type"], props)
    else:
        mlt_utils.add_filter(main_tractor, "frei0r.glow", {"blur": "0.02"})

    output_dir = Path(__file__).parent / prod_cfg["output_dir"]
    output_dir.mkdir(exist_ok=True)
    with open(output_dir / "header.kdenlive", "wb") as f:
        f.write(b'<?xml version="1.0" encoding="utf-8"?>\n')
        f.write(ET.tostring(root, encoding="utf-8"))
    print(f"[credits] header.kdenlive written")

if __name__ == "__main__":
    generate_header()
