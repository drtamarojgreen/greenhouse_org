#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: beat_overlap_audit
// @Requires beat_overlap_allowed = false
// @Results beat_count, overlap_count, overlaps, beat_overlap_allowed
struct Beat {
    std::string name;
    int start;
    int end;
};

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("beat_overlap.facts");
    if (!require_fact(facts, "beat_overlap_allowed", "false")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    std::vector<Beat> beats;
    std::string line;
    bool in_storyline = false;
    Beat current{};

    while (std::getline(file, line)) {
        if (line.find("\"storyline\":") != std::string::npos) in_storyline = true;
        if (in_storyline) {
            if (line.find("\"beat\":") != std::string::npos) {
                if (!current.name.empty()) beats.push_back(current);
                size_t open = line.find('\"', line.find(':')) + 1;
                current.name = line.substr(open, line.find('\"', open) - open);
            }
            if (line.find("\"start\":") != std::string::npos) {
                size_t start_pos = line.find(':') + 1;
                current.start = std::stoi(line.substr(start_pos, line.find(',', start_pos) - start_pos));
            }
            if (line.find("\"end\":") != std::string::npos) {
                size_t end_pos = line.find(':') + 1;
                current.end = std::stoi(line.substr(end_pos, line.find_first_of(",}", end_pos) - end_pos));
            }
        }
    }
    if (!current.name.empty()) beats.push_back(current);

    int overlap_count = 0;
    std::vector<std::string> overlaps;
    for (size_t i = 0; i < beats.size(); ++i) {
        for (size_t j = i + 1; j < beats.size(); ++j) {
            if (beats[i].start < beats[j].end && beats[j].start < beats[i].end) {
                overlap_count++;
                std::string msg = beats[i].name + " <-> " + beats[j].name;
                overlaps.push_back(msg);
                std::cerr << "[FAIL] Overlap detected: " << msg << std::endl;
            }
        }
    }

    bool ok = overlap_count == 0;
    std::cout << "beat_count = " << beats.size() << std::endl;
    std::cout << "overlap_count = " << overlap_count << std::endl;
    if (!overlaps.empty()) { std::cout << "overlaps = "; for (const auto& o : overlaps) std::cout << "[" << o << "] "; std::cout << std::endl; }
    std::cout << "beat_overlap_allowed = " << (ok ? "false" : "true") << std::endl;
    return ok ? 0 : 1;
}
