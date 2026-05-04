#ifndef SORREL_SDD_UTIL_FACT_UTILS_H
#define SORREL_SDD_UTIL_FACT_UTILS_H

#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <algorithm>
#include <filesystem>
#include <vector>
#include <cstdlib>

namespace fs = std::filesystem;

namespace Sorrel::Sdd::Util {

inline std::string trim(const std::string& s) {
    auto start = s.begin();
    while (start != s.end() && std::isspace(*start)) {
        start++;
    }
    if (start == s.end()) return "";
    auto end = s.end();
    do {
        end--;
    } while (std::distance(start, end) > 0 && std::isspace(*end));
    return std::string(start, end + 1);
}

class FactReader {
public:
    static std::map<std::string, std::string> readFacts(const std::string& filename) {
        std::map<std::string, std::string> facts;

        std::string target_path = "";

        // 1. Check environment variable
        const char* env_dir = std::getenv("SORREL_FACTS_DIR");
        if (env_dir) {
            fs::path p = fs::path(env_dir) / filename;
            if (fs::exists(p)) target_path = p.string();
        }

        // 2. Search heuristic if not found via env
        if (target_path.empty()) {
            std::vector<std::string> search_dirs = {
                "facts",
                "../facts",
                "../../facts",
                "tests/sdd/facts"
            };

            for (const auto& dir : search_dirs) {
                fs::path p = fs::path(dir) / filename;
                if (fs::exists(p)) {
                    target_path = p.string();
                    break;
                }
            }
        }

        // 3. Fallback to direct path if still empty
        if (target_path.empty()) target_path = filename;

        std::ifstream file(target_path);
        if (!file.is_open()) {
             std::cerr << "Error: Could not read facts for '" << filename << "' (checked: " << target_path << ")" << std::endl;
             std::cerr << "Current path: " << fs::current_path() << std::endl;
             return facts;
        }

        std::string line;
        while (std::getline(file, line)) {
            std::string trimmed = trim(line);
            if (trimmed.empty() || trimmed[0] == '#' || trimmed.find("Situation:") == 0) continue;

            size_t space_pos = trimmed.find(' ');
            if (space_pos == std::string::npos) continue;

            std::string rest = trim(trimmed.substr(space_pos + 1));
            size_t eq_pos = rest.find('=');
            if (eq_pos != std::string::npos) {
                std::string key = trim(rest.substr(0, eq_pos));
                std::string value = trim(rest.substr(eq_pos + 1));
                facts[key] = value;
            }
        }
        return facts;
    }
};

} // namespace Sorrel::Sdd::Util

#endif // SORREL_SDD_UTIL_FACT_UTILS_H
