# 🎮 Movie 8: Unity Integration & Asset Pipeline

## Overview
Movie 8 represents the transition from procedural rendering in Blender to real-time interactive experiences in Unity. This module provides the bridge between the high-fidelity anatomical rigs of Movie 7 and the performance requirements of a gaming environment.

---

## 🏗️ Asset Pipeline (`asset_exporter.py`)

The pipeline automates the transformation of Blender scenes into Unity-ready assets.

### Key Features:
- **LOD Generation**: Automatically creates LOD0 (100%), LOD1 (50%), and LOD2 (25%) versions of characters.
- **Mesh Joining**: Environment collections (`7b.ENVIRONMENT`, etc.) are joined into single meshes to minimize draw calls.
- **Metadata Injection**: Generates JSON sidecars for each character containing bounding boxes and collider data.
- **Level Layout**: Exports character positions, camera spawn points, and waypoints to `LevelLayout.json`.

### Psychological Rationale:
- **LODs as Cognitive Focus**: Objects further from the observer lose detail, mirroring how the subconscious processes peripheral information vs. conscious focus.
- **Integrated Environments**: Joining meshes represents the 'gestalt' of mental models - individual components forming a cohesive world-state.

---

## 🕹️ Unity Integration (`unity_src/`)

### 1. `Movie8GameManager.cs`
The central nervous system of the Unity scene. It:
- Parses `AssetManifest.json` and `LevelLayout.json`.
- Dynamically instantiates characters at their Blender-defined coordinates.
- Manages the transition between story beats.

### 2. `PlayerController.cs`
Handles user interaction with an emphasis on **Organic Motion**:
- Uses `SmoothDamp` for velocity transitions.
- **Creative Constraint**: Avoids mechanical linear acceleration, favoring biological-style ease-in and ease-out to promote a sense of calm and natural flow.

### 3. `DialogueSystem.cs`
A decoupled UI system for displaying mental insights and character interactions.

---

## 🧪 Testing

To verify the export pipeline without opening the Blender UI:

```bash
# Functional Integrity Tests
blender --background --python scripts/blender/movie/8/tests/test_exporter.py

# Performance & Optimization Tests
blender --background --python scripts/blender/movie/8/tests/test_performance.py
```

## 📊 Performance Benchmarks & Validation

The Movie 8 pipeline includes rigorous performance validation to ensure assets are "game-ready":

1. **LOD Efficiency**: Tests verify that LOD1 and LOD2 significantly reduce FBX file size and polygon complexity compared to LOD0.
2. **Draw Call Minimization**: Automated verification that entire environment collections are flattened into single mesh objects during export.
3. **Vertex Budgeting**: Assets are audited against a mobile-friendly vertex budget (default: 5000 vertices per character) to maintain high frame rates in Unity.

---

## 🚀 How to Export

1. Open your Movie 7/8 production file in Blender.
2. Run the exporter script:
```bash
blender --background --python scripts/blender/movie/8/asset_exporter.py
```
3. Assets will be generated in `scripts/blender/movie/8/Unity_Assets/`.
4. Copy the `Unity_Assets` folder into your Unity project's `Assets/Resources/` directory.
