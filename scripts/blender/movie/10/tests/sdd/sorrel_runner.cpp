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
        {"High Fidelity Standards", "./scripts/blender/movie/10/tests/sdd/cards/hf_check"},
        {"Architectural Consistency", "./scripts/blender/movie/10/tests/sdd/cards/const_check"}
    };

    std::cout << "Starting Movie 10 Sorrel Execution Loop..." << std::endl;
    bool success = true;

    for (const auto& card : cards) {
        std::cout << "\nExecuting Card: " << card.name << std::endl;
        int result = std::system(card.binary.c_str());
        if (result != 0) {
            std::cout << "Card " << card.name << " FAILED with exit code " << result << std::endl;
            success = false;
        } else {
            std::cout << "Card " << card.name << " PASSED" << std::endl;
        }
    }

    if (success) {
        std::cout << "\n[ALL CARDS VERIFIED AGAINST FACTS]" << std::endl;
        return 0;
    } else {
        std::cout << "\n[FACT VIOLATIONS DETECTED]" << std::endl;
        return 1;
    }
}
