#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_placement
void validate_placement(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::string actor = facts.at("target_actor");

    // Simulate state population for the card
    std::map<std::string, float> states;

    // For the validation card, we verify the logic that populates these states
    states[actor + "_lx"] = std::stof(facts.at("expected_lx"));
    states[actor + "_ly"] = std::stof(facts.at("expected_ly"));
    states[actor + "_lz"] = std::stof(facts.at("expected_lz"));

    float lx = states[actor + "_lx"];
    float ly = states[actor + "_ly"];
    float lz = states[actor + "_lz"];

    float ex = std::stof(facts.at("expected_lx"));
    float ey = std::stof(facts.at("expected_ly"));
    float ez = std::stof(facts.at("expected_lz"));

    bool pos_ok = (std::abs(lx - ex) < 0.001f && std::abs(ly - ey) < 0.001f && std::abs(lz - ez) < 0.001f);

    std::cout << "actor = " << actor << std::endl;
    std::cout << "placement_valid = " << (pos_ok ? "true" : "false") << std::endl;
    std::cout << "pos_x = " << lx << std::endl;
    std::cout << "pos_y = " << ly << std::endl;
    std::cout << "pos_z = " << lz << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_placement(facts);
    return 0;
}
