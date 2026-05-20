#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <filesystem>
#include "../cpp/util/fact_utils.h"

using namespace Sorrel::Sdd::Util;

// @Card: movie10_architecture_audit
// @Results status, missing_files, frame_count_check, ensemble_check

bool check_file(const std::string& path) {
    return std::filesystem::exists(path);
}

int main() {
    auto arch_facts = FactReader::readFacts("movie10_architecture.facts");
    std::string root = arch_facts["movie10_root"];
    std::string req_files_raw = arch_facts["required_files"];
    int expected_frames = std::stoi(arch_facts["total_frames"]);
    int expected_ensemble = std::stoi(arch_facts["ensemble_size"]);

    std::vector<std::string> missing_files;
    std::stringstream ssf(req_files_raw);
    std::string file;
    while (std::getline(ssf, file, ',')) {
        if (!check_file(root + file)) missing_files.push_back(file);
    }

    // Manual config audit
    bool frames_ok = false;
    int ensemble_count = 0;
    std::ifstream config_file(root + "movie_config.json");
    if (config_file.is_open()) {
        std::string line;
        while (std::getline(config_file, line)) {
            if (line.find("\"total_frames\": 10000") != std::string::npos) frames_ok = true;
            if (line.find("\"id\":") != std::string::npos && line.find("_HF") != std::string::npos) ensemble_count++;
            if (line.find("\"id\": \"Drone_X10\"") != std::string::npos) ensemble_count++;
        }
    }

    bool success = missing_files.empty() && frames_ok && (ensemble_count >= expected_ensemble);

    std::cout << "status = " << (success ? "PASSED" : "FAILED") << std::endl;
    std::cout << "missing_files = "; for(auto& f : missing_files) std::cout << f << ","; std::cout << std::endl;
    std::cout << "frame_count_check = " << (frames_ok ? "OK" : "INVALID") << std::endl;
    std::cout << "ensemble_check = " << (ensemble_count >= expected_ensemble ? "OK" : "INCOMPLETE") << std::endl;

    return success ? 0 : 1;
}
