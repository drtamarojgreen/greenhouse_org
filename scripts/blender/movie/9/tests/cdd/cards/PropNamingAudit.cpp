#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: prop_naming_audit
// @Requires prop_naming_compliance = true
// @Results prop_count, prop_naming_compliance
// Props: DYNAMIC entities with no source_rig and no is_protagonist/is_antagonist flag

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("prop_naming.facts");
    if (!require_fact(facts, "prop_naming_compliance", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    // lower_case_underscore: only lowercase letters, digits, underscores
    std::regex lower_under_regex("^[a-z][a-z0-9_]*$");

    struct EntityRecord { std::string id, type; bool has_rig = false, is_character = false; };
    std::vector<EntityRecord> entities;
    EntityRecord current{};
    bool in_entities = false;

    auto flush = [&]() { if (!current.id.empty()) entities.push_back(current); current = EntityRecord{}; };

    std::string line;
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

    int prop_count = 0;
    std::vector<std::string> failing;
    for (const auto& e : entities) {
        // Props: not a character entity
        if (e.has_rig || e.is_character) continue;
        prop_count++;
        // Convert to lowercase for comparison
        std::string lower_id = e.id;
        for (char& c : lower_id) c = std::tolower(c);

        if (!std::regex_match(lower_id, lower_under_regex) || e.id != lower_id) {
            failing.push_back(e.id);
            std::cerr << "[FAIL] Prop '" << e.id << "' must be lower_case_underscore (e.g. water_can)." << std::endl;
        }
    }

    bool ok = failing.empty();
    std::cout << "prop_count = " << prop_count << std::endl;
    std::cout << "prop_naming_compliance = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
