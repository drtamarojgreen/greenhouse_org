#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// Templated Chai Cards for Data-Driven Architecture

// @Card: validate_scene_logic
void validate_templated_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::string actor = facts.at("target_actor");
    std::string prop = facts.at("target_prop");
    std::string type_str = facts.at("anim_type");
    
    AnimType type = AnimType::LINEAR;
    if (type_str == "PULSE") type = AnimType::PULSE;
    else if (type_str == "EASE") type = AnimType::EASE;
    else if (type_str == "NOISE") type = AnimType::NOISE;

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

    std::cout << "result_val = " << states[actor + "_" + prop] << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_templated_card(facts);
    return 0;
}
