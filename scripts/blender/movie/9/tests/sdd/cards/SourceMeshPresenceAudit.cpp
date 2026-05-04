#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: source_mesh_presence_audit
// @Requires source_mesh_names_unique = true
// @Requires source_mesh_names_non_empty = true
// @Results mesh_entity_count, empty_source_mesh_count, repeated_source_mesh_count, repeated_sources, source_mesh_names_unique, source_mesh_names_non_empty
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("source_mesh_presence.facts");
    if (!require_fact(facts, "source_mesh_names_unique",    "true")) return 1;
    if (!require_fact(facts, "source_mesh_names_non_empty", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::map<std::string, std::string> entity_mesh_map;
    std::map<std::string, std::vector<std::string>> mesh_to_entities;
    bool in_entities = false;
    std::string current_id, current_type, current_source_mesh;
    std::string line;

    auto flush = [&]() {
        if (!current_id.empty() && current_type == "MESH") {
            entity_mesh_map[current_id] = current_source_mesh;
            mesh_to_entities[current_source_mesh].push_back(current_id);
        }
    };

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) in_entities = true;
        if (in_entities && line.find("\"storyline\":") != std::string::npos) { flush(); break; }
        if (in_entities) {
            if (line.find("\"id\":") != std::string::npos) {
                flush();
                size_t open = line.find('\"', line.find(':')) + 1;
                current_id = line.substr(open, line.find('\"', open) - open);
                current_type = ""; current_source_mesh = "";
            }
            if (line.find("\"type\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_type = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"source_mesh\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_source_mesh = line.substr(open, line.find('\"', open) - open);
            }
        }
    }

    std::vector<std::string> empty_sources, repeated_sources;
    for (const auto& p : entity_mesh_map)
        if (p.second.empty()) { empty_sources.push_back(p.first); std::cerr << "[FAIL] '" << p.first << "' MESH has no source_mesh." << std::endl; }
    for (const auto& p : mesh_to_entities)
        if (!p.first.empty() && p.second.size() > 1) {
            repeated_sources.push_back(p.first);
            std::cerr << "[FAIL] source_mesh '" << p.first << "' reused by: ";
            for (const auto& e : p.second) std::cerr << "'" << e << "' ";
            std::cerr << std::endl;
        }

    bool names_unique     = repeated_sources.empty();
    bool names_non_empty  = empty_sources.empty();
    std::cout << "mesh_entity_count = "         << entity_mesh_map.size()  << std::endl;
    std::cout << "empty_source_mesh_count = "   << empty_sources.size()    << std::endl;
    std::cout << "repeated_source_mesh_count = " << repeated_sources.size() << std::endl;
    if (!repeated_sources.empty()) { std::cout << "repeated_sources = "; for (const auto& s : repeated_sources) std::cout << "'" << s << "' "; std::cout << std::endl; }
    std::cout << "source_mesh_names_unique = "     << (names_unique    ? "true" : "false") << std::endl;
    std::cout << "source_mesh_names_non_empty = "  << (names_non_empty ? "true" : "false") << std::endl;
    return (names_unique && names_non_empty) ? 0 : 1;
}
