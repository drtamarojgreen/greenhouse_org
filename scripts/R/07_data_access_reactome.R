# 07_data_access_reactome.R
#
# This script provides functions to access and analyze pathways from the Reactome database.
# It uses the ReactomePA package from Bioconductor for pathway analysis.
#
# Dependencies:
#   - ReactomePA: For pathway over-representation and GSEA analysis.
#   - org.Hs.eg.db: For converting gene symbols to Entrez IDs.
#
# To install from Bioconductor:
# if (!requireNamespace("BiocManager", quietly = TRUE))
#     install.packages("BiocManager")
# BiocManager::install(c("ReactomePA", "org.Hs.eg.db"))

library(ReactomePA)
library(org.Hs.eg.db)

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
# # A list of genes potentially related to a mental health condition
# example_genes <- c("GRIN2A", "GRIK2", "HOMER1", "BDNF", "NTRK2", "SLC6A4", "HTR2A")
#
# enriched_results <- analyze_reactome_pathways(example_genes)
#
# # To view the results as a data frame:
# if (!is.null(enriched_results)) {
#   results_df <- as.data.frame(enriched_results)
#   print(head(results_df))
# }