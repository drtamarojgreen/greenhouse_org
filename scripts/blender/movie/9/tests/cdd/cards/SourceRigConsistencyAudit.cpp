#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <vector>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: source_rig_consistency_audit
// @Requires mesh_source_rig_required = true
// @Requires mesh_source_rig_non_empty = true
// @Results mesh_entity_count, missing_source_rig_count, empty_source_rig_count, missing_source_rig_entities, empty_source_rig_entities, mesh_source_rig_required, mesh_source_rig_non_empty
int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("source_rig_consistency.facts");

    if (!require_fact(facts, "mesh_source_rig_required", "true")) return 1;
    if (!require_fact(facts, "mesh_source_rig_non_empty", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) {
        std::cerr << "[ERROR] Cannot open " << config_path << std::endl;
        return 1;
    }

    bool in_entities = false;
    std::string line;
    std::string current_id;
    std::string current_type;
    bool has_source_rig = false;
    std::string source_rig_value;

    int mesh_entity_count = 0;
    std::vector<std::string> missing_source_rig_entities;
    std::vector<std::string> empty_source_rig_entities;

    auto flush = [&]() {
        if (!current_id.empty() && current_type == "MESH") {
            mesh_entity_count++;
            if (!has_source_rig) {
                missing_source_rig_entities.push_back(current_id);
                std::cerr << "[FAIL] '" << current_id << "' MESH is missing source_rig." << std::endl;
            } else if (trim(source_rig_value).empty()) {
                empty_source_rig_entities.push_back(current_id);
                std::cerr << "[FAIL] '" << current_id << "' MESH has empty source_rig." << std::endl;
            }
        }
    };

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) in_entities = true;
        if (in_entities && line.find("\"storyline\":") != std::string::npos) {
            flush();
            break;
        }

        if (!in_entities) continue;

        if (line.find("\"id\":") != std::string::npos) {
            flush();
            size_t open = line.find('"', line.find(':')) + 1;
            current_id = line.substr(open, line.find('"', open) - open);
            current_type.clear();
            has_source_rig = false;
            source_rig_value.clear();
        }
        if (line.find("\"type\":") != std::string::npos) {
            size_t open = line.find('"', line.find(':')) + 1;
            current_type = line.substr(open, line.find('"', open) - open);
        }
        if (line.find("\"source_rig\":") != std::string::npos) {
            size_t open = line.find('"', line.find(':')) + 1;
            source_rig_value = line.substr(open, line.find('"', open) - open);
            has_source_rig = true;
        }
    }

    bool rig_required = missing_source_rig_entities.empty();
    bool rig_non_empty = empty_source_rig_entities.empty();

    std::cout << "mesh_entity_count = " << mesh_entity_count << std::endl;
    std::cout << "missing_source_rig_count = " << missing_source_rig_entities.size() << std::endl;
    if (!missing_source_rig_entities.empty()) {
        std::cout << "missing_source_rig_entities = ";
        for (const auto& id : missing_source_rig_entities) std::cout << "'" << id << "' ";
        std::cout << std::endl;
    }
    std::cout << "empty_source_rig_count = " << empty_source_rig_entities.size() << std::endl;
    if (!empty_source_rig_entities.empty()) {
        std::cout << "empty_source_rig_entities = ";
        for (const auto& id : empty_source_rig_entities) std::cout << "'" << id << "' ";
        std::cout << std::endl;
    }
    std::cout << "mesh_source_rig_required = " << (rig_required ? "true" : "false") << std::endl;
    std::cout << "mesh_source_rig_non_empty = " << (rig_non_empty ? "true" : "false") << std::endl;

    return (rig_required && rig_non_empty) ? 0 : 1;
}
