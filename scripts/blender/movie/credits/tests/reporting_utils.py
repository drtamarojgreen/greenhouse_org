import re

def parse_geometry(geom_string):
    """
    Parses an MLT geometry string like:
    '0=10%/40%:80%x30%:0; 50=0/40%:100%x30%:100'
    Returns a list of keyframes.
    Each keyframe is a dict: {frame, x, y, w, h, opacity}
    """
    keyframes = []
    if not geom_string:
        return keyframes

    parts = geom_string.split(';')
    for part in parts:
        part = part.strip()
        if not part:
            continue

        match = re.match(r"(\d+)=([^/]+)/([^:]+):([^x]+)x([^:]+):(\d+)", part)
        if match:
            keyframes.append({
                "frame": int(match.group(1)),
                "x": match.group(2),
                "y": match.group(3),
                "w": match.group(4),
                "h": match.group(5),
                "opacity": int(match.group(6))
            })
    return keyframes

def extract_pango_text(markup):
    """Simple extractor for text from pango markup span."""
    if not markup:
        return ""
    match = re.search(r">([^<]+)<", markup)
    return match.group(1) if match else markup

def hex_to_rgb(hex_color):
    """Converts #RRGGBB or #RGB to (r, g, b) in 0.0-1.0."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join([c*2 for c in hex_color])
    r, g, b = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    return r/255.0, g/255.0, b/255.0

def get_luminance(r, g, b):
    def to_linear(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    rl = to_linear(r)
    gl = to_linear(g)
    bl = to_linear(b)
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl

def get_contrast_ratio(color1, color2):
    if isinstance(color1, str):
        if color1.lower() == 'white': color1 = '#ffffff'
        if color1.lower() == 'black': color1 = '#000000'
        color1 = hex_to_rgb(color1)
    if isinstance(color2, str):
        if color2.lower() == 'white': color2 = '#ffffff'
        if color2.lower() == 'black': color2 = '#000000'
        color2 = hex_to_rgb(color2)
    l1 = get_luminance(*color1)
    l2 = get_luminance(*color2)
    if l1 < l2: l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)

def parse_pango_color(markup):
    match = re.search(r'foreground="([^"]+)"', markup)
    return match.group(1) if match else "white"

def resolve_to_pixels(value, max_val):
    """Resolves a value (int string or percentage string) to pixels."""
    value = str(value).strip()
    if value.endswith('%'):
        pct = float(value.rstrip('%')) / 100.0
        return int(pct * max_val)
    try:
        return int(value)
    except ValueError:
        return 0

def is_on_screen(x, y, w, h, screen_w=1920, screen_h=1080):
    """Returns True if the box is within the screen boundaries."""
    # Resolve values to pixels first
    rx = resolve_to_pixels(x, screen_w)
    ry = resolve_to_pixels(y, screen_h)
    rw = resolve_to_pixels(w, screen_w)
    rh = resolve_to_pixels(h, screen_h)

    # We allow the box to be slightly off screen if it's intentional (like scroll)
    # but for header text, we expect it to be within boundaries.
    return (rx >= 0 and ry >= 0 and (rx + rw) <= screen_w and (ry + rh) <= screen_h)

def parse_pango_markup_size(markup):
    """Extracts font size from pango markup (divided by 1024)."""
    match = re.search(r'size="(\d+)"', markup)
    return int(int(match.group(1)) / 1024) if match else 0
