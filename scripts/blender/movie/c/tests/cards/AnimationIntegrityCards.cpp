#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_animation_integrity
void validate_animation_integrity(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::string actor = facts.at("target_actor");
    std::string prop = facts.at("target_prop");
    std::string type_str = facts.at("anim_type");

    AnimType type = AnimType::LINEAR;
    if (type_str == "PULSE") type = AnimType::PULSE;
    else if (type_str == "EASE") type = AnimType::EASE;
    else if (type_str == "NOISE") type = AnimType::NOISE;
    else if (type_str == "RAMP") type = AnimType::RAMP;
    else if (type_str == "STEP") type = AnimType::STEP;
    else if (type_str == "SPIRAL") type = AnimType::SPIRAL;

    SceneParams p = {
        std::stoi(facts.at("start")),
        std::stoi(facts.at("end")),
        actor, prop, type,
        std::stof(facts.at("intensity")),
        std::stof(facts.at("scale")),
        std::stof(facts.at("offset"))
    };

    std::map<std::string, float> states;

    // Instantiate appropriate template for testing
    if (type == AnimType::PULSE) { TemplatedScene<AnimType::PULSE> s(p); s.animate(f, states); }
    else if (type == AnimType::EASE) { TemplatedScene<AnimType::EASE> s(p); s.animate(f, states); }
    else if (type == AnimType::LINEAR) { TemplatedScene<AnimType::LINEAR> s(p); s.animate(f, states); }
    else if (type == AnimType::NOISE) { TemplatedScene<AnimType::NOISE> s(p); s.animate(f, states); }
    else if (type == AnimType::RAMP) { TemplatedScene<AnimType::RAMP> s(p); s.animate(f, states); }
    else if (type == AnimType::STEP) { TemplatedScene<AnimType::STEP> s(p); s.animate(f, states); }
    else if (type == AnimType::SPIRAL) { TemplatedScene<AnimType::SPIRAL> s(p); s.animate(f, states); }

    std::cout << "result_val = " << states[actor + "_" + prop] << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_animation_integrity(facts);
    return 0;
}
