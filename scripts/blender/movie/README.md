# 🎬 Greenhouse Movie Production Pipeline

This directory contains the procedural generation and rendering pipeline for the Greenhouse Mental Health movie project.

## 🏗️ Architecture

-   **`master.py`**: Contains `BaseMaster`, the foundation for all production masters.
-   **`silent_movie_generator.py`**: The primary master for the main feature film.
-   **`sequel_generator.py`**: Master for the action-oriented sequel.
-   **`constants.py`**: Canonical source for `SCENE_MAP` and quality presets.
-   **`style.py`**: Shared animation, shading, and cinematography utilities.
-   **`assets/`**: Procedural model generators for characters and props.
-   **`sceneXX_.../`**: Scene-specific logic modules.

## 🚀 Getting Started

To generate the movie in Blender:

```bash
blender --python silent_movie_generator.py -- --render-anim
```

To render a specific scene:

```bash
blender --python silent_movie_generator.py -- --scene garden --render-anim
```

## 🧪 Testing

Run the Blender test suite:

```bash
python3 run_blender_tests.py
```
