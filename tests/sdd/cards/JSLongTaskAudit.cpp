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

// @Card: js_long_task_audit
// @Results files_checked, unthrottled_listener_count, deep_loop_count

int main() {
    auto env = FactReader::readFacts("environment.facts");

    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    int files_checked = 0;
    int unthrottled_listeners = 0;
    int deep_loops = 0;

    std::regex listener_regex("addEventListener\\(['\"](mousemove|scroll|resize)['\"]");
    std::regex loop_start_regex("\\b(for|while|forEach)\\b");

    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;

        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                files_checked++;
                std::ifstream file(entry.path());
                std::string line;

                int max_loop_depth = 0;
                int current_loop_depth = 0;
                std::vector<int> loop_braces; // Track brace depth of loops

                int brace_depth = 0;

                while (std::getline(file, line)) {
                    if (std::regex_search(line, listener_regex)) {
                        unthrottled_listeners++;
                    }

                    // Heuristic loop depth tracking
                    bool has_loop_start = std::regex_search(line, loop_start_regex);

                    for (char c : line) {
                        if (c == '{') {
                            brace_depth++;
                            if (has_loop_start) {
                                current_loop_depth++;
                                loop_braces.push_back(brace_depth);
                                if (current_loop_depth > max_loop_depth) max_loop_depth = current_loop_depth;
                                has_loop_start = false; // brace found for this loop
                            }
                        } else if (c == '}') {
                            if (!loop_braces.empty() && loop_braces.back() == brace_depth) {
                                current_loop_depth--;
                                loop_braces.pop_back();
                            }
                            brace_depth--;
                        }
                    }
                }
                if (max_loop_depth >= 3) deep_loops++;
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "unthrottled_listener_count = " << unthrottled_listeners << std::endl;
    std::cout << "deep_loop_count = " << deep_loops << std::endl;

    return 0;
}
