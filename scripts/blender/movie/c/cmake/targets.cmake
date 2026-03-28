# Define tests and benchmark targets
# For each test file in tests/cards/, add an executable
file(GLOB CHAI_TEST_CARDS "tests/cards/*.cpp")

# Shared utility for tests
add_library(test_util STATIC tests/cpp/util/fact_utils.cpp)
target_include_directories(test_util PUBLIC tests/cpp/util include)

foreach(CARD_SRC ${CHAI_TEST_CARDS})
    get_filename_component(CARD_NAME ${CARD_SRC} NAME_WE)
    add_executable(${CARD_NAME} ${CARD_SRC})
    target_link_libraries(${CARD_NAME} PRIVATE test_util)
endforeach()

# Add unit tests
add_executable(core_unit_tests tests/cpp/core_unit_tests.cpp)
target_include_directories(core_unit_tests PRIVATE include)

# Add benchmark targets
file(GLOB BENCH_SRCS "bench/*.cpp")
foreach(BENCH_SRC ${BENCH_SRCS})
    get_filename_component(BENCH_NAME ${BENCH_SRC} NAME_WE)
    add_executable(${BENCH_NAME} ${BENCH_SRC})
    target_include_directories(${BENCH_NAME} PRIVATE include)
endforeach()
