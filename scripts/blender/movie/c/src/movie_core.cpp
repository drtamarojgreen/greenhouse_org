#include <iostream>
#include <vector>
#include <map>
#include <string>
#include <fstream>
#include <cmath>
#include <memory>
#include <algorithm>

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
        return sin(f / scale) * str;
    }

    // Logic Port: Scene 02 Garden (from garden_logic.py)
    void port_garden(int f, map<string, State>& actors) {
        if (f >= 401 && f <= 700) {
            State& h = actors["Herbaceous"];
            h.vis = true;
            h.loc = {0, 0, 0};
            h.scale.z = 1.0f + get_noise(f, 48.0f, 0.05f); // Ported Breathing
        }
    }

    // Logic Port: Scene 07 Shadow (from shadow_logic.py)
    void port_shadow(int f, map<string, State>& actors) {
        if (f >= 1300 && f <= 1600) {
            State& g = actors["GloomGnome"];
            g.vis = true;
            g.loc.y = (f - 1300) * 0.05f; // Constant movement
        }
    }

    void execute(int start, int end, string output_bin) {
        ofstream out(output_bin, ios::binary);
        // Header: Number of frames
        int frame_count = end - start + 1;
        out.write((char*)&frame_count, sizeof(int));

        for (int f = start; f <= end; ++f) {
            map<string, State> actors;
            // Defaults (Zeroing Python dictionaries)
            actors["Herbaceous"] = {{0,0,0}, {0,0,0}, {1,1,1}, false};
            actors["GloomGnome"] = {{0,0,0}, {0,0,0}, {1,1,1}, false};

            port_garden(f, actors);
            port_shadow(f, actors);

            // Write Binary Instruction Packet
            for (auto const& [name, s] : actors) {
                out.write((char*)&s.loc, sizeof(Vector3));
                out.write((char*)&s.rot, sizeof(Vector3));
                out.write((char*)&s.scale, sizeof(Vector3));
                out.write((char*)&s.vis, sizeof(bool));
            }
        }
    }
};

int main(int argc, char* argv[]) {
    int start = (argc > 1) ? stoi(argv[1]) : 1;
    int end = (argc > 2) ? stoi(argv[2]) : 200;

    MovieCore engine;
    string path = "renders/movie_logic_" + to_string(start) + ".bin";
    cout << "[C++ Movie Core] Compiling logic for frames " << start << "-" << end << "..." << endl;
    engine.execute(start, end, path);
    cout << "[C++ Movie Core] Logic binary saved: " << path << endl;

    return 0;
}
