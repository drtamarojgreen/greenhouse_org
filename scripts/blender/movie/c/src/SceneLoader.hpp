#include <iostream>
#include <vector>
#include <fstream>
#include <sstream>
#include "SceneNodes.hpp"

// Data-Driven Master Loader
class SceneLoader {
public:
    static std::vector<SceneNode*> load_config(const std::string& path) {
        std::vector<SceneNode*> timeline;
        std::ifstream file(path);
        std::string line;

        while (std::getline(file, line)) {
            if (line.empty() || line[0] == '#') continue;
            std::stringstream ss(line);
            std::string name, actor, prop, type_str;
            int start, end;
            float intensity, scale, offset;

            if (ss >> name >> start >> end >> actor >> prop >> type_str >> intensity >> scale >> offset) {
                SceneParams p = {start, end, actor, prop, AnimType::LINEAR, intensity, scale, offset};
                
                if (type_str == "PULSE") {
                    timeline.push_back(new TemplatedScene<AnimType::PULSE>(p));
                } else if (type_str == "EASE") {
                    timeline.push_back(new TemplatedScene<AnimType::EASE>(p));
                } else if (type_str == "LINEAR") {
                    timeline.push_back(new TemplatedScene<AnimType::LINEAR>(p));
                } else if (type_str == "NOISE") {
                    timeline.push_back(new TemplatedScene<AnimType::NOISE>(p));
                } else if (type_str == "RAMP") {
                    timeline.push_back(new TemplatedScene<AnimType::RAMP>(p));
                } else if (type_str == "STEP") {
                    timeline.push_back(new TemplatedScene<AnimType::STEP>(p));
                } else if (type_str == "SPIRAL") {
                    timeline.push_back(new TemplatedScene<AnimType::SPIRAL>(p));
                }
            }
        }
        return timeline;
    }
};
