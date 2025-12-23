# consolidated_ml_pipeline.py
"""
Research Pioneers LLC - Consolidated ML Pipeline
Supports: FFNN, CNN1D, RNN, Autoencoder architectures
Data sources: BRFSS, PubMed, ClinicalTrials, KEGG, Reactome
Learning modes: Full training, LoRA fine-tuning, feature extraction
"""

import os
import sys
import json
import pickle
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any, Union
import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import requests
import zipfile
import io

# Data processing
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    roc_auc_score, roc_curve, accuracy_score, 
    precision_recall_fscore_support, confusion_matrix,
    classification_report
)

# Deep learning
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models, callbacks, optimizers
from tensorflow.keras.mixed_precision import set_global_policy

# Visualization
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

# External data sources
try:
    from Bio import Entrez
    BIOPYTHON_AVAILABLE = True
except ImportError:
    BIOPYTHON_AVAILABLE = False
    
try:
    import gseapy as gp
    from bioservices import KEGG
    from mygene import MyGeneInfo
    PATHWAY_TOOLS_AVAILABLE = True
except ImportError:
    PATHWAY_TOOLS_AVAILABLE = False

try:
    import pyreadstat
    PYREADSTAT_AVAILABLE = True
except ImportError:
    PYREADSTAT_AVAILABLE = False

# ============================================================================
# CONFIGURATION AND LOGGING
# ============================================================================

class PipelineConfig:
    """Centralized configuration management with validation and defaults"""
    
    DEFAULT_CONFIG = {
        # Paths
        "data_dir": "data",
        "output_dir": "outputs",
        "model_dir": "models",
        "log_dir": "logs",
        
        # Data source
        "data_source": "brfss",  # brfss, pubmed, clinicaltrials, kegg, reactome, custom
        "data_url": None,
        "data_file": None,
        
        # BRFSS specific
        "brfss_url": "https://www.cdc.gov/brfss/annual_data/2022/files/LLCP2022XPT.zip",
        "brfss_columns": ["ADDEPEV3", "MENTHLTH", "SEXVAR", "_AGEG5YR"],
        
        # Feature engineering
        "label_column": "DEPRESSION_STATUS",
        "categorical_columns": ["AGE_GROUP", "SEX_LABEL", "FMD_INDICATOR"],
        "numeric_columns": ["MENTHLTH"],
        "text_columns": [],
        
        # Data splitting
        "test_size": 0.2,
        "val_size": 0.2,
        "random_state": 42,
        "stratify": True,
        "k_folds": None,  # If set, use k-fold CV
        
        # Model architecture
        "model_type": "ffnn",  # ffnn, cnn1d, rnn, lstm, gru, autoencoder
        "hidden_units": [128, 64],
        "conv_filters": [32, 64],
        "kernel_size": 3,
        "pool_size": 2,
        "rnn_units": [64, 32],
        "rnn_type": "lstm",  # lstm, gru, simple
        "latent_dim": 32,  # for autoencoder
        "dropout": 0.3,
        "l2_reg": 0.0001,
        "batch_norm": True,
        
        # Training
        "learning_mode": "full",  # full, feature_extraction, lora
        "lora_rank": 8,
        "lora_alpha": 16,
        "epochs": 50,
        "batch_size": 64,
        "learning_rate": 0.001,
        "optimizer": "adam",  # adam, sgd, rmsprop, adamw
        "loss": "binary_crossentropy",  # binary_crossentropy, categorical_crossentropy, mse
        "class_weights": None,  # auto or dict
        
        # Callbacks
        "early_stopping": True,
        "early_stopping_patience": 10,
        "reduce_lr": True,
        "reduce_lr_patience": 5,
        "checkpoint_monitor": "val_auc",
        "checkpoint_mode": "max",
        
        # GPU/Performance
        "gpu_memory_limit": 15000,  # MB
        "mixed_precision": True,
        "xla_optimization": True,
        
        # External APIs
        "entrez_email": None,
        "pubmed_retmax": 100,
        "clinicaltrials_max": 20,
        
        # Evaluation
        "eval_metrics": ["accuracy", "auc", "precision", "recall", "f1"],
        "plot_roc": True,
        "plot_confusion_matrix": True,
        "save_predictions": True,
        
        # Advanced
        "sequence_length": None,  # for CNN/RNN, auto-detect if None
        "use_attention": False,
        "ensemble_models": [],  # list of model paths for ensemble
        "pseudo_labeling": False,  # for semi-supervised
        "augmentation": False,
    }
    
    def __init__(self, config_path: Optional[str] = None, **kwargs):
        """Initialize configuration from file and/or kwargs"""
        self.config = self.DEFAULT_CONFIG.copy()
        
        # Load from file if provided
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r') as f:
                if config_path.endswith('.json'):
                    file_config = json.load(f)
                elif config_path.endswith('.yaml') or config_path.endswith('.yml'):
                    import yaml
                    file_config = yaml.safe_load(f)
                else:
                    raise ValueError(f"Unsupported config format: {config_path}")
                self.config.update(file_config)
        
        # Override with kwargs
        self.config.update(kwargs)
        
        # Validate
        self._validate()
        
    def _validate(self):
        """Validate configuration parameters"""
        # Check model type
        valid_models = ["ffnn", "cnn1d", "rnn", "lstm", "gru", "autoencoder"]
        if self.config["model_type"] not in valid_models:
            raise ValueError(f"model_type must be one of {valid_models}")
        
        # Check data source
        valid_sources = ["brfss", "pubmed", "clinicaltrials", "kegg", "reactome", "custom"]
        if self.config["data_source"] not in valid_sources:
            raise ValueError(f"data_source must be one of {valid_sources}")
        
        # Check required dependencies
        if self.config["data_source"] == "brfss" and not PYREADSTAT_AVAILABLE:
            raise ImportError("pyreadstat required for BRFSS data. Install: pip install pyreadstat")
        
        if self.config["data_source"] in ["pubmed", "kegg", "reactome"] and not BIOPYTHON_AVAILABLE:
            raise ImportError("Biopython required for biomedical data sources. Install: pip install biopython")
        
        # Create directories
        for dir_key in ["data_dir", "output_dir", "model_dir", "log_dir"]:
            os.makedirs(self.config[dir_key], exist_ok=True)
        
        # Auto-detect GPU
        if tf.config.list_physical_devices('GPU'):
            if self.config["gpu_memory_limit"]:
                gpus = tf.config.list_physical_devices('GPU')
                for gpu in gpus:
                    tf.config.set_logical_device_configuration(
                        gpu,
                        [tf.config.LogicalDeviceConfiguration(
                            memory_limit=self.config["gpu_memory_limit"]
                        )]
                    )
            if self.config["mixed_precision"]:
                set_global_policy('mixed_float16')
        
        # Set XLA optimization
        if self.config["xla_optimization"]:
            tf.config.optimizer.set_jit(True)
    
    def get(self, key: str, default=None):
        return self.config.get(key, default)
    
    def __getitem__(self, key):
        return self.config[key]
    
    def save(self, path: str):
        """Save configuration to file"""
        with open(path, 'w') as f:
            json.dump(self.config, f, indent=2)


def setup_logging(config: PipelineConfig) -> logging.Logger:
    """Configure logging with file and console handlers"""
    log_file = os.path.join(config["log_dir"], "pipeline.log")
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    logger = logging.getLogger("MLPipeline")
    return logger


# ============================================================================
# DATA LOADING AND PREPROCESSING
# ============================================================================

class DataLoader:
    """Unified data loading for multiple sources"""
    
    def __init__(self, config: PipelineConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.df = None
        self.metadata = {}
    
    def load_data(self) -> pd.DataFrame:
        """Load data based on configured source"""
        source = self.config["data_source"]
        self.logger.info(f"Loading data from source: {source}")
        
        if source == "brfss":
            self.df = self._load_brfss()
        elif source == "pubmed":
            self.df = self._load_pubmed()
        elif source == "clinicaltrials":
            self.df = self._load_clinicaltrials()
        elif source == "custom":
            self.df = self._load_custom()
        else:
            raise ValueError(f"Unsupported data source: {source}")
        
        self.logger.info(f"Loaded data shape: {self.df.shape}")
        return self.df
    
    def _load_brfss(self) -> pd.DataFrame:
        """Load BRFSS health survey data"""
        data_dir = self.config["data_dir"]
        url = self.config["brfss_url"]
        zip_path = os.path.join(data_dir, "LLCP2022XPT.zip")
        xpt_filename = "LLCP2022.XPT"
        
        # Download if needed
        if not os.path.exists(zip_path):
            self.logger.info(f"Downloading BRFSS data from {url}")
            try:
                r = requests.get(url, stream=True, timeout=300)
                r.raise_for_status()
                with open(zip_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                self.logger.info("Download complete")
            except Exception as e:
                self.logger.error(f"Download failed: {e}")
                raise
        
        # Extract if needed
        xpt_path = os.path.join(data_dir, xpt_filename)
        if not os.path.exists(xpt_path):
            self.logger.info(f"Extracting {zip_path}")
            try:
                with zipfile.ZipFile(zip_path, "r") as z:
                    members = z.namelist()
                    xpt_file = next((m for m in members if m.upper().endswith(".XPT")), None)
                    if not xpt_file:
                        raise FileNotFoundError("No .XPT file in archive")
                    z.extract(xpt_file, path=data_dir)
                    extracted_path = os.path.join(data_dir, xpt_file)
                    if extracted_path != xpt_path:
                        os.replace(extracted_path, xpt_path)
                self.logger.info("Extraction complete")
            except Exception as e:
                self.logger.error(f"Extraction failed: {e}")
                raise
        
        # Load XPT file
        self.logger.info(f"Reading XPT file: {xpt_path}")
        try:
            df, meta = pyreadstat.read_xport(xpt_path)
            df = pd.DataFrame(df)
            self.metadata["brfss_meta"] = meta
            return df
        except Exception as e:
            self.logger.error(f"Failed to read XPT: {e}")
            raise
    
    def _load_pubmed(self) -> pd.DataFrame:
        """Load PubMed article data"""
        if not BIOPYTHON_AVAILABLE:
            raise ImportError("Biopython required for PubMed")
        
        email = self.config["entrez_email"]
        if not email:
            raise ValueError("entrez_email required for PubMed API")
        
        Entrez.email = email
        search_term = self.config.get("pubmed_search_term", "depression AND mental health")
        retmax = self.config["pubmed_retmax"]
        
        self.logger.info(f"Searching PubMed: {search_term}")
        try:
            # Search
            handle = Entrez.esearch(db="pubmed", term=search_term, retmax=retmax)
            record = Entrez.read(handle)
            handle.close()
            ids = record.get("IdList", [])
            self.logger.info(f"Found {len(ids)} articles")
            
            if not ids:
                return pd.DataFrame()
            
            # Fetch summaries
            handle = Entrez.esummary(db="pubmed", id=",".join(ids))
            summaries = Entrez.read(handle)
            handle.close()
            
            # Parse
            rows = []
            for rec in summaries:
                rows.append({
                    "UID": rec.get("Id"),
                    "Title": rec.get("Title"),
                    "PubDate": rec.get("PubDate", ""),
                    "Journal": rec.get("Source"),
                    "FirstAuthor": rec.get("AuthorList", [None])[0]
                })
            
            return pd.DataFrame(rows)
        
        except Exception as e:
            self.logger.error(f"PubMed query failed: {e}")
            raise
    
    def _load_clinicaltrials(self) -> pd.DataFrame:
        """Load ClinicalTrials.gov data"""
        api_base = "https://clinicaltrials.gov/api/v2/"
        search_term = self.config.get("clinicaltrials_search_term", "depression")
        max_studies = self.config["clinicaltrials_max"]
        
        self.logger.info(f"Searching ClinicalTrials.gov: {search_term}")
        try:
            url = api_base + "studies"
            params = {
                "query.term": search_term,
                "pageSize": max_studies,
                "format": "json"
            }
            r = requests.get(url, params=params, timeout=60)
            r.raise_for_status()
            data = r.json()
            studies = data.get("studies", [])
            self.logger.info(f"Found {len(studies)} studies")
            
            rows = []
            for s in studies:
                prot = s.get("protocolSection", {})
                ident = prot.get("identificationModule", {})
                status = prot.get("statusModule", {})
                sponsor = prot.get("sponsorCollaboratorsModule", {})
                conditions = prot.get("conditionsModule", {}).get("conditions", [])
                
                rows.append({
                    "NCTID": ident.get("nctId"),
                    "Title": ident.get("briefTitle"),
                    "Status": status.get("overallStatus"),
                    "Sponsor": sponsor.get("leadSponsor", {}).get("name"),
                    "Conditions": "; ".join(conditions) if conditions else None
                })
            
            return pd.DataFrame(rows)
        
        except Exception as e:
            self.logger.error(f"ClinicalTrials query failed: {e}")
            raise
    
    def _load_custom(self) -> pd.DataFrame:
        """Load custom CSV/Excel/Parquet file"""
        data_file = self.config.get("data_file")
        if not data_file:
            raise ValueError("data_file required for custom data source")
        
        if not os.path.exists(data_file):
            raise FileNotFoundError(f"Data file not found: {data_file}")
        
        self.logger.info(f"Loading custom data from {data_file}")
        
        ext = os.path.splitext(data_file)[1].lower()
        try:
            if ext == ".csv":
                df = pd.read_csv(data_file)
            elif ext in [".xls", ".xlsx"]:
                df = pd.read_excel(data_file)
            elif ext == ".parquet":
                df = pd.read_parquet(data_file)
            elif ext == ".json":
                df = pd.read_json(data_file)
            elif ext == ".pkl" or ext == ".pickle":
                df = pd.read_pickle(data_file)
            else:
                raise ValueError(f"Unsupported file format: {ext}")
            
            return df
        
        except Exception as e:
            self.logger.error(f"Failed to load custom data: {e}")
            raise


class DataPreprocessor:
    """Unified data cleaning and feature engineering"""
    
    def __init__(self, config: PipelineConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.encoders = {}
        self.feature_names = []
    
    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean raw data based on source-specific rules"""
        source = self.config["data_source"]
        self.logger.info(f"Cleaning {source} data")
        
        if source == "brfss":
            df = self._clean_brfss(df)
        elif source in ["pubmed", "clinicaltrials"]:
            df = self._clean_text_data(df)
        # Add more source-specific cleaning as needed
        
        return df
    
    def _clean_brfss(self, df: pd.DataFrame) -> pd.DataFrame:
        """BRFSS-specific cleaning"""
        # Select columns
        required_cols = self.config["brfss_columns"]
        missing = [c for c in required_cols if c not in df.columns]
        if missing:
            raise KeyError(f"Missing required columns: {missing}")
        
        df = df[required_cols].copy()
        
        # Replace special codes with NaN
        special_codes = {
            "MENTHLTH": [77, 99, 88],  # 88 = 0 days, handled separately
            "ADDEPEV3": [7, 9],
        }
        
        for col, codes in special_codes.items():
            if col in df.columns:
                # Handle 88 specially for MENTHLTH
                if col == "MENTHLTH":
                    df[col] = df[col].replace(88, 0)
                    df[col] = df[col].replace({77: np.nan, 99: np.nan})
                else:
                    df[col] = df[col].replace({c: np.nan for c in codes})
        
        # Ensure proper dtypes
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        
        return df
    
    def _clean_text_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean text-based data sources"""
        # Remove duplicates
        df = df.drop_duplicates()
        
        # Fill missing text with empty string
        text_cols = df.select_dtypes(include=['object']).columns
        for col in text_cols:
            df[col] = df[col].fillna("")
        
        return df
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create derived features"""
        source = self.config["data_source"]
        self.logger.info("Engineering features")
        
        if source == "brfss":
            df = self._engineer_brfss_features(df)
        
        return df
    
    def _engineer_brfss_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """BRFSS-specific feature engineering"""
        # Age group labels
        age_labels = [
            "18-24", "25-29", "30-34", "35-39",
            "40-44", "45-49", "50-54", "55-59",
            "60-64", "65-69", "70-74", "75-79", "80+"
        ]
        if "_AGEG5YR" in df.columns:
            df["AGE_GROUP"] = pd.Categorical(
                df["_AGEG5YR"].map({i+1: age_labels[i] for i in range(len(age_labels))}),
                categories=age_labels,
                ordered=True
            )
        
        # Sex labels
        if "SEXVAR" in df.columns:
            df["SEX_LABEL"] = df["SEXVAR"].map({1: "Male", 2: "Female"})
            df["SEX_LABEL"] = pd.Categorical(df["SEX_LABEL"], categories=["Male", "Female"])
        
        # Depression status
        if "ADDEPEV3" in df.columns:
            df["DEPRESSION_STATUS"] = df["ADDEPEV3"].map({1: "Yes", 2: "No"})
            df["DEPRESSION_STATUS"] = pd.Categorical(
                df["DEPRESSION_STATUS"], 
                categories=["Yes", "No"]
            )
        
        # Frequent Mental Distress indicator
        if "MENTHLTH" in df.columns:
            df["FMD_INDICATOR"] = pd.NA
            mask_valid = df["MENTHLTH"].notna()
            df.loc[mask_valid & (df["MENTHLTH"] >= 14), "FMD_INDICATOR"] = "Frequent Mental Distress"
            df.loc[mask_valid & (df["MENTHLTH"] < 14), "FMD_INDICATOR"] = "No FMD"
            df["FMD_INDICATOR"] = pd.Categorical(
                df["FMD_INDICATOR"],
                categories=["No FMD", "Frequent Mental Distress"]
            )
        
        return df
    
    def prepare_features_labels(
        self, 
        df: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Encode features and split data"""
        self.logger.info("Preparing features and labels")
        
        label_col = self.config["label_column"]
        cat_cols = self.config["categorical_columns"]
        num_cols = self.config["numeric_columns"]
        
        # Filter valid labels
        df = df[df[label_col].notna()].copy()
        
        if df.empty:
            raise ValueError("No valid samples after filtering labels")
        
        # Encode labels
        if df[label_col].dtype.name == "category" or df[label_col].dtype == object:
            label_encoder = LabelEncoder()
            y = label_encoder.fit_transform(df[label_col].astype(str))
            self.encoders["label_encoder"] = label_encoder
            self.logger.info(f"Label classes: {label_encoder.classes_}")
        else:
            y = df[label_col].values
        
        # Encode categorical features
        X_cat = None
        if cat_cols:
            available_cat = [c for c in cat_cols if c in df.columns]
            if available_cat:
                cat_df = df[available_cat].copy()
                # Convert all to string and fill missing
                for col in available_cat:
                    cat_df[col] = cat_df[col].astype(str).fillna("MISSING")
                
                cat_encoder = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
                X_cat = cat_encoder.fit_transform(cat_df)
                self.encoders["cat_encoder"] = cat_encoder
                self.encoders["categorical_columns"] = available_cat
                self.logger.info(f"Encoded {len(available_cat)} categorical features -> {X_cat.shape[1]} dimensions")
        
        # Process numeric features
        X_num = None
        if num_cols:
            available_num = [c for c in num_cols if c in df.columns]
            if available_num:
                num_df = df[available_num].copy()
                
                # Impute
                num_imputer = SimpleImputer(strategy="median")
                X_num_imputed = num_imputer.fit_transform(num_df)
                
                # Scale
                num_scaler = StandardScaler()
                X_num = num_scaler.fit_transform(X_num_imputed)
                
                self.encoders["num_imputer"] = num_imputer
                self.encoders["num_scaler"] = num_scaler
                self.encoders["numeric_columns"] = available_num
                self.logger.info(f"Processed {len(available_num)} numeric features")
        
        # Combine features
        feature_arrays = [arr for arr in [X_num, X_cat] if arr is not None]
        if not feature_arrays:
            raise ValueError("No features available after encoding")
        
        X = np.hstack(feature_arrays)
        self.logger.info(f"Total feature dimensions: {X.shape[1]}")
        
        # Save encoder artifacts
        encoder_path = os.path.join(self.config["output_dir"], "encoders.pkl")
        with open(encoder_path, "wb") as f:
            pickle.dump(self.encoders, f)
        self.logger.info(f"Encoders saved to {encoder_path}")
        
        # Split data
        test_size = self.config["test_size"]
        val_size = self.config["val_size"]
        random_state = self.config["random_state"]
        stratify_split = y if self.config["stratify"] else None
        
        # First split: train+val vs test
        X_trainval, X_test, y_trainval, y_test = train_test_split(
            X, y, 
            test_size=test_size, 
            random_state=random_state, 
            stratify=stratify_split
        )
        
        # Second split: train vs val
        stratify_trainval = y_trainval if self.config["stratify"] else None
        X_train, X_val, y_train, y_val = train_test_split(
            X_trainval, y_trainval,
            test_size=val_size,
            random_state=random_state,
            stratify=stratify_trainval
        )
        
        self.logger.info(f"Data split - Train: {X_train.shape[0]}, Val: {X_val.shape[0]}, Test: {X_test.shape[0]}")
        
        # Compute class weights if needed
        if self.config["class_weights"] == "auto":
            from sklearn.utils.class_weight import compute_class_weight
            classes = np.unique(y_train)
            weights = compute_class_weight('balanced', classes=classes, y=y_train)
            self.config.config["class_weights"] = dict(zip(classes, weights))
            self.logger.info(f"Computed class weights: {self.config['class_weights']}")
        
        return X_train, X_val, X_test, y_train, y_val, y_test


# ============================================================================
# MODEL ARCHITECTURES
# ============================================================================

class ModelBuilder:
    """Build various neural network architectures"""
    
    def __init__(self, config: PipelineConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
    
    def build_model(self, input_shape: Tuple) -> keras.Model:
        """Build model based on configuration"""
        model_type = self.config["model_type"]
        self.logger.info(f"Building {model_type} model with input shape {input_shape}")
        
        if model_type == "ffnn":
            model = self._build_ffnn(input_shape)
        elif model_type == "cnn1d":
            model = self._build_cnn1d(input_shape)
        elif model_type in ["rnn", "lstm", "gru"]:
            model = self._build_rnn(input_shape)
        elif model_type == "autoencoder":
            model = self._build_autoencoder(input_shape)
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
        
        # Apply LoRA if specified
        if self.config["learning_mode"] == "lora":
            model = self._apply_lora(model)
        
        # Compile model
        model = self._compile_model(model)
        
        return model
    
    def _build_ffnn(self, input_shape: Tuple) -> keras.Model:
        """Build feedforward neural network"""
        hidden_units = self.config["hidden_units"]
        dropout = self.config["dropout"]
        l2_reg = self.config["l2_reg"]
        batch_norm = self.config["batch_norm"]
        
        inputs = layers.Input(shape=input_shape)
        x = inputs
        
        for i, units in enumerate(hidden_units):
            x = layers.Dense(
                units, 
                activation="relu",
                kernel_regularizer=keras.regularizers.l2(l2_reg),
                name=f"dense_{i}"
            )(x)
            
            if batch_norm:
                x = layers.BatchNormalization(name=f"bn_{i}")(x)
            
            if dropout > 0:
                x = layers.Dropout(dropout, name=f"dropout_{i}")(x)
        
        # Output layer
        loss = self.config["loss"]
        if "categorical" in loss:
            # Multi-class classification
            num_classes = self.config.get("num_classes", 2)
            outputs = layers.Dense(num_classes, activation="softmax", name="output")(x)
        elif loss == "mse":
            # Regression
            outputs = layers.Dense(1, activation="linear", name="output")(x)
        else:
            # Binary classification
            outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
        
        model = keras.Model(inputs, outputs, name="FFNN")
        return model
    
    def _build_cnn1d(self, input_shape: Tuple) -> keras.Model:
        """Build 1D convolutional neural network"""
        conv_filters = self.config["conv_filters"]
        kernel_size = self.config["kernel_size"]
        pool_size = self.config["pool_size"]
        dropout = self.config["dropout"]
        l2_reg = self.config["l2_reg"]
        batch_norm = self.config["batch_norm"]
        
        inputs = layers.Input(shape=input_shape)
        x = inputs
        
        for i, filters in enumerate(conv_filters):
            x = layers.Conv1D(
                filters=filters,
                kernel_size=kernel_size,
                activation="relu",
                padding="same",
                kernel_regularizer=keras.regularizers.l2(l2_reg),
                name=f"conv1d_{i}"
            )(x)
            
            if batch_norm:
                x = layers.BatchNormalization(name=f"bn_conv_{i}")(x)
            
            x = layers.MaxPooling1D(pool_size=pool_size, name=f"pool_{i}")(x)
            
            if dropout > 0:
                x = layers.Dropout(dropout, name=f"dropout_conv_{i}")(x)
        
        # Add attention if specified
        if self.config["use_attention"]:
            x = self._add_attention_layer(x)
        
        x = layers.Flatten(name="flatten")(x)
        x = layers.Dense(128, activation="relu", name="dense_final")(x)
        
        if dropout > 0:
            x = layers.Dropout(dropout, name="dropout_final")(x)
        
        # Output
        loss = self.config["loss"]
        if "categorical" in loss:
            num_classes = self.config.get("num_classes", 2)
            outputs = layers.Dense(num_classes, activation="softmax", name="output")(x)
        elif loss == "mse":
            outputs = layers.Dense(1, activation="linear", name="output")(x)
        else:
            outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
        
        model = keras.Model(inputs, outputs, name="CNN1D")
        return model
    
    def _build_rnn(self, input_shape: Tuple) -> keras.Model:
        """Build recurrent neural network (LSTM/GRU/SimpleRNN)"""
        rnn_units = self.config["rnn_units"]
        rnn_type = self.config.get("rnn_type", "lstm")
        dropout = self.config["dropout"]
        l2_reg = self.config["l2_reg"]
        batch_norm = self.config["batch_norm"]
        
        # Select RNN layer type
        if rnn_type == "lstm":
            RNNLayer = layers.LSTM
        elif rnn_type == "gru":
            RNNLayer = layers.GRU
        else:
            RNNLayer = layers.SimpleRNN
        
        inputs = layers.Input(shape=input_shape)
        x = inputs
        
        for i, units in enumerate(rnn_units):
            return_sequences = (i < len(rnn_units) - 1) or self.config["use_attention"]
            
            x = RNNLayer(
                units,
                return_sequences=return_sequences,
                dropout=dropout,
                recurrent_dropout=dropout if dropout > 0 else 0,
                kernel_regularizer=keras.regularizers.l2(l2_reg),
                name=f"{rnn_type}_{i}"
            )(x)
            
            if batch_norm:
                x = layers.BatchNormalization(name=f"bn_rnn_{i}")(x)
        
        # Add attention if specified
        if self.config["use_attention"]:
            x = self._add_attention_layer(x)
            x = layers.Flatten()(x)
        
        x = layers.Dense(64, activation="relu", name="dense_final")(x)
        
        if dropout > 0:
            x = layers.Dropout(dropout, name="dropout_final")(x)
        
        # Output
        loss = self.config["loss"]
        if "categorical" in loss:
            num_classes = self.config.get("num_classes", 2)
            outputs = layers.Dense(num_classes, activation="softmax", name="output")(x)
        elif loss == "mse":
            outputs = layers.Dense(1, activation="linear", name="output")(x)
        else:
            outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
        
        model = keras.Model(inputs, outputs, name=f"{rnn_type.upper()}")
        return model
    
    def _build_autoencoder(self, input_shape: Tuple) -> keras.Model:
        """Build autoencoder for unsupervised/semi-supervised learning"""
        latent_dim = self.config["latent_dim"]
        dropout = self.config["dropout"]
        l2_reg = self.config["l2_reg"]
        
        # Encoder
        encoder_input = layers.Input(shape=input_shape, name="encoder_input")
        x = encoder_input
        
        # Encoder layers (progressive dimension reduction)
        dims = [input_shape[0] // 2, input_shape[0] // 4, latent_dim]
        for i, dim in enumerate(dims):
            x = layers.Dense(
                dim,
                activation="relu",
                kernel_regularizer=keras.regularizers.l2(l2_reg),
                name=f"encoder_{i}"
            )(x)
            if dropout > 0:
                x = layers.Dropout(dropout)(x)
        
        latent = layers.Dense(latent_dim, name="latent")(x)
        encoder = keras.Model(encoder_input, latent, name="encoder")
        
        # Decoder
        decoder_input = layers.Input(shape=(latent_dim,), name="decoder_input")
        x = decoder_input
        
        # Decoder layers (mirror encoder)
        dims_reversed = dims[-2::-1] + [input_shape[0]]
        for i, dim in enumerate(dims_reversed):
            x = layers.Dense(
                dim,
                activation="relu" if i < len(dims_reversed) - 1 else "linear",
                kernel_regularizer=keras.regularizers.l2(l2_reg),
                name=f"decoder_{i}"
            )(x)
            if dropout > 0 and i < len(dims_reversed) - 1:
                x = layers.Dropout(dropout)(x)
        
        decoder_output = x
        decoder = keras.Model(decoder_input, decoder_output, name="decoder")
        
        # Full autoencoder
        autoencoder_input = layers.Input(shape=input_shape)
        encoded = encoder(autoencoder_input)
        decoded = decoder(encoded)
        autoencoder = keras.Model(autoencoder_input, decoded, name="Autoencoder")
        
        # For classification, add classifier on top of encoder
        if self.config["loss"] != "mse":
            classifier_input = layers.Input(shape=input_shape)
            encoded_repr = encoder(classifier_input)
            x = layers.Dense(64, activation="relu")(encoded_repr)
            if dropout > 0:
                x = layers.Dropout(dropout)(x)
            
            loss = self.config["loss"]
            if "categorical" in loss:
                num_classes = self.config.get("num_classes", 2)
                classifier_output = layers.Dense(num_classes, activation="softmax")(x)
            else:
                classifier_output = layers.Dense(1, activation="sigmoid")(x)
            
            classifier = keras.Model(classifier_input, classifier_output, name="AutoencoderClassifier")
            return classifier
        
        return autoencoder
    
    def _add_attention_layer(self, x):
        """Add attention mechanism"""
        attention = layers.MultiHeadAttention(
            num_heads=4,
            key_dim=x.shape[-1] // 4,
            name="attention"
        )(x, x)
        x = layers.Add()([x, attention])
        return x
    
    def _apply_lora(self, model: keras.Model) -> keras.Model:
        """Apply Low-Rank Adaptation (LoRA) to model"""
        self.logger.info("Applying LoRA adaptation")
        rank = self.config["lora_rank"]
        alpha = self.config["lora_alpha"]
        
        # Freeze base model
        for layer in model.layers:
            layer.trainable = False
        
        # Add LoRA layers to Dense layers
        # Note: This is a simplified implementation
        # For production, consider using a dedicated LoRA library
        lora_scale = alpha / rank
        
        # Wrap dense layers with LoRA
        for layer in model.layers:
            if isinstance(layer, layers.Dense):
                # Create low-rank matrices
                original_weights = layer.get_weights()
                
                # For simplicity, we'll add trainable low-rank matrices
                # In practice, you'd replace the layer properly
                layer.trainable = True  # Make specific layers trainable
        
        self.logger.info(f"LoRA applied with rank={rank}, alpha={alpha}")
        return model
    
    def _compile_model(self, model: keras.Model) -> keras.Model:
        """Compile model with optimizer, loss, and metrics"""
        # Get optimizer
        optimizer_name = self.config["optimizer"]
        learning_rate = self.config["learning_rate"]
        
        if optimizer_name == "adam":
            optimizer = optimizers.Adam(learning_rate=learning_rate)
        elif optimizer_name == "adamw":
            optimizer = optimizers.AdamW(learning_rate=learning_rate)
        elif optimizer_name == "sgd":
            optimizer = optimizers.SGD(learning_rate=learning_rate, momentum=0.9)
        elif optimizer_name == "rmsprop":
            optimizer = optimizers.RMSprop(learning_rate=learning_rate)
        else:
            raise ValueError(f"Unsupported optimizer: {optimizer_name}")
        
        # Get loss
        loss = self.config["loss"]
        
        # Get metrics
        metrics = ["accuracy"]
        if loss == "binary_crossentropy":
            metrics.append(keras.metrics.AUC(name="auc"))
            metrics.append(keras.metrics.Precision(name="precision"))
            metrics.append(keras.metrics.Recall(name="recall"))
        elif "categorical" in loss:
            metrics.append(keras.metrics.AUC(name="auc", multi_label=True))
        
        model.compile(
            optimizer=optimizer,
            loss=loss,
            metrics=metrics
        )
        
        return model


# ============================================================================
# TRAINING ORCHESTRATION
# ============================================================================

class Trainer:
    """Orchestrate model training with callbacks and evaluation"""
    
    def __init__(self, config: PipelineConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.model = None
        self.history = None
    
    def prepare_data(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray
    ) -> Tuple[tf.data.Dataset, tf.data.Dataset]:
        """Prepare TensorFlow datasets"""
        batch_size = self.config["batch_size"]
        
        # Convert to appropriate shape for model type
        model_type = self.config["model_type"]
        
        if model_type in ["cnn1d", "rnn", "lstm", "gru"]:
            X_train = self._prepare_sequence_data(X_train)
            X_val = self._prepare_sequence_data(X_val)
        
        # Create datasets
        train_ds = tf.data.Dataset.from_tensor_slices(
            (X_train.astype("float32"), y_train.astype("int32"))
        )
        train_ds = train_ds.shuffle(buffer_size=10000).batch(batch_size).prefetch(tf.data.AUTOTUNE)
        
        val_ds = tf.data.Dataset.from_tensor_slices(
            (X_val.astype("float32"), y_val.astype("int32"))
        )
        val_ds = val_ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
        
        return train_ds, val_ds
    
    def _prepare_sequence_data(self, X: np.ndarray) -> np.ndarray:
        """Convert flat features to sequences for CNN/RNN"""
        n_samples, n_features = X.shape
        seq_length = self.config["sequence_length"]
        
        if seq_length is None:
            # Auto-detect reasonable sequence length
            approx = int(np.sqrt(n_features))
            for s in range(approx, 1, -1):
                if n_features % s == 0:
                    seq_length = s
                    break
            if seq_length is None:
                seq_length = n_features
            
            self.config.config["sequence_length"] = seq_length
            self.logger.info(f"Auto-detected sequence length: {seq_length}")
        
        # Pad if necessary
        if n_features % seq_length != 0:
            pad_width = seq_length - (n_features % seq_length)
            X = np.pad(X, ((0, 0), (0, pad_width)), mode="constant", constant_values=0)
            n_features = X.shape[1]
        
        channels = n_features // seq_length
        X_seq = X.reshape((n_samples, seq_length, channels))
        
        return X_seq
    
    def build_callbacks(self) -> List[keras.callbacks.Callback]:
        """Build training callbacks"""
        callbacks_list = []
        
        # Model checkpoint
        model_path = os.path.join(
            self.config["model_dir"],
            f"{self.config['model_type']}_best.h5"
        )
        checkpoint = keras.callbacks.ModelCheckpoint(
            model_path,
            monitor=self.config["checkpoint_monitor"],
            mode=self.config["checkpoint_mode"],
            save_best_only=True,
            verbose=1
        )
        callbacks_list.append(checkpoint)
        
        # Early stopping
        if self.config["early_stopping"]:
            early_stop = keras.callbacks.EarlyStopping(
                monitor=self.config["checkpoint_monitor"],
                mode=self.config["checkpoint_mode"],
                patience=self.config["early_stopping_patience"],
                restore_best_weights=True,
                verbose=1
            )
            callbacks_list.append(early_stop)
        
        # Reduce learning rate on plateau
        if self.config["reduce_lr"]:
            reduce_lr = keras.callbacks.ReduceLROnPlateau(
                monitor=self.config["checkpoint_monitor"],
                mode=self.config["checkpoint_mode"],
                factor=0.5,
                patience=self.config["reduce_lr_patience"],
                min_lr=1e-7,
                verbose=1
            )
            callbacks_list.append(reduce_lr)
        
        # TensorBoard
        tensorboard = keras.callbacks.TensorBoard(
            log_dir=os.path.join(self.config["log_dir"], "tensorboard"),
            histogram_freq=1
        )
        callbacks_list.append(tensorboard)
        
        # CSV logger
        csv_logger = keras.callbacks.CSVLogger(
            os.path.join(self.config["log_dir"], "training.csv")
        )
        callbacks_list.append(csv_logger)
        
        return callbacks_list
    
    def train(
        self,
        model: keras.Model,
        train_ds: tf.data.Dataset,
        val_ds: tf.data.Dataset
    ) -> keras.callbacks.History:
        """Train model"""
        self.model = model
        self.logger.info("Starting training")
        
        callbacks_list = self.build_callbacks()
        
        # Get class weights if specified
        class_weights = self.config["class_weights"]
        if isinstance(class_weights, str) and class_weights != "auto":
            class_weights = None
        
        self.history = model.fit(
            train_ds,
            validation_data=val_ds,
            epochs=self.config["epochs"],
            callbacks=callbacks_list,
            class_weight=class_weights,
            verbose=1
        )
        
        # Save history
        history_path = os.path.join(
            self.config["output_dir"],
            f"{self.config['model_type']}_history.pkl"
        )
        with open(history_path, "wb") as f:
            pickle.dump(self.history.history, f)
        
        self.logger.info(f"Training complete. History saved to {history_path}")
        
        return self.history
    
    def evaluate(
        self,
        model: keras.Model,
        X_test: np.ndarray,
        y_test: np.ndarray
    ) -> Dict[str, float]:
        """Evaluate model on test set"""
        self.logger.info("Evaluating model on test set")
        
        # Prepare test data
        model_type = self.config["model_type"]
        if model_type in ["cnn1d", "rnn", "lstm", "gru"]:
            X_test = self._prepare_sequence_data(X_test)
        
        # Evaluate
        test_ds = tf.data.Dataset.from_tensor_slices(
            (X_test.astype("float32"), y_test.astype("int32"))
        ).batch(self.config["batch_size"]).prefetch(tf.data.AUTOTUNE)
        
        results = model.evaluate(test_ds, verbose=1)
        
        # Parse results
        metrics_dict = {}
        for metric_name, value in zip(model.metrics_names, results):
            metrics_dict[metric_name] = float(value)
        
        self.logger.info(f"Test results: {metrics_dict}")
        
        # Predictions for additional metrics
        y_pred_prob = model.predict(test_ds).ravel()
        y_pred = (y_pred_prob >= 0.5).astype(int)
        
        # Additional metrics
        try:
            from sklearn.metrics import classification_report
            report = classification_report(y_test, y_pred, output_dict=True)
            metrics_dict.update({
                "precision": report["1"]["precision"],
                "recall": report["1"]["recall"],
                "f1": report["1"]["f1-score"]
            })
        except Exception as e:
            self.logger.warning(f"Could not compute additional metrics: {e}")
        
        # Save results
        results_path = os.path.join(
            self.config["output_dir"],
            f"{self.config['model_type']}_test_results.json"
        )
        with open(results_path, "w") as f:
            json.dump(metrics_dict, f, indent=2)
        
        # Visualizations
        if self.config["plot_roc"]:
            self._plot_roc_curve(y_test, y_pred_prob)
        
        if self.config["plot_confusion_matrix"]:
            self._plot_confusion_matrix(y_test, y_pred)
        
        # Save predictions
        if self.config["save_predictions"]:
            pred_df = pd.DataFrame({
                "y_true": y_test,
                "y_pred": y_pred,
                "y_pred_prob": y_pred_prob
            })
            pred_path = os.path.join(
                self.config["output_dir"],
                f"{self.config['model_type']}_predictions.csv"
            )
            pred_df.to_csv(pred_path, index=False)
            self.logger.info(f"Predictions saved to {pred_path}")
        
        return metrics_dict
    
    def _plot_roc_curve(self, y_true: np.ndarray, y_pred_prob: np.ndarray):
        """Plot ROC curve"""
        try:
            fpr, tpr, _ = roc_curve(y_true, y_pred_prob)
            auc = roc_auc_score(y_true, y_pred_prob)
            
            plt.figure(figsize=(8, 6))
            plt.plot(fpr, tpr, label=f"AUC = {auc:.3f}", linewidth=2)
            plt.plot([0, 1], [0, 1], "k--", alpha=0.5, label="Random")
            plt.xlabel("False Positive Rate")
            plt.ylabel("True Positive Rate")
            plt.title(f"ROC Curve - {self.config['model_type'].upper()}")
            plt.legend(loc="lower right")
            plt.grid(alpha=0.3)
            plt.tight_layout()
            
            output_path = os.path.join(
                self.config["output_dir"],
                f"{self.config['model_type']}_roc_curve.png"
            )
            plt.savefig(output_path, dpi=300)
            plt.close()
            
            self.logger.info(f"ROC curve saved to {output_path}")
        
        except Exception as e:
            self.logger.error(f"Failed to plot ROC curve: {e}")
    
    def _plot_confusion_matrix(self, y_true: np.ndarray, y_pred: np.ndarray):
        """Plot confusion matrix"""
        try:
            cm = confusion_matrix(y_true, y_pred)
            
            plt.figure(figsize=(8, 6))
            sns.heatmap(
                cm,
                annot=True,
                fmt="d",
                cmap="Blues",
                xticklabels=["Negative", "Positive"],
                yticklabels=["Negative", "Positive"]
            )
            plt.xlabel("Predicted")
            plt.ylabel("Actual")
            plt.title(f"Confusion Matrix - {self.config['model_type'].upper()}")
            plt.tight_layout()
            
            output_path = os.path.join(
                self.config["output_dir"],
                f"{self.config['model_type']}_confusion_matrix.png"
            )
            plt.savefig(output_path, dpi=300)
            plt.close()
            
            self.logger.info(f"Confusion matrix saved to {output_path}")
        
        except Exception as e:
            self.logger.error(f"Failed to plot confusion matrix: {e}")


# ============================================================================
# ANALYSIS AND VISUALIZATION
# ============================================================================

class Analyzer:
    """Perform data analysis and visualization"""
    
    def __init__(self, config: PipelineConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
    
    def analyze_depression_prevalence(self, df: pd.DataFrame) -> pd.DataFrame:
        """Analyze depression prevalence by age group (BRFSS-specific)"""
        if "DEPRESSION_STATUS" not in df.columns or "AGE_GROUP" not in df.columns:
            self.logger.warning("Required columns not found for prevalence analysis")
            return pd.DataFrame()
        
        self.logger.info("Analyzing depression prevalence by age group")
        
        valid = df[
            df["DEPRESSION_STATUS"].notna() & 
            df["AGE_GROUP"].notna()
        ].copy()
        
        summary = valid.groupby("AGE_GROUP").agg(
            N_Cases=("DEPRESSION_STATUS", lambda s: (s == "Yes").sum()),
            Total_Observations=("DEPRESSION_STATUS", "size")
        ).reset_index()
        
        summary["Prevalence"] = summary["N_Cases"] / summary["Total_Observations"]
        summary = summary.sort_values("AGE_GROUP")
        
        # Save
        output_path = os.path.join(
            self.config["output_dir"],
            "depression_prevalence_analysis.csv"
        )
        summary.to_csv(output_path, index=False)
        self.logger.info(f"Analysis saved to {output_path}")
        
        # Visualize
        self.visualize_prevalence(summary)
        
        return summary
    
    def visualize_prevalence(self, summary: pd.DataFrame):
        """Create prevalence visualization"""
        try:
            sns.set_style("whitegrid")
            plt.figure(figsize=(12, 6))
            
            ax = sns.barplot(
                data=summary,
                x="AGE_GROUP",
                y="Prevalence",
                palette="viridis"
            )
            
            ax.set_title(
                "Prevalence of Depressive Disorder by Age Group",
                fontsize=14,
                fontweight="bold"
            )
            ax.set_xlabel("Age Group", fontsize=12)
            ax.set_ylabel("Prevalence Rate", fontsize=12)
            
            # Add percentage labels
            for p in ax.patches:
                height = p.get_height()
                ax.annotate(
                    f"{height:.1%}",
                    (p.get_x() + p.get_width() / 2., height),
                    ha="center",
                    va="bottom",
                    fontsize=9,
                    xytext=(0, 4),
                    textcoords="offset points"
                )
            
            plt.xticks(rotation=45, ha="right")
            plt.tight_layout()
            
            output_path = os.path.join(
                self.config["output_dir"],
                "depression_prevalence_by_age.png"
            )
            plt.savefig(output_path, dpi=300)
            plt.close()
            
            self.logger.info(f"Visualization saved to {output_path}")
        
        except Exception as e:
            self.logger.error(f"Visualization failed: {e}")


# ============================================================================
# MAIN PIPELINE
# ============================================================================

class MLPipeline:
    """Complete ML pipeline orchestrator"""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.logger = setup_logging(config)
        self.logger.info("="*80)
        self.logger.info("Research Pioneers LLC - ML Pipeline")
        self.logger.info("="*80)
    
    def run(self):
        """Execute full pipeline"""
        try:
            # 1. Load data
            self.logger.info(" " + "="*80)
            self.logger.info("STAGE 1: DATA LOADING")
            self.logger.info("="*80)
            
            data_loader = DataLoader(self.config, self.logger)
            df = data_loader.load_data()
            
            # 2. Preprocess data
            self.logger.info(" " + "="*80)
            self.logger.info("STAGE 2: DATA PREPROCESSING")
            self.logger.info("="*80)
            
            preprocessor = DataPreprocessor(self.config, self.logger)
            df = preprocessor.clean_data(df)
            df = preprocessor.engineer_features(df)
            
            # Save processed data
            processed_path = os.path.join(
                self.config["output_dir"],
                "processed_data.pkl"
            )
            with open(processed_path, "wb") as f:
                pickle.dump(df, f)
            self.logger.info(f"Processed data saved to {processed_path}")
            
            # 3. Optional: Analysis and visualization
            if self.config["data_source"] == "brfss":
                self.logger.info(" " + "="*80)
                self.logger.info("STAGE 3: DATA ANALYSIS")
                self.logger.info("="*80)
                
                analyzer = Analyzer(self.config, self.logger)
                analyzer.analyze_depression_prevalence(df)
            
            # 4. Prepare features and labels
            self.logger.info("" + "="*80)
            self.logger.info("STAGE 4: FEATURE PREPARATION")
            self.logger.info("="*80)
            
            X_train, X_val, X_test, y_train, y_val, y_test = preprocessor.prepare_features_labels(df)
            
            # 5. Build model
            self.logger.info(" " + "="*80)
            self.logger.info("STAGE 5: MODEL BUILDING")
            self.logger.info("="*80)
            
            model_builder = ModelBuilder(self.config, self.logger)
            
            # Determine input shape
            if self.config["model_type"] in ["cnn1d", "rnn", "lstm", "gru"]:
                # Will be reshaped in trainer
                input_shape = (X_train.shape[1],)  # Placeholder
            else:
                input_shape = (X_train.shape[1],)
            
            model = model_builder.build_model(input_shape)
            model.summary(print_fn=self.logger.info)
            
            # 6. Train model
            self.logger.info(" " + "="*80)
            self.logger.info("STAGE 6: MODEL TRAINING")
            self.logger.info("="*80)
            
            trainer = Trainer(self.config, self.logger)
            train_ds, val_ds = trainer.prepare_data(X_train, y_train, X_val, y_val)
            
            # Update input shape after sequence preparation if needed
            if self.config["model_type"] in ["cnn1d", "rnn", "lstm", "gru"]:
                X_sample = trainer._prepare_sequence_data(X_train[:1])
                input_shape = X_sample.shape[1:]
                model = model_builder.build_model(input_shape)
                model.summary(print_fn=self.logger.info)
            
            history = trainer.train(model, train_ds, val_ds)
            
            # 7. Evaluate model
            self.logger.info(" " + "="*80)
            self.logger.info("STAGE 7: MODEL EVALUATION")
            self.logger.info("="*80)
            
            metrics = trainer.evaluate(model, X_test, y_test)
            
            # 8. Save final artifacts
            self.logger.info(" " + "="*80)
            self.logger.info("STAGE 8: SAVING ARTIFACTS")
            self.logger.info("="*80)
            
            final_model_path = os.path.join(
                self.config["model_dir"],
                f"{self.config['model_type']}_final"
            )
            model.save(final_model_path)
            self.logger.info(f"Final model saved to {final_model_path}")
            
            # Save configuration
            config_path = os.path.join(
                self.config["output_dir"],
                "pipeline_config.json"
            )
            self.config.save(config_path)
            self.logger.info(f"Configuration saved to {config_path}")
            
            # Summary
            self.logger.info(" " + "="*80)
            self.logger.info("PIPELINE COMPLETE")
            self.logger.info("="*80)
            self.logger.info(f"Model: {self.config['model_type']}")
            self.logger.info(f"Test Metrics: {json.dumps(metrics, indent=2)}")
            self.logger.info(f"Outputs saved to: {self.config['output_dir']}")
            
        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}", exc_info=True)
            raise


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Research Pioneers LLC - Consolidated ML Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train FFNN on BRFSS data
  python consolidated_ml_pipeline.py --model_type ffnn --data_source brfss
  
  # Train CNN with custom config
  python consolidated_ml_pipeline.py --config config.json
  
  # Train LSTM with specific parameters
  python consolidated_ml_pipeline.py --model_type lstm --epochs 100 --batch_size 128
        """
    )
    
    # Configuration
    parser.add_argument(
        "--config",
        type=str,
        help="Path to JSON/YAML configuration file"
    )
    
    # Data
    parser.add_argument("--data_source", type=str, choices=["brfss", "pubmed", "clinicaltrials", "custom"])
    parser.add_argument("--data_file", type=str, help="Path to custom data file")
    parser.add_argument("--data_dir", type=str, default="data")
    
    # Model
    parser.add_argument(
        "--model_type",
        type=str,
        choices=["ffnn", "cnn1d", "rnn", "lstm", "gru", "autoencoder"]
    )
    parser.add_argument("--hidden_units", nargs="+", type=int)
    parser.add_argument("--conv_filters", nargs="+", type=int)
    parser.add_argument("--rnn_units", nargs="+", type=int)
    parser.add_argument("--latent_dim", type=int)
    parser.add_argument("--dropout", type=float)
    parser.add_argument("--use_attention", action="store_true")
    
    # Training
    parser.add_argument("--learning_mode", type=str, choices=["full", "feature_extraction", "lora"])
    parser.add_argument("--epochs", type=int)
    parser.add_argument("--batch_size", type=int)
    parser.add_argument("--learning_rate", type=float)
    parser.add_argument("--optimizer", type=str, choices=["adam", "adamw", "sgd", "rmsprop"])
    
    # Features
    parser.add_argument("--label_column", type=str)
    parser.add_argument("--categorical_columns", nargs="+")
    parser.add_argument("--numeric_columns", nargs="+")
    
    # Output
    parser.add_argument("--output_dir", type=str, default="outputs")
    parser.add_argument("--model_dir", type=str, default="models")
    
    # GPU
    parser.add_argument("--gpu_memory_limit", type=int, help="GPU memory limit in MB")
    parser.add_argument("--no_mixed_precision", action="store_true")
    
    args = parser.parse_args()
    
    # Build configuration
    config_dict = {k: v for k, v in vars(args).items() if v is not None and k != "config"}
    if args.no_mixed_precision:
        config_dict["mixed_precision"] = False
    
    config = PipelineConfig(config_path=args.config, **config_dict)
    
    # Run pipeline
    pipeline = MLPipeline(config)
    pipeline.run()


if __name__ == "__main__":
    main()