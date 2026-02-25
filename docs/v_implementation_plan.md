# MeSH Discovery Suite Implementation Plan

This document outlines the changes required to address issues and implement enhancements in the MeSH Discovery Suite pipelines (v2, v3, and v4).

## 1. v2 Pipeline: Seed Term Processing
### Issue
The v2 pipeline currently rejects the seed term if its publication count does not meet the `min_count` threshold.
### Change
Modify `scripts/research/mesh/v2/core/engine.py` in the `run` method to explicitly allow the `seed_term` to be accepted regardless of its publication count.
### Verification
Run `scripts/research/mesh/v2/pipeline.py` with a high `min_count` and confirm the seed term is processed.

## 2. v2 Pipeline Advanced: Query Limit
### Issue
The advanced pipeline lacks a mechanism to limit the number of API calls, which can lead to excessive usage.
### Change
1. Add `query_limit` to `scripts/research/mesh/v2/config.yaml`.
2. Update `scripts/research/mesh/v2/pipeline_advanced.py` to:
   - Load `query_limit` from the configuration.
   - Implement a counter in `build_dynamic_mesh_tree`.
   - Halt further API requests once the limit is reached.
### Verification
Set a low `query_limit` and verify the pipeline stops fetching details after the limit is hit.

## 3. v3 and v4 Pipelines: Configuration Management
### Issue
Pipelines v3 and v4 use hardcoded `default_config` blocks, ignoring some values from `config.yaml` or making the code redundant.
### Change
1. Move all essential defaults from `pipeline.py` to `config.yaml` for both versions.
2. Refactor `_load_config` in `scripts/research/mesh/v3/pipeline.py` and `scripts/research/mesh/v4/pipeline.py` to read directly from the YAML file.
### Verification
Confirm that modifying `config.yaml` correctly updates pipeline behavior without relying on internal defaults.

## 4. v3 Pipeline: ElementTree Definition Error
### Issue
The v3 pipeline fails when parsing XML abstracts because `ElementTree` is used but not imported.
### Change
Add `import xml.etree.ElementTree as ElementTree` to the imports in `scripts/research/mesh/v3/pipeline.py`.
### Verification
Run the v3 pipeline with NLP enrichment enabled and confirm it parses abstracts without errors.

## 5. v4 Pipeline: Rate Limiting
### Issue
The v4 pipeline frequently encounters 429 "Rate limited" errors from the NCBI API.
### Change
Modify `scripts/research/mesh/v4/core/client.py` to include a mandatory `asyncio.sleep(0.4)` (or similar) before each request in the `fetch` method to ensure compliance with NCBI's rate limits.
### Verification
Run the v4 pipeline and observe the logs for a significant reduction in 429 warnings.

## 6. Testing and Regression
- Run existing unit tests: `pytest tests/unit/test_mesh_v6.py tests/unit/test_mesh_v8.py`.
- Conduct end-to-end runs of each affected pipeline.
