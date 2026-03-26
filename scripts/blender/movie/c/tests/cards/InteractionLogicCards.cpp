#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../src/SceneNodes.hpp"

// @Card: validate_talking_animation
void validate_talking_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    InteractionScene s; s.animate(f, states);
    
    // Original test checked for 'Mouth' bone scale
    float influence = states["Interaction_Influence"];
    std::cout << "talking_active = " << (abs(influence) > 0.001f ? "true" : "false") << std::endl;
}

// @Card: validate_staff_gesture
void validate_gesture_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);
    
    float nod = states["Dialogue_HeadNod"];
    std::cout << "gesture_valid = " << (abs(nod) > 0.0f ? "true" : "false") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "talking") validate_talking_card(facts);
    else if (card == "gesture") validate_gesture_card(facts);
    
    return 0;
}
