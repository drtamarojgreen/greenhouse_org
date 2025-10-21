# 13_pharma_convert_drugsfda.R
#
# Objective:
# This script replaces the Python script `convert_drugsfda_to_rdf.py`.
# It reads the tabular Drugs@FDA data, maps it to an RDF structure, and
# serializes it as an RDF/XML file. It uses the `data.table` package for
# efficient reading and the `rdflib` package for graph manipulation.

# --- 1. Load Dependencies ---
library(data.table)
library(rdflib)

# --- 2. Configuration ---
config <- list(
  INPUT_DIR = "./raw_data/drugsfda_raw",
  RDF_DIR = "./rdf_data",
  OUTPUT_FILE = "./rdf_data/drugsfda.rdf",
  BASE_URI = "http://www.fda.gov/drugsatfda/"
)

# --- 3. Define Functions ---

#' Convert Drugs@FDA Data to RDF
#'
#' @description Orchestrates the conversion of the Drugs@FDA dataset to RDF.
#' @param cfg A list containing the configuration variables.
run_drugsfda_to_rdf_conversion <- function(cfg) {
  # --- Initialize Graph and Namespaces ---
  message("--- Initializing RDF graph ---")
  g <- rdf()
  # Define and bind namespaces for cleaner RDF output.
  namespaces <- c(
    fda = cfg$BASE_URI,
    rdfs = "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
    rdf = "http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  )
  for (prefix in names(namespaces)) {
    rdf_add_prefix(g, prefix, namespaces[prefix])
  }
  
  # --- Define Data Mappings ---
  # This structure maps filenames to their primary/foreign keys and column-to-predicate mappings.
  file_mappings <- list(
    `Applications.txt` = list(
      pk = "ApplNo",
      columns = c(ApplType = "fda:applicationType", SponsorName = "fda:sponsorName")
    ),
    `Products.txt` = list(
      pk = "ProductNo",
      fk = "ApplNo",
      columns = c(Form = "fda:form", Strength = "fda:strength", DrugName = "fda:drugName",
                  ActiveIngredient = "fda:activeIngredient", ReferenceDrug = "fda:isReferenceDrug",
                  ReferenceStandard = "fda:isReferenceStandard")
    ),
    `Submissions.txt` = list(
      pk = "SubmissionNo",
      fk = "ApplNo",
      columns = c(SubmissionType = "fda:submissionType", SubmissionStatus = "fda:submissionStatus",
                  SubmissionStatusDate = "fda:submissionStatusDate", ReviewPriority = "fda:reviewPriority")
    )
  )
  
  # --- Process Each File ---
  message("--- Starting data processing ---")
  for (filename in names(file_mappings)) {
    file_path <- file.path(cfg$INPUT_DIR, filename)
    mapping <- file_mappings[[filename]]
    
    if (!file.exists(file_path)) {
      warning(paste("File not found, skipping:", file_path))
      next
    }
    
    message(paste("Processing", filename, "..."))
    # Use data.table::fread for fast and robust file reading.
    dt <- fread(file_path, sep = "\t", colClasses = "character", na.strings = "")
    
    for (i in 1:nrow(dt)) {
      row <- dt[i, ]
      
      # Create the main subject URI from the application number.
      appl_no <- trimws(row[[mapping$fk %||% mapping$pk]])
      if (is.na(appl_no) || appl_no == "") next
      subject <- paste0(cfg$BASE_URI, "application/", appl_no)
      rdf_add(g, subject, "rdf:type", "fda:Application")
      
      # Create a related entity if there is a separate primary key (e.g., for Products).
      entity_subject <- subject
      if (!is.null(mapping$fk)) {
        pk_val <- trimws(row[[mapping$pk]])
        if (is.na(pk_val) || pk_val == "") next
        entity_type <- sub(".txt$", "", sub("s$", "", filename)) # e.g., "Product"
        entity_subject <- paste0(cfg$BASE_URI, tolower(entity_type), "/", appl_no, "/", pk_val)
        rdf_add(g, entity_subject, "rdf:type", paste0("fda:", entity_type))
        rdf_add(g, subject, paste0("fda:has", entity_type), entity_subject)
      }
      
      # Add triples for each mapped column.
      for (col_name in names(mapping$columns)) {
        if (col_name %in% names(row) && !is.na(row[[col_name]])) {
          value <- trimws(row[[col_name]])
          if (value != "") {
            rdf_add(g, entity_subject, mapping$columns[col_name], value)
          }
        }
      }
    }
  }
  
  # --- Serialize Graph ---
  message(paste("--- Serializing graph to", cfg$OUTPUT_FILE, "---"))
  dir.create(cfg$RDF_DIR, showWarnings = FALSE)
  rdf_serialize(g, cfg$OUTPUT_FILE, format = "rdfxml")
  
  message("Conversion complete.")
}

# Custom infix operator for NULL default
`%||%` <- function(a, b) if (is.null(a)) b else a

# --- 4. Execution ---
# To run this script directly, uncomment the following line:
# run_drugsfda_to_rdf_conversion(config)
