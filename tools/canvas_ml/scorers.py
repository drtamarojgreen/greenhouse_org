"""
Scoring metrics for visual analysis in pure Python.
"""

import math

def calculate_contrast(rgba_data, width, height):
    """
    Calculates the root mean square (RMS) contrast of the image.
    RMS contrast is the standard deviation of the pixel intensities.
    """
    pixel_count = width * height
    if pixel_count == 0:
        return 0

    intensities = []
    total_intensity = 0

    for i in range(0, len(rgba_data), 4):
        r = rgba_data[i]
        g = rgba_data[i+1]
        b = rgba_data[i+2]
        # Normalize to 0-1
        luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0
        intensities.append(luminance)
        total_intensity += luminance

    mean_intensity = total_intensity / pixel_count

    variance = 0
    for val in intensities:
        variance += (val - mean_intensity) ** 2

    rms_contrast = math.sqrt(variance / pixel_count)
    return rms_contrast

def calculate_white_space(rgba_data, width, height, threshold=250):
    """
    Calculates the ratio of "white" (or very light) space to total space.
    """
    pixel_count = width * height
    if pixel_count == 0:
        return 0

    white_pixels = 0

    for i in range(0, len(rgba_data), 4):
        r = rgba_data[i]
        g = rgba_data[i+1]
        b = rgba_data[i+2]

        # Check if pixel is close to white
        if r > threshold and g > threshold and b > threshold:
            white_pixels += 1

    return white_pixels / pixel_count

def calculate_color_themes(rgba_data, width, height, num_bins=8):
    """
    Generates a simplified color histogram to detect palette consistency.
    Returns a normalized distribution of hues.
    """
    pixel_count = width * height
    if pixel_count == 0:
        return []

    # We will compute a simple 3D histogram (R, G, B bins) flattened
    bin_size = 256 // num_bins
    histogram = {}

    for i in range(0, len(rgba_data), 4):
        r = rgba_data[i]
        g = rgba_data[i+1]
        b = rgba_data[i+2]

        r_bin = r // bin_size
        g_bin = g // bin_size
        b_bin = b // bin_size

        key = (r_bin, g_bin, b_bin)
        histogram[key] = histogram.get(key, 0) + 1

    # Flatten and normalize top N dominant colors?
    # Or just return a vector of the bins?
    # For simplicity/vectors, we can return the count of top 5 dominant bins as a "consistency score"
    # or just the entropy.

    # Let's return the entropy of the color distribution (lower entropy = more consistent theme)
    probs = [count / pixel_count for count in histogram.values()]
    entropy = -sum(p * math.log(p, 2) for p in probs if p > 0)

    return entropy

def calculate_text_density(text_content, area):
    """
    Estimates text density given the text content string and the area of the container.
    """
    if area == 0:
        return 0
    return len(text_content) / area
