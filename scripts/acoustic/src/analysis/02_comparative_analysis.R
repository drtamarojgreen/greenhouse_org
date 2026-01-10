# scripts/acoustic/src/analysis/02_comparative_analysis.R

# Load necessary libraries
# install.packages("readr")
# install.packages("ggplot2")
library(readr)
library(ggplot2)

comparative_analysis <- function() {
  print("Performing comparative analysis...")

  # Define file paths
  inhouse_data_file <- "scripts/acoustic/data/inhouse_data_processed.csv"
  public_research_file <- "scripts/acoustic/data/relevant_pubmed_papers.csv"
  output_dir <- "scripts/acoustic/analysis_results"
  output_plot <- file.path(output_dir, "comparative_plot.png")

  # Check if input files exist
  if (!file.exists(inhouse_data_file) || !file.exists(public_research_file)) {
    stop("Input data files not found. Please run the preceding pipeline steps.")
  }

  # Load data
  inhouse_data <- read_csv(inhouse_data_file)
  public_research_data <- read_csv(public_research_file)

  # Placeholder for a comparative analysis
  # This example creates a simple plot of the in-house data's reaction scores.

  # Create the output directory if it doesn't exist
  if (!dir.exists(output_dir)) {
    dir.create(output_dir, recursive = TRUE)
  }

  # Generate a plot
  p <- ggplot(inhouse_data, aes(x = reaction_score)) +
    geom_histogram(bins = 20, fill = "blue", alpha = 0.7) +
    labs(
      title = "Distribution of In-House Reaction Scores",
      x = "Reaction Score (Standardized)",
      y = "Frequency"
    ) +
    theme_minimal()

  # Save the plot
  ggsave(output_plot, plot = p, width = 8, height = 6)

  print(paste("Comparative analysis complete. Plot saved to", output_plot))
}

# Run the function
comparative_analysis()
