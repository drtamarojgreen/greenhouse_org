#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_var_usage_audit
// @Results files_checked, var_usage_count, var_locations

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    int files_checked = 0;
    std::vector<std::string> violations;

    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_checked++;
                std::ifstream file(entry.path());
                std::string line;
                int line_num = 0;
                while (std::getline(file, line)) {
                    line_num++;
                    // Avoid false positives in comments
                    if (line.find("var ") != std::string::npos && line.find("//") == std::string::npos) {
                        violations.push_back(entry.path().filename().string() + ":" + std::to_string(line_num));
                    }
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "var_usage_count = " << violations.size() << std::endl;
    std::cout << "var_locations = "; for (const auto& v : violations) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
