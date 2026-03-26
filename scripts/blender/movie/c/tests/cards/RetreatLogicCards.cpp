#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../src/MathCore.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_retreat_ramp
void validate_ramp_card(const std::map<std::string, std::string>& facts) {
    int f1 = std::stoi(facts.at("frame_1"));
    int f2 = std::stoi(facts.at("frame_2"));
    
    SceneParams p = { 13701, 14500, "GloomGnome", "lx", AnimType::RAMP, 25.0f, 1.0f, -5.0f };
    TemplatedScene<AnimType::RAMP> s(p);
    
    std::map<std::string, float> s1, s2;
    s.animate(f1, s1);
    s.animate(f2, s2);
    
    float dist1 = abs(s1["GloomGnome_lx"] - p.offset);
    float dist2 = abs(s2["GloomGnome_lx"] - p.offset);
    
    // In a quadratic ramp, distance at 80% should be much larger than at 20%
    std::cout << "ramp_ratio = " << (dist2 / dist1) << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    validate_ramp_card(facts);
    return 0;
}
