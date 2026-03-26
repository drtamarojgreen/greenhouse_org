#ifndef THREADING_H
#define THREADING_H

#include <mutex>

// Greenhouse Movie Engine Threading Model
// 1. Core logic (SceneNode::animate) is thread-safe and can run in parallel.
// 2. Blender-specific operators must stay on the main thread.
// 3. AssetManager loading is I/O bound and should be single-threaded or gated.

namespace Movie {
    class Threading {
    public:
        // Global lock for any non-thread-safe Blender bridge operations
        static std::mutex blender_mtx;

        // Assertion to help during debug builds
        static void assert_main_thread() {
            // Placeholder: real implementation would check thread ID
        }
    };
}

#endif
