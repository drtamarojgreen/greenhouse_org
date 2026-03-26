#include <iostream>
#include <vector>
#include <thread>
#include <mutex>
#include <queue>
#include <chrono>
#include <sys/stat.h>
#include <unistd.h>

using namespace std;

struct RenderChunk { int start, end; string subdir; };
mutex mtx;
queue<RenderChunk> taskQueue;

void render_worker(int id, string blender_path, string bridge_script) {
    while (true) {
        RenderChunk chunk;
        {
            unique_lock<mutex> lock(mtx);
            if (taskQueue.empty()) break;
            chunk = taskQueue.front();
            taskQueue.pop();
        }

        cout << "[Orchestrator] Worker " << id << " starting chunk " << chunk.start << "-" << chunk.end << endl;
        
        // Step 1: Execute C++ Engine for this range
        string engine_cmd = "./movie_core " + to_string(chunk.start) + " " + to_string(chunk.end);
        system(engine_cmd.c_str());

        // Step 2: Driven Blender Render
        string data_file = "renders/cpp_frame_data_" + to_string(chunk.start) + ".json";
        string render_cmd = blender_path + " --background --python " + bridge_script + " -- --data " + data_file;
        int status = system(render_cmd.c_str());

        if (status == 0) cout << "[Orchestrator] Chunk " << chunk.start << " SUCCESS" << endl;
        else cerr << "[Orchestrator] Chunk " << chunk.start << " FAILED" << endl;
    }
}

int main(int argc, char* argv[]) {
    string blender_bin = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/blender-5.1.0-linux-x64/blender";
    string bridge_script = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/render_bridge.py";
    
    // Test Range
    taskQueue.push({1, 2, "test_chunk"});
    
    cout << "--- C++ Multi-Threaded Orchestrator (No Python Core) ---" << endl;
    thread t1(render_worker, 0, blender_bin, bridge_script);
    t1.join();
    
    return 0;
}
