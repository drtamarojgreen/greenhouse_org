CXX = g++
CXXFLAGS = -std=c++17 -I./cpp/util
CARDS_DIR = ./cards
BIN_DIR = ./bin

SOURCES = $(wildcard $(CARDS_DIR)/*.cpp)
EXECUTABLES = $(patsubst $(CARDS_DIR)/%.cpp, $(BIN_DIR)/%, $(SOURCES))

all: $(BIN_DIR) $(EXECUTABLES)

$(BIN_DIR):
	mkdir -p $(BIN_DIR)

$(BIN_DIR)/%: $(CARDS_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

clean:
	rm -rf $(BIN_DIR)

.PHONY: all clean
