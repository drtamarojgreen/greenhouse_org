# 08_data_access_kegg.R
#
# This script provides functions to access the KEGG (Kyoto Encyclopedia of Genes and Genomes)
# database. It uses the KEGGREST package to find pathways and genes related to
# mental health conditions.
#
# Dependencies:
#   - KEGGREST: Provides a client for the KEGG REST API.
#
# To install from Bioconductor:
# if (!requireNamespace("BiocManager", quietly = TRUE))
#     install.packages("BiocManager")
# BiocManager::install("KEGGREST")

library(KEGGREST)

# Function to find KEGG pathways related to a search term
find_kegg_pathways <- function(search_term) {
  message(paste("Searching for KEGG pathways related to:", search_term))
  # keggFind returns a named vector where names are pathway IDs and values are descriptions
  pathways <- keggFind("pathway", search_term)
  if (length(pathways) == 0) {
    message("No pathways found.")
    return(NULL)
  }
  message(paste("Found", length(pathways), "pathways."))
  return(pathways)
}

# Function to get detailed information for a specific KEGG pathway
get_kegg_pathway_details <- function(pathway_id) {
  message(paste("Fetching details for KEGG pathway:", pathway_id))
  pathway_details <- tryCatch({
    keggGet(pathway_id)
  }, error = function(e) {
    message(paste("Could not retrieve details for pathway ID:", pathway_id))
    return(NULL)
  })
  return(pathway_details)
}

# Function to parse the gene information from a KEGG pathway object
parse_kegg_genes <- function(pathway_details) {
  if (is.null(pathway_details) || is.null(pathway_details[[1]]$GENE)) {
    return(data.frame()) # Return empty data frame if no gene info
  }
  
  # The GENE field is a named character vector.
  # The names are the Entrez Gene IDs.
  # The values are the gene symbols and descriptions.
  genes_vector <- pathway_details[[1]]$GENE
  
  # Extract the Entrez IDs from the names of the vector
  entrez_ids <- names(genes_vector)
  
  # Extract the gene symbols by removing the description part
  gene_symbols <- sub(";.*", "", genes_vector)
  
  df <- data.frame(
    EntrezID = entrez_ids,
    Symbol = gene_symbols,
    Description = genes_vector, # Keep the full original description
    stringsAsFactors = FALSE
  )
  
  # Remove rows where EntrezID might be missing (though unlikely)
  df <- df[!is.na(df$EntrezID), ]
  
  return(df)
}


# Example Usage:
# search_term <- "neuroactive ligand-receptor interaction"
# found_pathways <- find_kegg_pathways(search_term)
#
# if (!is.null(found_pathways)) {
#   # Get the ID for the human pathway (hsa)
#   hsa_pathway_id <- names(found_pathways)[grep("hsa", names(found_pathways))][1]
#   
#   if (!is.na(hsa_pathway_id)) {
#     pathway_data <- get_kegg_pathway_details(hsa_pathway_id)
#     gene_list_df <- parse_kegg_genes(pathway_data)
#     
#     # View the first few genes in the pathway
#     print(head(gene_list_df))
#   }
# }