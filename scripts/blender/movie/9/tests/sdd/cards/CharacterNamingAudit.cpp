#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: character_naming_convention
// @Requires character_naming_compliance = true
// @Results character_count, character_naming_compliance
// Only checks entities identified as characters: has source_rig, is_protagonist, or is_antagonist

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("character_naming.facts");
    if (!require_fact(facts, "character_naming_compliance", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    // Title_Case: each word starts uppercase, words joined by underscores
    // e.g. Shadow_Weaver, Herbaceous, Root_Guardian
    std::regex title_case_regex("^([A-Z][a-z0-9]*)(_[A-Z][a-z0-9]*)*$");

    std::string line, current_id, current_type;
    bool in_entities = false;
    int character_count = 0;
    std::vector<std::string> failing;

    // Two-pass: collect all entity data then evaluate
    struct EntityRecord { std::string id, type; bool has_rig, is_character; };
    std::vector<EntityRecord> entities;
    EntityRecord current{};

    auto flush = [&]() {
        if (!current.id.empty()) entities.push_back(current);
        current = EntityRecord{};
    };

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) in_entities = true;
        if (in_entities && line.find("\"storyline\":") != std::string::npos) { flush(); break; }
        if (in_entities) {
            if (line.find("\"id\":") != std::string::npos && line.find("geometry") == std::string::npos) {
                flush();
                size_t open = line.find('\"', line.find(':')) + 1;
                current.id = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"type\":") != std::string::npos && !current.id.empty()) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current.type = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"source_rig\":") != std::string::npos) current.has_rig = true;
            if (line.find("\"is_protagonist\":") != std::string::npos ||
                line.find("\"is_antagonist\":") != std::string::npos) current.is_character = true;
        }
    }

    for (const auto& e : entities) {
        // A character is rigged or explicitly tagged
        if (!e.has_rig && !e.is_character) continue;
        character_count++;
        if (!std::regex_match(e.id, title_case_regex)) {
            failing.push_back(e.id);
            std::cerr << "[FAIL] Character '" << e.id << "' must be Title_Case." << std::endl;
        }
    }

    bool ok = failing.empty();
    std::cout << "character_count = " << character_count << std::endl;
    std::cout << "character_naming_compliance = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
