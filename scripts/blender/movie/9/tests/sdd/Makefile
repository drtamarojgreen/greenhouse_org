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
	$(BIN_DIR)/CharacterVisibilityAudit \
	$(BIN_DIR)/PoseMarkerAudit \
	$(BIN_DIR)/PropNamingAudit \
	$(BIN_DIR)/AssetVisibilityTimingAudit \
	$(BIN_DIR)/CameraDistanceAudit \
	$(BIN_DIR)/SceneGeometryAudit \
	$(BIN_DIR)/ProtagonistStructureAudit \
	$(BIN_DIR)/DiagnosticSceneVisibilityAudit

all: $(TARGETS)

$(BIN_DIR)/%Audit: $(CARDS_DIR)/%Audit.cpp
	$(CXX) $(CXXFLAGS) $< -o $@

run: all
	@echo "Running SDD Pipeline Audits..."
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CharacterNamingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CameraNamingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/EmptyNamingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/BackdropNamingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/UniqueEntityIdAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/StrayTagAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/FrameBoundaryAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/AnimationTagAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SourceMeshPresenceAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SceneConfigCoverageAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SourceRigConsistencyAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/BeatOverlapAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/PatrolPathReferenceAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CameraSequencingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CharacterVisibilityAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/PoseMarkerAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/PropNamingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/AssetVisibilityTimingAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/CameraDistanceAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/SceneGeometryAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/ProtagonistStructureAudit
	@SORREL_FACTS_DIR=$(FACTS_DIR) ./$(BIN_DIR)/DiagnosticSceneVisibilityAudit

verify: run

clean:
	rm -rf $(BIN_DIR)

.PHONY: all run verify clean
