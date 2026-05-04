# Greenhouse Movie Engine: C++ Production Layer

This directory contains the high-performance C++17 core for the Greenhouse Movie production pipeline. It provides deterministic animation orchestration, geometry optimization (SoA), and a robust verification suite.

## 🏗️ Building the Project

The project uses CMake for cross-platform builds.

### Prerequisites
- **Compiler**: C++17 compatible (g++ 9+, clang 10+, MSVC 2019+)
- **Build System**: CMake 3.10+

### Build Steps

1. **Bootstrap the environment**:
   ```bash
   ./bootstrap.sh
   ```

2. **Configure and Build**:
   ```bash
   mkdir build && cd build
   cmake .. -DCMAKE_BUILD_TYPE=Release
   make -j$(nproc)
   ```

### Build Options
- `-DENABLE_SANITIZERS=ON`: Enables Address and Undefined Behavior Sanitizers (Debug builds only).
- `-DENABLE_PROFILING=ON`: Enables gprof profiling instrumentation.

## 🧪 Testing and Verification

We utilize **Sorrel-Driven Development (SDD): Standardizing of Resilient and Reliable Equipment Learning** to maintain strict parity between cinematic vision and logical implementation.

### 1. Running the Full Suite
From the `build/` directory, you can run all unit tests:
```bash
./core_unit_tests
```

### 2. Executing Sorrel Verification Cards
Sorrel cards are specialized test executables that validate logic against `.facts` ground truth files.

**Example: Validate Camera Cinematography**
```bash
./CameraValidationCards ../tests/facts/camera_branding.facts
```

**Example: Validate Asset Placement**
```bash
./PlacementValidationCards ../tests/facts/placement_garden.facts
```

**Example: Validate Chromatic Accuracy (Colors)**
```bash
./ColorValidationCards ../tests/facts/color_branding.facts
```

## 📈 Performance Benchmarking
To run the microbenchmark suite and verify kernel optimizations:
```bash
./kernel_bench
```

## 📂 Directory Structure
- `src/`: Core engine implementation.
- `include/`: Public headers and shared interfaces.
- `tests/cards/`: Sorrel verification card implementations.
- `tests/facts/`: Data-driven ground truth definitions.
- `bench/`: Performance microbenchmarks.
- `cmake/`: Modular build configurations.
- `docs/`: Architectural documentation.

---
*Precision. Reliability. Greenhouse 2026.*
