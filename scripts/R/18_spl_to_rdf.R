library(xml2)
library(dplyr)

# -----------------------------
# Base path and directory pattern
# -----------------------------
base_path <- "."
dir_pattern <- "^20250801_[0-9a-fA-F\\-]{36}$"

# -----------------------------
# Find matching directories and XML files
# -----------------------------
all_dirs <- list.dirs(path = base_path, recursive = FALSE)
matching_dirs <- all_dirs[grepl(dir_pattern, basename(all_dirs))]

xml_files <- unlist(sapply(matching_dirs, function(dir) {
  list.files(path = dir, pattern = "\\.xml$", full.names = TRUE)
}))

print(paste("Found", length(xml_files), "matching XML files."))

# -----------------------------
# Namespaces
# -----------------------------
ns_spl <- c(
  spl = "http://fda.gov/spl#",
  dc  = "http://purl.org/dc/elements/1.1/"
)

# -----------------------------
# Initialize RDF storage
# -----------------------------
all_ttl_lines <- c(
  "@prefix spl: <http://fda.gov/spl#> .",
  "@prefix dc:  <http://purl.org/dc/elements/1.1/> .",
  ""
)

# -----------------------------
# Process each XML file
# -----------------------------
for (spl_file in xml_files) {
  tryCatch({
    doc <- read_xml(spl_file)

    # Extract manufacturedProduct
    product_node <- xml_find_first(doc, ".//manufacturedProduct", ns = ns_spl)

    if (!is.na(product_node)) {
      code_node <- xml_find_first(product_node, ".//code", ns = ns_spl)
      product_code <- xml_attr(code_node, "code")

      name_node <- xml_find_first(product_node, ".//name", ns = ns_spl)
      product_name <- xml_text(name_node)

      product_uri <- paste0("http://localhost:3030/testspl/", gsub("[^0-9a-zA-Z]", "", product_code))

      # Start building TTL for this product
      product_ttl <- c(
        paste0("<", product_uri, "> a spl:ManufacturedProduct ;"),
        paste0("    spl:code \"", product_code, "\" ;"),
        paste0("    dc:title \"", product_name, "\" ;")
      )

      # Extract sections and paragraphs
      sections <- xml_find_all(doc, ".//section", ns = ns_spl)

      section_list <- lapply(sections, function(sec) {
        title_node <- xml_find_first(sec, ".//title", ns = ns_spl)
        title <- if (!is.na(title_node)) xml_text(title_node) else "No Title"

        text_nodes <- xml_find_all(sec, ".//text/paragraph", ns = ns_spl)
        paragraphs <- sapply(text_nodes, xml_text)

        data.frame(
          section = title,
          paragraph = paragraphs,
          stringsAsFactors = FALSE
        )
      })

      sections_df <- bind_rows(section_list)

      # Add sections to TTL
      if (nrow(sections_df) > 0) {
        for (i in seq_len(nrow(sections_df))) {
            # Sanitize strings for TTL
            sanitized_section <- gsub("\"", "\\\\\"", sections_df$section[i])
            sanitized_paragraph <- gsub("\"", "\\\\\"", sections_df$paragraph[i])
            sanitized_paragraph <- gsub("\n", "\\\\n", sanitized_paragraph)
            sanitized_paragraph <- gsub("\r", "\\\\r", sanitized_paragraph)

            product_ttl <- c(
                product_ttl,
                paste0("    dc:section \"", sanitized_section, "\" ;"),
                paste0("    dc:paragraph \"", sanitized_paragraph, "\" ;")
            )
        }
      }

      # Replace the last semicolon with a period
      if (length(product_ttl) > 0) {
        product_ttl[length(product_ttl)] <- sub(";$", ".", product_ttl[length(product_ttl)])
        all_ttl_lines <- c(all_ttl_lines, product_ttl, "")
      }
    }
  }, error = function(e) {
    cat("Error processing file:", spl_file, "\n", e$message, "\n")
  })
}

# -----------------------------
# Write aggregated Turtle RDF
# -----------------------------
output_file <- "spl_products.ttl"
writeLines(all_ttl_lines, output_file)
cat("Aggregated Turtle RDF saved to:", output_file, "\n")
