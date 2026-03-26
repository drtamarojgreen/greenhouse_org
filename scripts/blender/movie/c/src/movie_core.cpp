#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <fstream>
#include <cmath>
#include <memory>
#include <algorithm>
#include <chrono>
#include "status.h"
#include "threading.h"

using namespace std;

// Native Vector Math
struct Vector3 { float x, y, z; };
struct State { Vector3 loc, rot, scale; bool vis; };

// Scene Management Port
struct SceneRange { int start, end; };
map<string, SceneRange> SCENES = {
    {"Branding", {1, 100}},
    {"Garden", {401, 700}},
    {"Resonance", {801, 1200}},
    {"Shadow", {1300, 1600}}
};

class MovieCore {
public:
    // Ported from style.py: insert_looping_noise
    float get_noise(int f, float scale, float str) {
        if (scale == 0.0f) return 0.0f;
        return sin(f / scale) * str;
    }

    // Logic Port: Scene 02 Garden (from garden_logic.py)
    void port_garden(int f, map<string, State>& actors) {
        if (f >= 401 && f <= 700) {
            State& h = actors["Herbaceous"];
            h.vis = true;
            h.loc = {0, 0, 0};
            h.scale.z = 1.0f + get_noise(f, 48.0f, 0.05f);
        }
    }

    // Logic Port: Scene 07 Shadow (from shadow_logic.py)
    void port_shadow(int f, map<string, State>& actors) {
        if (f >= 1300 && f <= 1600) {
            State& g = actors["GloomGnome"];
            g.vis = true;
            g.loc.y = (f - 1300) * 0.05f;
        }
    }

    Movie::Status execute(int start, int end, string output_bin) {
        auto start_time = std::chrono::high_resolution_clock::now();

        if (start < 0 || end < 0 || start > end) {
            return {Movie::StatusCode::INVALID_ARGUMENT, "Invalid frame range"};
        }

        ofstream out(output_bin, ios::binary);
        if (!out) {
            return {Movie::StatusCode::NOT_FOUND, "Could not open output file"};
        }

        int frame_count = end - start + 1;
        out.write((char*)&frame_count, sizeof(int));

        for (int f = start; f <= end; ++f) {
            map<string, State> actors;
            actors["Herbaceous"] = {{0,0,0}, {0,0,0}, {1,1,1}, false};
            actors["GloomGnome"] = {{0,0,0}, {0,0,0}, {1,1,1}, false};

            port_garden(f, actors);
            port_shadow(f, actors);

            for (auto const& [name, s] : actors) {
                out.write((char*)&s.loc, sizeof(Vector3));
                out.write((char*)&s.rot, sizeof(Vector3));
                out.write((char*)&s.scale, sizeof(Vector3));
                out.write((char*)&s.vis, sizeof(bool));
            }

            if (f % 500 == 0) {
                cout << "[C++ Movie Core] Processed frame " << f << endl;
            }
        }

        auto end_time = std::chrono::high_resolution_clock::now();
        std::chrono::duration<double> diff = end_time - start_time;

        // Structured Metric Export
        cout << "[METRIC] execution_time_sec=" << diff.count() << endl;
        cout << "[METRIC] frames_processed=" << frame_count << endl;
        cout << "[METRIC] avg_ms_per_frame=" << (diff.count() * 1000.0 / frame_count) << endl;

        return Movie::Status::OK();
    }
};

int main(int argc, char* argv[]) {
    int start = (argc > 1) ? stoi(argv[1]) : 1;
    int end = (argc > 2) ? stoi(argv[2]) : 200;

    MovieCore engine;
    string path = "renders/movie_logic_" + to_string(start) + ".bin";
    cout << "[C++ Movie Core] Starting logic compilation for frames " << start << "-" << end << "..." << endl;
    auto status = engine.execute(start, end, path);
    if (!status.ok()) {
        cerr << "[C++ Movie Core] Error: " << status.message << endl;
        return 1;
    }
    cout << "[C++ Movie Core] Done. Result: " << path << endl;

    return 0;
}
