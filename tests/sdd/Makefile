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
	$(BIN_DIR)/JSLongTaskAudit \
	$(BIN_DIR)/JSComplexityAudit \
	$(BIN_DIR)/JSVarUsageAudit \
	$(BIN_DIR)/JSMagicNumberDetailedAudit \
	$(BIN_DIR)/JSWasteDetailedAudit \
	$(BIN_DIR)/JSRawPatternDetailedAudit \
	$(BIN_DIR)/MovieStandardizationAudit \
	$(BIN_DIR)/MovieBlenderLogicAudit \
	$(BIN_DIR)/MovieDirectorRegistryAudit \
	$(BIN_DIR)/MovieSourceQualityAudit \
	$(BIN_DIR)/MovieRedundancyAudit \
	$(BIN_DIR)/MovieConfigHygieneAudit \
	$(BIN_DIR)/MovieFilesystemHygieneAudit

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
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSComplexityAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSVarUsageAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSMagicNumberDetailedAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSWasteDetailedAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/JSRawPatternDetailedAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieStandardizationAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieBlenderLogicAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieDirectorRegistryAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieSourceQualityAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieRedundancyAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieConfigHygieneAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/MovieFilesystemHygieneAudit

verify: run

clean:
	rm -rf $(BIN_DIR)/*
	touch $(BIN_DIR)/.gitkeep

.PHONY: all run verify clean
