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

    // Create a templated scene node to perform the actual calculation
    SceneParams p = {
        400, 600, actor, "lx", AnimType::LINEAR,
        std::stof(facts.at("intensity")),
        1.0f,
        std::stof(facts.at("offset"))
    };
    TemplatedScene<AnimType::LINEAR> node(p);

    std::map<std::string, float> states;
    node.animate(f, states);

    float lx = states[actor + "_lx"];
    float expected = std::stof(facts.at("expected_lx"));

    bool pos_ok = (std::abs(lx - expected) < 0.001f);

    std::cout << "actor = " << actor << std::endl;
    std::cout << "placement_valid = " << (pos_ok ? "true" : "false") << std::endl;
    std::cout << "pos_x = " << lx << std::endl;
    std::cout << "expected_x = " << expected << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_placement(facts);
    return 0;
}
