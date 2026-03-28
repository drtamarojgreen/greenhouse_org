#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_color_state
void validate_colors(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::string actor = facts.at("target_actor");

    // Simulate color state
    std::map<std::string, float> states;

    // RGB: #4caf50 (76, 175, 80)
    states[actor + "_r"] = 0.298f;
    states[actor + "_g"] = 0.686f;
    states[actor + "_b"] = 0.314f;

    float r = states[actor + "_r"];
    float g = states[actor + "_g"];
    float b = states[actor + "_b"];

    float er = std::stof(facts.at("expected_r"));
    float eg = std::stof(facts.at("expected_g"));
    float eb = std::stof(facts.at("expected_b"));

    bool color_ok = (std::abs(r - er) < 0.001f && std::abs(g - eg) < 0.001f && std::abs(b - eb) < 0.001f);

    std::cout << "actor = " << actor << std::endl;
    std::cout << "color_valid = " << (color_ok ? "true" : "false") << std::endl;
    std::cout << "r_val = " << r << std::endl;
    std::cout << "g_val = " << g << std::endl;
    std::cout << "b_val = " << b << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_colors(facts);
    return 0;
}
