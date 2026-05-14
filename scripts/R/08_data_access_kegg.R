# 08_data_access_kegg.R (DEPRECATED)
#
# NOTICE: This script is deprecated and has been replaced by Reactome integration.
# It now acts as a bridge to 07_data_access_reactome.R to maintain compatibility 
# with legacy code while transitioning to the Reactome database.
#
# Please update your code to use scripts/R/07_data_access_reactome.R directly.

if (file.exists("scripts/R/07_data_access_reactome.R")) {
  source("scripts/R/07_data_access_reactome.R")
} else {
  warning("scripts/R/07_data_access_reactome.R not found. Bridge functionality may be limited.")
}

# Bridge: find_kegg_pathways -> find_reactome_pathways
find_kegg_pathways <- function(search_term) {
  message("Warning: find_kegg_pathways is deprecated. Redirecting to find_reactome_pathways.")
  return(find_reactome_pathways(search_term))
}

# Bridge: get_kegg_pathway_details -> get_reactome_pathway_genes (closest equivalent)
get_kegg_pathway_details <- function(pathway_id) {
  message("Warning: get_kegg_pathway_details is deprecated and redirected to get_reactome_pathway_genes.")
  # Note: Reactome details differ from KEGG details, but gene list is the primary need.
  return(get_reactome_pathway_genes(pathway_id))
}

# Bridge: parse_kegg_genes -> pass-through
parse_kegg_genes <- function(pathway_details) {
  message("Warning: parse_kegg_genes is deprecated. Returning input as it is already parsed by Reactome service.")
  return(pathway_details)
}
