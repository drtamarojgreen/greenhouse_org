import xml.etree.ElementTree as ET

def create_mlt_root(producer_id="main_tractor"):
    """Creates the root MLT element."""
    return ET.Element("mlt", {
        "LC_NUMERIC": "C",
        "version": "7.22.0",
        "producer": producer_id
    })

def add_profile(root, width, height, fps):
    """Adds a profile element to the MLT root."""
    return ET.SubElement(root, "profile", {
        "description": f"atsc_{height}p_{fps}",
        "width": str(width),
        "height": str(height),
        "frame_rate_num": str(fps),
        "frame_rate_den": "1",
        "progressive": "1"
    })

def add_color_producer(root, id, color, out_frame):
    """Adds a color producer (background)."""
    prod = ET.SubElement(root, "producer", {"id": id, "in": "0", "out": str(out_frame)})
    ET.SubElement(prod, "property", {"name": "mlt_service"}).text = "color"
    ET.SubElement(prod, "property", {"name": "resource"}).text = color
    return prod

def add_pango_producer(root, id, text, size, weight="normal", out_frame=100, width=1920):
    """Adds a pango text producer."""
    prod = ET.SubElement(root, "producer", {"id": id, "in": "0", "out": str(out_frame)})
    ET.SubElement(prod, "property", {"name": "mlt_service"}).text = "pango"
    ET.SubElement(prod, "property", {"name": "align"}).text = "centre"
    markup = f'<span font_family="DejaVu Sans" foreground="white" weight="{weight}" size="{size*1024}">{text}</span>'
    ET.SubElement(prod, "property", {"name": "markup"}).text = markup
    ET.SubElement(prod, "property", {"name": "width"}).text = str(width)
    ET.SubElement(prod, "property", {"name": "height"}).text = str(size * 3)
    return prod

def add_tractor(root, id, out_frame=None):
    """Adds a tractor element."""
    attrs = {"id": id}
    if out_frame is not None:
        attrs["out"] = str(out_frame)
    return ET.SubElement(root, "tractor", attrs)

def add_track(tractor, producer_id=None, in_frame=None, out_frame=None):
    """Adds a track to a tractor."""
    track = ET.SubElement(tractor, "track")
    if producer_id:
        track.set("producer", producer_id)
    return track

def add_transition(tractor, service, a_track, b_track, in_frame=None, out_frame=None, geometry=None):
    """Adds a transition to a tractor."""
    attrs = {}
    if in_frame is not None: attrs["in"] = str(in_frame)
    if out_frame is not None: attrs["out"] = str(out_frame)

    trans = ET.SubElement(tractor, "transition", attrs)
    ET.SubElement(trans, "property", {"name": "mlt_service"}).text = service
    ET.SubElement(trans, "property", {"name": "a_track"}).text = str(a_track)
    ET.SubElement(trans, "property", {"name": "b_track"}).text = str(b_track)
    if geometry:
        ET.SubElement(trans, "property", {"name": "geometry"}).text = geometry
    return trans

def add_filter(tractor, service, properties=None):
    """Adds a filter to a tractor."""
    filt = ET.SubElement(tractor, "filter")
    ET.SubElement(filt, "property", {"name": "mlt_service"}).text = service
    if properties:
        for name, value in properties.items():
            ET.SubElement(filt, "property", {"name": name}).text = str(value)
    return filt
