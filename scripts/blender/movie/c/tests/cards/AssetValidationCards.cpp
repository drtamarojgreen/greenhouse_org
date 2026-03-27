#include <iostream>
#include <map>
#include <string>
#include "../cpp/util/FactReader.hpp"
#include "../../include/SceneNodes.hpp"

// @Card: validate_asset_existence
void validate_asset_card(const std::map<std::string, std::string>& facts) {
    int f = std::stoi(facts.at("frame"));
    std::map<std::string, float> states;
    BrandingScene s; s.animate(f, states);
    
    bool exists = (states.count("GreenhouseLogo_vis") > 0);
    float alpha = states["GreenhouseLogo_alpha"];
    bool visible = states["GreenhouseLogo_vis"] == 1.0f;

    bool check_passed = false;
    if (f >= 1 && f <= 100) {
        check_passed = visible && (alpha >= 0.0f && alpha <= 1.0f);
    } else {
        check_passed = !visible;
    }

    std::cout << "asset_status = " << (exists ? "PASS" : "FAIL") << std::endl;
    std::cout << "asset_alpha = " << alpha << std::endl;
    std::cout << "functional_check = " << (check_passed ? "PASS" : "FAIL") << std::endl;
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    auto facts = FactReader::read_facts(argv[1]);
    std::string card = facts.at("target_card");
    
    if (card == "existence") validate_asset_card(facts);
    
    return 0;
}
