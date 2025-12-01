"""
Manual implementation of Convolutional Neural Network layers in pure Python.
"""

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

def convolve2d(image, kernel):
    """
    Applies a 2D convolution with the given kernel.
    Assumes kernel is a square matrix of odd size (e.g., 3x3).
    Returns the feature map (same dimensions as input if padded appropriately,
    but here we do valid convolution or padded? Let's do valid with padding to keep size).
    Actually, let's just do valid convolution for simplicity, or with padding.
    Standard CNNs often preserve size. Let's assume input is padded or handle edges.
    """
    kernel_size = len(kernel)
    padding = kernel_size // 2
    padded_image = apply_padding(image, padding)

    output_height = len(image)
    output_width = len(image[0])

    feature_map = []

    for y in range(output_height):
        row = []
        for x in range(output_width):
            sum_val = 0
            for ky in range(kernel_size):
                for kx in range(kernel_size):
                    pixel = padded_image[y + ky][x + kx]
                    weight = kernel[ky][kx]
                    sum_val += pixel * weight
            row.append(max(0, sum_val)) # ReLU activation
        feature_map.append(row)

    return feature_map

def max_pooling(feature_map, pool_size=2, stride=2):
    """
    Applies max pooling to the feature map.
    """
    height = len(feature_map)
    width = len(feature_map[0])

    output = []

    for y in range(0, height - pool_size + 1, stride):
        row = []
        for x in range(0, width - pool_size + 1, stride):
            max_val = -float('inf')
            for py in range(pool_size):
                for px in range(pool_size):
                    val = feature_map[y + py][x + px]
                    if val > max_val:
                        max_val = val
            row.append(max_val)
        output.append(row)

    return output

def flatten(feature_map):
    """Flattens a 2D feature map into a 1D vector."""
    vector = []
    for row in feature_map:
        vector.extend(row)
    return vector

# Predefined kernels
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
