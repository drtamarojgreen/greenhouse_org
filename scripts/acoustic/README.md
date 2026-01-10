# Acoustic Machine Learning Pipeline

## Overview

This project contains a fully implemented suite of Python and R scripts that demonstrate a machine learning pipeline. The pipeline assesses and searches research from PubMed and ClinicalTrials.gov and compares it to an in-house model. The in-house model is trained on a synthetic dataset of musical features to predict a simulated "reaction score."

The pipeline is designed to be modular and run sequentially, with a `main.py` script to orchestrate the entire process.

## Features

- **Data Acquisition**: Fetches real data from PubMed and ClinicalTrials.gov APIs and generates a sophisticated synthetic dataset for the in-house model.
- **Advanced Preprocessing**: Utilizes `nltk` for robust NLP preprocessing of text data and `dplyr` in R for normalization and outlier handling of the in-house data.
- **Machine Learning Model**: Trains a Random Forest Regressor on the in-house data, evaluates its performance, and identifies key feature importances.
- **Intelligent Search**: Uses the feature importances from the trained model to guide a search for relevant articles in the public research data.
- **Comparative Analysis**: Generates a keyword frequency plot from the relevant PubMed abstracts to visualize key themes.

## Directory Structure

```
scripts/acoustic/
├── data/
│   ├── (raw and processed data will be saved here)
├── src/
│   ├── data_acquisition/
│   │   ├── 01_fetch_pubmed_data.py
│   │   ├── 02_fetch_clinical_trials_data.py
│   │   └── 03_generate_inhouse_data.py
│   ├── preprocessing/
│   │   ├── 01_preprocess_text.py
│   │   └── 02_preprocess_inhouse_data.R
│   ├── modeling/
│   │   ├── 01_train_inhouse_model.py
│   │   └── inhouse_model.pkl (saved model)
│   └── analysis/
│       ├── 01_search_public_research.py
│       └── 02_comparative_analysis.R
├── analysis_results/
│   └── keyword_frequency_plot.png (output plot)
├── main.py
├── requirements.txt
└── README.md
```

## How to Use

### 1. Prerequisites

- Python 3.7+
- R installed and `Rscript` command available in the system's PATH.

### 2. Installation

First, install the required Python packages:
```bash
pip install -r requirements.txt
```

Next, you'll need to install the R packages. Open an R console and run:
```R
install.packages(c("readr", "dplyr", "tidytext", "ggplot2", "stringr"))
```

### 3. Running the Pipeline

To run the entire pipeline, execute the `main.py` script from within the `scripts/acoustic` directory:
```bash
python main.py
```
The script will run each step of the pipeline in the correct order, from data acquisition to the final analysis. The output plot will be saved in the `analysis_results` directory.
