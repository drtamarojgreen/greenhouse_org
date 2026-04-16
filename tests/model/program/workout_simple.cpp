#include "error_handler.hpp"
#include <iostream>
#include <vector>
#include <thread>
#include <chrono>
#include <cmath>

using namespace rma;

void run_training(int epochs, int tokenizer_size) {
    RMA_INFO("Starting workout_simple training");
    RMA_ERROR_FMT(ErrorType::INFO, "Config: epochs=%d, tokenizer_size=%d", epochs, tokenizer_size);

    for (int epoch = 0; epoch < epochs; ++epoch) {
        RMA_DEBUG("Epoch started");

        // Simulate some processing
        for (int i = 0; i < tokenizer_size; ++i) {
            // Potential division by zero error simulation
            if (tokenizer_size == 0) {
                 RMA_ERROR(ErrorType::FLOAT_PRECISION, "Division by zero in tokenizer normalization!");
            } else if (i == tokenizer_size / 2 && epoch == epochs / 2) {
                // Simulate an occasional division by zero if we were using a flawed formula
                double denominator = static_cast<double>(epochs / 2 - epoch);
                if (std::abs(denominator) < 1e-9) {
                    RMA_ERROR_VAL(ErrorType::FLOAT_PRECISION, denominator, "Denominator is zero at mid-training!");
                }
            }

            if (i % 10 == 0) {
                std::this_thread::sleep_for(std::chrono::milliseconds(10));
            }
        }

        if (epoch == epochs - 1) {
            RMA_INFO("Training reaching final epoch");
        }
    }

    RMA_INFO("Training completed successfully");
}

int main(int argc, char* argv[]) {
    uint32_t session_id = 0;
    int epochs = 10;
    int tokenizer_size = 50;

    if (argc > 1) session_id = std::stoul(argv[1]);
    if (argc > 2) epochs = std::stoi(argv[2]);
    if (argc > 3) tokenizer_size = std::stoi(argv[3]);

    if (!RMA_INIT(session_id)) {
        std::cerr << "Failed to initialize RMA ErrorHandler" << std::endl;
        return 1;
    }

    std::cout << "Workout Simple starting (Session " << session_id << ")" << std::endl;

    run_training(epochs, tokenizer_size);

    std::cout << "Workout Simple finished." << std::endl;

    return 0;
}
