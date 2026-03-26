cmake_minimum_required(VERSION 3.10)
project(GreenhouseMovieEngine CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(cmake/options.cmake)

include_directories(include)

# Main Engine
add_executable(movie_engine src/movie_engine.cpp)
target_include_directories(movie_engine PRIVATE include)

# Library for Python bindings
add_library(movie_accel SHARED src/bindings.cpp src/mesh_math.cpp)
target_include_directories(movie_accel PRIVATE include)

# Sub-CMake for tests and benchmarks if needed
include(cmake/targets.cmake)
