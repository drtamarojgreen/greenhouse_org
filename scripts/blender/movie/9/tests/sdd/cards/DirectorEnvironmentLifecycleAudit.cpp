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

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("environment_lifecycle.facts");
    if (!require_fact(facts, "scene_environment_lifecycle_guard", "true")) return 1;

    std::string m9_root = env.count("m9_root") ? env.at("m9_root") : "../../";
    std::string director_path = m9_root + "/director.py";
    std::string content = read_file(director_path);
    if (content.empty()) { std::cerr << "[ERROR] Cannot open " << director_path << std::endl; return 1; }

    bool purge_guarded =
        content.find("if env_coll and (is_global or force):") != std::string::npos ||
        content.find("if env_coll and (force or is_global):") != std::string::npos;
    bool unconditional_purge = content.find("if env_coll:\n            def purge_coll") != std::string::npos;
    bool director_stores_hide_keyframes = content.find("keyframe_insert(data_path=\"hide_render\"") != std::string::npos;
    bool context_override = content.find("env_cfg.get(\"context\"") != std::string::npos;

    bool ok = purge_guarded && !unconditional_purge && !director_stores_hide_keyframes && context_override;

    std::cout << "purge_guarded_by_global_or_force = " << (purge_guarded ? "true" : "false") << std::endl;
    std::cout << "unconditional_environment_purge = " << (unconditional_purge ? "true" : "false") << std::endl;
    std::cout << "director_stores_hide_keyframes = " << (director_stores_hide_keyframes ? "true" : "false") << std::endl;
    std::cout << "environment_context_override_supported = " << (context_override ? "true" : "false") << std::endl;
    std::cout << "scene_environment_lifecycle_guard = " << (ok ? "true" : "false") << std::endl;

    if (!ok) {
        std::cerr << "[FAIL] Director environment lifecycle must not purge every scene block, "
                  << "must not store hide_render keyframes for environment isolation, and must support context overrides." << std::endl;
    }
    return ok ? 0 : 1;
}
