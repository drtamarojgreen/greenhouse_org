#ifndef FACT_UTILS_H
#define FACT_UTILS_H

#include <map>
#include <string>
#include <vector>

namespace Chai {
namespace Cdd {
namespace Util {

class FactReader {
public:
    static std::map<std::string, std::string> readFacts(const std::string& filepath);
};

} // Util
} // Cdd
} // Chai

#endif
