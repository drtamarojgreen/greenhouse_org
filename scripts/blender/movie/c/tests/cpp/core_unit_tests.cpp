#include <iostream>
#include <cassert>
#include <cmath>
#include "MathCore.hpp"
#include "status.h"

void test_noise() {
    float val = MovieMath::looping_noise(0, 10.0f, 1.0f);
    assert(val == 0.0f);
    std::cout << "test_noise passed" << std::endl;
}

void test_ease() {
    float val = MovieMath::ease_in_out(0.5f);
    assert(val == 0.5f);
    assert(MovieMath::ease_in_out(0.0f) == 0.0f);
    assert(MovieMath::ease_in_out(1.0f) == 1.0f);
    std::cout << "test_ease passed" << std::endl;
}

void test_status() {
    Movie::Status ok = Movie::Status::OK();
    assert(ok.ok());
    assert(ok.code == Movie::StatusCode::OK);

    Movie::Status err = {Movie::StatusCode::ERROR, "Fail"};
    assert(!err.ok());
    assert(err.message == "Fail");
    std::cout << "test_status passed" << std::endl;
}

int main() {
    test_noise();
    test_ease();
    test_status();
    std::cout << "All core unit tests passed!" << std::endl;
    return 0;
}
