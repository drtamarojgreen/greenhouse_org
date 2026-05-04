#include "fact_utils.h"
#include <fstream>
#include <sstream>
#include <iostream>

namespace Sorrel {
namespace Sdd {
namespace Util {

std::map<std::string, std::string> FactReader::readFacts(const std::string& filepath) {
    std::map<std::string, std::string> facts;
    std::ifstream file(filepath);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open facts file " << filepath << std::endl;
        return facts;
    }

    std::string line;
    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;
        
        size_t is_pos = line.find("Is ");
        size_t eq_pos = line.find(" = ");
        
        if (is_pos != std::string::npos && eq_pos != std::string::npos) {
            std::string key = line.substr(is_pos + 3, eq_pos - (is_pos + 3));
            std::string value = line.substr(eq_pos + 3);
            facts[key] = value;
        } else if (line.find("Situation: ") == 0) {
            facts["Situation"] = line.substr(11);
        }
    }
    return facts;
}

} // Util
} // Sdd
} // Sorrel
