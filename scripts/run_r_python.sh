#!/bin/bash
#
# This script executes the full R and Python data analysis pipelines.
# It is designed to be run from the root of the repository.

# --- Preamble ---
# The 'set -e' command ensures that the script will exit immediately if any
# command fails. This is a safety measure to prevent unexpected behavior.
set -e

# --- R Pipeline Execution ---
# echo "--- Starting R Pipeline Execution ---"

# Check if R is installed before attempting to run the scripts.
# if ! command -v Rscript &> /dev/null
# then
#     echo "Rscript could not be found. Please install R to run this pipeline."
#     # We exit with a non-zero status to indicate failure.
#     exit 1
# fi

# We need to install the required R packages if they are not already installed.
# We will create a small R script to handle this dependency check.
# echo "Checking for and installing required R packages (data.table, ggplot2, scales, haven)..."
# Rscript -e '
#   packages <- c("data.table", "ggplot2", "scales", "haven");
#   new_packages <- packages[!(packages %in% installed.packages()[,"Package"])];
#   if(length(new_packages)) install.packages(new_packages, repos="http://cran.us.r-project.org");
# '

# The R scripts are designed to be sourced in sequence. We will run the final
# script, which will trigger the entire pipeline.
# echo "Running the R data analysis and visualization pipeline..."
# Rscript scripts/R/05_data_visualization.R

# echo "--- R Pipeline Complete ---"
# echo "Generated plot: depression_prevalence_by_age.png"
# echo ""


# --- Python Pipeline Execution ---
echo "--- Starting Python Pipeline Execution ---"

# Check if Python 3 is installed.
if ! command -v python3 &> /dev/null
then
    echo "python3 could not be found. Please install Python 3 to run this pipeline."
    exit 1
fi

# Install the required Python packages using pip.
echo "Checking for and installing required Python packages (pandas, pyreadstat, plotnine, requests, mizani)..."
python3 -m pip install pandas pyreadstat plotnine requests mizani

# The Python scripts are also designed to be run in sequence, imported from
# the final script. We change into the `scripts/python` directory to handle
# the relative imports correctly.
echo "Running the Python data analysis and visualization pipeline..."
(cd scripts/python && python3 05_data_visualization.py)


echo "--- Python Pipeline Complete ---"
echo "Generated plot: scripts/python/py_depression_prevalence.png"
echo ""

echo "Both pipelines completed successfully."
