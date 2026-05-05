CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -I.
CARDS_DIR = cards
BIN_DIR = bin
FACTS_DIR = facts

# Ensure bin directory exists
$(shell mkdir -p $(BIN_DIR))

TARGETS = \
	$(BIN_DIR)/GeneticUIMethodAudit \
	$(BIN_DIR)/JSGlobalNamespaceAudit \
	$(BIN_DIR)/JSNamingConventionAudit \
	$(BIN_DIR)/JSUnusedSymbolAudit \
	$(BIN_DIR)/JSEmptyCatchAudit \
	$(BIN_DIR)/JSMeaninglessAssertionAudit \
	$(BIN_DIR)/JSHardcodedValueAudit \
	$(BIN_DIR)/JSCodeDuplicationAudit \
	$(BIN_DIR)/JSFileLengthAudit \
	$(BIN_DIR)/JSLongTaskAudit

all: $(TARGETS)

$(BIN_DIR)/%: $(CARDS_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

run: all
	@echo "Running JS SDD Pipeline Audits..."
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/GeneticUIMethodAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSGlobalNamespaceAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSNamingConventionAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSUnusedSymbolAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSEmptyCatchAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSMeaninglessAssertionAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSHardcodedValueAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSCodeDuplicationAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSFileLengthAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSLongTaskAudit

verify: run

clean:
	rm -rf $(BIN_DIR)/*
	touch $(BIN_DIR)/.gitkeep

.PHONY: all run verify clean
