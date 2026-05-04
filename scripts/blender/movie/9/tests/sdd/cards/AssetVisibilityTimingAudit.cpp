#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

struct VisibilityRange {
    int start = -1;
    int end = -1;
    bool visible = true;
};

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

    std::cout << "--- Visibility Timing Report ---" << std::endl;

    // Very basic parsing to find visibility actions
    size_t pos = 0;
    while ((pos = content.find("\"action\": \"visibility\"", pos)) != std::string::npos) {
        // Look backwards for target
        size_t target_pos = content.rfind("\"target\":", pos);
        size_t id_start = content.find("\"", target_pos + 9) + 1;
        size_t id_end = content.find("\"", id_start);
        std::string target = content.substr(id_start, id_end - id_start);

        // Look forwards for params
        size_t params_pos = content.find("\"params\":", pos);
        size_t visible_at_pos = content.find("\"visible_at\":", params_pos);
        size_t hidden_at_pos = content.find("\"hidden_at\":", params_pos);

        std::cout << "Entity: " << target << std::endl;
        if (visible_at_pos != std::string::npos && visible_at_pos < content.find("}", params_pos)) {
            size_t val_start = content.find_first_of("0123456789", visible_at_pos);
            size_t val_end = content.find_first_of(", \n\r}", val_start);
            std::cout << "  Visible at frame: " << content.substr(val_start, val_end - val_start) << std::endl;
        }
        if (hidden_at_pos != std::string::npos && hidden_at_pos < content.find("}", params_pos)) {
            size_t val_start = content.find_first_of("0123456789", hidden_at_pos);
            size_t val_end = content.find_first_of(", \n\r}", val_start);
            std::cout << "  Hidden at frame: " << content.substr(val_start, val_end - val_start) << std::endl;
        }
        pos += 20;
    }

    std::cout << "--- End of Visibility Report ---" << std::endl;
    return 0;
}
