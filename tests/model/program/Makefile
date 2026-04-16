CXX := g++
CXXFLAGS := -std=c++17 -Wall -Wextra -pedantic -O2 -I../analyzer
LDFLAGS := -pthread

# Platform-specific
UNAME := $(shell uname)
ifeq ($(UNAME), Linux)
    LDFLAGS += -lrt
endif

# Targets
WORKOUT := workout_simple

.PHONY: all clean

all: $(WORKOUT)

$(WORKOUT): workout_simple.cpp error_handler.hpp ../analyzer/error_wrapper.hpp ../analyzer/rpc_protocol.hpp
	$(CXX) $(CXXFLAGS) -o $@ $< $(LDFLAGS)

clean:
	rm -f $(WORKOUT)
