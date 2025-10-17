# 04_data_analysis.R
#
# Objective:
# This script is for performing statistical analysis on the processed data.
# It takes the feature-engineered data from the real BRFSS dataset and
# calculates summary statistics to derive insights from the data.
#
# All steps are fully commented.

# Load required libraries.
library(data.table)

# Source the data processing script, which in turn sources the others.
# This gives us access to the entire data pipeline.
tryCatch({
  source("scripts/R/03_data_processing.R")
}, error = function(e) {
  stop("Error: The file '03_data_processing.R' was not found. Please ensure all prerequisite scripts are in 'scripts/R/'.")
})

#' Analyze Depression Prevalence by Age Group
#'
#' @description
#' Calculates the prevalence of depressive disorder for each age group in the
#' processed dataset. Prevalence is calculated as the number of "Yes" cases
' divided by the total number of valid (non-NA) responses.
#'
#' @param processed_data A data.table object containing the processed data with
#'   'AGE_GROUP' and 'DEPRESSION_STATUS' columns.
#'
#' @return A data.table summarizing the analysis, with columns for age group,
#'   case count, total observations, and prevalence rate.
#'
#' @examples
#' # This example assumes the full data pipeline has been run.
#' full_pipeline_data <- process_brfss_data(clean_brfss_data(download_and_load_brfss_data()))
#' analysis_results <- analyze_depression_prevalence(full_pipeline_data)
#' print(analysis_results)

analyze_depression_prevalence <- function(processed_data) {
  # --- Analysis ---
  # The goal is to calculate the prevalence of DEPRESSION_STATUS == "Yes"
  # for each AGE_GROUP.

  # We use the powerful data.table aggregation syntax: dt[, .(new_col = calculation), by = .(grouping_col)]

  # First, filter out any rows where DEPRESSION_STATUS or AGE_GROUP is NA, as they cannot be
  # included in the prevalence calculation.
  valid_data <- processed_data[!is.na(DEPRESSION_STATUS) & !is.na(AGE_GROUP)]

  # Now, perform the aggregation.
  analysis_summary <- valid_data[, .(
    # `N_Cases`: Count the number of rows where DEPRESSION_STATUS is "Yes".
    # `sum(DEPRESSION_STATUS == "Yes")` works because `TRUE` is treated as 1 and `FALSE` as 0.
    N_Cases = sum(DEPRESSION_STATUS == "Yes"),

    # `Total_Observations`: Count the total number of rows in the group.
    # `.N` is a special data.table symbol that holds the number of rows in the current group.
    Total_Observations = .N
  ), by = .(AGE_GROUP)] # The `by` argument specifies the grouping variable.

  # Calculate the prevalence rate.
  analysis_summary[, Prevalence := N_Cases / Total_Observations]

  # Sort the results by age group for a clean presentation.
  # This is important because factors can sometimes be ordered incorrectly if not explicitly handled.
  analysis_summary <- analysis_summary[order(AGE_GROUP)]

  cat("Analysis complete: Calculated depression prevalence by age group.\n")

  # Return the summary table.
  return(analysis_summary)
}

# --- Script Execution ---
# The following lines demonstrate the full pipeline up to this point.

# Uncomment the lines below to test the function directly.
#
# cat("1. Running the full data pipeline (Generate -> Clean -> Process)...\n")
# processed_sample <- process_brfss_data(
#   clean_brfss_data(
#     download_and_load_brfss_data()
#   )
# )
#
# cat("\n2. Performing the analysis...\n")
# prevalence_results <- analyze_depression_prevalence(processed_sample)
#
# cat("\nAnalysis Results:\n")
# print(prevalence_results)
