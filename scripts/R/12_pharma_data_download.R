# 12_pharma_data_download.R
#
# Objective:
# This script replaces the original `download_data.sh` script. It downloads
# and unzips the required DailyMed and Drugs@FDA datasets using pure R.
# It includes parallel downloads to significantly improve performance.

# --- 1. Load Dependencies ---
# `future` and `furrr` are used for parallel processing.
library(future)
library(furrr)


# --- 2. Configuration ---
# Centralized configuration for easy management.
config <- list(
  DATA_DIR = "./raw_data",
  DAILYMED_XML_DIR = "./raw_data/dailymed_xml",
  DRUGSFDA_RAW_DIR = "./raw_data/drugsfda_raw",
  BASE_DAILYMED_URL = "https://dailymed-data.nlm.nih.gov/public-release-files",
  DRUGSFDA_URL = "https://www.fda.gov/media/89850/download?attachment"
)

# --- 3. Define Functions ---

#' Download and Unzip a Single File
#'
#' @description Handles the download and extraction of one file.
#' @param url The URL of the file to download.
#' @param output_zip_path The path to save the downloaded zip file.
#' @param extract_dir The directory to extract the contents to.
#' @return TRUE if successful, FALSE otherwise.
download_and_unzip_file <- function(url, output_zip_path, extract_dir) {
  tryCatch({
    # Download the file.
    # `download.file` is a reliable, cross-platform function.
    download.file(url, destfile = output_zip_path, mode = "wb", quiet = TRUE)
    
    # Unzip the file.
    # `unzip` handles the extraction.
    unzip(output_zip_path, exdir = extract_dir)
    
    # Remove the zip file to save space.
    file.remove(output_zip_path)
    
    cat(paste("Successfully processed:", basename(url), "\n"))
    return(TRUE)
  }, error = function(e) {
    cat(paste("Failed to process:", basename(url), "\nError:", e$message, "\n"))
    return(FALSE)
  })
}

#' Main Function to Orchestrate Data Download
#'
#' @description Creates directories and orchestrates the parallel download of all datasets.
#' @param cfg A list containing the configuration variables.
run_pharma_data_download <- function(cfg) {
  # --- Create Directories ---
  message("--- Creating required directories ---")
  dir.create(cfg$DATA_DIR, showWarnings = FALSE)
  dir.create(cfg$DAILYMED_XML_DIR, showWarnings = FALSE)
  dir.create(cfg$DRUGSFDA_RAW_DIR, showWarnings = FALSE)
  
  # --- Define All URLs to Download ---
  message("--- Preparing list of files to download ---")
  # DailyMed Human Prescription files (5 parts)
  dailymed_rx_urls <- paste0(cfg$BASE_DAILYMED_URL, "/dm_spl_release_human_rx_part", 1:5, ".zip")
  # DailyMed Human OTC files (11 parts)
  dailymed_otc_urls <- paste0(cfg$BASE_DAILYMED_URL, "/dm_spl_release_human_otc_part", 1:11, ".zip")
  
  # Combine all URLs into a single list.
  all_urls <- c(dailymed_rx_urls, dailymed_otc_urls)
  
  # --- Set Up Parallel Processing ---
  # `plan(multisession)` sets up parallel workers. The number of workers is
  # automatically determined based on available CPU cores.
  message(paste("--- Starting parallel download of", length(all_urls), "DailyMed files ---"))
  plan(multisession)
  
  # --- Execute Parallel Downloads for DailyMed ---
  # `future_walk` from the `furrr` package iterates over the list in parallel.
  future_walk(all_urls, ~ download_and_unzip_file(
    url = .x,
    output_zip_path = file.path(cfg$DATA_DIR, basename(.x)),
    extract_dir = cfg$DAILYMED_XML_DIR
  ))
  
  # Revert to sequential processing.
  plan(sequential)
  message("--- DailyMed download complete ---")
  
  # --- Download Drugs@FDA Data (Single File) ---
  message("--- Starting Drugs@FDA download ---")
  download_and_unzip_file(
    url = cfg$DRUGSFDA_URL,
    output_zip_path = file.path(cfg$DATA_DIR, "drugsatfda.zip"),
    extract_dir = cfg$DRUGSFDA_RAW_DIR
  )
  message("--- Drugs@FDA download complete ---")
  
  message("\nAll data download and extraction tasks are complete.")
}

# --- 4. Execution ---
# To run this script directly, uncomment the following line:
# run_pharma_data_download(config)
