# Define tests and benchmark targets
# For each test file in tests/cards/, add an executable
file(GLOB CHAI_TEST_CARDS "tests/cards/*.cpp")
foreach(CARD_SRC ${CHAI_TEST_CARDS})
    get_filename_component(CARD_NAME ${CARD_SRC} NAME_WE)
    add_executable(${CARD_NAME} ${CARD_SRC})
    target_include_directories(${CARD_NAME} PRIVATE include tests/cpp/util)
endforeach()

# Add benchmark targets
file(GLOB BENCH_SRCS "bench/*.cpp")
foreach(BENCH_SRC ${BENCH_SRCS})
    get_filename_component(BENCH_NAME ${BENCH_SRC} NAME_WE)
    add_executable(${BENCH_NAME} ${BENCH_SRC})
    target_include_directories(${BENCH_NAME} PRIVATE include)
endforeach()
