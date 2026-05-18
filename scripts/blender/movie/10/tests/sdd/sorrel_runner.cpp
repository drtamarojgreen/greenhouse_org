#include <iostream>
#include <vector>
#include <string>
#include <cstdlib>

struct Card {
    std::string name;
    std::string binary;
};

int main() {
    std::vector<Card> cards = {
        {"Architecture Consistency", "./scripts/blender/movie/10/tests/sdd/cards/const_check"},
        {"High Fidelity Standards", "./scripts/blender/movie/10/tests/sdd/cards/hf_check"},
        {"Deep Module & JSON Integrity", "./scripts/blender/movie/10/tests/sdd/cards/deep_check"}
    };

    std::cout << "Starting Movie 10 Sorrel Structural Enforcement Loop..." << std::endl;
    bool success = true;

    for (const auto& card : cards) {
        std::cout << "\nExecuting Card: " << card.name << std::endl;
        int result = std::system(card.binary.c_str());
        if (result != 0) {
            std::cout << "Card " << card.name << " VIOLATION detected (exit code " << result << ")" << std::endl;
            success = false;
        } else {
            std::cout << "Card " << card.name << " PASSED (Verified against Facts)" << std::endl;
        }
    }

    if (success) {
        std::cout << "\n[RESULT] SYSTEM STABLE AND STRUCTURALLY SOUND" << std::endl;
        return 0;
    } else {
        std::cout << "\n[RESULT] CRITICAL STRUCTURAL VIOLATIONS DETECTED" << std::endl;
        return 1;
    }
}
