#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <set>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: pose_marker_audit
// @Requires pose_markers_valid = true
// @Requires rig_pose_markers = <comma-separated list>
// @Results storyline_action_count, missing_marker_count, missing_markers, pose_markers_valid

std::set<std::string> parse_markers(const std::string& raw) {
    std::set<std::string> markers;
    std::stringstream ss(raw);
    std::string token;
    while (std::getline(ss, token, ',')) markers.insert(trim(token));
    return markers;
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("rig_pose_markers.facts");
    if (!require_fact(facts, "pose_markers_valid", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::set<std::string> valid_markers;
    if (facts.count("rig_pose_markers")) valid_markers = parse_markers(facts.at("rig_pose_markers"));

    int storyline_action_count = 0;
    std::map<std::string, int> missing;
    bool in_storyline = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"storyline\":") != std::string::npos) in_storyline = true;
        if (in_storyline) {
            size_t action_pos = line.find("\"action\":");
            if (action_pos != std::string::npos) {
                size_t colon_pos = line.find(':', action_pos);
                size_t open = line.find('\"', colon_pos) + 1;
                std::string action = line.substr(open, line.find('\"', open) - open);

                // We only care about actions that map to rig animations (animate)
                // However, the task says 'action' tags used in storyline.
                // Let's look specifically for "animate" events and their "tag" parameter.
                if (action == "animate") {
                    storyline_action_count++;
                }
            }

            size_t tag_pos = line.find("\"tag\":");
            if (tag_pos != std::string::npos) {
                size_t colon_pos = line.find(':', tag_pos);
                size_t open = line.find('\"', colon_pos) + 1;
                std::string tag = line.substr(open, line.find('\"', open) - open);

                if (!valid_markers.empty() && valid_markers.find(tag) == valid_markers.end()) {
                    // Ignore built-in logic actions like "visibility", "altitude", "move_to", "emission_pulse"
                    // if they are not in the marker list, but actually those are "action" values, not "tag" values.
                    // In movie_config.json: { "target": "Arbor", "action": "animate", "params": { "tag": "sit", ... } }
                    missing[tag]++;
                    std::cerr << "[FAIL] Missing rig pose marker for action tag: '" << tag << "'" << std::endl;
                }
            }
        }
        if (line.find("\"environment\":") != std::string::npos) in_storyline = false;
    }

    bool valid = missing.empty();
    std::cout << "storyline_action_count = " << storyline_action_count << std::endl;
    std::cout << "missing_marker_count = " << missing.size() << std::endl;
    if (!missing.empty()) {
        std::cout << "missing_markers = ";
        for (const auto& p : missing) std::cout << p.first << "(" << p.second << "x) ";
        std::cout << std::endl;
    }
    std::cout << "pose_markers_valid = " << (valid ? "true" : "false") << std::endl;
    return valid ? 0 : 1;
}
