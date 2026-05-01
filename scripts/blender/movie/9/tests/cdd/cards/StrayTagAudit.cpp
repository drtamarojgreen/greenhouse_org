#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <set>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: stray_tag_audit
// @Requires storyline_targets_valid = true
// @Results entity_count, storyline_target_count, stray_target_count, stray_targets, storyline_targets_valid
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("stray_tags.facts");
    if (!require_fact(facts, "storyline_targets_valid", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::set<std::string> entity_ids;
    std::set<std::string> seen_targets;
    std::vector<std::string> stray;
    bool in_entities = false, in_storyline = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) { in_entities = true; in_storyline = false; }
        if (line.find("\"storyline\":") != std::string::npos) { in_storyline = true; in_entities = false; }
        if (in_entities && line.find("\"id\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            entity_ids.insert(line.substr(open, line.find('\"', open) - open));
        }
        if (in_storyline && line.find("\"target\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            std::string target = line.substr(open, line.find('\"', open) - open);
            seen_targets.insert(target);
            if (target != "ALL" && entity_ids.find(target) == entity_ids.end())
                stray.push_back(target);
        }
    }

    std::sort(stray.begin(), stray.end());
    stray.erase(std::unique(stray.begin(), stray.end()), stray.end());
    bool valid = stray.empty();

    if (!valid) { std::cerr << "[FAIL] Stray storyline targets: "; for (const auto& s : stray) std::cerr << "'" << s << "' "; std::cerr << std::endl; }
    std::cout << "entity_count = " << entity_ids.size() << std::endl;
    std::cout << "storyline_target_count = " << seen_targets.size() << std::endl;
    std::cout << "stray_target_count = " << stray.size() << std::endl;
    if (!stray.empty()) { std::cout << "stray_targets = "; for (const auto& s : stray) std::cout << s << " "; std::cout << std::endl; }
    std::cout << "storyline_targets_valid = " << (valid ? "true" : "false") << std::endl;
    return valid ? 0 : 1;
}
