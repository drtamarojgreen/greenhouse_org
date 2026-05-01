#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <set>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: animation_tag_audit
// @Requires animation_tags_valid = true
// @Requires known_tags = <comma-separated list>
// @Results animate_event_count, unknown_tag_count, unknown_tags, animation_tags_valid

std::set<std::string> parse_known_tags(const std::string& raw) {
    std::set<std::string> tags;
    std::stringstream ss(raw);
    std::string token;
    while (std::getline(ss, token, ',')) tags.insert(trim(token));
    return tags;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("animation_tags.facts");
    if (!require_fact(facts, "animation_tags_valid", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::set<std::string> known_tags;
    if (facts.count("known_tags")) known_tags = parse_known_tags(facts.at("known_tags"));

    int animate_event_count = 0;
    std::map<std::string, int> unknown;
    bool in_storyline = false, in_animate = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"storyline\":") != std::string::npos) in_storyline = true;
        if (in_storyline) {
            if (line.find("\"action\": \"animate\"") != std::string::npos ||
                line.find("\"action\":\"animate\"") != std::string::npos) {
                in_animate = true;
                animate_event_count++;
            }
            if (in_animate && line.find("\"tag\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                std::string tag = line.substr(open, line.find('\"', open) - open);
                in_animate = false;
                if (!known_tags.empty() && known_tags.find(tag) == known_tags.end()) {
                    unknown[tag]++;
                    std::cerr << "[FAIL] Unknown animation tag: '" << tag << "'" << std::endl;
                }
            }
        }
    }

    bool valid = unknown.empty();
    std::cout << "animate_event_count = " << animate_event_count << std::endl;
    std::cout << "unknown_tag_count = " << unknown.size() << std::endl;
    if (!unknown.empty()) { std::cout << "unknown_tags = "; for (const auto& p : unknown) std::cout << p.first << "(" << p.second << "x) "; std::cout << std::endl; }
    std::cout << "animation_tags_valid = " << (valid ? "true" : "false") << std::endl;
    return valid ? 0 : 1;
}
