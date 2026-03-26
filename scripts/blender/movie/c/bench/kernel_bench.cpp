#include <iostream>
#include <chrono>
#include <vector>
#include "MathCore.hpp"
#include "GeometryCore.hpp"

// Benchmarking Kernel: Noise Generation
void bench_noise() {
    auto start = std::chrono::high_resolution_clock::now();
    float total = 0;
    for (int i = 0; i < 1000000; ++i) {
        total += MovieMath::looping_noise(i, 48.0f, 0.05f);
    }
    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> diff = end - start;
    std::cout << "[BENCH] Noise (1M iterations): " << diff.count() << "s (total=" << total << ")" << std::endl;
}

// Benchmarking Kernel: Mesh Transform (SoA vs AoS)
void bench_transform() {
    BModeler::Mesh mesh;
    for (int i = 0; i < 100000; ++i) {
        mesh.add_vertex(1.0f, 2.0f, 3.0f);
    }

    auto start = std::chrono::high_resolution_clock::now();
    for (int i = 0; i < 100; ++i) {
        mesh.transform(0.1f, 0.2f, 0.3f);
    }
    auto end = std::chrono::high_resolution_clock::now();
    std::chrono::duration<double> diff = end - start;
    std::cout << "[BENCH] Transform 100k vertices (100x): " << diff.count() << "s" << std::endl;
}

int main() {
    std::cout << "--- Greenhouse Movie Engine Microbenchmarks ---" << std::endl;
    bench_noise();
    bench_transform();
    return 0;
}
