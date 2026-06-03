CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -I.
CARDS_DIR = cards
TEMP_DIR = temp
FACTS_DIR = facts

TARGETS = \
	$(TEMP_DIR)/ClinicalDecisionsSpecAudit \
	$(TEMP_DIR)/ConfigSpecAudit \
	$(TEMP_DIR)/FeaturesSpecAudit \
	$(TEMP_DIR)/APIsSpecAudit \
	$(TEMP_DIR)/JSONNamingSpecAudit \
	$(TEMP_DIR)/ImportsSpecAudit

all: $(TARGETS)

$(TEMP_DIR)/%: $(CARDS_DIR)/%.cpp
	@mkdir -p $(TEMP_DIR)
	$(CXX) $(CXXFLAGS) $< -o $@

run: all
	@echo "Running MeSH Suite v10.0 C++ SDD Pipeline Audits..."
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(TEMP_DIR)/ClinicalDecisionsSpecAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(TEMP_DIR)/ConfigSpecAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(TEMP_DIR)/FeaturesSpecAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(TEMP_DIR)/APIsSpecAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(TEMP_DIR)/JSONNamingSpecAudit
	-@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(TEMP_DIR)/ImportsSpecAudit
	@echo "Audit execution complete. Potty training cleanup in progress..."
	@rm -rf $(TEMP_DIR)
	@echo "Workspace is 100% clean."

clean:
	rm -rf $(TEMP_DIR)

.PHONY: all run clean
