
import math

def to_grayscale_grid(pixels_rgba, width, height):
    """
    Converts flattened RGBA pixels to a 2D grid of luminance values.
    Returns: List of Lists (height x width) containing float luminance (0-255).
    Using Rec. 709 (HDTV) coefficients: 0.2126 R + 0.7152 G + 0.0722 B
    """
    grid = []
    if not pixels_rgba:
        return grid

    # Verify dimensions
    expected_len = width * height * 4
    if len(pixels_rgba) < expected_len:
        # Pad with zeros if necessary
        pixels_rgba = pixels_rgba + [0] * (expected_len - len(pixels_rgba))

    for y in range(height):
        row = []
        for x in range(width):
            idx = (y * width + x) * 4
            r = pixels_rgba[idx]
            g = pixels_rgba[idx+1]
            b = pixels_rgba[idx+2]
            # Standard luminance formula
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            row.append(lum)
        grid.append(row)
    return grid

def calculate_contrast(pixels_rgba):
    """
    Calculates average contrast of the image using Standard Deviation of Luminance.
    Input: flattened list of RGBA values [r, g, b, a, r, g, b, a, ...]
    Returns a float score.
    """
    if not pixels_rgba:
        return 0.0

    luminances = []
    for i in range(0, len(pixels_rgba), 4):
        r = pixels_rgba[i]
        g = pixels_rgba[i+1]
        b = pixels_rgba[i+2]

        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        luminances.append(lum)

    if not luminances:
        return 0.0

    mean_lum = sum(luminances) / len(luminances)
    variance = sum((l - mean_lum) ** 2 for l in luminances) / len(luminances)
    std_dev = math.sqrt(variance)

    return std_dev

def calculate_whitespace_ratio(pixels_rgba, threshold=240):
    """
    Calculates the ratio of 'white' or light pixels to total pixels.
    Input: flattened list of RGBA values.
    Returns a float (0.0 to 1.0).
    """
    if not pixels_rgba:
        return 0.0

    pixel_count = len(pixels_rgba) // 4
    white_pixel_count = 0

    for i in range(0, len(pixels_rgba), 4):
        r = pixels_rgba[i]
        g = pixels_rgba[i+1]
        b = pixels_rgba[i+2]

        # Check if pixel is close to white
        if r > threshold and g > threshold and b > threshold:
            white_pixel_count += 1

    return white_pixel_count / pixel_count if pixel_count > 0 else 0.0

def get_color_histogram(pixels_rgba, bins=8):
    """
    Generates a color histogram.
    Input: flattened list of RGBA values.
    Returns a 1D list representing the histogram.
    """
    # Quantize R, G, B into bins
    hist_size = bins * bins * bins
    histogram = [0] * hist_size

    bin_size = 256 / bins

    for i in range(0, len(pixels_rgba), 4):
        r = pixels_rgba[i]
        g = pixels_rgba[i+1]
        b = pixels_rgba[i+2]

        r_bin = int(r / bin_size)
        g_bin = int(g / bin_size)
        b_bin = int(b / bin_size)

        # Ensure we don't go out of bounds
        if r_bin >= bins: r_bin = bins - 1
        if g_bin >= bins: g_bin = bins - 1
        if b_bin >= bins: b_bin = bins - 1

        index = (r_bin * bins * bins) + (g_bin * bins) + b_bin
        histogram[index] += 1

    # Normalize
    total_pixels = len(pixels_rgba) // 4
    if total_pixels > 0:
        histogram = [h / total_pixels for h in histogram]

    return histogram

def calculate_color_entropy(pixels_rgba, bins=8):
    """
    Calculates the Shannon Entropy of the color distribution.
    Higher entropy = more diverse/complex color palette.
    Input: flattened list of RGBA values.
    Returns: float
    """
    histogram = get_color_histogram(pixels_rgba, bins)
    entropy = 0.0
    for p in histogram:
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy

def calculate_edge_density(grayscale_grid, threshold=30):
    """
    Calculates the ratio of pixels that are part of an 'edge'.
    Uses a simple neighbor difference (approximation of gradient).
    Input: 2D list of luminance values.
    Returns: float (0.0 to 1.0)
    """
    if not grayscale_grid:
        return 0.0

    height = len(grayscale_grid)
    width = len(grayscale_grid[0])
    if width < 2 or height < 2:
        return 0.0

    edge_pixels = 0
    total_pixels = (width - 1) * (height - 1) # Accounting for border ignore

    # Iterate excluding the last row/col to avoid boundary checks for +1 neighbors
    for y in range(height - 1):
        for x in range(width - 1):
            val = grayscale_grid[y][x]
            right = grayscale_grid[y][x+1]
            down = grayscale_grid[y+1][x]

            diff_x = abs(val - right)
            diff_y = abs(val - down)

            if diff_x > threshold or diff_y > threshold:
                edge_pixels += 1

    return edge_pixels / total_pixels if total_pixels > 0 else 0.0

def calculate_feature_density(grayscale_grid):
    """
    Heuristic to detect high-frequency areas (like text or detailed icons).
    Scans horizontal lines for rapid light/dark transitions.
    Returns: float (average transitions per pixel)
    """
    if not grayscale_grid:
        return 0.0

    height = len(grayscale_grid)
    width = len(grayscale_grid[0])

    total_transitions = 0

    # Check every other line to speed up
    rows_checked = 0
    for y in range(0, height, 2):
        rows_checked += 1
        row = grayscale_grid[y]
        transitions = 0
        last_val = row[0] if width > 0 else 0

        for x in range(1, width):
            curr_val = row[x]
            # Transition defined as crossing a luminance threshold relative to previous
            if abs(curr_val - last_val) > 20:
                transitions += 1
                last_val = curr_val # Update "plateau"

        total_transitions += transitions

    total_possible = rows_checked * width
    return total_transitions / total_possible if total_possible > 0 else 0.0

def calculate_symmetry(grayscale_grid):
    """
    Calculates the horizontal symmetry of the image.
    Compares the left half to the mirrored right half.
    Returns: float (0.0 to 1.0, where 1.0 is perfect symmetry)
    """
    if not grayscale_grid:
        return 0.0

    height = len(grayscale_grid)
    width = len(grayscale_grid[0])

    if width < 2:
        return 1.0

    mid_x = width // 2
    total_diff = 0.0
    pixels_compared = 0

    for y in range(height):
        for x in range(mid_x):
            left_val = grayscale_grid[y][x]
            # Mirror index: width - 1 - x
            right_val = grayscale_grid[y][width - 1 - x]

            # Normalize difference (0-255) to 0-1 range
            diff = abs(left_val - right_val) / 255.0
            total_diff += diff
            pixels_compared += 1

    if pixels_compared == 0:
        return 1.0

    avg_diff = total_diff / pixels_compared
    # Symmetry is inverse of difference
    return 1.0 - avg_diff
