#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <filesystem>
#include "../cpp/util/fact_utils.h"

namespace fs = std::filesystem;
using namespace Chai::Cdd::Util;

// @Card: frame_data_verification
// @Results total_frames == 4800, frame_data_complete == true
void verify_frame_data(const std::map<std::string, std::string>& facts) {
    std::string config_path = "../../../movie_config.json";
    std::ifstream file(config_path);
    bool found_total = false;
    int total_frames = 0;

    if (file.is_open()) {
        std::string line;
        while (std::getline(file, line)) {
            if (line.find("\"total_frames\":") != std::string::npos) {
                size_t colon = line.find(':');
                size_t comma = line.find(',', colon);
                std::string val = line.substr(colon + 1, comma - colon - 1);
                total_frames = std::stoi(trim(val));
                found_total = true;
                break;
            }
        }
    }

    bool complete = found_total && (total_frames == 4800);
    std::cout << "total_frames = " << total_frames << std::endl;
    std::cout << "frame_data_complete = " << (complete ? "true" : "false") << std::endl;
}

// @Card: tag_naming_convention
// @Results unique_tags_verified == true, naming_convention_followed == true
void verify_tags(const std::map<std::string, std::string>& facts) {
    std::string config_path = "../../../movie_config.json";
    std::ifstream file(config_path);
    std::set<std::string> tags;
    bool naming_ok = true;
    bool unique_ok = true;

    if (file.is_open()) {
        std::string line;
        while (std::getline(file, line)) {
            if (line.find("\"id\":") != std::string::npos) {
                size_t start = line.find('\"', line.find(':')) + 1;
                size_t end = line.find('\"', start);
                std::string tag = line.substr(start, end - start);
                
                if (tags.count(tag)) unique_ok = false;
                tags.insert(tag);

                // Naming convention: CamelCase or snake_case with no special chars
                for (char c : tag) {
                    if (!isalnum(c) && c != '_' && c != '.') {
                        naming_ok = false;
                        break;
                    }
                }
            }
        }
    }

    std::cout << "unique_tags_verified = " << (unique_ok ? "true" : "false") << std::endl;
    std::cout << "naming_convention_followed = " << (naming_ok ? "true" : "false") << std::endl;
}

// @Card: mandatory_entities
// @Results mandatory_entities_present == true
void verify_mandatory_entities(const std::map<std::string, std::string>& facts) {
    std::vector<std::string> mandatory = {"Herbaceous", "Arbor", "Shadow_Weaver", "Verdant_Sprite"};
    std::string config_path = "../../../movie_config.json";
    std::ifstream file(config_path);
    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    
    bool all_present = true;
    for (const auto& entity : mandatory) {
        if (content.find("\"id\": \"" + entity + "\"") == std::string::npos) {
            all_present = false;
            break;
        }
    }
    
    std::cout << "mandatory_entities_present = " << (all_present ? "true" : "false") << std::endl;
}

int main(int argc, char* argv[]) {
    auto facts = FactReader::readFacts("pipeline.facts");
    if (facts.empty()) return 1;

    if (argc > 1) {
        std::string cmd = argv[1];
        if (cmd == "frames") verify_frame_data(facts);
        else if (cmd == "tags") verify_tags(facts);
        else if (cmd == "entities") verify_mandatory_entities(facts);
    } else {
        verify_frame_data(facts);
        verify_tags(facts);
        verify_mandatory_entities(facts);
    }

    return 0;
}
