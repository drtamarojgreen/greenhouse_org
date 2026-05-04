#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: unique_entity_id_audit
// @Requires entity_ids_unique = true
// @Results entity_count, duplicate_count, duplicates, entity_ids_unique
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("unique_entity_ids.facts");
    if (!require_fact(facts, "entity_ids_unique", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) {
        std::cerr << "[ERROR] Cannot open " << config_path << std::endl;
        return 1;
    }

    std::map<std::string, int> id_count;
    bool in_entities = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) in_entities = true;
        if (in_entities && line.find("\"storyline\":") != std::string::npos) break;
        if (in_entities && line.find("\"id\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            size_t close = line.find('\"', open);
            id_count[line.substr(open, close - open)]++;
        }
    }

    std::vector<std::string> duplicates;
    for (const auto& p : id_count)
        if (p.second > 1) { duplicates.push_back(p.first); std::cerr << "[FAIL] Duplicate entity ID: '" << p.first << "'" << std::endl; }

    bool unique = duplicates.empty();
    std::cout << "entity_count = " << id_count.size() << std::endl;
    std::cout << "duplicate_count = " << duplicates.size() << std::endl;
    if (!duplicates.empty()) { std::cout << "duplicates = "; for (const auto& d : duplicates) std::cout << d << " "; std::cout << std::endl; }
    std::cout << "entity_ids_unique = " << (unique ? "true" : "false") << std::endl;
    return unique ? 0 : 1;
}
