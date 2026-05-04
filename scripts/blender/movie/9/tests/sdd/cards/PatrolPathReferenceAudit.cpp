#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <set>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: patrol_path_reference_audit
// @Requires patrol_paths_valid = true
// @Results patrol_usage_count, missing_path_count, missing_paths, patrol_paths_valid
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("patrol_path.facts");
    if (!require_fact(facts, "patrol_paths_valid", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::set<std::string> defined_paths;
    std::vector<std::pair<std::string, std::string>> entity_path_refs; // {entity_id, path_name}
    bool in_patrol_paths = false, in_entities = false;
    std::string line, current_id;

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) { in_entities = true; in_patrol_paths = false; }
        if (line.find("\"patrol_paths\":") != std::string::npos) { in_patrol_paths = true; in_entities = false; }

        if (in_entities) {
            if (line.find("\"id\":") != std::string::npos && line.find("geometry") == std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_id = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"path\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                std::string path_name = line.substr(open, line.find('\"', open) - open);
                entity_path_refs.push_back({current_id, path_name});
            }
        }

        if (in_patrol_paths) {
            size_t colon_pos = line.find("\": {");
            if (colon_pos != std::string::npos) {
                size_t open = line.find_last_of('\"', colon_pos - 1);
                defined_paths.insert(line.substr(open + 1, colon_pos - open - 1));
            }
        }

        if (line.find("\"extended_scenes\":") != std::string::npos) break;
    }

    int missing_count = 0;
    std::vector<std::string> missing;
    for (const auto& ref : entity_path_refs) {
        if (defined_paths.find(ref.second) == defined_paths.end()) {
            missing_count++;
            missing.push_back(ref.first + "->" + ref.second);
            std::cerr << "[FAIL] Entity '" << ref.first << "' references unknown patrol path '" << ref.second << "'" << std::endl;
        }
    }

    bool ok = missing_count == 0;
    std::cout << "patrol_usage_count = " << entity_path_refs.size() << std::endl;
    std::cout << "missing_path_count = " << missing_count << std::endl;
    if (!missing.empty()) { std::cout << "missing_paths = "; for (const auto& m : missing) std::cout << m << " "; std::cout << std::endl; }
    std::cout << "patrol_paths_valid = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
