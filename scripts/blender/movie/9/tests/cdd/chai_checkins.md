# Movie 9 CDD — Chai Checkins
# Tracks deferred/unimplemented work per the CHAI Agent Handbook.

## Completed

- [x] CharacterNamingAudit
- [x] CameraNamingAudit
- [x] EmptyNamingAudit
- [x] BackdropNamingAudit
- [x] UniqueEntityIdAudit
- [x] StrayTagAudit
- [x] FrameBoundaryAudit
- [x] AnimationTagAudit
- [x] SourceMeshPresenceAudit
- [x] SceneConfigCoverageAudit
- [x] SourceRigConsistencyAudit
- [x] BeatOverlapAudit
- [x] PatrolPathReferenceAudit
- [x] CameraSequencingAudit
- [x] CharacterVisibilityAudit
- [x] PoseMarkerAudit: verify that all 'action' tags used in storyline have corresponding pose markers in the respective rigs.
- [x] AssetVisibilityTimingAudit: reports and verifies environment and character visibility frame ranges.
- [x] CameraDistanceAudit: reports distance from camera to each character in the scene.

## Open

- [ ] LightingAndTargetAudit: implement frame-by-frame verification of lighting and camera targets.
- [ ] ProtagonistStructureAudit: further automate comparison of protagonist DYNAMIC vs MESH structure against previous movie versions.
- [ ] SceneGeometryAudit: verify that protagonists are within the camera frustum for key scene ranges.
