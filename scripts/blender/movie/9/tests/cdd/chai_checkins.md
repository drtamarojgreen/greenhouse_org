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
- [x] AnimationTagAudit: reads known_tags vocabulary from facts file, flags unknown tags with frequency
- [x] SourceMeshPresenceAudit: detects empty and repeated source_mesh names across MESH entities
- [x] SceneConfigCoverageAudit: probes disk for each path declared in extended_scenes
- [x] SourceRigConsistencyAudit: verify each MESH entity with a source_mesh also declares a source_rig.
- [x] BeatOverlapAudit: check if any two storyline beats have overlapping frame ranges.
- [x] PatrolPathReferenceAudit: verify every entity patrol.path value matches a key declared in patrol_paths.
- [x] CameraSequencingAudit: verify cameras and prefixes in sequencing exist in camera definitions.
- [x] CharacterVisibilityAudit: validate visibility action targets and parameter presence.

## Open

- [ ] PoseMarkerAudit: verify that all 'action' tags used in storyline have corresponding pose markers in the respective rigs.
