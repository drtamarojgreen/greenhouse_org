#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: source_rig_consistency_audit
// @Requires source_rig_consistency = true
// @Results mesh_entity_count, missing_rig_count, missing_rigs, source_rig_consistency
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("source_rig.facts");
    if (!require_fact(facts, "source_rig_consistency", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    int mesh_entity_count = 0;
    std::vector<std::string> missing_rigs;
    bool in_entities = false;
    std::string line, current_id, current_type, current_mesh, current_rig;

    auto flush = [&]() {
        if (current_type == "MESH" && !current_mesh.empty()) {
            mesh_entity_count++;
            if (current_rig.empty()) {
                missing_rigs.push_back(current_id);
                std::cerr << "[FAIL] MESH entity '" << current_id << "' has source_mesh but no source_rig." << std::endl;
            }
        }
        current_id = ""; current_type = ""; current_mesh = ""; current_rig = "";
    };

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) in_entities = true;
        if (in_entities && line.find("\"storyline\":") != std::string::npos) { flush(); break; }
        if (in_entities) {
            if (line.find("\"id\":") != std::string::npos && line.find("geometry") == std::string::npos) {
                flush();
                size_t open = line.find('\"', line.find(':')) + 1;
                current_id = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"type\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_type = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"source_mesh\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_mesh = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"source_rig\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_rig = line.substr(open, line.find('\"', open) - open);
            }
        }
    }

    bool ok = missing_rigs.empty();
    std::cout << "mesh_entity_count = " << mesh_entity_count << std::endl;
    std::cout << "missing_rig_count = " << missing_rigs.size() << std::endl;
    if (!missing_rigs.empty()) { std::cout << "missing_rigs = "; for (const auto& s : missing_rigs) std::cout << s << " "; std::cout << std::endl; }
    std::cout << "source_rig_consistency = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
