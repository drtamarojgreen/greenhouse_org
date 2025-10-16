# 02_data_cleaning.R
#
# Objective:
# This script is dedicated to cleaning the raw data obtained from the data access
# script. It now works with the real 2022 BRFSS dataset. The primary tasks are
# to select relevant variables and handle special codes for missing or non-response
# data by converting them to R's standard `NA`.
#
# All steps are fully commented for clarity.

# Load required libraries for data manipulation.
library(data.table)
library(haven) # This is needed if the data is still in .XPT format

# Source the data access script to ensure the data-loading function is available.
tryCatch({
  source("scripts/R/01_data_access.R")
}, error = function(e) {
  stop("Error: The file '01_data_access.R' was not found. Please ensure it is in the 'scripts/R/' directory.")
})

#' Clean the Real 2022 BRFSS Data
#'
#' @description
#' Takes the raw 2022 BRFSS data and performs essential cleaning operations.
#' This includes:
#'   1. Selecting a subset of variables relevant for the analysis.
#'   2. Converting special codes (e.g., 7, 9, 77, 99 for 'Don't know' or 'Refused')
#'      into `NA` for the selected variables.
#'
#' @param raw_data A data.table object containing the raw BRFSS data.
#'
#' @return A cleaned data.table object ready for processing.
#'
#' @examples
#' # This example assumes the data has been downloaded.
#' raw_brfss_data <- download_and_load_brfss_data()
#' cleaned_brfss_data <- clean_brfss_data(raw_brfss_data)
#' print(head(cleaned_brfss_data))
#' print(summary(cleaned_brfss_data))

clean_brfss_data <- function(raw_data) {
  # --- 1. Select Relevant Columns ---
  # To make the dataset more manageable, we select only the columns needed for
  # the planned analysis. This is a crucial step for performance with large datasets.
  # We are interested in age, sex, mental health status, and depression diagnosis.
  # `.(col1, col2)` is data.table syntax for creating a list of columns to select.
  selected_cols <- c("ADDEPEV3", "MENTHLTH", "SEXVAR", "_AGEG5YR")

  # Ensure all selected columns exist in the raw data
  missing_cols <- setdiff(selected_cols, names(raw_data))
  if (length(missing_cols) > 0) {
    stop(paste("The following required columns are missing from the raw data:", paste(missing_cols, collapse = ", ")))
  }

  # The `..` prefix tells data.table that `selected_cols` is a variable in the
  # parent environment, not a column name.
  cleaned_dt <- raw_data[, ..selected_cols]

  cat("Selected relevant columns for analysis.\n")

  # --- 2. Handle Missing and Special Values ---

  # Based on the BRFSS codebook:
  # - For MENTHLTH: 77 and 99 are 'Don't know'/'Refused'.
  # - For ADDEPEV3: 7 and 9 are 'Don't know'/'Refused'.
  # We will convert these to NA.

  # Clean `MENTHLTH` column
  # Using `fifelse` for conditional replacement. If the value is 77 or 99,
  # replace with NA_integer_, otherwise keep the original value.
  cleaned_dt[, MENTHLTH := fifelse(MENTHLTH %in% c(77, 99), NA_integer_, MENTHLTH)]

  # Clean `ADDEPEV3` (Depressive Disorder) column
  cleaned_dt[, ADDEPEV3 := fifelse(ADDEPEV3 %in% c(7, 9), NA_integer_, ADDEPEV3)]

  cat("Data cleaning complete. Special codes have been replaced with NA.\n")

  # Return the cleaned data.table.
  return(cleaned_dt)
}

# --- Script Execution ---
# The following lines demonstrate how to use the functions. The main orchestrator
# would handle this flow.

# Uncomment the lines below to test the function directly.
#
# cat("1. Downloading and loading real BRFSS data...\n")
# raw_data_sample <- download_and_load_brfss_data()
#
# cat("\nSummary of raw data (selected columns) before cleaning:\n")
# print(summary(raw_data_sample[, .(ADDEPEV3, MENTHLTH, SEXVAR, _AGEG5YR)]))
#
# cat("\n2. Cleaning the raw data...\n")
# cleaned_data_sample <- clean_brfss_data(raw_data_sample)
#
# cat("\nSummary of data after cleaning:\n")
# print(summary(cleaned_data_sample))
