# Greenhouse C++ Engine: The Raw Truth

## What this IS
This is a **Deterministic Acting Orchestrator**. It exists to ensure that every frame of the 15,000-frame movie has a mathematically verifiable state. It replaces Python's slow logic loops with high-speed C++17 templates.

## What this IS NOT
- **It is NOT a Blender replacement.** If you expect Cycles-level lighting or Eevee-level real-time visuals, you will be disappointed.
- **The "Renderer"** is a basic software rasterizer that draws points and simple shaded primitives to a PPM file. It is a tool for *previewing coordinates*, not for final cinematic pixels.
- **The "Modeler"** is a vertex-and-face storage kernel. It handles simple extrusions and transforms, but lacks a full B-Rep or Sub-D engine.
- **"Mathematical Parity"** currently means we match the *locations and properties* defined in the acting scripts. We do not yet account for complex deformers, dual-quaternion skinning, or hair simulations found in the Blender source.

## Technical Debt & Limitations
- **No GPU**: Everything runs on the CPU.
- **PPM Output**: There is no video compression or PNG encoding; we just dump raw pixels.
- **Simple Lighting**: Our "Gouraud shader" is a 10-line dot-product approximation.

## The Aspiration
To build a trusted, 100% C++ production path where we can *eventually* drop in a real Vulkan renderer or a professional CAD kernel without re-writing the 15,000-frame acting logic.

---
*Honest Engineering. Greenhouse 2026.*
