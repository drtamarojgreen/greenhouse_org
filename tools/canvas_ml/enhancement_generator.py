import json
import os
import random
import copy

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

def apply_enhancement(idx):
    config = get_base()
    width = config["canvas"]["logicalWidth"]
    height = config["canvas"]["logicalHeight"]
    cx, cy = width / 2, height / 2

    # 0. Cluster - Central
    if idx == 0:
        for item in config["icons"] + config["labels"]:
            item["x"] = cx + random.randint(-100, 100)
            item["y"] = cy + random.randint(-100, 100)

    # 1. Cluster - Corners
    elif idx == 1:
        corners = [(100, 100), (width-100, 100), (100, height-100), (width-100, height-100)]
        for i, item in enumerate(config["icons"] + config["labels"]):
            corn = corners[i % 4]
            item["x"] = corn[0] + random.randint(-50, 50)
            item["y"] = corn[1] + random.randint(-50, 50)

    # 2. Linear - Horizontal
    elif idx == 2:
        items = config["icons"]
        spacing = width / (len(items) + 1)
        for i, item in enumerate(items):
            item["x"] = spacing * (i + 1)
            item["y"] = cy

    # 3. Linear - Vertical
    elif idx == 3:
        items = config["icons"]
        spacing = height / (len(items) + 1)
        for i, item in enumerate(items):
            item["x"] = cx
            item["y"] = spacing * (i + 1)

    # 4. Grid
    elif idx == 4:
        # Simple 2x2 grid for existing items if possible, or just spread
        cols = 2
        for i, item in enumerate(config["icons"]):
            r = i // cols
            c = i % cols
            item["x"] = (width / 3) * (c + 1)
            item["y"] = (height / 3) * (r + 1)

    # 5. Top Heavy
    elif idx == 5:
        for item in config["icons"] + config["labels"]:
            item["y"] = random.randint(50, int(height * 0.3))

    # 6. Bottom Heavy
    elif idx == 6:
        for item in config["icons"] + config["labels"]:
            item["y"] = random.randint(int(height * 0.7), height - 50)

    # 7. Left Aligned
    elif idx == 7:
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(50, int(width * 0.3))

    # 8. Right Aligned
    elif idx == 8:
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(int(width * 0.7), width - 50)

    # 9. Spread Out
    elif idx == 9:
        # Manual spread
        config["icons"][0]["x"] = 100
        config["icons"][0]["y"] = 100
        config["icons"][1]["x"] = width - 100
        config["icons"][1]["y"] = height - 100
        config["icons"][2]["x"] = width - 100
        config["icons"][2]["y"] = 100
        if len(config["icons"]) > 3:
             config["icons"][3]["x"] = 100
             config["icons"][3]["y"] = height - 100

    # 10. Text Heavy
    elif idx == 10:
        for l in config["labels"]:
            l["fontSize"] *= 2

    # 11. Icon Heavy
    elif idx == 11:
        for icon in config["icons"]:
            icon["scale"] *= 2

    # 12. Balanced Scale
    elif idx == 12:
        for icon in config["icons"]:
            icon["scale"] = 4.0
        for l in config["labels"]:
            l["fontSize"] = 40

    # 13. Giant Labels
    elif idx == 13:
        for l in config["labels"]:
            l["fontSize"] = 120

    # 14. Micro Labels
    elif idx == 14:
        for l in config["labels"]:
            l["fontSize"] = 10

    # 15. Giant Icons
    elif idx == 15:
        for icon in config["icons"]:
            icon["scale"] = 10.0

    # 16. Micro Icons
    elif idx == 16:
        for icon in config["icons"]:
            icon["scale"] = 1.0

    # 17. High Contrast
    elif idx == 17:
        colors = ["rgba(255,0,0,1)", "rgba(0,0,255,1)", "rgba(0,0,0,1)", "rgba(255,255,0,1)"]
        for i, icon in enumerate(config["icons"]):
            icon["color"] = colors[i % len(colors)]

    # 18. Pastel Palette
    elif idx == 18:
        for icon in config["icons"]:
            r = random.randint(200, 255)
            g = random.randint(200, 255)
            b = random.randint(200, 255)
            icon["color"] = f"rgba({r},{g},{b},0.6)"

    # 19. Monochrome
    elif idx == 19:
        for icon in config["icons"]:
            val = random.randint(50, 200)
            icon["color"] = f"rgba(0,0,{val},1)"

    # 20. High Density
    elif idx == 20:
        # Add random icons
        base_icon = config["icons"][0]
        for _ in range(10):
            new_icon = copy.deepcopy(base_icon)
            new_icon["x"] = random.randint(50, width-50)
            new_icon["y"] = random.randint(50, height-50)
            new_icon["color"] = "rgba(100,100,100,0.5)"
            config["icons"].append(new_icon)

    # 21. Low Density
    elif idx == 21:
        config["icons"] = [config["icons"][0]]
        config["labels"] = [config["labels"][0]]

    # 22. Overlap
    elif idx == 22:
        for item in config["icons"] + config["labels"]:
            item["x"] = cx + random.randint(-20, 20)
            item["y"] = cy + random.randint(-20, 20)

    # 23. Noisy
    elif idx == 23:
        base_icon = config["icons"][0]
        base_icon["scale"] = 1.0
        for _ in range(50):
            new_icon = copy.deepcopy(base_icon)
            new_icon["x"] = random.randint(0, width)
            new_icon["y"] = random.randint(0, height)
            config["icons"].append(new_icon)

    # 24. Chaos
    elif idx == 24:
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(0, width)
            item["y"] = random.randint(0, height)
            if "scale" in item:
                item["scale"] = random.uniform(1.0, 15.0)
            if "fontSize" in item:
                item["fontSize"] = random.randint(10, 200)

    # 25. Family Centric
    elif idx == 25:
        for icon in config["icons"]:
            if icon["id"] == "family":
                icon["scale"] = 12.0
                icon["x"] = cx
                icon["y"] = cy
            else:
                icon["scale"] = 2.0 # shrink others

    # 26. Community Focus
    elif idx == 26:
        for icon in config["icons"]:
            if icon["id"] == "community":
                icon["scale"] = 12.0
                icon["x"] = cx
                icon["y"] = cy
            else:
                icon["scale"] = 2.0

    # 27. Society Dominance
    elif idx == 27:
        for icon in config["icons"]:
            if icon["id"] == "society":
                icon["scale"] = 12.0
                icon["x"] = cx
                icon["y"] = 200 # Top
            else:
                icon["y"] = height - 200

    # 28. Stress Overload
    elif idx == 28:
        for l in config["labels"]:
            if "environmental_stress" in l["text"]:
                l["fontSize"] = 100
                l["color"] = "rgba(255,0,0,1)" # Assuming label supports color override in rendering, if not it might be ignored but intention is there
            else:
                l["fontSize"] = 20

    # 29. Growth Focus
    elif idx == 29:
        for l in config["labels"]:
            if "personal_growth" in l["text"]:
                l["fontSize"] = 80
                l["color"] = "rgba(0,255,0,1)"
            else:
                l["fontSize"] = 20

    # 30. Genetic Emphasis
    elif idx == 30:
        for l in config["labels"]:
            if "genetic_factors" in l["text"]:
                l["fontSize"] = 80
                l["color"] = "rgba(100,0,255,1)"

    # 31. Family-Community Bridge
    elif idx == 31:
        f = next((i for i in config["icons"] if i["id"] == "family"), None)
        c = next((i for i in config["icons"] if i["id"] == "community"), None)
        if f and c:
            f["x"] = cx - 100
            f["y"] = cy
            c["x"] = cx + 100
            c["y"] = cy

    # 32. Society-Individual Gap
    elif idx == 32:
         s = next((i for i in config["icons"] if i["id"] == "society"), None)
         pg = next((l for l in config["labels"] if "personal_growth" in l["text"]), None)
         if s: s["y"] = 100
         if pg: pg["y"] = height - 100

    # 33. Environmental Pressure
    elif idx == 33:
        pg = next((l for l in config["labels"] if "personal_growth" in l["text"]), None)
        if pg:
            target_x, target_y = pg["x"], pg["y"]
            for icon in config["icons"]:
                icon["x"] = target_x + random.randint(-100, 100)
                icon["y"] = target_y + random.randint(-100, 100)

    # 34. Support Triangle
    elif idx == 34:
         f = next((i for i in config["icons"] if i["id"] == "family"), None)
         c = next((i for i in config["icons"] if i["id"] == "community"), None)
         s = next((i for i in config["icons"] if i["id"] == "society"), None)
         if f: f["x"], f["y"] = cx - 200, cy + 200
         if c: c["x"], c["y"] = cx + 200, cy + 200
         if s: s["x"], s["y"] = cx, cy - 200

    # 35. Hidden Stress
    elif idx == 35:
        for l in config["labels"]:
            if "environmental_stress" in l["text"]:
                l["fontSize"] = 10
                l["color"] = "rgba(0,0,0,0.1)"

    # 36. Hidden Factors
    elif idx == 36:
        for l in config["labels"]:
            if "genetic_factors" in l["text"]:
                l["fontSize"] = 10
                l["color"] = "rgba(0,0,0,0.1)"

    # 37. Overwhelming Society
    elif idx == 37:
        s = next((i for i in config["icons"] if i["id"] == "society"), None)
        if s: s["scale"] = 20.0

    # 38. Tiny Community
    elif idx == 38:
        c = next((i for i in config["icons"] if i["id"] == "community"), None)
        if c: c["scale"] = 0.5

    # 39. Red Alert
    elif idx == 39:
        for icon in config["icons"]:
            icon["color"] = "rgba(255,0,0,1)"

    # 40. Blue Calm
    elif idx == 40:
        for icon in config["icons"]:
            icon["color"] = "rgba(0,0,255,1)"

    # 41. Dark Icons
    elif idx == 41:
        for icon in config["icons"]:
            icon["color"] = "rgba(30,30,30,1)"

    # 42. Ghost Mode
    elif idx == 42:
        for icon in config["icons"]:
            icon["color"] = "rgba(100,100,100,0.1)"

    # 43. Text Only
    elif idx == 43:
        for icon in config["icons"]:
            icon["scale"] = 0.0

    # 44. Icon Only
    elif idx == 44:
        for l in config["labels"]:
            l["fontSize"] = 0

    # 45. Top-Left Quadrant
    elif idx == 45:
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(0, int(width/2))
            item["y"] = random.randint(0, int(height/2))

    # 46. Bottom-Right Quadrant
    elif idx == 46:
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(int(width/2), width)
            item["y"] = random.randint(int(height/2), height)

    # 47. Diagonal Stream
    elif idx == 47:
        # y = x * (height/width)
        ratio = height/width
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(0, width)
            item["y"] = item["x"] * ratio + random.randint(-50, 50)

    # 48. Anti-Diagonal
    elif idx == 48:
        # y = height - x * (height/width)
        ratio = height/width
        for item in config["icons"] + config["labels"]:
            item["x"] = random.randint(0, width)
            item["y"] = height - (item["x"] * ratio) + random.randint(-50, 50)

    # 49. The Greenhouse
    elif idx == 49:
         f = next((i for i in config["icons"] if i["id"] == "family"), None)
         c = next((i for i in config["icons"] if i["id"] == "community"), None)
         s = next((i for i in config["icons"] if i["id"] == "society"), None)
         # Family as base
         if f:
             f["x"], f["y"] = cx, height - 200
             f["scale"] = 8.0
         # Community as walls (use 2 if possible, or just one side)
         if c:
             c["x"], c["y"] = cx - 300, height - 200
             c["scale"] = 6.0
             # Add a duplicate for other wall
             c2 = copy.deepcopy(c)
             c2["x"] = cx + 300
             config["icons"].append(c2)
         # Society as roof
         if s:
             s["x"], s["y"] = cx, height - 600
             s["scale"] = 10.0

    return config

def generate():
    print(f"Generating 50 enhancements in {OUTPUT_DIR}...")
    for i in range(50):
        variation = apply_enhancement(i)
        filepath = os.path.join(OUTPUT_DIR, f"variation_{i}.json")
        with open(filepath, 'w') as f:
            json.dump(variation, f, indent=2)
    print("Done.")

if __name__ == "__main__":
    generate()
