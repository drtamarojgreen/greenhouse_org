import xml.etree.ElementTree as ET
from pathlib import Path
import config_loader
import mlt_utils

# Fallback configuration
CONFIG = {
    "film_title":        "The Greenhouse",
    "year":              2026,
    "fps":               25,
    "width":             1920,
    "height":            1080,
    "output_dir":        "output",
    "credits_scroll_duration": 90,
    "background_black":  "#000000",
}

def generate_final_credits(config_path=None):
    """Generates the final_credits.kdenlive XML file using kdenlivetitle."""
    try:
        full_config = config_loader.load_config(config_path)
        prod_cfg = config_loader.get_production_settings(full_config)
        credits_cfg = config_loader.get_credits_config(full_config)
    except Exception as e:
        print(f"Warning: Configuration loading failed ({e}). Using hardcoded defaults.")
        prod_cfg = CONFIG
        credits_cfg = {
            "duration": 90, "background": "#000000",
            "font": {"family": "DejaVu Sans", "size": 36, "weight": 50},
            "cast": {"Herbaceous": "AI", "Arbor": "AI", "GloomGnome": "AI"},
            "crew": [{"role": "PRODUCER", "name": "Tamaro Green"}],
            "scroll": {"text_height": 3000, "geometry": "0=0/1080:1920x3000:100; 2249=0/-3000:1920x3000:100"}
        }

    width, height, fps = prod_cfg["width"], prod_cfg["height"], prod_cfg["fps"]
    duration_frames = credits_cfg["duration"] * fps

    root = mlt_utils.create_mlt_root("main_tractor")
    mlt_utils.add_profile(root, width, height, fps)

    # Background
    mlt_utils.add_color_producer(root, "bg", credits_cfg["background"], duration_frames - 1)

    # Content construction
    content = "CAST\n\n"
    for char, actor in credits_cfg.get("cast", {}).items():
        content += f"{char.ljust(20)}  {actor}\n"
    content += "\n\n"
    for member in credits_cfg.get("crew", []):
        content += f"{member['role']}\n{member['name']}\n\n"

    content += f"{prod_cfg.get('film_title', 'The Greenhouse')}\n\n"
    content += f"© {prod_cfg.get('year', 2026)} GreenhouseMD Production Studio\nAll rights reserved."

    # Title XML
    title_xml = ET.Element("kdenlivetitle", {"width": str(width), "height": str(height), "out": str(duration_frames - 1)})
    item = ET.SubElement(title_xml, "item", {"z-index": "0", "type": "QGraphicsTextItem"})
    ET.SubElement(item, "content").text = content
    f_cfg = credits_cfg.get("font", {})
    ET.SubElement(item, "font", {"family": f_cfg.get("family", "DejaVu Sans"), "size": str(f_cfg.get("size", 36)), "weight": str(f_cfg.get("weight", 50))})
    ET.SubElement(item, "font-color", {"red": "255", "green": "255", "blue": "255", "alpha": "255"})
    
    xmldata = ET.tostring(title_xml, encoding="utf-8").decode("utf-8")

    # Producer for title
    prod = ET.SubElement(root, "producer", {"id": "credits_text", "in": "0", "out": str(duration_frames - 1)})
    ET.SubElement(prod, "property", {"name": "mlt_service"}).text = "kdenlivetitle"
    ET.SubElement(prod, "property", {"name": "xmldata"}).text = xmldata
    ET.SubElement(prod, "property", {"name": "geometry"}).text = credits_cfg["scroll"]["geometry"]

    # Tractor
    tractor = mlt_utils.add_tractor(root, "main_tractor", duration_frames - 1)
    mlt_utils.add_track(tractor, "bg")
    mlt_utils.add_track(tractor, "credits_text")
    mlt_utils.add_transition(tractor, "composite", 0, 1, 0, duration_frames - 1)

    # Filters
    if "filters" in credits_cfg:
        for f in credits_cfg["filters"]:
            props = {k: v for k, v in f.items() if k != "type"}
            mlt_utils.add_filter(tractor, f["type"], props)
    else:
        mlt_utils.add_filter(tractor, "oldfilm")

    output_dir = Path(__file__).parent / prod_cfg["output_dir"]
    output_dir.mkdir(exist_ok=True)
    with open(output_dir / "final_credits.kdenlive", "wb") as f:
        f.write(b'<?xml version="1.0" encoding="utf-8"?>\n')
        f.write(ET.tostring(root, encoding="utf-8"))

    print(f"[credits] final_credits.kdenlive written — {duration_frames} frames")

if __name__ == "__main__":
    generate_final_credits()
