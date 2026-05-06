#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <regex>
#include <vector>
#include <algorithm>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

struct Range { int start; int end; std::string name; };

static std::string read_file(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) return "";
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("intro_render_continuity.facts");
    if (!require_fact(facts, "intro_render_continuity_required", "true")) return 1;

    int required_until = facts.count("intro_required_visible_until") ? std::stoi(facts.at("intro_required_visible_until")) : 2000;
    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::string lights_path = env.count("lights_camera_path") ? env.at("lights_camera_path") : "../../lights_camera.json";
    std::string config = read_file(config_path);
    std::string lights = read_file(lights_path);
    if (config.empty()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }
    if (lights.empty()) { std::cerr << "[ERROR] Cannot open " << lights_path << std::endl; return 1; }

    std::vector<Range> beats;
    std::regex beat_re("\\\"beat\\\"\\s*:\\s*\\\"([^\\\"]+)\\\".*\\\"start\\\"\\s*:\\s*([0-9]+).*\\\"end\\\"\\s*:\\s*([0-9]+)");
    for (std::sregex_iterator it(config.begin(), config.end(), beat_re), end; it != end; ++it) {
        beats.push_back({std::stoi((*it)[2].str()), std::stoi((*it)[3].str()), (*it)[1].str()});
    }
    std::sort(beats.begin(), beats.end(), [](const Range& a, const Range& b){ return a.start < b.start; });

    int covered_until = 0;
    bool starts_at_one = !beats.empty() && beats.front().start == 1;
    bool contiguous = starts_at_one;
    for (const auto& beat : beats) {
        if (beat.start > covered_until + 1 && covered_until != 0) { contiguous = false; break; }
        if (beat.start == 1 && covered_until == 0) covered_until = beat.end;
        else if (beat.start <= covered_until) covered_until = std::max(covered_until, beat.end);
        else if (beat.start == covered_until) covered_until = std::max(covered_until, beat.end);
    }

    bool intro_camera = lights.find("\"intro\"") != std::string::npos &&
                        lights.find("\"start\": 1") != std::string::npos &&
                        lights.find("\"end\": 3") != std::string::npos;
    bool main_open_camera = lights.find("\"main_open\"") != std::string::npos &&
                            lights.find("\"start\": 4") != std::string::npos;
    bool covered = starts_at_one && contiguous && covered_until >= required_until && intro_camera && main_open_camera;

    std::cout << "storyline_starts_at_frame_1 = " << (starts_at_one ? "true" : "false") << std::endl;
    std::cout << "storyline_contiguous_from_frame_1 = " << (contiguous ? "true" : "false") << std::endl;
    std::cout << "storyline_covered_until = " << covered_until << std::endl;
    std::cout << "intro_camera_frames_1_to_3 = " << (intro_camera ? "true" : "false") << std::endl;
    std::cout << "main_open_camera_starts_at_4 = " << (main_open_camera ? "true" : "false") << std::endl;
    std::cout << "intro_render_continuity_required = " << (covered ? "true" : "false") << std::endl;

    if (!covered) {
        std::cerr << "[FAIL] Story/camera coverage must start at frame 1 and remain continuous through frame " << required_until << "." << std::endl;
    }
    return covered ? 0 : 1;
}
