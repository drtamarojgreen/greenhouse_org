
import math

def calculate_contrast(pixels_rgba):
    """
    Calculates average contrast of the image.
    Input: flattened list of RGBA values [r, g, b, a, r, g, b, a, ...]
    Returns a float score.

    Simplified approach: Calculate standard deviation of luminance.
    Luminance = 0.2126*R + 0.7152*G + 0.0722*B
    """
    if not pixels_rgba:
        return 0.0

    luminances = []
    for i in range(0, len(pixels_rgba), 4):
        r = pixels_rgba[i]
        g = pixels_rgba[i+1]
        b = pixels_rgba[i+2]
        # a = pixels_rgba[i+3] # Ignored for luminance calculation for now

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

        # Ensure we don't go out of bounds (e.g. 256/32 = 8, index 8 is out of 0-7)
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
    Calculates the Shannon entropy of the color distribution.
    Higher entropy means more diverse/chaotic color usage.
    """
    histogram = get_color_histogram(pixels_rgba, bins)
    entropy = 0.0
    for p in histogram:
        if p > 0:
            entropy -= p * math.log2(p)
    return entropy
