
import math

def to_grayscale(rgba_data, width, height):
    """
    Converts a flat RGBA list into a 2D grayscale grid (list of lists).
    Formula: 0.299*R + 0.587*G + 0.114*B
    """
    grayscale = []
    for y in range(height):
        row = []
        for x in range(width):
            idx = (y * width + x) * 4
            r = rgba_data[idx]
            g = rgba_data[idx + 1]
            b = rgba_data[idx + 2]
            # Alpha is ignored for grayscale features
            gray = 0.299 * r + 0.587 * g + 0.114 * b
            row.append(gray)
        grayscale.append(row)
    return grayscale

def apply_padding(image, padding=1):
    """Adds zero padding to the 2D image."""
    height = len(image)
    width = len(image[0])
    new_width = width + 2 * padding
    padded = [[0] * new_width for _ in range(padding)]

    for row in image:
        padded.append([0] * padding + row + [0] * padding)

    padded.extend([[0] * new_width for _ in range(padding)])
    return padded

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

KERNELS = {
    "edge_detection": [
        [-1, -1, -1],
        [-1,  8, -1],
        [-1, -1, -1]
    ],
    "sharpen": [
        [ 0, -1,  0],
        [-1,  5, -1],
        [ 0, -1,  0]
    ]
}
