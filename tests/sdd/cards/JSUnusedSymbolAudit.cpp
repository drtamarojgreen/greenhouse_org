#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <filesystem>
#include <set>
#include <regex>
#include <unordered_set>
#include "../cpp/util/fact_utils.h"
#include "../cpp/util/decorator.h"

namespace fs = std::filesystem;
using namespace Sorrel::Sdd::Util;

// @Card: js_unused_symbol_audit
// @Results files_checked, potential_unused_count, unused_symbols

int main() {
    auto env = FactReader::readFacts("environment.facts");
    std::vector<std::string> scan_dirs;
    if (env.count("genetic_js_dir")) scan_dirs.push_back(env.at("genetic_js_dir"));
    if (env.count("models_js_dir")) scan_dirs.push_back(env.at("models_js_dir"));

    std::unordered_set<std::string> declared_symbols;
    std::unordered_set<std::string> used_symbols;
    int files_checked = 0;

    // Matches 'const name =', 'let name =', 'var name =', 'function name(', 'name: function'
    std::regex decl_regex("\\b(?:const|let|var|function)\\s+([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+):\\s*function");
    std::regex word_regex("\\b([a-zA-Z0-9_]+)\\b");

    std::vector<std::string> all_files;
    for (const auto& js_dir : scan_dirs) {
        if (!fs::exists(js_dir)) continue;
        for (const auto& entry : fs::directory_iterator(js_dir)) {
            if (entry.path().extension() == ".js") {
                all_files.push_back(entry.path().string());
            }
        }
    }

    files_checked = all_files.size();

    // First pass: Collect all declarations
    for (const auto& file_path : all_files) {
        std::ifstream file(file_path);
        std::string line;
        while (std::getline(file, line)) {
            std::smatch match;
            std::string search_line = line;
            while (std::regex_search(search_line, match, decl_regex)) {
                if (match[1].matched) declared_symbols.insert(match[1]);
                else if (match[2].matched) declared_symbols.insert(match[2]);
                search_line = match.suffix().str();
            }
        }
    }

    // Second pass: Tokenize all files and check usage
    for (const auto& file_path : all_files) {
        std::ifstream file(file_path);
        std::string line;
        while (std::getline(file, line)) {
            std::smatch match;
            std::string search_line = line;
            size_t cumulative_offset = 0;
            while (std::regex_search(search_line, match, word_regex)) {
                std::string word = match[1];
                if (declared_symbols.count(word)) {
                    size_t absolute_pos = cumulative_offset + match.position();
                    std::string prefix = line.substr(0, absolute_pos);

                    // Simple check if the word is NOT being declared or assigned as a property here
                    std::regex keyword_regex("\\b(const|let|var|function)\\s+$");
                    std::regex prop_decl_regex("([a-zA-Z0-9_]+):\\s*$");

                    if (!std::regex_search(prefix, keyword_regex) && !std::regex_search(prefix, prop_decl_regex)) {
                         used_symbols.insert(word);
                    }
                }
                cumulative_offset += match.position() + match.length();
                search_line = match.suffix().str();
            }
        }
    }

    std::vector<std::string> unused;
    for (const auto& sym : declared_symbols) {
        if (used_symbols.find(sym) == used_symbols.end()) {
            if (sym.find("Greenhouse") == std::string::npos && sym.length() > 3) {
                unused.push_back(sym);
            }
        }
    }

    std::cout << "files_checked = " << files_checked << std::endl;
    std::cout << "potential_unused_count = " << unused.size() << std::endl;
    std::cout << "unused_symbols = "; for (const auto& v : unused) std::cout << v << " "; std::cout << std::endl;

    return 0;
}
