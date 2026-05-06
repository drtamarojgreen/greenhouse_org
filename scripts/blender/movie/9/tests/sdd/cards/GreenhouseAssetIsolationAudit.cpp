#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

static std::string read_file(const std::string& path) {
    std::ifstream file(path);
    if (!file.is_open()) return "";
    std::ostringstream ss;
    ss << file.rdbuf();
    return ss.str();
}

static std::string block_after(const std::string& content, const std::string& marker) {
    size_t start = content.find(marker);
    if (start == std::string::npos) return "";
    size_t end = content.find("\n    }", start + marker.size());
    if (end == std::string::npos) end = content.size();
    return content.substr(start, end - start);
}

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("greenhouse_asset_isolation.facts");
    if (!require_fact(facts, "greenhouse_asset_isolation_required", "true")) return 1;

    std::string config_path = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::string m9_root = env.count("m9_root") ? env.at("m9_root") : "../../";
    std::string scene01_path = m9_root + "/scene_configs/scene_01_arrival.json";

    std::string config = read_file(config_path);
    std::string scene01 = read_file(scene01_path);
    if (config.empty()) { std::cerr << "[ERROR] Cannot open " << config_path << std::endl; return 1; }
    if (scene01.empty()) { std::cerr << "[ERROR] Cannot open " << scene01_path << std::endl; return 1; }

    std::string constraints = block_after(config, "\"greenhouse\": {");
    bool has_mountain_range = constraints.find("\"mountain_range\"") != std::string::npos;
    bool has_vegetation = constraints.find("\"vegetation\"") != std::string::npos;
    bool has_rock_path = constraints.find("\"rock_path\"") != std::string::npos;
    bool has_ext_prefix = constraints.find("\"ext_\"") != std::string::npos;
    bool stale_mountains_constraint = constraints.find("\"mountains\"") != std::string::npos;
    bool scene01_greenhouse_context = scene01.find("\"context\": \"greenhouse\"") != std::string::npos;

    bool ok = has_mountain_range && has_vegetation && has_rock_path && has_ext_prefix &&
              !stale_mountains_constraint && scene01_greenhouse_context;

    std::cout << "greenhouse_disallows_mountain_range = " << (has_mountain_range ? "true" : "false") << std::endl;
    std::cout << "greenhouse_disallows_vegetation = " << (has_vegetation ? "true" : "false") << std::endl;
    std::cout << "greenhouse_disallows_rock_path = " << (has_rock_path ? "true" : "false") << std::endl;
    std::cout << "greenhouse_disallows_ext_prefix = " << (has_ext_prefix ? "true" : "false") << std::endl;
    std::cout << "greenhouse_uses_stale_mountains_name = " << (stale_mountains_constraint ? "true" : "false") << std::endl;
    std::cout << "scene_01_context_greenhouse = " << (scene01_greenhouse_context ? "true" : "false") << std::endl;
    std::cout << "greenhouse_asset_isolation_required = " << (ok ? "true" : "false") << std::endl;

    if (!ok) {
        std::cerr << "[FAIL] Greenhouse scenes must declare greenhouse context and disallow exterior mountain/tree/path assets by current generated names." << std::endl;
    }
    return ok ? 0 : 1;
}
