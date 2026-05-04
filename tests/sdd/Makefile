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
	$(BIN_DIR)/JSMeaninglessAssertionAudit

all: $(TARGETS)

$(BIN_DIR)/%: $(CARDS_DIR)/%.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

run: all
	@echo "Running JS SDD Pipeline Audits..."
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/GeneticUIMethodAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSGlobalNamespaceAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSNamingConventionAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSUnusedSymbolAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSEmptyCatchAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSMeaninglessAssertionAudit

verify: run

clean:
	rm -rf $(BIN_DIR)

.PHONY: all run verify clean
