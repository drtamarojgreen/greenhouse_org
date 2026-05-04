#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <set>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: character_visibility_audit
// @Requires visibility_actions_valid = true
// @Results visibility_action_count, invalid_visibility_count, invalid_visibility_details, visibility_actions_valid
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("character_visibility.facts");
    if (!require_fact(facts, "visibility_actions_valid", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::set<std::string> entity_ids;
    entity_ids.insert("ALL");
    bool in_entities = false, in_storyline = false, in_visibility = false;
    std::string line, current_target;
    int visibility_action_count = 0;
    int invalid_count = 0;
    std::vector<std::string> invalid_details;

    while (std::getline(file, line)) {
        if (line.find("\"entities\":") != std::string::npos) { in_entities = true; in_storyline = false; }
        if (line.find("\"storyline\":") != std::string::npos) { in_storyline = true; in_entities = false; }

        if (in_entities && line.find("\"id\":") != std::string::npos && line.find("geometry") == std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            entity_ids.insert(line.substr(open, line.find('\"', open) - open));
        }

        if (in_storyline) {
            if (line.find("\"action\": \"visibility\"") != std::string::npos ||
                line.find("\"action\":\"visibility\"") != std::string::npos) {
                visibility_action_count++;
                in_visibility = true;
                // Target is usually on the same line or previous line in this JSON style
                // but let's be robust and look back or forward if needed.
                // In movie_config.json, "target" comes before "action".
            }
            if (line.find("\"target\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                current_target = line.substr(open, line.find('\"', open) - open);
            }
            if (in_visibility) {
                if (entity_ids.find(current_target) == entity_ids.end()) {
                    invalid_count++;
                    invalid_details.push_back("Unknown target: " + current_target);
                    std::cerr << "[FAIL] Visibility action targets unknown entity: '" << current_target << "'" << std::endl;
                    in_visibility = false;
                }
                // Check for params
                if (line.find("}") != std::string::npos && line.find("{") == std::string::npos) {
                   in_visibility = false; // End of event
                }
            }
        }
    }

    bool ok = invalid_count == 0;
    std::cout << "visibility_action_count = " << visibility_action_count << std::endl;
    std::cout << "invalid_visibility_count = " << invalid_count << std::endl;
    if (!invalid_details.empty()) { std::cout << "invalid_visibility_details = "; for (const auto& d : invalid_details) std::cout << "[" << d << "] "; std::cout << std::endl; }
    std::cout << "visibility_actions_valid = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
