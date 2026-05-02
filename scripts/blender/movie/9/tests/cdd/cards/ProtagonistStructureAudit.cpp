#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <map>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

using namespace Chai::Cdd::Util;

// @Card: protagonist_structure_audit
// @Is structure_verification_active == true

int main() {
    auto env   = FactReader::readFacts("environment.facts");
    auto facts = FactReader::readFacts("protagonist_structure.facts");
    if (!require_fact(facts, "structure_verification_active", "true")) return 1;

    std::string m9_config = env.count("config_path") ? env.at("config_path") : "../../movie_config.json";
    std::string m7_config = "../../../7/movie_config.json";

    auto check_config = [](const std::string& path, const std::string& char_id) {
        std::ifstream file(path);
        if (!file.is_open()) return std::string("MISSING_FILE");
        std::string line;
        bool in_char = false;
        std::string type = "NOT_FOUND";
        bool has_plant_modeler = false;
        bool has_universal_shader = false;

        while (std::getline(file, line)) {
            if (line.find("\"id\": \"" + char_id + "\"") != std::string::npos) in_char = true;
            if (in_char) {
                if (line.find("\"type\":") != std::string::npos) {
                    size_t first = line.find('\"', line.find(':'));
                    size_t last = line.find('\"', first + 1);
                    type = line.substr(first + 1, last - first - 1);
                }
                if (line.find("\"modeling\": \"PlantModeler\"") != std::string::npos) has_plant_modeler = true;
                if (line.find("\"shading\": \"UniversalShader\"") != std::string::npos) has_universal_shader = true;
                
                if (line.find("}") != std::string::npos && line.find("{") == std::string::npos) {
                    if (type != "NOT_FOUND") break;
                }
            }
        }
        return type + (has_plant_modeler ? ":PLANT" : ":NO_PLANT") + (has_universal_shader ? ":SHADER" : ":NO_SHADER");
    };

    std::string h7 = check_config(m7_config, "Herbaceous");
    std::string h9 = check_config(m9_config, "Herbaceous");
    std::string a7 = check_config(m7_config, "Arbor");
    std::string a9 = check_config(m9_config, "Arbor");

    std::cout << "herbaceous_m7_info = " << h7 << std::endl;
    std::cout << "herbaceous_m9_info = " << h9 << std::endl;
    std::cout << "arbor_m7_info = " << a7 << std::endl;
    std::cout << "arbor_m9_info = " << a9 << std::endl;

    bool h_ok = (h9.find("DYNAMIC") != std::string::npos && h9.find(":PLANT") != std::string::npos && h9.find(":SHADER") != std::string::npos);
    bool a_ok = (a9.find("DYNAMIC") != std::string::npos && a9.find(":PLANT") != std::string::npos && a9.find(":SHADER") != std::string::npos);
    
    std::cout << "herbaceous_structure_valid = " << (h_ok ? "true" : "false") << std::endl;
    std::cout << "arbor_structure_valid = " << (a_ok ? "true" : "false") << std::endl;

    return (h_ok && a_ok) ? 0 : 1;
}
