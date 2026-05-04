#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: sit_to_hidden_audit
// @Requires characters_not_sit_hidden = true
// @Results checked_entities, sit_to_hidden_count, offending_entities, characters_not_sit_hidden
//
// Bug pattern: entity receives "sit" animate event, then "visibility" hidden_at before receiving "stand"
// This leaves the character in a seated-but-invisible state — the animation is stranded mid-pose.

struct AnimEvent {
    std::string target, action, tag;
    int frame = 0;
    int hidden_at = -1;
};

int extract_int_val(const std::string& line, const std::string& key) {
    size_t pos = line.find("\"" + key + "\":");
    if (pos == std::string::npos) return -1;
    size_t start = line.find_first_of("-0123456789", line.find(':', pos));
    if (start == std::string::npos) return -1;
    size_t end = start;
    while (end < line.size() && (isdigit(line[end]) || line[end] == '-')) end++;
    return std::stoi(line.substr(start, end - start));
}

std::string extract_str_val(const std::string& line, const std::string& key) {
    size_t pos = line.find("\"" + key + "\":");
    if (pos == std::string::npos) return "";
    size_t open = line.find('\"', line.find(':', pos) + 1);
    if (open == std::string::npos) return "";
    size_t close = line.find('\"', open + 1);
    return line.substr(open + 1, close - open - 1);
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("sit_to_hidden.facts");
    if (!require_fact(facts, "characters_not_sit_hidden", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::vector<AnimEvent> events;
    bool in_storyline = false;
    std::string current_target, current_action;
    int current_beat_start = 0;
    AnimEvent current_event;
    bool in_event = false;

    std::string line;
    while (std::getline(file, line)) {
        if (line.find("\"storyline\":") != std::string::npos) { in_storyline = true; continue; }
        if (in_storyline) {
            if (line.find("\"beat\":") != std::string::npos) {
                // Reset beat context
            }
            // Capture beat-level start for events that inherit it
            if (line.find("\"start\":") != std::string::npos && line.find("beat") == std::string::npos && !in_event) {
                int v = extract_int_val(line, "start");
                if (v > 0) current_beat_start = v;
            }
            // Event object detection
            if (line.find("\"target\":") != std::string::npos) {
                current_event = AnimEvent{};
                current_event.target = extract_str_val(line, "target");
                in_event = true;
            }
            if (in_event) {
                if (line.find("\"action\":") != std::string::npos)
                    current_event.action = extract_str_val(line, "action");
                if (line.find("\"start\":") != std::string::npos)
                    current_event.frame = extract_int_val(line, "start");
                if (line.find("\"tag\":") != std::string::npos)
                    current_event.tag = extract_str_val(line, "tag");
                if (line.find("\"hidden_at\":") != std::string::npos)
                    current_event.hidden_at = extract_int_val(line, "hidden_at");
                // Event ends at params closing brace
                if (line.find("}") != std::string::npos && current_event.frame == 0)
                    current_event.frame = current_beat_start;
                if (line.find("} }") != std::string::npos || 
                    (line.find("}") != std::string::npos && !current_event.action.empty())) {
                    if (!current_event.target.empty() && !current_event.action.empty()) {
                        events.push_back(current_event);
                        in_event = false;
                    }
                }
            }
        }
    }

    // Per-entity: find sit events not followed by stand before hidden
    std::map<std::string, std::vector<AnimEvent>> by_target;
    for (const auto& e : events) by_target[e.target].push_back(e);

    std::vector<std::string> offenders;
    int checked = 0;
    for (auto& pair : by_target) {
        const std::string& entity = pair.first;
        auto& evts = pair.second;
        std::sort(evts.begin(), evts.end(), [](const AnimEvent& a, const AnimEvent& b){ return a.frame < b.frame; });
        checked++;
        bool sitting = false;
        int sit_frame = -1;
        for (const auto& ev : evts) {
            if (ev.action == "animate" && ev.tag == "sit") { sitting = true; sit_frame = ev.frame; }
            if (ev.action == "animate" && ev.tag == "stand") { sitting = false; }
            if (ev.action == "visibility" && ev.hidden_at > 0 && sitting) {
                offenders.push_back(entity);
                std::cerr << "[FAIL] '" << entity << "' hidden_at=" << ev.hidden_at
                          << " while sitting (sat at frame " << sit_frame << ", never stood before hidden)." << std::endl;
                break;
            }
        }
    }

    // Remove duplicates
    std::sort(offenders.begin(), offenders.end());
    offenders.erase(std::unique(offenders.begin(), offenders.end()), offenders.end());
    bool ok = offenders.empty();

    std::cout << "checked_entities = " << checked << std::endl;
    std::cout << "sit_to_hidden_count = " << offenders.size() << std::endl;
    if (!offenders.empty()) { std::cout << "offending_entities = "; for (const auto& o : offenders) std::cout << "'" << o << "' "; std::cout << std::endl; }
    std::cout << "characters_not_sit_hidden = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
