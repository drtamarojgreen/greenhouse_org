#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_file_length_audit
// @Results files_checked, long_file_count, long_files

int main() {
    auto env = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("js_quality.facts");

    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    int max_lines = facts.count("max_file_lines") ? std::stoi(facts.at("max_file_lines")) : 1000;

    int files_checked = 0;
    std::vector<std::string> violations;

    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_checked++;
                std::ifstream file(entry.path());
                int line_count = 0;
                std::string line;
                while (std::getline(file, line)) {
                    line_count++;
                }

                if (line_count > max_lines) {
                    violations.push_back(entry.path().filename().string() + ":" + std::to_string(line_count));
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "long_file_count = " << violations.size() << std::endl;
    std::cout << "long_files = "; for (const auto& v : violations) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
