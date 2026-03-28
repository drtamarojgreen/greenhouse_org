#ifndef FACT_READER_HPP
#define FACT_READER_HPP

#include <iostream>
#include <fstream>
#include <string>
#include <map>
#include <algorithm>

class FactReader {
public:
    static std::map<std::string, std::string> read_facts(const std::string& filepath) {
        std::map<std::string, std::string> facts;
        std::ifstream file(filepath);
        std::string line;

        while (std::getline(file, line)) {
            // Basic parser for "Is key = value"
            if (line.find("Is ") == 0) {
                size_t eq = line.find(" = ");
                if (eq != std::string::npos) {
                    std::string key = line.substr(3, eq - 3);
                    std::string val = line.substr(eq + 3);
                    facts[key] = val;
                }
            }
        }
        return facts;
    }
};

#endif
