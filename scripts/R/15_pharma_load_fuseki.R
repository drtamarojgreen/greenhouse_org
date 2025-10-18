# 15_pharma_load_fuseki.R
#
# Objective:
# This script replaces the data loading part of `process_and_load.sh`.
# It uploads all generated RDF files to an Apache Jena Fuseki server.
# It includes an improvement to concatenate small files into larger chunks
# before uploading to reduce HTTP overhead and improve loading speed.

# --- 1. Load Dependencies ---
library(httr)

# --- 2. Configuration ---
config <- list(
  RDF_DIR = "./rdf_data",
  FUSEKI_URL = "http://localhost:3030/spl/data",
  CHUNK_SIZE = 500 # Number of SPL files to combine into a single upload.
)

# --- 3. Define Functions ---

#' Upload a Single File or Content to Fuseki
#'
#' @description Posts content to the Fuseki data endpoint.
#' @param content The RDF content (as a string) or a file path.
#' @param is_file TRUE if `content` is a file path, FALSE if it's a string.
#' @param cfg Configuration list.
#' @return The HTTP response object.
upload_to_fuseki <- function(content, is_file = TRUE, cfg) {
  if (is_file) {
    body_data <- upload_file(content)
  } else {
    body_data <- content
  }
  
  response <- POST(
    url = cfg$FUSEKI_URL,
    body = body_data,
    content_type("application/rdf+xml"),
    timeout(300) # 5-minute timeout for large uploads
  )
  return(response)
}

#' Main Function to Orchestrate RDF Data Loading
#'
#' @description Finds all RDF files and uploads them to Fuseki.
#' @param cfg Configuration list.
run_fuseki_load <- function(cfg) {
  message("--- Starting RDF data load into Fuseki ---")
  
  # --- 1. Check Fuseki Server Status ---
  message(paste("Checking for Fuseki server at", cfg$FUSEKI_URL, "..."))
  tryCatch({
    response <- HEAD(cfg$FUSEKI_URL, timeout(5))
    if (response$status_code != 200) {
      stop("Fuseki server is not responding correctly (HTTP status ", response$status_code, ").")
    }
    message("Fuseki server is running.")
  }, error = function(e) {
    stop("Could not connect to Fuseki server. Please ensure it is running and the 'spl' dataset exists. Error: ", e$message)
  })
  
  # --- 2. Load the Single Drugs@FDA File ---
  drugsfda_file <- file.path(cfg$RDF_DIR, "drugsfda.rdf")
  if (file.exists(drugsfda_file)) {
    message("Loading Drugs@FDA RDF...")
    resp <- upload_to_fuseki(drugsfda_file, is_file = TRUE, cfg = cfg)
    if (http_error(resp)) warning("Failed to load Drugs@FDA data.")
  } else {
    warning("Drugs@FDA RDF file not found. Skipping.")
  }
  
  # --- 3. Load the DailyMed SPL Files in Chunks ---
  spl_dir <- file.path(cfg$RDF_DIR, "spl")
  all_spl_files <- list.files(spl_dir, pattern = "\\.rdf$", full.names = TRUE)
  
  if (length(all_spl_files) == 0) {
    warning("No DailyMed SPL RDF files found. Skipping.")
    return()
  }
  
  message(paste("Found", length(all_spl_files), "SPL files to load."))
  
  # Split files into chunks for efficient uploading.
  file_chunks <- split(all_spl_files, ceiling(seq_along(all_spl_files) / cfg$CHUNK_SIZE))
  
  message(paste("Loading SPL files in", length(file_chunks), "chunks of up to", cfg$CHUNK_SIZE, "files each..."))
  
  # Process each chunk.
  i <- 0
  for (chunk in file_chunks) {
    i <- i + 1
    message(paste("Processing chunk", i, "of", length(file_chunks), "..."))
    
    # Concatenate the content of all files in the chunk.
    # We need to keep the XML declaration of the first file and wrap all content
    # in a single <rdf:RDF> element with all necessary namespace definitions.
    
    # Read the first file to get the header
    first_file_content <- readLines(chunk[1], warn = FALSE)
    header <- first_file_content[1:grep("<rdf:RDF", first_file_content)]
    footer <- "</rdf:RDF>"
    
    # Function to extract only the content inside <rdf:RDF>
    extract_rdf_content <- function(file_path) {
      lines <- readLines(file_path, warn = FALSE)
      start <- grep("<rdf:RDF", lines) + 1
      end <- grep("</rdf:RDF>", lines) - 1
      if (length(start) == 0 || length(end) == 0 || start > end) return("")
      return(paste(lines[start:end], collapse = "\n"))
    }
    
    # Combine content from all files in the chunk
    all_content <- sapply(chunk, extract_rdf_content)
    full_chunk_content <- paste(c(paste(header, collapse="\n"), all_content, footer), collapse = "\n")
    
    # Upload the combined content
    resp <- upload_to_fuseki(full_chunk_content, is_file = FALSE, cfg = cfg)
    if (http_error(resp)) {
      warning(paste("Failed to load chunk", i, ". Status:", status_code(resp)))
    } else {
      message(paste("Chunk", i, "loaded successfully."))
    }
  }
  
  message("--- Data loading complete ---")
}

# --- 4. Execution ---
# To run this script directly, uncomment the following line:
# run_fuseki_load(config)
