#include <vector>
#include <string>
#include <fstream>
#include "GeometryCore.hpp"

// Point 165: Native Binary Mesh Loader
namespace BModeler {
    class MeshLoader {
    public:
        static bool load_gmesh(Mesh& mesh, const std::string& path) {
            std::ifstream file(path, std::ios::binary);
            if (!file) return false;

            int v_count, f_count;
            file.read((char*)&v_count, sizeof(int));
            file.read((char*)&f_count, sizeof(int));

            mesh.vertices.resize(v_count);
            for (int i = 0; i < v_count; ++i) {
                file.read((char*)&mesh.vertices[i].co, sizeof(float) * 3);
                mesh.vertices[i].id = i;
            }

            for (int i = 0; i < f_count; ++i) {
                int sides;
                file.read((char*)&sides, sizeof(int));
                std::vector<int> vids(sides);
                file.read((char*)vids.data(), sizeof(int) * sides);
                mesh.faces.push_back({vids});
            }
            return true;
        }
    };
}
