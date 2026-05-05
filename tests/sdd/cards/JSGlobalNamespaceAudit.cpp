#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_global_namespace_audit
// @Results files_checked, namespace_violation_count, namespace_violations

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    int files_scanned = 0;
    std::vector<std::string> violations;

    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_scanned++;
                std::ifstream file(entry.path());
                std::string line;
                bool has_iife_start = false;
                bool has_strict = false;
                bool has_iife_end = false;

                while (std::getline(file, line)) {
                    if (line.find("(function") != std::string::npos && line.find("{") != std::string::npos) has_iife_start = true;
                    if (line.find("'use strict'") != std::string::npos || line.find("\"use strict\"") != std::string::npos) has_strict = true;
                    if (line.find("})();") != std::string::npos || line.find("}) (") != std::string::npos) has_iife_end = true;
                }

                if (!has_iife_start || !has_strict || !has_iife_end) {
                    violations.push_back(entry.path().filename().string());
                }
            }
        }
    }

    std::cout << "files_checked = " << files_scanned << std::endl;
    std::cout << "namespace_violation_count = " << violations.size() << std::endl;
    std::cout << "namespace_violations = "; for (const auto& v : violations) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
