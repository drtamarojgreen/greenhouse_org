# Universal System Protocol for Greenhouse Development

## 1. Core Operational Mandates

These mandates are universal and apply to all tasks undertaken within this repository, regardless of the specific development domain.

### 1.1. Directive on Compilation
Binary compilation is strictly forbidden. This directive prohibits the execution of any command or script that results in a binary executable (e.g., `make`, `g++`, `mvn`, `gcc`). Scripts that do not produce binaries, such as those for testing, data processing, or interpretation (e.g., Python, R, shell scripts), are permitted. A pre-execution analysis of any script is mandatory to ensure compliance. In cases where binary compilation is deemed essential, all operations will cease, and authorization will be requested via `request_user_input`.

### 1.2. The Gated Direct-to-Publish Protocol
All source code modifications are to be published directly, as-is. The functional state of the code is secondary to the precision of the publication process. Adherence to the following meticulous staging protocol is non-negotiable.
1.  **Status Review**: Execute `git status` to obtain a comprehensive list of all modified and untracked files.
2.  **Precision Staging**: Stage files for commit individually using `git add <path/to/your/file>`. The use of broad-based or wildcard commands (e.g., `git add .`, `git add -A`, `git add *`) is a critical failure condition and is explicitly forbidden.
3.  **Exclusion of Artifacts**: No build products, test reports, or any other extraneous files shall be included in the commit. The staging area must be clean.
4.  **Final Verification**: Execute `git status` a second time to meticulously verify that the "Changes to be committed" list contains only the intended source files before proceeding to commit.

### 1.3. Mandate on Professional Standards
All deliverables are intended for a live production environment or for critical data analysis, and must meet the highest professional standards. Work must be thoroughly reviewed for quality, accuracy, and alignment with project objectives before submission. Superficial or incomplete solutions are unacceptable.

## 2. Domain-Specific Protocols

The following protocols provide context and rules for specific development areas within the repository.

### 2.1. Web Development Environment (`apps/` and `docs/`)
This domain covers both the live Velo application and the static JavaScript application.

*   **Architectural Duality**: Be aware of the two distinct frontend systems:
    *   **Live Velo Production Environment (`apps/frontend/schedule/`)**: Runs on the live Wix site. Interacts with the UI via the Velo API (`$w`). Direct DOM manipulation is prohibited. Communicates with Velo backend functions in `apps/wv/backend/`.
    *   **Static JavaScript Environment (`docs/js/`)**: A vanilla JS application for local testing. It exercises direct, programmatic control over the DOM.
*   **Verification Protocol**: All UI validation will be conducted using **Selenium**.
    *   For the **Velo environment**, tests must be executed against the live production URL, incorporating a 5-15 second delay for dynamic content rendering.
    *   For the **Static JS environment**, tests will run against dedicated HTML test harnesses (e.g., `docs/test_dependency_loading.html`).
*   **Engineering Standards**:
    *   **CSS**: Styles must be tightly scoped to unique component IDs to prevent global conflicts. Vendor prefixes (`-webkit-`) and fallbacks are mandatory.
    *   **JavaScript**: Use `requestAnimationFrame` for high-frequency DOM updates. Use `animationend`/`transitionend` for event-driven cleanup. Data fetching must be user-initiated.

### 2.2. Pharmaceutical Data Pipeline (`scripts/pharmaceutical/`)
This domain covers the data processing pipeline for FDA drug data.

*   **Pipeline Architecture**: This is a multi-stage data processing pipeline orchestrated by shell scripts (`.sh`). It involves downloading data, converting it from XML and tabular formats to RDF, loading it into a triple store, and running SPARQL queries.
*   **Core Technologies**: `bash`, `wget`, `xsltproc`, `python3`, `curl`, and Apache Jena Fuseki.
*   **Python Dependencies**: The pipeline's Python scripts require `pandas` and `rdflib`.
*   **External Dependencies**: The pipeline requires an external XSLT file (`spl2rdf_extended.xsl`) and a running Apache Jena Fuseki server with a dataset named `spl`. Assume these are configured and available.
*   **Verification**: Verification involves ensuring the successful execution of the pipeline scripts, checking for the creation of RDF files in `rdf_data/`, and confirming that query results are generated in `results/`.

### 2.3. General Python Scripting & Testing (`tests/`)
This domain covers all general-purpose Python scripts, including the legacy test suites in `tests/python_legacy` and `tests/bdd_legacy`.

*   **Legacy Constraint**: All legacy Python tests must be preserved. They should not be deleted or re-implemented unless explicitly directed.
*   **Testing Framework**: The primary testing framework is Python's built-in `unittest`. The BDD tests utilize `behave`.
*   **Execution**: Tests are typically run from the root directory, e.g., `python3 -m unittest tests/python_legacy/test_frontend.py`. The `run_all_tests.py` script provides a method for executing the entire suite.
*   **Environment**: These are command-line scripts. They do not have a UI component, but may use Selenium to interact with web pages as part of their test execution.
*   **Dependencies**: Be aware of required dependencies for different tests, which may include `selenium`, `behave`, etc.

### 2.4. R Scripting
This domain covers all data analysis and modeling scripts written in the R language.

*   **Execution**: R scripts must be executed as non-interactive jobs using `Rscript`. For example: `Rscript your_script.R`.
*   **Dependency Management**: Before execution, you must identify script dependencies. Any required packages (e.g., `catmaid`, `rgl`, `tidyverse`) must be installed programmatically within the R script itself, guarded by a check to see if they are already installed. For example:
    ```R
    if (!require("tidyverse")) install.packages("tidyverse", repos = "http://cran.us.r-project.org")
    library(tidyverse)
    ```
*   **Verification**: Verification of R scripts involves ensuring successful execution and checking for the creation of specified output artifacts, such as plots (`.png`, `.pdf`), data files (`.csv`, `.rds`), or console output logs.
*   **Data Integrity**: All data sources must be clearly documented within the script's comments. Scripts should be designed to read from a `data/` directory and write outputs to a `results/` or `plots/` directory.

## 3. General Intelligence

*   **Data Integrity**: The use of synthetic or invented data is strictly prohibited across all domains.
*   **Issue Scoping**: Fixes must be narrowly scoped to the reported problem. Broad refactoring is forbidden unless explicitly authorized.
*   **Code Documentation**: All code, whether it be JavaScript, Python, or R script, must be meticulously commented.