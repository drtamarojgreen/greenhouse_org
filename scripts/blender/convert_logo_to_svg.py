
import os
from PIL import Image
from potrace import Bitmap

def convert_png_to_svg(png_path, svg_path):
    """
    Converts a PNG image to an SVG file using the potracer library.
    """
    if not os.path.exists(png_path):
        print(f"Error: Input PNG file not found at {png_path}")
        return False

    try:
        image = Image.open(png_path)
    except IOError:
        print(f"Error: Could not open image file at {png_path}")
        return False

    bm = Bitmap(image)
    plist = bm.trace()

    width, height = image.size
    svg_content = f'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'

    for path in plist:
        svg_content += '<path d="'
        start_x = path.start_point.x
        start_y = path.start_point.y
        svg_content += f'M{start_x},{start_y}'

        for segment in path:
            end_x = segment.end_point.x
            end_y = segment.end_point.y
            if segment.is_corner:
                cx = segment.c.x
                cy = segment.c.y
                svg_content += f'L{cx},{cy}L{end_x},{end_y}'
            else:
                c1x = segment.c1.x
                c1y = segment.c1.y
                c2x = segment.c2.x
                c2y = segment.c2.y
                svg_content += f'C{c1x},{c1y} {c2x},{c2y} {end_x},{end_y}'
        svg_content += 'Z"/>'

    svg_content += '</svg>'

    with open(svg_path, 'w') as f:
        f.write(svg_content)
    print(f"Successfully converted {png_path} to {svg_path}")
    return True

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.join(script_dir, "..", "..")
    png_file = os.path.join(base_dir, "docs", "images", "Greenhouse_Logo.png")
    svg_file = os.path.join(base_dir, "docs", "images", "Greenhouse_Logo.svg")
    convert_png_to_svg(png_file, svg_file)
