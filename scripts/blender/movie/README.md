# 🎬 Greenhouse Movie Production Pipeline

This directory contains the procedural generation and rendering pipeline for the Greenhouse Mental Health movie project, organized into evolutionary versions.

---

## 🚀 Version 4: Cinematic Realism [CURRENT]
**Directivity**: High-fidelity plant humanoid assets with anatomical rigging and professional cinematography.

### ✨ Key Features
- **Botanical Anatomy**: Full rigging for hands, fingers, toes, and ears.
- **Organic Mesh Welding**: Seamless joining of neck, torso, and head using BMesh smoothing and joint bulbs.
- **6-Point Lighting**: Rim, Head-Key, and Leg-Key lighting for high-contrast chroma isolation.
- **Ocular Expression**: Lavender pupils with animated jitter and responsive eyelid blinking.
- **Wind Physics**: Procedural foliage branches with wind sway (Wave modifier).
- **Cinematography**: 85mm Over-the-Shoulder (OTS) camera sequences.

### 🧪 Testing
```bash
blender --background --python scripts/blender/movie/4/tests/test_v4_comprehensive_animation.py
```

### 🎥 Rendering
```bash
blender --background --python scripts/blender/movie/4/render_scene4.py
```
**Storage Location**: `scripts/blender/movie/4/renders/`

---

## 🌿 Version 3: Procedural Environments
**Directivity**: Automated scene assembly and dialogue-driven blocking.

### ✨ Key Features
- **Dialogue Blocking**: Automated character positioning based on dialogue lines.
- **Chroma Setup**: Professional background and sky configuration for post-production.
- **Environmental Safety**: Guaranteed character visibility via procedural bounds checking.

### 🧪 Testing
```bash
blender --background --python scripts/blender/movie/3/tests/run_tests.py
```

### 🎥 Rendering
```bash
blender --background --python scripts/blender/movie/3/render_scene3.py
```
**Storage Location**: `scripts/blender/movie/3/renders/`

---

## 🍃 Version 2: The Verdant Pulse
**Directivity**: Rebooted clean-slate architecture for the Greenhouse sequel.

### ✨ Key Features
- **Zero Legacy**: Eliminates Z-shifting bugs from Version 1 through native coordinate systems.
- **Cycles-Native**: Optimized for Cycles lighting with professional color palettes.
- **Master Engine**: Centrally managed scene orchestrator via `VaultMaster`.

### 🧪 Testing / Initialization
```bash
blender --background --python scripts/blender/movie/2/run_v2.py
```

### 🎥 Rendering
```bash
blender --background --python scripts/blender/movie/2/run_v2.py -- --render
```
**Storage Location**: `scripts/blender/movie/2/renders/`

---

## 🏛️ Legacy Master Pipeline
The root-level scripts (`master.py`, `silent_movie_generator.py`) represent the original Version 1 engine. To render the legacy feature film:

```bash
blender --python silent_movie_generator.py -- --render-anim
```
**Storage Location**: `scripts/blender/movie/renders/`

---

| Feature | Legacy | V2 | V3 | V4 |
| :--- | :---: | :---: | :---: | :---: |
| Asset Fidelity | Primitive | Procedural | Stylized | Cinematic |
| Rigging | Simple | Skeletal | Blocked | Full Anatomy |
| Lighting | Default | Cycles | Chroma-Ready | 6-Point Pro |
| Camera | Static | Orchestrated | Safe-Range | Dynamic OTS |

---

## 🎞️ Post-Production: Assembling MP4 Files

After rendering, use `ffmpeg` to assemble the PNG frame sequences into MP4 files. All output goes to the root project `greenhouse_org/` directory.

### Scene 4 — Preview (fast, draft quality)
```bash
ffmpeg -framerate 24 -pattern_type glob \
  -i 'scripts/blender/movie/4/renders/scene4/preview/frame_*.png' \
  -c:v libx264 -pix_fmt yuv420p -crf 23 \
  scene4_preview.mp4
```

### Scene 4 — Review (final Eevee render)
```bash
ffmpeg -framerate 24 -pattern_type glob \
  -i 'scripts/blender/movie/4/renders/scene4/review/frame_*.png' \
  -c:v libx264 -pix_fmt yuv420p -crf 18 \
  scene4_review.mp4
```

### Scene 4 — Final (high-quality Cycles render)
```bash
ffmpeg -framerate 24 -pattern_type glob \
  -i 'scripts/blender/movie/4/renders/scene4/final/frame_*.png' \
  -c:v libx264 -pix_fmt yuv420p -crf 12 \
  scene4_final.mp4
```

### All scenes — Combined feature film
```bash
# First generate a concat list
for f in scripts/blender/movie/4/renders/scene4/final/frame_*.png; do
  echo "file '$PWD/$f'"
done > /tmp/scene4_frames.txt

ffmpeg -f concat -safe 0 -i /tmp/scene4_frames.txt \
  -c:v libx264 -pix_fmt yuv420p -crf 12 \
  greenhouse_movie.mp4
```

> **Note**: Run all ffmpeg commands from the `greenhouse_org/` root directory. The `crf` value controls quality: lower = higher quality (12 = near lossless, 23 = standard, 28 = compressed).
