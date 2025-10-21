# 10_data_access_clinicaltrials.R
#
# This script provides functions to access the official ClinicalTrials.gov API (V2)
# and parse the JSON response.
#
# Dependencies:
#   - httr: For making HTTP requests.
#   - jsonlite: For parsing JSON data.
#
# Ensure you have installed the packages:
# install.packages(c("httr", "jsonlite"))

library(httr)
library(jsonlite)

# Base URL for the ClinicalTrials.gov API V2
API_BASE_URL <- "https://clinicaltrials.gov/api/v2/"

# Function to search for clinical trials by a search term
search_clinical_trials <- function(term, max_studies = 20) {
  message(paste("Searching ClinicalTrials.gov API for:", term))
  
  # Construct the request URL
  request_url <- paste0(API_BASE_URL, "studies")
  
  # Define query parameters
  query_params <- list(
    "query.term" = term,
    "pageSize" = max_studies,
    "format" = "json"
  )
  
  # Make the GET request
  response <- GET(url = request_url, query = query_params)
  
  # Check for successful request
  if (http_status(response)$category != "Success") {
    stop("API request failed with status: ", http_status(response)$reason)
    return(NULL)
  }
  
  # Parse the JSON content
  json_content <- content(response, "text", encoding = "UTF-8")
  parsed_data <- fromJSON(json_content, flatten = TRUE)
  
  message(paste("Found", length(parsed_data$studies), "studies."))
  return(parsed_data$studies)
}

# Function to parse the studies data frame into a cleaner format
parse_trials_json <- function(studies_df) {
  if (is.null(studies_df) || nrow(studies_df) == 0) {
    return(data.frame())
  }
  
  # The fromJSON with flatten=TRUE does a lot of the work.
  # We just need to select and rename columns for clarity.
  
  # Helper to safely extract a column, returning NA if it doesn't exist
  get_col <- function(df, col_name) {
    if (col_name %in% names(df)) {
      return(df[[col_name]])
    } else {
      return(NA)
    }
  }
  
  # Helper to handle list-columns (like conditions and interventions)
  get_collapsed_list_col <- function(df, col_name) {
      if (col_name %in% names(df)) {
          # The column is a list of lists/vectors; we need to process each element
          sapply(df[[col_name]], function(item) {
              if (is.list(item) || is.vector(item)) {
                  # If it's a data frame, it might have a 'name' column
                  if(is.data.frame(item) && "name" %in% names(item)) {
                      paste(item$name, collapse = "; ")
                  } else {
                      paste(unlist(item), collapse = "; ")
                  }
              } else {
                  as.character(item)
              }
          })
      } else {
          NA_character_
      }
  }


  clean_df <- data.frame(
    NCTID = get_col(studies_df, "protocolSection.identificationModule.nctId"),
    Title = get_col(studies_df, "protocolSection.identificationModule.briefTitle"),
    Status = get_col(studies_df, "protocolSection.statusModule.overallStatus"),
    Sponsor = get_col(studies_df, "protocolSection.sponsorCollaboratorsModule.leadSponsor.name"),
    Conditions = get_collapsed_list_col(studies_df, "protocolSection.conditionsModule.conditions"),
    Interventions = get_collapsed_list_col(studies_df, "protocolSection.armsInterventionsModule.interventions"),
    stringsAsFactors = FALSE
  )
  
  return(clean_df)
}


# Example Usage:
# condition_term <- "major depressive disorder AND ketamine"
# raw_studies_df <- search_clinical_trials(condition_term, max_studies = 5)
#
# if (!is.null(raw_studies_df)) {
#   trials_df <- parse_trials_json(raw_studies_df)
#   print(head(trials_df))
# }
