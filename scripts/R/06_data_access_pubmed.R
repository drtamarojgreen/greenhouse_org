# 06_data_access_pubmed.R
#
# This script provides functions to access and retrieve data from the PubMed database
# using the rentrez package. It is designed to search for articles related to
# mental health conditions and retrieve their summaries.
#
# Dependencies:
#   - rentrez: Provides an interface to the NCBI E-utilities API.
#
# Ensure you have installed the package:
# install.packages("rentrez")

library(rentrez)

# Function to search PubMed for a given term and retrieve article IDs
search_pubmed <- function(term, retmax = 100) {
  message(paste("Searching PubMed for:", term))
  search_results <- entrez_search(db = "pubmed", term = term, retmax = retmax)
  message(paste("Found", length(search_results$ids), "articles."))
  return(search_results$ids)
}

# Function to fetch summaries for a list of PubMed IDs
fetch_pubmed_summaries <- function(ids) {
  if (length(ids) == 0) {
    message("No IDs provided to fetch summaries.")
    return(NULL)
  }
  message(paste("Fetching summaries for", length(ids), "articles..."))
  summaries <- entrez_summary(db = "pubmed", id = ids)
  return(summaries)
}

# Function to parse the raw list of summaries into a clean data frame
parse_pubmed_summaries <- function(summaries) {
  if (is.null(summaries)) {
    return(data.frame()) # Return empty data frame if no summaries
  }
  
  # Use extract_from_esummary to get specific fields
  # Note: Author list is complex, so we'll just get the first author for simplicity
  df <- data.frame(
    UID = extract_from_esummary(summaries, "uid"),
    Title = extract_from_esummary(summaries, "title"),
    Date = extract_from_esummary(summaries, "pubdate"),
    Journal = extract_from_esummary(summaries, "source"),
    FirstAuthor = sapply(extract_from_esummary(summaries, "authors"), function(x) ifelse(length(x$name) > 0, x$name[1], NA))
  )
  
  return(df)
}


# Example Usage:
# mental_health_term <- "depression AND (genetics OR biomarkers)"
# article_ids <- search_pubmed(mental_health_term, retmax = 20)
# raw_summaries <- fetch_pubmed_summaries(article_ids)
# articles_df <- parse_pubmed_summaries(raw_summaries)
#
# To view the resulting data frame:
# if (nrow(articles_df) > 0) {
#   print(head(articles_df))
# }