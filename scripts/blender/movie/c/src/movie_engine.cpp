#include "AssetManager.hpp"

// Total C++ Production Suite (100% Asset-Aware)
int main(int argc, char* argv[]) {
    int start = (argc > 1) ? std::stoi(argv[1]) : 1;
    int end = (argc > 2) ? std::stoi(argv[2]) : 10;

    std::vector<SceneNode*> timeline = SceneLoader::load_config("scenes.config");
    Renderer renderer(1280, 720);
    
    // Total Asset Ingestion: Load everything from Python-to-C++ conversion bridge
    AssetManager manager;
    manager.load_all("assets");

    std::filesystem::create_directories("renders/frames");
    std::cout << "[C++ Movie Suite] Production ready. Total assets loaded: " << manager.assets.size() << std::endl;

    for (int f = start; f <= end; ++f) {
        std::map<std::string, float> states;
        for (auto scene : timeline) scene->animate(f, states);

        renderer.clear();
        
        // Render all actors and structures in the native pool
        for (auto& [name, mesh] : manager.assets) {
            float lx = states[name + "_lx"];
            float lz = states[name + "_lz"];
            
            mesh.transform(lx, 0, lz);
            renderer.render_mesh(mesh);
            mesh.transform(-lx, 0, -lz); // State reset
        }

    for (int f = start; f <= end; ++f) {
        std::map<std::string, float> states;
        for (auto scene : timeline) scene->animate(f, states);

        renderer.clear();
        
        // Render characters from asset pool
        for (auto& [name, mesh] : assets) {
            float lx = states[name + "_lx"];
            float lz = states[name + "_lz"];
            
            // Temporary transform (modifies mesh in-place for rasterization)
            mesh.transform(lx, 0, lz);
            renderer.render_mesh(mesh);
            mesh.transform(-lx, 0, -lz); // Reset
        }
        
        char filename[128];
        sprintf(filename, "renders/frames/frame_%05d.ppm", f);
        renderer.save_ppm(filename);
    }
        
        char filename[128];
        sprintf(filename, "renders/frames/frame_%05d.ppm", f);
        renderer.save_ppm(filename);
        
        if (f % 100 == 0) std::cout << "Rendered frame " << f << std::endl;
    }

    for (auto s : timeline) delete s;
    return 0;
}
