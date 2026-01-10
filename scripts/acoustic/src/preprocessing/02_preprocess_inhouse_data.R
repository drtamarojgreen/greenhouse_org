# scripts/acoustic/src/preprocessing/02_preprocess_inhouse_data.R

# Load necessary libraries
# install.packages("readr")
# install.packages("dplyr")
library(readr)
library(dplyr)

preprocess_inhouse_data <- function() {
  print("Preprocessing in-house data...")

  # Define file paths
  input_file <- "scripts/acoustic/data/inhouse_data.csv"
  output_file <- "scripts/acoustic/data/inhouse_data_processed.csv"
  output_dir <- "scripts/acoustic/data"

  # Check if input file exists
  if (!file.exists(input_file)) {
    stop("Data file not found. Please run the data acquisition scripts first.")
  }

  # Load data
  inhouse_data <- read_csv(input_file)

  # Preprocess data (e.g., scaling)
  processed_data <- inhouse_data %>%
    mutate(across(everything(), scale))

  # Create output directory if it doesn't exist
  if (!dir.exists(output_dir)) {
    dir.create(output_dir, recursive = TRUE)
  }

  # Save processed data
  write_csv(processed_data, output_file)

  print(paste("In-house data preprocessed and saved to", output_file))
}

# Run the function
preprocess_inhouse_data()
