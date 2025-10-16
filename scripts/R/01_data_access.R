# 01_data_access.R
#
# Objective:
# This script is responsible for accessing real public health data. It defines
# a function to download the 2022 BRFSS public use data file from the CDC,
# unzip it, and load it into an R session. This approach ensures the data is
# real and the process is reproducible.
#
# Using real data is critical for scientific validity. This script replaces the
# previous synthetic data generation.

# Load required libraries.
# `data.table` for efficient data manipulation.
# `haven` for reading SAS transport files (.XPT).
library(data.table)
library(haven)

#' Download, Unzip, and Load the 2022 BRFSS Dataset
#'
#' @description
#' This function handles the entire process of acquiring the 2022 BRFSS data.
#' It checks if the data file already exists to avoid re-downloading. If not,
#' it downloads the zip archive from the CDC's website, extracts the .XPT file,
#' and then loads it into a data.table.
#'
#' @param data_dir A string specifying the directory to store the data files.
#'   Defaults to a 'data' subdirectory.
#'
#' @return A data.table object containing the 2022 BRFSS survey data.

download_and_load_brfss_data <- function(data_dir = "data") {
  # --- 1. Define File Paths and URL ---
  # URL for the 2022 BRFSS data in SAS XPT format (zipped).
  url <- "https://www.cdc.gov/brfss/annual_data/2022/files/LLCP2022XPT.zip"

  # Create the local data directory if it doesn't exist.
  if (!dir.exists(data_dir)) {
    cat(paste0("Creating data directory: '", data_dir, "'\n"))
    dir.create(data_dir)
  }

  # Define local file paths.
  zip_file <- file.path(data_dir, "LLCP2022XPT.zip")
  xpt_file <- file.path(data_dir, "LLCP2022.XPT") # The file inside the zip

  # --- 2. Download the Data if Necessary ---
  if (!file.exists(zip_file)) {
    cat(paste0("Downloading BRFSS data from CDC...\nSource: ", url, "\n"))
    # Use download.file for cross-platform compatibility.
    download.file(url, destfile = zip_file, mode = "wb")
    cat("Download complete.\n")
  } else {
    cat("Zip file already exists. Skipping download.\n")
  }

  # --- 3. Unzip the Data if Necessary ---
  if (!file.exists(xpt_file)) {
    cat(paste0("Unzipping '", zip_file, "'...\n"))
    unzip(zip_file, exdir = data_dir)
    cat("Unzipping complete.\n")
  } else {
    cat("XPT file already exists. Skipping unzip.\n")
  }

  # --- 4. Load the Data ---
  cat(paste0("Loading data from '", xpt_file, "'...\n"))
  # `read_xpt` from the `haven` package reads the SAS transport file.
  # `setDT` from `data.table` converts the resulting data.frame to a data.table
  # efficiently, without making a copy.
  brfss_data <- setDT(read_xpt(xpt_file))
  cat("Data loaded successfully.\n")

  # Return the loaded data.
  return(brfss_data)
}

# --- Script Execution ---
# The main orchestration script would call the function.
# Uncomment the lines below for direct testing.
#
# cat("--- Starting Data Access ---\n")
# brfss_2022_data <- download_and_load_brfss_data()
# cat("\n--- Data Access Complete ---\n")
# cat("Dimensions of the loaded data:\n")
# print(dim(brfss_2022_data))
# cat("\nFirst 6 rows of the data:\n")
# print(head(brfss_2022_data))
