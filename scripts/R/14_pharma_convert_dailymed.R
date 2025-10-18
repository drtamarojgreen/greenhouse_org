# 14_pharma_convert_dailymed.R
#
# Objective:
# This script replaces the `xsltproc` part of the original pipeline.
# Since the XSLT file was missing, this script parses the DailyMed SPL XML files
# directly using R, extracts key information, and converts it to RDF.
# This makes the pipeline self-contained and more maintainable.
# It processes files in parallel for performance.

# --- 1. Load Dependencies ---
library(xml2)
library(rdflib)
library(future)
library(furrr)

# --- 2. Configuration ---
config <- list(
  XML_SOURCE_DIR = "./raw_data/dailymed_xml",
  RDF_OUT_DIR = "./rdf_data/spl",
  BASE_URI = "http://www.fda.gov/dailymed/"
)

# --- 3. Define Functions ---

#' Convert a Single SPL XML File to RDF
#'
#' @description Reads an XML file, parses it, and creates an RDF graph.
#' @param xml_file Path to the input XML file.
#' @param cfg Configuration list.
#' @return TRUE if successful, FALSE otherwise.
convert_spl_xml_to_rdf <- function(xml_file, cfg) {
  tryCatch({
    # --- Read and Parse XML ---
    doc <- read_xml(xml_file)
    
    # --- Initialize Graph and Namespaces ---
    g <- rdf()
    ns <- c(
      spl = cfg$BASE_URI,
      dc = "http://purl.org/dc/elements/1.1/",
      rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    )
    for (prefix in names(ns)) {
      rdf_add_prefix(g, prefix, ns[prefix])
    }
    
    # --- Extract Key Information using XPath ---
    # Helper to safely get text from an XPath query.
    get_text <- function(xpath) {
      node <- xml_find_first(doc, xpath, ns = xml_ns(doc))
      if (is.na(node)) NA_character_ else trimws(xml_text(node))
    }
    
    set_id <- get_text("//c:document/c:setId/@root")
    if (is.na(set_id)) return(FALSE) # Skip if no Set ID
    
    subject <- paste0(cfg$BASE_URI, "spl/", set_id)
    rdf_add(g, subject, "rdf:type", "spl:StructuredProductLabel")
    
    # --- Add Triples for Extracted Data ---
    # Add basic metadata
    rdf_add(g, subject, "dc:identifier", set_id)
    rdf_add(g, subject, "dc:title", get_text("//c:document/c:title"))
    rdf_add(g, subject, "dc:date", get_text("//c:document/c:effectiveTime/@value"))
    
    # Link to Drugs@FDA via application number, if present
    app_no <- get_text("//c:document/c:relatedDocument/c:relatedDocument/c:id/@extension")
    if (!is.na(app_no)) {
      rdf_add(g, subject, "dc:source", app_no)
    }
    
    # Add all section paragraphs as dc:paragraph literals
    # This mimics the original pipeline's goal of making label text searchable.
    paragraphs <- xml_find_all(doc, "//c:text/c:paragraph", ns = xml_ns(doc))
    walk(paragraphs, ~ rdf_add(g, subject, "dc:paragraph", trimws(xml_text(.x))))
    
    # --- Serialize Graph ---
    output_file <- file.path(cfg$RDF_OUT_DIR, paste0(set_id, ".rdf"))
    rdf_serialize(g, output_file, format = "rdfxml")
    
    return(TRUE)
  }, error = function(e) {
    cat(paste("Failed to process file:", basename(xml_file), "\nError:", e$message, "\n"))
    return(FALSE)
  })
}

#' Main Function to Orchestrate XML to RDF Conversion
#'
#' @description Lists all XML files and processes them in parallel.
#' @param cfg Configuration list.
run_dailymed_to_rdf_conversion <- function(cfg) {
  message("--- Starting DailyMed XML to RDF conversion ---")
  dir.create(cfg$RDF_OUT_DIR, showWarnings = FALSE, recursive = TRUE)
  
  # Get a list of all XML files to process.
  all_xml_files <- list.files(cfg$XML_SOURCE_DIR, pattern = "\.xml$", full.names = TRUE, recursive = TRUE)
  
  if (length(all_xml_files) == 0) {
    stop("No XML files found in the source directory. Did the download step run correctly?")
  }
  
  message(paste("Found", length(all_xml_files), "XML files to process."))
  
  # --- Set Up and Run Parallel Processing ---
  message("--- Starting parallel conversion ---")
  plan(multisession)
  
  # `future_walk` processes the list in parallel without returning results.
  # A progress bar is enabled for long-running jobs.
  suppressMessages(future_walk(all_xml_files, ~ convert_spl_xml_to_rdf(.x, cfg), .progress = TRUE))
  
  plan(sequential)
  message("\n--- DailyMed XML conversion complete ---")
}

# --- 4. Execution ---
# To run this script directly, uncomment the following line:
# run_dailymed_to_rdf_conversion(config)
