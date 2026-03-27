# Greenhouse Movie Engine: Verification & Validation Suite

## Overview: Chai-Driven Development (CDD)

The Greenhouse Movie Engine utilizes a rigorous **Chai-Driven Development (CDD)** methodology to ensure the mathematical and logical integrity of our 15,000-frame cinematic production. CDD operates on the principle of **Logical State Verification**, where high-level production requirements (Facts) are systematically compared against low-level C++ kernel outputs (Cards).

## Verification Methodology

### 1. Deterministic State Validation
Our primary objective is to guarantee that the engine produces a mathematically verifiable state for every entity in the scene hierarchy at any given temporal index (frame). This is achieved through:
- **Temporal Indexing**: Verification of transformation matrices, vertex positions, and visibility flags at discrete frame intervals.
- **Kernel-to-Fact Mapping**: Mapping C++ execution results directly to data-driven expectations defined in `.facts` files.

### 2. Functional Parity Tests
We maintain strict parity between the Blender/Python acting scripts and our accelerated C++ implementation. The suite includes:
- **Animation Integrity**: Validation of procedural noise, easing functions, and linear/quadratic ramps.
- **Mesh Operations**: Verification of SoA (Structure of Arrays) vertex transforms and geometric kernel stability.
- **Resource Constraints**: Real-time analysis of vertex budgets and memory footprints against production limits.

## Scope and Limitations

While CDD provides a robust foundation for logical correctness, it is essential to understand the boundaries of the current verification layer:
- **Logical vs. Visual Truth**: The suite validates positional and property-based data. It does not perform visual regression testing (e.g., shader artifacts, lighting inaccuracies, or rasterization glitches).
- **Static Ground Truth**: The `.facts` corpus represents the canonical production requirements. Changes to cinematic intent must be reflected in the fact-set to maintain the "Closed Loop" verification cycle.
- **Performance Benchmarking**: Logical pass/fail criteria are independent of execution latency. Performance engineering is handled via a separate microbenchmark harness in the `bench/` directory.

## Future Research & Development

Our roadmap for the verification suite includes:
- **Automated Oracle Generation**: Direct extraction of "Ground Truth" facts from Blender's dependency graph.
- **Structural Similarity (SSIM) Analysis**: Integrating automated pixel-comparison buffers to bridge the gap between logical and visual verification.
- **CI/CD Quality Gates**: Enforcing strict branch coverage and performance SLAs on every architectural commit.

---
*Precision. Reliability. Greenhouse 2026.*
