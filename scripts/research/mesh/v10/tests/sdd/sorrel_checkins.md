# MeSH Suite v10.0 SDD — Sorrel Checkins
Tracks the structural implementation of compliance audits and pending verification steps.

## Completed Audits (Structural Implementation)

- [x] **ClinicalDecisionsSpecAudit.cpp**: Source code written to scan Python files for hardcoded clinical stubs. Not yet compiled or run.
- [x] **ConfigSpecAudit.cpp**: Source code written to scan config.yaml for prohibited clinical categories. Not yet compiled or run.
- [x] **FeaturesSpecAudit.cpp**: Source code written to empirically check that all v10 systematic review, compatibility, and roadmapping features are fully implemented. Not yet compiled or run.
- [x] **APIsSpecAudit.cpp**: Source code written to statically verify urllib Standard Request layers, scientific URL structures, and cached fallback endpoints. Not yet compiled or run.
- [x] **JSONNamingSpecAudit.cpp**: Source code written to programmatically scan dictionary key accesses and assert standard snake_case naming conventions. Not yet compiled or run.
- [x] **ImportsSpecAudit.cpp**: Source code written to programmatically scan all module references and check standard library import completeness. Not yet compiled or run.

## Open / Pending Tasks

- [ ] **Compile C++ Audit Suite**: Build the binaries dynamically in `temp/` using `make all` in `v10/tests/sdd/` (requires user execution).
- [ ] **Execute C++ Audits**: Run compiled binaries in `temp/` and auto-cleanup using `make run`.
- [ ] **Check for Compiler Warnings**: Verify that compilation completes cleanly under standard C++17 flags.
- [ ] **Address Static Scans**: If dynamic C++ audits detect any missing files or parsing failures, correct the path mappings in `environment.facts`.
