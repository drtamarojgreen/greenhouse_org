# 11_data_access_dailymed.R
#
# This script provides functions to access the DailyMed REST API to find drug
# information and parse the returned JSON data.
#
# Dependencies:
#   - httr: For making HTTP requests.
#   - jsonlite: For parsing JSON data.
#
# Ensure you have installed the packages:
# install.packages(c("httr", "jsonlite"))

library(httr)
library(jsonlite)

# Base URL for the DailyMed API
DAILYMED_API_BASE <- "https://dailymed.nlm.nih.gov/dailymed/services/v2/"

# Function to search for a drug by name and get its SPL set ID
get_dailymed_setid <- function(drug_name) {
  message(paste("Searching DailyMed for drug:", drug_name))
  request_url <- paste0(DAILYMED_API_BASE, "spls.json")
  
  response <- GET(url = request_url, query = list(drug_name = drug_name))
  
  if (http_status(response)$category != "Success") {
    warning("DailyMed API request failed.")
    return(NULL)
  }
  
  parsed_content <- fromJSON(content(response, "text", encoding = "UTF-8"))
  
  if (is.null(parsed_content$data) || length(parsed_content$data) == 0) {
    warning(paste("No results found for drug:", drug_name))
    return(NULL)
  }
  
  # Return the set ID of the first result
  first_result_set_id <- parsed_content$data$spl$set_id[1]
  message(paste("Found SET ID:", first_result_set_id))
  return(first_result_set_id)
}

# Function to get the full SPL data for a given set ID
get_dailymed_spl <- function(set_id) {
  if (is.null(set_id)) return(NULL)
  
  message(paste("Fetching SPL data for SET ID:", set_id))
  request_url <- paste0(DAILYMED_API_BASE, "spls/", set_id, ".json")
  
  response <- GET(url = request_url)
  
  if (http_status(response)$category != "Success") {
    warning("Failed to fetch SPL data.")
    return(NULL)
  }
  
  parsed_content <- fromJSON(content(response, "text", encoding = "UTF-8"))
  return(parsed_content)
}

# Function to parse key information from the SPL JSON object
parse_dailymed_spl <- function(spl_json) {
  if (is.null(spl_json)) return(NULL)
  
  # Helper to extract a field if it exists
  extract_field <- function(field_name) {
    if (field_name %in% names(spl_json)) {
      # Content is often nested and can be complex; this is a simplification
      return(paste(unlist(spl_json[[field_name]]), collapse = " \n "))
    } else {
      return(NA_character_)
    }
  }
  
  drug_info <- list(
    BrandName = spl_json$brand_name,
    GenericName = spl_json$generic_name,
    Indications = extract_field("indications_and_usage"),
    Contraindications = extract_field("contraindications"),
    Warnings = extract_field("warnings_and_cautions"),
    AdverseReactions = extract_field("adverse_reactions"),
    Pharmacokinetics = extract_field("pharmacokinetics")
  )
  
  return(drug_info)
}


# Example Usage:
# drug <- "Aripiprazole"
# set_id <- get_dailymed_setid(drug)
#
# if (!is.null(set_id)) {
#   spl_data <- get_dailymed_spl(set_id)
#   drug_details <- parse_dailymed_spl(spl_data)
#   
#   # Print a summary of the extracted information
#   cat(paste("Brand Name:", drug_details$BrandName, "\n"))
#   cat(paste("Generic Name:", drug_details$GenericName, "\n\n"))
#   cat(paste("Indications:\n", substr(drug_details$Indications, 1, 300), "...\n"))
# }
