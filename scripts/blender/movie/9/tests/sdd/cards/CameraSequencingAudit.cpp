#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <set>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Sorrel::Sdd::Util;

// @Card: camera_sequencing_audit
// @Requires camera_sequencing_valid = true
// @Results sequence_count, unknown_camera_count, unknown_cameras, camera_sequencing_valid
int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("camera_sequencing.facts");
    if (!require_fact(facts, "camera_sequencing_valid", "true")) return 1;

    std::string lc_path = env.at("lights_camera_path");
    std::ifstream file(lc_path);
    if (!file.is_open()) { std::cerr << "[ERROR] Cannot open " << lc_path << std::endl; return 1; }

    std::set<std::string> defined_cameras;
    std::vector<std::string> sequenced_cameras;
    bool in_cameras = false, in_sequencing = false;
    std::string line;

    while (std::getline(file, line)) {
        if (line.find("\"cameras\":") != std::string::npos) { in_cameras = true; in_sequencing = false; }
        if (line.find("\"lighting\":") != std::string::npos) { in_cameras = false; }
        if (line.find("\"sequencing\":") != std::string::npos) { in_sequencing = true; in_cameras = false; }

        if (in_cameras && line.find("\"id\":") != std::string::npos) {
            size_t open = line.find('\"', line.find(':')) + 1;
            defined_cameras.insert(line.substr(open, line.find('\"', open) - open));
        }

        if (in_sequencing) {
            if (line.find("\"camera\":") != std::string::npos) {
                size_t open = line.find('\"', line.find(':')) + 1;
                sequenced_cameras.push_back(line.substr(open, line.find('\"', open) - open));
            }
            if (line.find("\"order\":") != std::string::npos) {
                // Parse array of camera IDs/prefixes
                size_t start = line.find('[');
                size_t end = line.find(']');
                if (start != std::string::npos && end != std::string::npos) {
                    std::string array_content = line.substr(start + 1, end - start - 1);
                    std::string current;
                    bool in_quotes = false;
                    for (char c : array_content) {
                        if (c == '\"') {
                            if (in_quotes) { sequenced_cameras.push_back(current); current = ""; in_quotes = false; }
                            else in_quotes = true;
                        } else if (in_quotes && c != ',') {
                            current += c;
                        }
                    }
                }
            }
        }
    }

    int unknown_count = 0;
    std::vector<std::string> unknown;
    for (const auto& cam : sequenced_cameras) {
        bool found = (defined_cameras.find(cam) != defined_cameras.end());
        if (!found) {
            // Check if it's a prefix for multiple cameras (e.g. "Antag" -> Antag1, Antag2...)
            for (const auto& def : defined_cameras) {
                if (def.find(cam) == 0) { found = true; break; }
            }
        }
        if (!found) {
            unknown_count++;
            unknown.push_back(cam);
            std::cerr << "[FAIL] Sequencing references unknown camera or prefix: '" << cam << "'" << std::endl;
        }
    }

    bool ok = unknown_count == 0;
    std::cout << "sequence_count = " << sequenced_cameras.size() << std::endl;
    std::cout << "unknown_camera_count = " << unknown_count << std::endl;
    if (!unknown.empty()) { std::cout << "unknown_cameras = "; for (const auto& u : unknown) std::cout << u << " "; std::cout << std::endl; }
    std::cout << "camera_sequencing_valid = " << (ok ? "true" : "false") << std::endl;
    return ok ? 0 : 1;
}
