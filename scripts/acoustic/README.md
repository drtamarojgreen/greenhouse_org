# Acoustic Machine Learning Pipeline

## Overview

This project contains a sophisticated, fully implemented suite of Python scripts that demonstrate a machine learning pipeline for musical analysis. The pipeline analyzes the note content of classical music from the `music21` corpus, trains a model to predict a simulated "popularity score," and then cross-references the model's findings with academic research from PubMed and ClinicalTrials.gov.

The final output is a text-based report (`analysis_summary.txt`) that details the key musical patterns identified by the model and lists the academic research that discusses similar concepts.

## Features

- **Real Music Data Analysis**: Utilizes the `music21` library to download and analyze Bach chorales, extracting features like note frequencies, key signatures, and time signatures.
- **Advanced Preprocessing**: Prepares the music data for modeling by one-hot encoding categorical features and normalizing numerical data.
- **Machine Learning Model**: Trains a Random Forest Regressor to identify the most important musical features in predicting a simulated "popularity score."
- **Text-Based Reporting**: Generates a detailed textual summary that connects the model's findings to real-world academic research.

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
│   │   └── 02_preprocess_inhouse_data.py
│   ├── modeling/
│   │   ├── 01_train_inhouse_model.py
│   │   └── inhouse_model.pkl (saved model)
│   └── analysis/
│       ├── 01_search_public_research.py
│       └── 02_comparative_analysis.py
├── analysis_results/
│   └── analysis_summary.txt (output report)
├── main.py
├── requirements.txt
└── README.md
```

## How to Use

### 1. Prerequisites

- Python 3.7+

### 2. Installation

Install the required Python packages:
```bash
pip install -r requirements.txt
```
*Note: The first time you run the pipeline, `music21` may need to download its corpus, which can take a few minutes.*

### 3. Running the Pipeline

To run the entire pipeline, execute the `main.py` script from within the `scripts/acoustic` directory:
```bash
python main.py
```
The script will run each step of the pipeline in the correct order. The final analysis report will be saved in the `analysis_results` directory.
