# Production Bugs Report

This file documents identified bugs in the Greenhouse production scripts located in `docs/js/`.

## GreenhouseMobile.js

### Script Path Resolution Bug
- **Issue**: The `modelRegistry` in `GreenhouseMobile.js` lists script names without their subdirectory paths (e.g., `genetic_config.js` instead of `genetic/genetic_config.js`).
- **Effect**: When `activateModel` calls `Utils.loadScript(scriptName, baseUrl)`, it fails to find the files because they are nested in subdirectories like `docs/js/genetic/` or `docs/js/neuro/`.
- **Evidence**: Mobile Hub screenshots show "Failed to load genetic" and "Failed to load neuro" because the 404 errors prevent the models from initializing.
- **Suggested Fix**: Update `modelRegistry` in `GreenhouseMobile.js` to include the correct relative paths or update `loadScript` to search subdirectories.
