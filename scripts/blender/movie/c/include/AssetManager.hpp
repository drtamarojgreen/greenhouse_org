#ifndef ASSET_MANAGER_HPP
#define ASSET_MANAGER_HPP

#include <iostream>
#include <map>
#include <string>
#include <vector>
#include <filesystem>
#include "MeshLoader.hpp"

// C++ Native Asset Manager
// Automatically loads all .gmesh files for the 15,000-frame production
class AssetManager {
public:
    std::map<std::string, BModeler::Mesh> assets;

    void load_all(const std::string& directory) {
        std::cout << "[C++ AssetManager] Scanning " << directory << " for Greenhouse assets..." << std::endl;
        
        for (const auto& entry : std::filesystem::directory_iterator(directory)) {
            if (entry.path().extension() == ".gmesh") {
                std::string name = entry.path().stem().string();
                BModeler::Mesh mesh;
                if (BModeler::MeshLoader::load_gmesh(mesh, entry.path().string())) {
                    assets[name] = std::move(mesh);
                    std::cout << "  - Loaded asset: " << name << " (" << assets[name].vertices.size() << " verts)" << std::endl;
                }
            }
        }
        std::cout << "[C++ AssetManager] Loading complete. Total assets: " << assets.size() << std::endl;
    }

    const BModeler::Mesh* get_asset(const std::string& name) const {
        auto it = assets.find(name);
        return (it != assets.end()) ? &it->second : nullptr;
    }
};

#endif
