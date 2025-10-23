# 05_data_visualization.R
#
# Objective:
# This script is the final step in the pipeline, focusing on data visualization.
# It takes the results from the analysis of the real BRFSS data and creates a
# publication-quality plot using the ggplot2 library. The plot is then saved to a file.
#
# All steps are fully commented.

# Load required libraries for visualization and data manipulation.
library(data.table)
library(ggplot2)
library(scales)

# Source the data analysis script, which gives us access to the full pipeline.
tryCatch({
  source("scripts/R/04_data_analysis.R")
}, error = function(e) {
  stop("Error: The file '04_data_analysis.R' was not found. Please ensure all prerequisite scripts are in 'scripts/R/'.")
})

#' Visualize Depression Prevalence by Age Group
#'
#' @description
#' Creates and saves a bar chart showing the prevalence of depression across
#' different age groups, based on the analysis of the real 2022 BRFSS data.
#'
#' @param analysis_data A data.table object from the analysis step, containing
#'   'AGE_GROUP' and 'Prevalence' columns.
#' @param output_path A string specifying the file path to save the plot (e.g., "plot.png").
#'
#' @return The ggplot object (the plot itself).

visualize_prevalence <- function(analysis_data, output_path = "depression_prevalence_by_age.png") {
  # --- Visualization using ggplot2 ---
  # The grammar of graphics (ggplot) builds a plot in layers.

  plot <- ggplot(
    # 1. The `data` layer: Specify the dataset to use.
    data = analysis_data,
    # 2. The `aes` (aesthetic) layer: Map variables from the data to visual properties.
    aes(x = AGE_GROUP, y = Prevalence, fill = AGE_GROUP)
  ) +
    # 3. The `geom` (geometric object) layer: Specify the type of plot.
    # `geom_col()` is used for bar charts where the height of the bar is a value in the data.
    geom_col(show.legend = FALSE) + # We hide the legend as the x-axis is self-explanatory.

    # Add text labels on top of each bar to show the exact prevalence value.
    # `geom_text` adds text annotations to the plot.
    # `scales::percent` formats the number as a percentage.
    geom_text(aes(label = scales::percent(Prevalence, accuracy = 0.1)),
              vjust = -0.5, # `vjust` adjusts the vertical position to be just above the bar.
              size = 3.5) +

    # 4. The `labs` (labels) layer: Customize titles, subtitles, and axis labels.
    labs(
      title = "Prevalence of Depressive Disorder by Age Group",
      subtitle = "Based on 2022 BRFSS data",
      x = "Age Group",
      y = "Prevalence Rate",
      caption = "Source: CDC Behavioral Risk Factor Surveillance System, 2022."
    ) +

    # 5. The `scale` layer: Customize how data is mapped to aesthetics.
    # `scale_y_continuous` lets us format the y-axis. We expand the limits
    # to make space for the text labels above the bars.
    scale_y_continuous(labels = scales::percent, expand = expansion(mult = c(0, 0.15))) +

    # 6. The `theme` layer: Customize the non-data elements of the plot (e.g., background, fonts).
    # `theme_minimal()` is a clean, modern theme. We can further customize it.
    theme_minimal(base_size = 14) +
    theme(
      plot.title = element_text(face = "bold"),
      axis.title = element_text(face = "bold.italic"),
      axis.text.x = element_text(angle = 45, hjust = 1), # Rotate x-axis labels for readability
      panel.grid.major.x = element_blank() # Remove vertical grid lines for a cleaner look.
    )

  # Save the plot to the specified file path.
  # `ggsave` handles the details of file formats and sizing.
  ggsave(output_path, plot, width = 10, height = 7, dpi = 300)

  cat(paste0("Visualization complete. Plot saved to: '", output_path, "'\n"))

  # Return the plot object.
  return(plot)
}

# --- Script Execution ---
# The following lines demonstrate running the entire pipeline from start to finish.

# Uncomment the lines below to run the full pipeline and generate the plot.
#
# cat("--- Running Full Data Pipeline ---\n")
#
# # It is recommended to run this in an interactive R session, as the data download
# # can take time.
#
# # Step 1: Download and load the data
# raw_data <- download_and_load_brfss_data()
#
# # Step 2: Clean the data
# cleaned_data <- clean_brfss_data(raw_data)
#
# # Step 3: Process the data for features
# processed_data <- process_brfss_data(cleaned_data)
#
# # Step 4: Analyze the data
# analysis_results <- analyze_depression_prevalence(processed_data)
# print(analysis_results)
#
# # Step 5: Create and save the visualization
# final_plot <- visualize_prevalence(analysis_results, "real_data_depression_prevalence.png")
#
# cat("--- Pipeline Complete ---\n")
