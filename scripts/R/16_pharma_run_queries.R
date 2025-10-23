# 16_pharma_run_queries.R
#
# Objective:
# This script replaces `run_queries.sh`. It reads SPARQL queries from the
# `.rq` files in the `queries/` directory, executes them against the Fuseki
# server, and saves the results as CSV files.

# --- 1. Load Dependencies ---
# The `SPARQL` package provides a client for executing SPARQL queries.
# Note: This is a CRAN package.
library(SPARQL)

# --- 2. Configuration ---
config <- list(
  QUERY_DIR = "./scripts/R/queries",
  RESULTS_DIR = "./results",
  FUSEKI_ENDPOINT = "http://localhost:3030/spl/query"
)

# --- 3. Define Functions ---

#' Main Function to Run All SPARQL Queries
#'
#' @description Finds all `.rq` files, runs them, and saves the results.
#' @param cfg Configuration list.
run_sparql_queries <- function(cfg) {
  message("--- Starting SPARQL query execution ---")
  dir.create(cfg$RESULTS_DIR, showWarnings = FALSE)
  
  # --- 1. Check Fuseki Server Status ---
  message(paste("Checking for Fuseki server at", cfg$FUSEKI_ENDPOINT, "..."))
  tryCatch({
    # The SPARQL package doesn't have a simple ping, so we use httr if available,
    # or just let it fail gracefully.
    if (requireNamespace("httr", quietly = TRUE)) {
        response <- httr::HEAD(cfg$FUSEKI_ENDPOINT, timeout(5))
        if (response$status_code != 200) {
            stop("Fuseki server is not responding correctly (HTTP status ", response$status_code, ").")
        }
    }
    message("Fuseki server is responding.")
  }, error = function(e) {
    stop("Could not connect to Fuseki server. Please ensure it is running and data is loaded. Error: ", e$message)
  })

  # --- 2. Find and Execute Queries ---
  query_files <- list.files(cfg$QUERY_DIR, pattern = "\\.rq$", full.names = TRUE)
  
  if (length(query_files) == 0) {
    warning("No .rq query files found in the directory. Skipping.")
    return()
  }
  
  message(paste("Found", length(query_files), "queries to execute."))
  
  for (query_file in query_files) {
    query_name <- sub("\\.rq$", "", basename(query_file))
    message(paste("Running query:", query_name, "..."))
    
    # Read the SPARQL query from the file.
    query_string <- readChar(query_file, file.info(query_file)$size)
    
    # Execute the query using the SPARQL package.
    # The `SPARQL()` function returns a list with a `results` data frame.
    query_results <- SPARQL(url = cfg$FUSEKI_ENDPOINT, query = query_string)
    
    if (is.null(query_results) || is.null(query_results$results)) {
        warning(paste("Query", query_name, "returned no results or failed."))
        next
    }
    
    results_df <- query_results$results
    
    # Save the results to a CSV file.
    output_path <- file.path(cfg$RESULTS_DIR, paste0(query_name, ".csv"))
    write.csv(results_df, file = output_path, row.names = FALSE)
    
    message(paste("Results saved to", output_path))
  }
  
  message("--- All queries have been executed ---")
}

# --- 4. Execution ---
# To run this script directly, uncomment the following line:
# run_sparql_queries(config)
