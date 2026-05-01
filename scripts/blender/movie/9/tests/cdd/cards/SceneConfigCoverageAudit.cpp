#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Chai::Cdd::Util;

// @Card: scene_config_coverage_audit
// @Requires extended_scenes_present = true
// @Results extended_scene_count, missing_count, missing_files, extended_scenes_present
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("scene_config_coverage.facts");
    if (!require_fact(facts, "extended_scenes_present", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    fs::path m9_root = fs::path(config_path).parent_path();

    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::vector<std::string> declared, missing;
    bool in_extended = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"extended_scenes\":") != std::string::npos) { in_extended = true; continue; }
        if (in_extended && line.find("]") != std::string::npos) break;
        if (in_extended && line.find('\"') != std::string::npos) {
            size_t open  = line.find('\"') + 1;
            size_t close = line.rfind('\"');
            if (close > open) {
                std::string scene_path = line.substr(open, close - open);
                if (!scene_path.empty()) {
                    declared.push_back(scene_path);
                    fs::path full = m9_root / scene_path;
                    if (!fs::exists(full)) {
                        missing.push_back(scene_path);
                        std::cerr << "[FAIL] Missing on disk: '" << full.string() << "'" << std::endl;
                    }
                }
            }
        }
    }

    bool present = missing.empty();
    std::cout << "extended_scene_count = " << declared.size() << std::endl;
    std::cout << "missing_count = "        << missing.size()  << std::endl;
    if (!missing.empty()) { std::cout << "missing_files = "; for (const auto& m : missing) std::cout << "'" << m << "' "; std::cout << std::endl; }
    std::cout << "extended_scenes_present = " << (present ? "true" : "false") << std::endl;
    return present ? 0 : 1;
}
