CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -I.
CARDS_DIR = cards
BIN_DIR = bin
FACTS_DIR = facts

# Ensure bin directory exists
$(shell mkdir -p $(BIN_DIR))

TARGETS = \
	$(BIN_DIR)/CharacterNamingAudit \
	$(BIN_DIR)/CameraNamingAudit \
	$(BIN_DIR)/EmptyNamingAudit \
	$(BIN_DIR)/BackdropNamingAudit \
	$(BIN_DIR)/UniqueEntityIdAudit \
	$(BIN_DIR)/StrayTagAudit \
	$(BIN_DIR)/FrameBoundaryAudit \
	$(BIN_DIR)/AnimationTagAudit \
	$(BIN_DIR)/SourceMeshPresenceAudit \
	$(BIN_DIR)/SceneConfigCoverageAudit \
	$(BIN_DIR)/SourceRigConsistencyAudit \
	$(BIN_DIR)/BeatOverlapAudit \
	$(BIN_DIR)/PatrolPathReferenceAudit \
	$(BIN_DIR)/CameraSequencingAudit \
	$(BIN_DIR)/CharacterVisibilityAudit
	$(BIN_DIR)/SourceRigConsistencyAudit
	$(BIN_DIR)/SceneGeometryAudit \
	$(BIN_DIR)/ProtagonistStructureAudit \
	$(BIN_DIR)/DiagnosticSceneVisibilityAudit

all: $(TARGETS)

$(BIN_DIR)/%Audit: $(CARDS_DIR)/%Audit.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

run: all
	@echo "Running CDD Pipeline Audits..."
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CharacterNamingAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CameraNamingAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/EmptyNamingAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/BackdropNamingAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/UniqueEntityIdAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/StrayTagAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/FrameBoundaryAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/AnimationTagAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SourceMeshPresenceAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SceneConfigCoverageAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SourceRigConsistencyAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/BeatOverlapAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/PatrolPathReferenceAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CameraSequencingAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CharacterVisibilityAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SceneGeometryAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/ProtagonistStructureAudit
	@CHAI_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/DiagnosticSceneVisibilityAudit

verify: run

clean:
	rm -rf $(BIN_DIR)

.PHONY: all run verify clean
