#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: frame_boundary_audit
// @Requires total_frames_expected = 4800
// @Requires frame_boundary_respected = true
// @Requires beats_contiguous = true
// @Results total_frames_read, beat_count, max_beat_frame, frame_boundary_respected, beats_contiguous

struct Beat { std::string name; int start = 0; int end = 0; };

int extract_int(const std::string& line, const std::string& key) {
    size_t pos = line.find("\"" + key + "\":");
    if (pos == std::string::npos) return -1;
    size_t start = line.find_first_of("-0123456789", line.find(':', pos));
    size_t end = start;
    while (end < line.size() && (isdigit(line[end]) || line[end] == '-')) end++;
    return std::stoi(line.substr(start, end - start));
}

std::string extract_str(const std::string& line, const std::string& key) {
    size_t pos = line.find("\"" + key + "\":");
    if (pos == std::string::npos) return "";
    size_t open = line.find('\"', line.find(':', pos) + 1);
    if (open == std::string::npos) return "";
    size_t close = line.find('\"', open + 1);
    return line.substr(open + 1, close - open - 1);
}

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("frame_boundary.facts");
    if (!require_fact(facts, "total_frames_expected", "4800")) return 1;
    if (!require_fact(facts, "frame_boundary_respected", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::ifstream file(config_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }

    int total_frames = 0;
    std::vector<Beat> beats;
    Beat current;
    bool in_storyline = false, in_beat = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"total_frames\":") != std::string::npos) total_frames = extract_int(line, "total_frames");
        if (line.find("\"storyline\":") != std::string::npos) { in_storyline = true; continue; }
        if (in_storyline) {
            if (line.find("\"beat\":") != std::string::npos) { current = Beat{}; current.name = extract_str(line, "beat"); in_beat = true; }
            if (in_beat && line.find("\"start\":") != std::string::npos && current.start == 0) current.start = extract_int(line, "start");
            if (in_beat && line.find("\"end\":") != std::string::npos && current.end == 0) current.end = extract_int(line, "end");
            if (in_beat && current.start > 0 && current.end > 0 && line.find("\"events\":") != std::string::npos) { beats.push_back(current); in_beat = false; }
        }
    }

    int max_beat_frame = 0;
    bool boundary_ok = true, contiguous_ok = true;
    for (int i = 0; i < (int)beats.size(); i++) {
        if (beats[i].end > max_beat_frame) max_beat_frame = beats[i].end;
        if (beats[i].end > total_frames) {
            boundary_ok = false;
            std::cerr << "[FAIL] Beat '" << beats[i].name << "' end=" << beats[i].end << " exceeds total_frames=" << total_frames << std::endl;
        }
        if (i > 0 && beats[i].start != beats[i-1].end) {
            contiguous_ok = false;
            std::cerr << "[FAIL] Gap: '" << beats[i-1].name << "' end=" << beats[i-1].end << " vs '" << beats[i].name << "' start=" << beats[i].start << std::endl;
        }
    }

    std::cout << "total_frames_read = " << total_frames << std::endl;
    std::cout << "beat_count = " << beats.size() << std::endl;
    std::cout << "max_beat_frame = " << max_beat_frame << std::endl;
    std::cout << "frame_boundary_respected = " << (boundary_ok ? "true" : "false") << std::endl;
    std::cout << "beats_contiguous = " << (contiguous_ok ? "true" : "false") << std::endl;
    return (boundary_ok && contiguous_ok) ? 0 : 1;
}
