#include <iostream>
#include <vector>
#include <string>
#include <fstream>

// Simple QC Scanner to detect "blank" or "corrupt" frames
// In a real scenario, this would use a library like FreeImage or OpenImageIO
// for now, we simulate the logic by checking file size and existence

namespace Movie {
    class QCScanner {
    public:
        struct Report {
            std::vector<std::string> missing_frames;
            std::vector<std::string> corrupt_frames;
            int total_scanned = 0;
        };

        static Report scan_range(const std::string& directory, int start, int end) {
            Report report;
            for (int i = start; i <= end; ++i) {
                char buffer[128];
                snprintf(buffer, sizeof(buffer), "%s/%05d.png", directory.c_str(), i);
                std::string path(buffer);
                
                std::ifstream file(path, std::ios::binary | std::ios::ate);
                if (!file.is_open()) {
                    report.missing_frames.push_back(path);
                } else {
                    // Check if file is suspiciously small (e.g. < 10KB)
                    if (file.tellg() < 10240) {
                        report.corrupt_frames.push_back(path);
                    }
                }
                report.total_scanned++;
            }
            return report;
        }
    };
}

int main(int argc, char* argv[]) {
    if (argc < 4) {
        std::cout << "Usage: qc_scanner <directory> <start> <end>" << std::endl;
        return 1;
    }

    std::string dir = argv[1];
    int start = std::stoi(argv[2]);
    int end = std::stoi(argv[3]);

    auto report = Movie::QCScanner::scan_range(dir, start, end);

    std::cout << "--- QC Report ---" << std::endl;
    std::cout << "Total Scanned: " << report.total_scanned << std::endl;
    std::cout << "Missing: " << report.missing_frames.size() << std::endl;
    std::cout << "Corrupt/Small: " << report.corrupt_frames.size() << std::endl;

    for (const auto& f : report.missing_frames) std::cout << "MISSING: " << f << std::endl;
    for (const auto& f : report.corrupt_frames) std::cout << "CORRUPT: " << f << std::endl;

    return (report.missing_frames.empty() && report.corrupt_frames.empty()) ? 0 : 2;
}
