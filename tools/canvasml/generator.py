import json
import random
import os

OUTPUT_DIR = "tools/canvasml/data"
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
    "influencePaths": [
        { "startX": 150, "startY": 350, "endX": 768, "endY": 600, "color": "rgba(255, 159, 64, 0.7)", "width": 6, "label": "legend_family" },
        { "startX": 768, "startY": 30, "endX": 768, "endY": 600, "color": "rgba(54, 162, 235, 0.7)", "width": 6, "label": "legend_society" },
        { "startX": 1386, "startY": 350, "endX": 768, "endY": 600, "color": "rgba(75, 192, 192, 0.7)", "width": 6, "label": "legend_community" }
    ],
    "interactiveElements": {
        "medication": {
            "id": "medication_general",
            "name": "label_medication",
            "description": "medication_desc",
            "dataSource": "health.active_medications",
            "x": 570,
            "y": 750,
            "width": 60,
            "height": 30,
            "type": "pill"
        },
        "therapy": {
            "id": "therapy_general",
            "name": "label_therapy",
            "description": "therapy_desc",
            "dataSource": "health.therapy_sessions",
            "x": 966,
            "y": 750,
            "radius": 25,
            "type": "node"
        }
    }
}

def random_color():
    r = random.randint(0, 255)
    g = random.randint(0, 255)
    b = random.randint(0, 255)
    a = round(random.uniform(0.5, 1.0), 1)
    return f"rgba({r}, {g}, {b}, {a})"

def mutate_config(seed):
    random.seed(seed)
    config = json.loads(json.dumps(BASE_CONFIG)) # Deep copy

    # Mutation 1: Move labels
    for label in config["labels"]:
        label["x"] += random.randint(-100, 100)
        label["y"] += random.randint(-50, 50)
        label["fontSize"] = max(10, label["fontSize"] + random.randint(-10, 10))

    # Mutation 2: Change icon colors and positions
    for icon in config["icons"]:
        if random.random() > 0.5:
            icon["color"] = random_color()
        icon["x"] += random.randint(-50, 50)
        icon["y"] += random.randint(-50, 50)
        icon["scale"] = round(random.uniform(2.0, 6.0), 1)

    return config

print(f"Generating 50 variations in {OUTPUT_DIR}...")
for i in range(50):
    variation = mutate_config(i)
    filepath = os.path.join(OUTPUT_DIR, f"variation_{i}.json")
    with open(filepath, 'w') as f:
        json.dump(variation, f, indent=2)
print("Done.")
