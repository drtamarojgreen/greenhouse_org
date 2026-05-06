#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <regex>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_complexity_audit
// @Results files_checked, complex_file_count, complexity_scores

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    int files_checked = 0;
    std::vector<std::string> complex_files;

    std::regex branching_regex("\\b(if|else|switch|case|while|for|catch|&&|\\|\\|)\\b");

    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_checked++;
                std::ifstream file(entry.path());
                std::string line;
                int score = 1; // Base complexity
                while (std::getline(file, line)) {
                    std::smatch match;
                    std::string search_line = line;
                    while (std::regex_search(search_line, match, branching_regex)) {
                        score++;
                        search_line = match.suffix().str();
                    }
                }

                if (score > 100) {
                    complex_files.push_back(entry.path().filename().string() + ":" + std::to_string(score));
                }
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "complex_file_count = " << complex_files.size() << std::endl;
    std::cout << "complexity_scores = "; for (const auto& f : complex_files) std::cout << f << " "; std::cout << std::endl;

    return 0;
}
