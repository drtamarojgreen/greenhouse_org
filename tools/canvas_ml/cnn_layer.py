
import math

def convolve_2d(image, kernel):
    """
    Applies a 2D convolution to a 2D list (image) using a 2D kernel.
    Assumes image is a list of lists of numbers.
    Assumes kernel is a list of lists of numbers (square, odd dimension).
    Returns a 2D list (feature map).
    """
    if not image or not image[0]:
        return []

    img_height = len(image)
    img_width = len(image[0])

    kernel_size = len(kernel)
    kernel_radius = kernel_size // 2

    # Output dimensions (assuming valid padding, i.e., shrinking output)
    # To keep same size, we'd need padding. Let's do valid convolution (no padding) for simplicity
    # unless otherwise specified.
    # Actually, usually for feature extraction we might want to capture everything,
    # but valid is easiest to implement without extra logic.
    # Let's do 'valid' (no padding).

    out_height = img_height - kernel_size + 1
    out_width = img_width - kernel_size + 1

    if out_height <= 0 or out_width <= 0:
        return []

    output = []

    for y in range(out_height):
        row = []
        for x in range(out_width):
            # Apply kernel centered at image[y + kernel_radius][x + kernel_radius]
            # But since we are doing valid, we iterate top-left of the kernel window.

            pixel_sum = 0.0
            for ky in range(kernel_size):
                for kx in range(kernel_size):
                    pixel_val = image[y + ky][x + kx]
                    weight = kernel[ky][kx]
                    pixel_sum += pixel_val * weight

            row.append(pixel_sum)
        output.append(row)

    return output

def relu(feature_map):
    """
    Applies Rectified Linear Unit activation function in-place or returns new.
    Returns new 2D list.
    """
    return [[max(0.0, val) for val in row] for row in feature_map]

def max_pool(feature_map, pool_size=2, stride=2):
    """
    Applies Max Pooling to a 2D list.
    """
    if not feature_map or not feature_map[0]:
        return []

    height = len(feature_map)
    width = len(feature_map[0])

    out_height = (height - pool_size) // stride + 1
    out_width = (width - pool_size) // stride + 1

    if out_height <= 0 or out_width <= 0:
        return []

    output = []

    for y in range(0, height - pool_size + 1, stride):
        row = []
        for x in range(0, width - pool_size + 1, stride):
            # Find max in the window
            window_max = float('-inf')
            for py in range(pool_size):
                for px in range(pool_size):
                    val = feature_map[y + py][x + px]
                    if val > window_max:
                        window_max = val
            row.append(window_max)
        output.append(row)

    return output

def flatten(feature_map):
    """
    Flattens a 2D list into a 1D list.
    """
    flat = []
    for row in feature_map:
        flat.extend(row)
    return flat
