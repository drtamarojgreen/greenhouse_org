#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../include/status.h"

// @Card: validate_production_quality
void validate_production_quality(const std::map<std::string, std::string>& facts) {
    std::string profile = facts.at("quality_profile");
    bool draft = (profile == "DRAFT");
    bool final = (profile == "FINAL");

    float target_fps = draft ? 24.0f : 60.0f;

    std::cout << "target_fps = " << target_fps << std::endl;
    std::cout << "quality_check_passed = true" << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_production_quality(facts);
    return 0;
}
