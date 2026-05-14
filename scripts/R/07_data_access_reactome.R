# 07_data_access_reactome.R
#
# This script provides functions to access and analyze pathways from the Reactome database.
# It uses the ReactomePA package from Bioconductor for pathway analysis and the 
# Reactome Content Service API for direct pathway and gene retrieval.
#
# Dependencies:
#   - ReactomePA: For pathway over-representation and GSEA analysis.
#   - org.Hs.eg.db: For converting gene symbols to Entrez IDs.
#   - httr: For making API calls to Reactome Content Service.
#   - jsonlite: For parsing JSON responses.
#
# To install:
# if (!requireNamespace("BiocManager", quietly = TRUE))
#     install.packages("BiocManager")
# BiocManager::install(c("ReactomePA", "org.Hs.eg.db"))
# install.packages(c("httr", "jsonlite"))

library(ReactomePA)
library(org.Hs.eg.db)
library(httr)
library(jsonlite)

# --- 1. Reactome Content Service API Functions ---

# Function to search for Reactome pathways by term
find_reactome_pathways <- function(search_term, species = "Homo sapiens") {
  message(paste("Searching Reactome for pathways related to:", search_term))
  
  url <- "https://reactome.org/ContentService/search/query"
  params <- list(
    query = search_term,
    species = species,
    types = "Pathway"
  )
  
  response <- GET(url, query = params)
  
  if (status_code(response) != 200) {
    message("Failed to retrieve data from Reactome API.")
    return(NULL)
  }
  
  data <- fromJSON(content(response, "text", encoding = "UTF-8"))
  
  if (is.null(data$results) || length(data$results) == 0) {
    message("No pathways found.")
    return(NULL)
  }
  
  # Extract relevant fields
  pathways <- data.frame(
    id = data$results$stId,
    name = data$results$name,
    dbId = data$results$dbId,
    stringsAsFactors = FALSE
  )
  
  message(paste("Found", nrow(pathways), "pathways."))
  return(pathways)
}

# Function to get genes involved in a specific Reactome pathway
get_reactome_pathway_genes <- function(pathway_id) {
  message(paste("Fetching genes for Reactome pathway:", pathway_id))
  
  # Use the participants endpoint to get PhysicalEntities
  url <- paste0("https://reactome.org/ContentService/data/participants/", pathway_id)
  
  response <- GET(url)
  
  if (status_code(response) != 200) {
    message("Failed to retrieve pathway participants.")
    return(NULL)
  }
  
  data <- fromJSON(content(response, "text", encoding = "UTF-8"))
  
  # Extract ReferenceEntities (which contains UniProt/Entrez info for proteins/genes)
  # Reactome results can be complex; we look for objects with 'refEntities'
  
  all_entities <- data$refEntities
  
  if (is.null(all_entities) || length(all_entities) == 0) {
    message("No gene/protein entities found for this pathway.")
    return(NULL)
  }
  
  # Filter for proteins/genes (usually have identifier and name)
  genes_df <- data.frame(
    id = all_entities$identifier,
    name = sapply(all_entities$name, function(x) x[1]), # Take first name/alias
    database = all_entities$databaseName,
    stringsAsFactors = FALSE
  )
  
  return(genes_df)
}


# --- 2. ReactomePA Analysis Functions ---

# Function to perform pathway enrichment analysis for a list of gene symbols
analyze_reactome_pathways <- function(gene_symbols) {
  message("Performing Reactome pathway enrichment analysis...")

  # Convert gene symbols to Entrez gene IDs
  entrez_ids <- tryCatch({
    mapIds(org.Hs.eg.db, keys = gene_symbols, column = "ENTREZID", keytype = "SYMBOL", multiVals = "first")
  }, error = function(e) {
    message("Could not map all gene symbols to Entrez IDs. Some may be missing.")
    return(NULL)
  })

  # Filter out any NA values from the conversion
  valid_entrez_ids <- na.omit(entrez_ids)

  if (length(valid_entrez_ids) == 0) {
    message("No valid Entrez IDs found for the given gene list.")
    return(NULL)
  }

  # Perform enrichment analysis
  enriched_pathways <- enrichPathway(gene = valid_entrez_ids, pvalueCutoff = 0.05, readable = TRUE)

  if (is.null(enriched_pathways) || nrow(as.data.frame(enriched_pathways)) == 0) {
    message("No significant pathways found.")
    return(NULL)
  }

  message("Pathway analysis complete.")
  return(enriched_pathways)
}

# Example Usage:
# # 1. Search for a pathway
# # p_df <- find_reactome_pathways("Tryptophan metabolism")
# # if (!is.null(p_df)) {
# #   genes <- get_reactome_pathway_genes(p_df$id[1])
# #   print(head(genes))
# # }
#
# # 2. Enrichment Analysis
# # example_genes <- c("GRIN2A", "GRIK2", "HOMER1", "BDNF", "NTRK2", "SLC6A4", "HTR2A")
# # enriched_results <- analyze_reactome_pathways(example_genes)
