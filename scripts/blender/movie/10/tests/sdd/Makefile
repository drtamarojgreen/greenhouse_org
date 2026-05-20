CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -I.
CARDS_DIR = cards
BIN_DIR = bin
FACTS_DIR = facts

$(shell mkdir -p $(BIN_DIR))

TARGETS = \
	$(BIN_DIR)/Movie10ArchitectureAudit \
	$(BIN_DIR)/Movie10FidelityAudit

all: $(TARGETS)

$(BIN_DIR)/%: $(CARDS_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

run: all
	@echo "Running Movie 10 Sorrel Pipeline Audits..."
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/Movie10ArchitectureAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/Movie10FidelityAudit

clean:
	rm -rf $(BIN_DIR)/*

.PHONY: all run clean
