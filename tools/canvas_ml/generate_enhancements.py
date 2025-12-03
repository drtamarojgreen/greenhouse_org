import json
import os
import random
import copy
import math

OUTPUT_DIR = "tools/canvas_ml/data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

BASE_CONFIG = {
    "canvas": {
        "logicalWidth": 1536,
        "logicalHeight": 1024
    },
    "labels": [
        { "text": "label_environmental_stress", "x": 768, "y": 160, "fontSize": 52, "type": "header" },
        { "text": "label_genetic_factors", "x": 768, "y": 250, "fontSize": 40, "type": "subheader" },
        { "text": "label_community", "x": 1200, "y": 512, "fontSize": 40, "type": "label" },
        { "text": "label_personal_growth", "x": 768, "y": 950, "fontSize": 36, "type": "label" }
    ],
    "icons": [
        {
            "id": "family", "type": "path",
            "pathData": "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
            "x": 150, "y": 320, "scale": 4.0, "label": "legend_family",
            "color": "rgba(255, 159, 64, 0.8)"
        },
        {
            "id": "community", "type": "path",
            "pathData": "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V18h14v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V18h6v-1.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V18h6v-1.5c0-2.33-4.67-3.5-7-3.5z",
            "x": 1386, "y": 320, "scale": 4.0, "label": "legend_community",
            "color": "rgba(75, 192, 192, 0.8)"
        },
        {
            "id": "society", "type": "path",
            "pathData": "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
            "x": 768, "y": 30, "scale": 4.0, "label": "legend_society",
            "color": "rgba(54, 162, 235, 0.8)"
        }
    ],
    "influencePaths": [],
    "interactiveElements": []
}

def get_base():
    return copy.deepcopy(BASE_CONFIG)

def generate_variations():
    variations = []

    # 1. Default Baseline
    variations.append(get_base())

    # 2. Minimalist
    v = get_base()
    v["icons"] = [v["icons"][0]]
    v["labels"] = [v["labels"][0]]
    variations.append(v)

    # 3. Icon Heavy
    v = get_base()
    base_icons = v["icons"]
    v["icons"] = base_icons + copy.deepcopy(base_icons)
    for i in range(3, 6):
        v["icons"][i]["id"] += f"_copy_{i}"
        v["icons"][i]["x"] = random.randint(100, 1400)
        v["icons"][i]["y"] = random.randint(100, 900)
    variations.append(v)

    # 4. Label Heavy
    v = get_base()
    base_labels = v["labels"]
    v["labels"] = base_labels + copy.deepcopy(base_labels)
    for i in range(4, 8):
        v["labels"][i]["text"] += f"_copy"
        v["labels"][i]["x"] = random.randint(100, 1400)
        v["labels"][i]["y"] = random.randint(100, 900)
    variations.append(v)

    # 5. High Density
    v = get_base()
    for i in range(17):
        icon = copy.deepcopy(v["icons"][i % 3])
        icon["id"] = f"extra_icon_{i}"
        icon["x"] = random.randint(50, 1450)
        icon["y"] = random.randint(50, 950)
        v["icons"].append(icon)
    for i in range(6):
        label = copy.deepcopy(v["labels"][i % 4])
        label["text"] = f"extra_label_{i}"
        label["x"] = random.randint(50, 1450)
        label["y"] = random.randint(50, 950)
        v["labels"].append(label)
    variations.append(v)

    # 6. Low Density
    v = get_base()
    v["icons"][0]["x"], v["icons"][0]["y"] = 100, 100
    v["icons"][1]["x"], v["icons"][1]["y"] = 1400, 900
    v["icons"][2]["x"], v["icons"][2]["y"] = 100, 900
    v["labels"].pop()
    variations.append(v)

    # 7. Text Only
    v = get_base()
    v["icons"] = []
    variations.append(v)

    # 8. Visual Only
    v = get_base()
    v["labels"] = []
    variations.append(v)

    # 9. Large Icons
    v = get_base()
    for icon in v["icons"]:
        icon["scale"] = 8.0
    variations.append(v)

    # 10. Small Icons
    v = get_base()
    for icon in v["icons"]:
        icon["scale"] = 2.0
    variations.append(v)

    # 11. Large Text
    v = get_base()
    for label in v["labels"]:
        label["fontSize"] = 72
    variations.append(v)

    # 12. Small Text
    v = get_base()
    for label in v["labels"]:
        label["fontSize"] = 12
    variations.append(v)

    # 13. Central Cluster
    v = get_base()
    for icon in v["icons"]:
        icon["x"] = random.randint(600, 900)
        icon["y"] = random.randint(400, 600)
    for label in v["labels"]:
        label["x"] = random.randint(600, 900)
        label["y"] = random.randint(400, 600)
    variations.append(v)

    # 14. Perimeter Cluster
    v = get_base()
    for icon in v["icons"]:
        if random.random() > 0.5:
            icon["x"] = random.choice([50, 1450])
            icon["y"] = random.randint(50, 950)
        else:
            icon["x"] = random.randint(50, 1450)
            icon["y"] = random.choice([50, 950])
    variations.append(v)

    # 15. Grid Layout
    v = get_base()
    v["icons"][0]["x"], v["icons"][0]["y"] = 400, 400
    v["icons"][1]["x"], v["icons"][1]["y"] = 1100, 400
    v["icons"][2]["x"], v["icons"][2]["y"] = 400, 800
    v["labels"][0]["x"], v["labels"][0]["y"] = 1100, 800
    variations.append(v)

    # 16. Monochromatic Blue
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = "rgba(0, 0, 255, 0.8)"
    variations.append(v)

    # 17. Monochromatic Red
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = "rgba(255, 0, 0, 0.8)"
    variations.append(v)

    # 18. High Contrast
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = "rgba(255, 255, 255, 1.0)"
    variations.append(v)

    # 19. Transparent Overlay
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = icon["color"].replace("0.8", "0.3")
    variations.append(v)

    # 20. Pastel Theme
    v = get_base()
    pastels = ["rgba(255, 179, 186, 0.9)", "rgba(255, 223, 186, 0.9)", "rgba(255, 255, 186, 0.9)"]
    for i, icon in enumerate(v["icons"]):
        icon["color"] = pastels[i % 3]
    variations.append(v)

    # 21. Dark Mode
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = "rgba(64, 64, 64, 0.9)"
    variations.append(v)

    # 22. Overlapping Elements
    v = get_base()
    for icon in v["icons"]:
        icon["x"] = 768
        icon["y"] = 512
    variations.append(v)

    # 23. Disconnected Elements
    v = get_base()
    v["icons"][0]["x"], v["icons"][0]["y"] = 100, 100
    v["icons"][1]["x"], v["icons"][1]["y"] = 1436, 100
    v["icons"][2]["x"], v["icons"][2]["y"] = 768, 924
    variations.append(v)

    # 24. Linear Flow
    v = get_base()
    for i, icon in enumerate(v["icons"]):
        icon["y"] = 512
        icon["x"] = 400 + (i * 300)
    variations.append(v)

    # 25. Random Scatter
    v = get_base()
    for icon in v["icons"]:
        icon["x"] = random.randint(100, 1400)
        icon["y"] = random.randint(100, 900)
        icon["scale"] = random.uniform(2.0, 6.0)
    variations.append(v)

    # --- New 25 ---

    # 26. Accessibility Deuteranopia
    v = get_base()
    # Blue/Yellow safe palette. Avoid Red/Green confusion.
    # Using Blue and Gold/Yellow
    deut_colors = ["rgba(0, 114, 178, 0.9)", "rgba(230, 159, 0, 0.9)", "rgba(86, 180, 233, 0.9)"]
    for i, icon in enumerate(v["icons"]):
        icon["color"] = deut_colors[i % 3]
    variations.append(v)

    # 27. Accessibility Protanopia
    v = get_base()
    # Similar to Deuteranopia but avoiding red specifically. Blue/Yellow/Grey.
    prot_colors = ["rgba(0, 114, 178, 0.9)", "rgba(240, 228, 66, 0.9)", "rgba(204, 121, 167, 0.9)"]
    for i, icon in enumerate(v["icons"]):
        icon["color"] = prot_colors[i % 3]
    variations.append(v)

    # 28. Accessibility Tritanopia
    v = get_base()
    # Blue blind. Use Red/Cyan/Pink.
    trit_colors = ["rgba(213, 94, 0, 0.9)", "rgba(0, 158, 115, 0.9)", "rgba(240, 228, 66, 0.9)"]
    for i, icon in enumerate(v["icons"]):
        icon["color"] = trit_colors[i % 3]
    variations.append(v)

    # 29. Senior Friendly
    v = get_base()
    for label in v["labels"]:
        label["fontSize"] = 48
    for icon in v["icons"]:
        icon["color"] = icon["color"].replace("0.8", "1.0") # Max contrast
    variations.append(v)

    # 30. Child Friendly
    v = get_base()
    primary = ["rgba(255, 0, 0, 1.0)", "rgba(0, 0, 255, 1.0)", "rgba(255, 255, 0, 1.0)"]
    for i, icon in enumerate(v["icons"]):
        icon["color"] = primary[i % 3]
        icon["scale"] = 6.0
    variations.append(v)

    # 31. Stress Heatmap
    v = get_base()
    # Add many red icons in top left (0,0 to 768,512)
    for i in range(10):
        icon = copy.deepcopy(v["icons"][0]) # Family
        icon["color"] = "rgba(255, 0, 0, 0.6)"
        icon["x"] = random.randint(100, 600)
        icon["y"] = random.randint(100, 400)
        icon["id"] = f"stress_{i}"
        v["icons"].append(icon)
    variations.append(v)

    # 32. Support Network Radial
    v = get_base()
    cx, cy = 768, 512
    v["icons"] = []
    # Center
    center = copy.deepcopy(BASE_CONFIG["icons"][2])
    center["x"], center["y"] = cx, cy
    center["label"] = "Self"
    v["icons"].append(center)
    # Radial
    count = 8
    radius = 300
    for i in range(count):
        angle = (2 * math.pi / count) * i
        icon = copy.deepcopy(BASE_CONFIG["icons"][1])
        icon["x"] = cx + radius * math.cos(angle)
        icon["y"] = cy + radius * math.sin(angle)
        icon["id"] = f"radial_{i}"
        v["icons"].append(icon)
    variations.append(v)

    # 33. Growth Spiral
    v = get_base()
    v["icons"] = []
    cx, cy = 768, 512
    a = 20
    b = 0.3
    for i in range(20):
        angle = 0.5 * i
        r = a * math.exp(b * angle)
        icon = copy.deepcopy(BASE_CONFIG["icons"][0])
        icon["x"] = cx + r * math.cos(angle)
        icon["y"] = cy + r * math.sin(angle)
        icon["scale"] = 2.0 + (i * 0.2)
        icon["id"] = f"spiral_{i}"
        if 0 < icon["x"] < 1536 and 0 < icon["y"] < 1024:
             v["icons"].append(icon)
    variations.append(v)

    # 34. Timeline View
    v = get_base()
    v["icons"] = []
    for i in range(5):
        icon = copy.deepcopy(BASE_CONFIG["icons"][i % 3])
        icon["x"] = 200 + (i * 250)
        icon["y"] = 512
        icon["id"] = f"time_{i}"
        v["icons"].append(icon)
    # Add a line? Not supported in schema directly, assuming implied by position.
    variations.append(v)

    # 35. Hierarchy Pyramid
    v = get_base()
    v["icons"] = []
    # Top
    top = copy.deepcopy(BASE_CONFIG["icons"][2])
    top["x"], top["y"] = 768, 200
    v["icons"].append(top)
    # Middle
    for i in range(2):
        icon = copy.deepcopy(BASE_CONFIG["icons"][1])
        icon["x"] = 600 + (i * 336)
        icon["y"] = 500
        icon["id"] = f"mid_{i}"
        v["icons"].append(icon)
    # Base
    for i in range(3):
        icon = copy.deepcopy(BASE_CONFIG["icons"][0])
        icon["x"] = 500 + (i * 268)
        icon["y"] = 800
        icon["id"] = f"base_{i}"
        v["icons"].append(icon)
    variations.append(v)

    # 36. Balanced Ecology
    v = get_base()
    # Just colors
    v["icons"][0]["color"] = "rgba(255, 159, 64, 0.9)" # Self/Family (Orange)
    v["icons"][1]["color"] = "rgba(75, 192, 192, 0.9)" # Community (Green/Teal)
    v["icons"][2]["color"] = "rgba(54, 162, 235, 0.9)" # Society (Blue)
    variations.append(v)

    # 37. Urban Environment
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = "rgba(128, 128, 128, 0.9)"
    # Grid-ish
    v["icons"][0]["x"], v["icons"][0]["y"] = 500, 500
    v["icons"][1]["x"], v["icons"][1]["y"] = 500, 700
    v["icons"][2]["x"], v["icons"][2]["y"] = 700, 500
    variations.append(v)

    # 38. Rural Environment
    v = get_base()
    for icon in v["icons"]:
        icon["color"] = "rgba(34, 139, 34, 0.9)" # Forest Green
    # Spread out
    v["icons"][0]["x"], v["icons"][0]["y"] = 200, 200
    v["icons"][1]["x"], v["icons"][1]["y"] = 1200, 800
    v["icons"][2]["x"], v["icons"][2]["y"] = 800, 400
    variations.append(v)

    # 39. Night Shift
    v = get_base()
    # Warm amber colors
    amber = "rgba(255, 191, 0, 0.9)"
    for icon in v["icons"]:
        icon["color"] = amber
    variations.append(v)

    # 40. High Anxiety State
    v = get_base()
    # Jittery positions
    for i in range(20):
        icon = copy.deepcopy(v["icons"][i % 3])
        icon["x"] = random.randint(600, 900)
        icon["y"] = random.randint(400, 600)
        # Slight offsets
        icon["x"] += random.randint(-20, 20)
        icon["y"] += random.randint(-20, 20)
        icon["id"] = f"chaos_{i}"
        v["icons"].append(icon)
    variations.append(v)

    # 41. Calm State
    v = get_base()
    # Symmetrical
    v["icons"] = []
    icon1 = copy.deepcopy(BASE_CONFIG["icons"][1])
    icon1["x"], icon1["y"] = 500, 512
    v["icons"].append(icon1)
    icon2 = copy.deepcopy(BASE_CONFIG["icons"][1])
    icon2["x"], icon2["y"] = 1036, 512
    v["icons"].append(icon2)
    variations.append(v)

    # 42. Information Overload
    v = get_base()
    v["icons"] = []
    for i in range(20):
        lbl = copy.deepcopy(v["labels"][0])
        lbl["text"] = f"INFO_{i}"
        lbl["x"] = random.randint(100, 1400)
        lbl["y"] = random.randint(100, 900)
        v["labels"].append(lbl)
    variations.append(v)

    # 43. Symbolic Abstract
    v = get_base()
    # Circle path data
    circle_path = "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z"
    for icon in v["icons"]:
        icon["pathData"] = circle_path
    variations.append(v)

    # 44. Connective Tissue
    v = get_base()
    # Clusters of 3
    v["icons"] = []
    for i in range(3):
        cx = random.randint(300, 1200)
        cy = random.randint(300, 700)
        for j in range(3):
            icon = copy.deepcopy(BASE_CONFIG["icons"][j])
            icon["x"] = cx + (j * 40)
            icon["y"] = cy
            icon["id"] = f"cluster_{i}_{j}"
            v["icons"].append(icon)
    variations.append(v)

    # 45. Isolation Mode
    v = get_base()
    v["icons"][0]["x"], v["icons"][0]["y"] = 768, 512 # Center
    v["icons"][1]["x"], v["icons"][1]["y"] = 50, 50
    v["icons"][2]["x"], v["icons"][2]["y"] = 1486, 974
    variations.append(v)

    # 46. Community Focus
    v = get_base()
    v["icons"] = []
    for i in range(10):
        icon = copy.deepcopy(BASE_CONFIG["icons"][1]) # Community
        icon["x"] = random.randint(600, 900)
        icon["y"] = random.randint(400, 600)
        icon["id"] = f"comm_{i}"
        v["icons"].append(icon)
    variations.append(v)

    # 47. Self-Reflection
    v = get_base()
    v["labels"] = [l for l in v["labels"] if l["text"] == "label_personal_growth"]
    v["labels"][0]["fontSize"] = 100
    v["labels"][0]["x"] = 768
    v["labels"][0]["y"] = 512
    v["icons"] = []
    variations.append(v)

    # 48. External Factors
    v = get_base()
    v["icons"] = [BASE_CONFIG["icons"][2]] # Society
    v["icons"][0]["scale"] = 10.0
    v["icons"][0]["x"], v["icons"][0]["y"] = 768, 512
    v["labels"] = [l for l in v["labels"] if l["text"] == "label_environmental_stress"]
    variations.append(v)

    # 49. Legacy Mode
    v = get_base()
    # Cramped
    v["canvas"]["logicalWidth"] = 800
    v["canvas"]["logicalHeight"] = 600
    for icon in v["icons"]:
        icon["x"] = icon["x"] / 2
        icon["y"] = icon["y"] / 2
    variations.append(v)

    # 50. Future Tech
    v = get_base()
    cyan = "rgba(0, 255, 255, 1.0)"
    magenta = "rgba(255, 0, 255, 1.0)"
    v["icons"][0]["color"] = cyan
    v["icons"][1]["color"] = magenta
    v["icons"][2]["color"] = cyan
    variations.append(v)


    # Write files
    print(f"Generating {len(variations)} variations in {OUTPUT_DIR}...")
    for i, var in enumerate(variations):
        filepath = os.path.join(OUTPUT_DIR, f"variation_{i}.json")
        with open(filepath, 'w') as f:
            json.dump(var, f, indent=2)
    print("Done.")

if __name__ == "__main__":
    generate_variations()
