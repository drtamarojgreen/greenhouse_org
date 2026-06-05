# v12 Framework SDD - Restrictions
# Enforces structural integrity and coding patterns for the v12 research pipeline.

## 1. Structural Restrictions
- **Directory Scope**: All new code must reside within `scripts/research/mesh/v12/`.
- **Modular Isolation**: Each lifecycle stage must be independent and communicate only via the `context` dictionary.
- **Dependency Direction**: Stages must depend on `BaseStage` and `schema.py`, but not on each other.
- **Plugin Pattern**: New models and transformers must be registered in the central registry and never instantiated directly by name string in core code.

## 2. Pattern Restrictions
- **Zero Stubs**: No `pass` or `NotImplementedError` in final implementation files (except abstract bases).
- **No Empty Catches**: All `try...except` blocks must log the error and handle it or re-raise.
- **Strict Typing**: All function signatures must include type hints.
- **Docstrings**: All classes and public methods must have Google-style docstrings.

## 3. Tool Restrictions
- **Configuration**: Use `pydantic` (v2) for all configuration validation.
- **Logging**: Use the central `logging_config.py` for all output.
- **Data Handling**: Use `pandas` and `numpy` for data structures.

## 4. Architectural Restrictions
- **Sip Principle**: Work must be divisible into minimal, verifiable increments.
- **Numeric Evidence**: Verification must produce measurable outputs (e.g., `files_written`, `execution_time_ms`).
- **Deterministic Seeding**: Global seeds must be set in Stage 0 and respected throughout.
