# 03_data_processing.R
#
# Objective:
# This script is for data processing and feature engineering. It takes the cleaned
# real BRFSS data and creates new, more insightful variables for analysis.
# This version is adapted to use the actual variable names and codes from the
# 2022 BRFSS dataset.
#
# All steps are fully commented.

# Load required libraries for data manipulation.
library(data.table)

# Source the data cleaning script. This makes all functions from both
# `01_data_access.R` and `02_data_cleaning.R` available here.
tryCatch({
  source("scripts/R/02_data_cleaning.R")
}, error = function(e) {
  stop("Error: The file '02_data_cleaning.R' was not found. Please ensure it and its dependencies are in the 'scripts/R/' directory.")
})

#' Process Cleaned BRFSS Data for Analysis
#'
#' @description
#' Performs feature engineering on the cleaned data. This involves creating
#' categorical variables (factors) from numeric codes to make them more
#' interpretable for analysis and visualization.
#'
#' @param cleaned_data A data.table object containing the cleaned BRFSS data.
#'
#' @return A data.table object with new, processed columns.
#'
#' @examples
#' # This example assumes the data has been downloaded and cleaned.
#' raw_dt <- download_and_load_brfss_data()
#' cleaned_dt <- clean_brfss_data(raw_dt)
#' processed_dt <- process_brfss_data(cleaned_dt)
#' print(head(processed_dt))
#' print(str(processed_dt)) # Show structure

process_brfss_data <- function(cleaned_data) {
  # Work on a copy to avoid modifying the original cleaned data.
  processed_dt <- copy(cleaned_data)

  # --- Feature Engineering ---

  # 1. Convert Age Group to a Labeled Factor
  # The `_AGEG5YR` variable is already categorized. We just need to convert it
  # to a factor with meaningful labels.
  # Codebook values: 1=18-24, 2=25-29, ..., 13=80+, 14=Don't know/Refused
  processed_dt[, AGE_GROUP := factor(`_AGEG5YR`,
                                     levels = 1:13,
                                     labels = c("18-24", "25-29", "30-34", "35-39",
                                                "40-44", "45-49", "50-54", "55-59",
                                                "60-64", "65-69", "70-74", "75-79",
                                                "80+"))]

  # 2. Convert Sex to a Labeled Factor
  # The `SEXVAR` variable uses 1 for Male and 2 for Female.
  processed_dt[, SEX_LABEL := factor(SEXVAR,
                                     levels = c(1, 2),
                                     labels = c("Male", "Female"))]

  # 3. Convert Depression Indicator to a Labeled Factor
  # The `ADDEPEV3` variable uses 1 for Yes and 2 for No.
  processed_dt[, DEPRESSION_STATUS := factor(ADDEPEV3,
                                             levels = c(1, 2),
                                             labels = c("Yes", "No"))]

  # 4. Create an indicator for Frequent Mental Distress (FMD)
  # FMD is defined as 14 or more days of poor mental health in the past month.
  # The MENTHLTH variable uses 88 for "None". We will treat that as 0 days.
  processed_dt[MENTHLTH == 88, MENTHLTH := 0]
  processed_dt[, FMD_INDICATOR := fcase(
    MENTHLTH >= 14, 1,
    MENTHLTH < 14, 0,
    is.na(MENTHLTH), NA_integer_
  )]
  # Convert the new indicator to a labeled factor for clarity.
  processed_dt[, FMD_INDICATOR_LABEL := factor(FMD_INDICATOR,
                                                levels = c(0, 1),
                                                labels = c("No FMD", "Frequent Mental Distress"))]


  cat("Data processing complete.\n")
  cat("New variables created: 'AGE_GROUP', 'SEX_LABEL', 'DEPRESSION_STATUS', 'FMD_INDICATOR_LABEL'.\n")

  # Return the data.table with the new features.
  return(processed_dt)
}

# --- Script Execution ---
# The following lines demonstrate the full pipeline up to this point.

# Uncomment the lines below to test the function directly.
#
# cat("1. Running data download and cleaning...\n")
# cleaned_sample <- clean_brfss_data(download_and_load_brfss_data())
#
# cat("\n2. Processing data...\n")
# processed_sample <- process_brfss_data(cleaned_sample)
#
# cat("\nStructure of the final processed data:\n")
# print(str(processed_sample))
#
# cat("\nFirst 6 rows of the processed data:\n")
# print(head(processed_sample))
