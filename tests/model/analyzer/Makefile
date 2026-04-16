CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -pedantic -O2
LDFLAGS := -pthread

# Platform-specific
UNAME := $(shell uname)
ifeq ($(UNAME), Linux)
    LDFLAGS += -lrt
endif

# Targets
ANALYZER := analyzer
TEST_ANALYZER := test_analyzer

# Headers
HEADERS := error_types.hpp error_wrapper.hpp rpc_protocol.hpp \
           analyzer_queue.hpp filter_manager.hpp file_buffer.hpp \
           benchmark.hpp keyboard_input.hpp

.PHONY: all clean

all: $(ANALYZER) $(TEST_ANALYZER)

$(ANALYZER): analyzer_main.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $@ $< $(LDFLAGS)

$(TEST_ANALYZER): test_analyzer.cpp $(HEADERS)
	$(CXX) $(CXXFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f $(ANALYZER) $(TEST_ANALYZER) analyzer_log.txt test_analyzer_log.txt

# Debug build
debug: CXXFLAGS += -g -DDEBUG -O0
debug: all
