#include <iostream>
#include <map>
#include <string>
#include <cmath>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_talking_animation
void validate_talking_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    InteractionScene s; s.animate(f, states);

    float influence = states["Interaction_Influence"];
    float expected_min = 0.8f; // 1.0 - 0.2
    float expected_max = 1.2f; // 1.0 + 0.2

    bool talking_active = (f >= 100 && f <= 200);
    bool check_passed = false;

    if (talking_active) {
        check_passed = (influence >= expected_min && influence <= expected_max);
    } else {
        check_passed = (influence == 0.0f);
    }

    std::cout << "talking_active = " << (talking_active ? "true" : "false") << std::endl;
    std::cout << "influence_val = " << influence << std::endl;
    std::cout << "functional_check = " << (check_passed ? "PASS" : "FAIL") << std::endl;
}

// @Card: validate_staff_gesture
void validate_gesture_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    DialogueScene s; s.animate(f, states);

    float nod = states["Dialogue_HeadNod"];
    bool gesture_active = (f >= 300 && f <= 500);
    bool check_passed = false;

    if (gesture_active) {
        float expected = std::abs(std::sin(f * 0.1f));
        check_passed = (std::abs(nod - expected) < 0.001f);
    } else {
        check_passed = (nod == 0.0f);
    }

    std::cout << "gesture_valid = " << (gesture_active ? "true" : "false") << std::endl;
    std::cout << "head_nod_val = " << nod << std::endl;
    std::cout << "functional_check = " << (check_passed ? "PASS" : "FAIL") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");

    if (card == "talking") validate_talking_card(facts);
    else if (card == "gesture") validate_gesture_card(facts);

    return 0;
}
