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
- [x] SourceRigConsistencyAudit: verify each MESH entity with a source_mesh also declares a source_rig; flags missing and empty rig references.

## Open

- [ ] BeatOverlapAudit: check if any two storyline beats have overlapping frame ranges (distinct from contiguity — catches beats that share frames unintentionally).
- [ ] PatrolPathReferenceAudit: verify every entity patrol.path value (e.g. "perimeter", "perimeter_inner") matches a key declared in patrol_paths — stray path names will silently produce no animation.
