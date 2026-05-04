#ifndef SORREL_SDD_UTIL_DECORATOR_H
#define SORREL_SDD_UTIL_DECORATOR_H

#include <iostream>
#include <map>
#include <string>

namespace Sorrel::Sdd::Util {

// Enforces that a required fact key equals the expected value before proceeding.
// If the guard fails, prints a diagnostic and returns false — caller must exit.
inline bool require_fact(
    const std::map<std::string, std::string>& facts,
    const std::string& key,
    const std::string& expected_value)
{
    auto it = facts.find(key);
    if (it == facts.end()) {
        std::cerr << "[DECORATOR FAIL] Required fact '" << key << "' not found in facts file." << std::endl;
        return false;
    }
    if (it->second != expected_value) {
        std::cerr << "[DECORATOR FAIL] Fact '" << key << "' = '" << it->second
                  << "', expected '" << expected_value << "'. Card will not run." << std::endl;
        return false;
    }
    return true;
}

} // namespace Sorrel::Sdd::Util

#endif // SORREL_SDD_UTIL_DECORATOR_H
