#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: camera_naming_convention
// @Requires camera_naming_compliance = true
// @Results camera_naming_compliance = true|false
void verify_camera_naming(const std::string& lc_path) {
    std::ifstream file(lc_path);
    bool all_ok = true;
    std::vector<std::string> failing;
    std::regex sentence_case_regex("^[A-Z][a-z0-9]*(_[a-z0-9]+)*$");

    if (!file.is_open()) {
        std::cerr << "[ERROR] Cannot open " << lc_path << std::endl;
        std::cout << "camera_naming_compliance = false" << std::endl;
        return;
    }

    std::string line;
    bool in_cameras = false, in_lighting = false, in_calligraphy = false;
    while (std::getline(file, line)) {
        if (line.find("\"cameras\":") != std::string::npos) { in_cameras = true; in_lighting = false; in_calligraphy = false; }
        if (line.find("\"lighting\":") != std::string::npos) { in_lighting = true; in_cameras = false; in_calligraphy = false; }
        if (line.find("\"calligraphy\":") != std::string::npos) { in_calligraphy = true; in_lighting = false; in_cameras = false; }
        
        if (in_cameras && line.find("\"id\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            size_t close = line.find('\"', open);
            std::string id = line.substr(open, close - open);
            if (id.find("focus_") == 0 || id.find("lighting_") == 0 || id.find("diag_") == 0) continue;
            if (!std::regex_match(id, sentence_case_regex)) {
                all_ok = false;
                failing.push_back(id);
            }
        }
        
        // Stop camera block if we hit another top-level key
        if (in_cameras && line.find("],") != std::string::npos) in_cameras = false;
    }

    if (!all_ok) {
        std::cerr << "[FAIL] Cameras must be Sentence_case. Failing IDs: ";
        for (const auto& f : failing) std::cerr << "'" << f << "' ";
        std::cerr << std::endl;
    }
    std::cout << "camera_naming_compliance = " << (all_ok ? "true" : "false") << std::endl;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("camera_naming.facts");
    if (!require_fact(facts, "camera_naming_compliance", "true")) return 1;
    verify_camera_naming(env.at("lights_camera_path"));
    return 0;
}
