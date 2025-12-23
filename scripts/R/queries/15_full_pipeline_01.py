import os
import sys
import json
import argparse
import logging
from typing import Dict, List, Optional, Tuple, Any, Union
from pathlib import Path
import warnings

import numpy as np
import pandas as pd
import pickle
import joblib
from dataclasses import dataclass, field, asdict

# ML/DL libraries
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks, optimizers
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    roc_auc_score, roc_curve, accuracy_score, 
    precision_recall_fscore_support, classification_report
)

# Data acquisition libraries
import requests
import zipfile
import io

# Optional imports with graceful degradation
try:
    import pyreadstat
    HAS_PYREADSTAT = True
except ImportError:
    HAS_PYREADSTAT = False
    warnings.warn("pyreadstat not available. SAS XPT files cannot be read.")

try:
    from Bio import Entrez
    HAS_BIOPYTHON = True
except ImportError:
    HAS_BIOPYTHON = False
    warnings.warn("Biopython not available. PubMed queries disabled.")

try:
    import gseapy as gp
    from bioservices import KEGG
    from mygene import MyGeneInfo
    HAS_PATHWAY_TOOLS = True
except ImportError:
    HAS_PATHWAY_TOOLS = False
    warnings.warn("Pathway analysis tools not available.")

try:
    import matplotlib.pyplot as plt
    import seaborn as sns
    HAS_PLOTTING = True
except ImportError:
    HAS_PLOTTING = False
    warnings.warn("Plotting libraries not available. Visualization disabled.")


# ============================================================================
# CONFIGURATION MANAGEMENT
# ============================================================================

@dataclass
class DataConfig:
    """Configuration for data loading and processing."""
    source_type: str = "brfss"  # brfss, csv, parquet, custom
    data_url: Optional[str] = None
    data_dir: str = "data"
    raw_file: Optional[str] = None
    processed_file: str = "processed_data.pkl"
    
    # Column specifications
    label_col: str = "DEPRESSION_STATUS"
    categorical_cols: List[str] = field(default_factory=lambda: ["AGE_GROUP", "SEX_LABEL", "FMD_INDICATOR_LABEL"])
    numeric_cols: List[str] = field(default_factory=lambda: ["MENTHLTH"])
    
    # Data cleaning parameters
    missing_value_codes: Dict[str, List[int]] = field(default_factory=lambda: {
        "MENTHLTH": [77, 99],
        "ADDEPEV3": [7, 9]
    })
    
    # Splitting
    test_size: float = 0.2
    val_size: float = 0.2
    random_state: int = 42
    stratify: bool = True


@dataclass
class ModelConfig:
    """Configuration for model architecture and training."""
    model_type: str = "ffnn"  # ffnn, cnn1d, rnn, autoencoder, knn
    
    # Architecture parameters
    hidden_units: List[int] = field(default_factory=lambda: [128, 64])
    dropout: float = 0.3
    batch_norm: bool = True
    
    # CNN-specific
    conv_filters: List[int] = field(default_factory=lambda: [32, 64])
    kernel_size: int = 3
    pool_size: int = 2
    seq_length: Optional[int] = None
    
    # RNN-specific
    rnn_type: str = "lstm"  # lstm, gru
    rnn_units: List[int] = field(default_factory=lambda: [64, 32])
    bidirectional: bool = False
    
    # Autoencoder-specific
    encoding_dim: int = 32
    decoder_units: List[int] = field(default_factory=lambda: [64, 128])
    
    # Training parameters
    learning_rate: float = 1e-3
    batch_size: int = 64
    epochs: int = 50
    early_stopping_patience: int = 8
    
    # Advanced training
    use_class_weights: bool = False
    optimizer: str = "adam"  # adam, sgd, rmsprop
    loss: str = "binary_crossentropy"  # binary_crossentropy, focal_loss
    
    # Output paths
    model_save_path: str = "model_best.h5"
    history_save_path: str = "training_history.pkl"
    encoders_save_path: str = "encoders.pkl"


@dataclass
class ExternalDataConfig:
    """Configuration for external data sources."""
    # PubMed
    pubmed_email: str = "user@example.com"
    pubmed_search_term: Optional[str] = None
    pubmed_max_results: int = 100
    
    # ClinicalTrials
    clinicaltrials_search_term: Optional[str] = None
    clinicaltrials_max_studies: int = 20
    
    # Pathway analysis
    gene_symbols: List[str] = field(default_factory=list)
    organism: str = "Human"
    kegg_pathway_id: Optional[str] = None


@dataclass
class PipelineConfig:
    """Master configuration for the entire pipeline."""
    data: DataConfig = field(default_factory=DataConfig)
    model: ModelConfig = field(default_factory=ModelConfig)
    external: ExternalDataConfig = field(default_factory=ExternalDataConfig)
    
    # Pipeline control
    mode: str = "train"  # train, evaluate, predict, analyze, fetch_external
    log_level: str = "INFO"
    output_dir: str = "outputs"
    seed: int = 42
    use_gpu: bool = True
    gpu_memory_limit: Optional[int] = 15000  # MB
    
    @classmethod
    def from_json(cls, json_path: str) -> 'PipelineConfig':
        """Load configuration from JSON file."""
        with open(json_path, 'r') as f:
            config_dict = json.load(f)
        return cls(
            data=DataConfig(**config_dict.get('data', {})),
            model=ModelConfig(**config_dict.get('model', {})),
            external=ExternalDataConfig(**config_dict.get('external', {})),
            **{k: v for k, v in config_dict.items() if k not in ['data', 'model', 'external']}
        )
    
    def to_json(self, json_path: str):
        """Save configuration to JSON file."""
        config_dict = {
            'data': asdict(self.data),
            'model': asdict(self.model),
            'external': asdict(self.external),
            'mode': self.mode,
            'log_level': self.log_level,
            'output_dir': self.output_dir,
            'seed': self.seed,
            'use_gpu': self.use_gpu,
            'gpu_memory_limit': self.gpu_memory_limit
        }
        with open(json_path, 'w') as f:
            json.dump(config_dict, f, indent=2)


# ============================================================================
# LOGGING SETUP
# ============================================================================

def setup_logging(log_level: str = "INFO", log_file: Optional[str] = None):
    """Configure logging for the pipeline."""
    handlers = [logging.StreamHandler(sys.stdout)]
    if log_file:
        handlers.append(logging.FileHandler(log_file))
    
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=handlers
    )
    return logging.getLogger(__name__)


# ============================================================================
# GPU CONFIGURATION
# ============================================================================

def configure_gpu(use_gpu: bool = True, memory_limit: Optional[int] = None):
    """Configure GPU settings for TensorFlow."""
    if not use_gpu:
        tf.config.set_visible_devices([], 'GPU')
        logging.info("GPU disabled. Using CPU only.")
        return
    
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        try:
            for gpu in gpus:
                if memory_limit:
                    tf.config.set_logical_device_configuration(
                        gpu,
                        [tf.config.LogicalDeviceConfiguration(memory_limit=memory_limit)]
                    )
                else:
                    tf.config.experimental.set_memory_growth(gpu, True)
            logging.info(f"Configured {len(gpus)} GPU(s) with memory_limit={memory_limit}")
        except RuntimeError as e:
            logging.error(f"GPU configuration error: {e}")
    else:
        logging.warning("No GPUs found. Using CPU.")


# ============================================================================
# DATA LOADING MODULE
# ============================================================================

class DataLoader:
    """Unified data loading interface supporting multiple sources."""
    
    def __init__(self, config: DataConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        os.makedirs(config.data_dir, exist_ok=True)
    
    def load(self) -> pd.DataFrame:
        """Load data based on source_type."""
        self.logger.info(f"Loading data from source: {self.config.source_type}")
        
        if self.config.source_type == "brfss":
            return self._load_brfss()
        elif self.config.source_type == "csv":
            return self._load_csv()
        elif self.config.source_type == "parquet":
            return self._load_parquet()
        elif self.config.source_type == "pickle":
            return self._load_pickle()
        else:
            raise ValueError(f"Unsupported source_type: {self.config.source_type}")
    
    def _load_brfss(self) -> pd.DataFrame:
        """Load BRFSS data from CDC."""
        if not HAS_PYREADSTAT:
            raise ImportError("pyreadstat is required for BRFSS data. Install with: pip install pyreadstat")
        
        url = self.config.data_url or "https://www.cdc.gov/brfss/annual_data/2022/files/LLCP2022XPT.zip"
        zip_path = os.path.join(self.config.data_dir, "LLCP2022XPT.zip")
        xpt_filename = "LLCP2022.XPT"
        xpt_path = os.path.join(self.config.data_dir, xpt_filename)
        
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
            except requests.RequestException as e:
                raise RuntimeError(f"Failed to download BRFSS data: {e}")
        
        # Extract if needed
        if not os.path.exists(xpt_path):
            self.logger.info(f"Extracting {zip_path}")
            try:
                with zipfile.ZipFile(zip_path, "r") as z:
                    members = z.namelist()
                    xpt_file = next((m for m in members if m.upper().endswith(".XPT")), None)
                    if not xpt_file:
                        raise FileNotFoundError("No .XPT file found in archive")
                    z.extract(xpt_file, path=self.config.data_dir)
                    extracted_path = os.path.join(self.config.data_dir, xpt_file)
                    if os.path.basename(extracted_path) != xpt_filename:
                        os.replace(extracted_path, xpt_path)
                self.logger.info("Extraction complete")
            except (zipfile.BadZipFile, OSError) as e:
                raise RuntimeError(f"Failed to extract BRFSS data: {e}")
        
        # Load XPT
        self.logger.info(f"Reading XPT file: {xpt_path}")
        try:
            df, meta = pyreadstat.read_xport(xpt_path)
            return pd.DataFrame(df)
        except Exception as e:
            raise RuntimeError(f"Failed to read XPT file: {e}")
    
    def _load_csv(self) -> pd.DataFrame:
        """Load CSV file."""
        file_path = self.config.raw_file
        if not file_path:
            raise ValueError("raw_file must be specified for CSV source")
        self.logger.info(f"Loading CSV from {file_path}")
        try:
            return pd.read_csv(file_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load CSV: {e}")
    
    def _load_parquet(self) -> pd.DataFrame:
        """Load Parquet file."""
        file_path = self.config.raw_file
        if not file_path:
            raise ValueError("raw_file must be specified for Parquet source")
        self.logger.info(f"Loading Parquet from {file_path}")
        try:
            return pd.read_parquet(file_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load Parquet: {e}")
    
    def _load_pickle(self) -> pd.DataFrame:
        """Load pickled DataFrame."""
        file_path = self.config.processed_file
        self.logger.info(f"Loading pickle from {file_path}")
        try:
            with open(file_path, "rb") as f:
                return pickle.load(f)
        except Exception as e:
            raise RuntimeError(f"Failed to load pickle: {e}")


# ============================================================================
# DATA PROCESSING MODULE
# ============================================================================

class DataProcessor:
    """Unified data cleaning and feature engineering."""
    
    def __init__(self, config: DataConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
    
    def process(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply cleaning and feature engineering pipeline."""
        self.logger.info("Starting data processing pipeline")
        df = self._clean_data(df)
        df = self._engineer_features(df)
        self._save_processed(df)
        return df
    
    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean raw data by handling missing values and special codes."""
        self.logger.info("Cleaning data")
        df = df.copy()
        
        # Replace special missing codes with NaN
        for col, codes in self.config.missing_value_codes.items():
            if col in df.columns:
                df[col] = df[col].replace(codes, np.nan)
                self.logger.debug(f"Replaced codes {codes} with NaN in {col}")
        
        return df
    
    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create derived features (BRFSS-specific logic)."""
        self.logger.info("Engineering features")
        df = df.copy()
        
        # BRFSS-specific transformations
        if "_AGEG5YR" in df.columns and "AGE_GROUP" not in df.columns:
            age_labels = ["18-24", "25-29", "30-34", "35-39", "40-44", "45-49", 
                          "50-54", "55-59", "60-64", "65-69", "70-74", "75-79", "80+"]
            df["AGE_GROUP"] = pd.Categorical(
                df["_AGEG5YR"].replace({i+1: age_labels[i] for i in range(len(age_labels))}),
                categories=age_labels,
                ordered=True
            )
        
        if "SEXVAR" in df.columns and "SEX_LABEL" not in df.columns:
            df["SEX_LABEL"] = df["SEXVAR"].replace({1: "Male", 2: "Female"})
            df["SEX_LABEL"] = pd.Categorical(df["SEX_LABEL"], categories=["Male", "Female"])
        
        if "ADDEPEV3" in df.columns and "DEPRESSION_STATUS" not in df.columns:
            df["DEPRESSION_STATUS"] = df["ADDEPEV3"].replace({1: "Yes", 2: "No"})
            df["DEPRESSION_STATUS"] = pd.Categorical(df["DEPRESSION_STATUS"], categories=["Yes", "No"])
        
        if "MENTHLTH" in df.columns and "FMD_INDICATOR_LABEL" not in df.columns:
            df["MENTHLTH"] = df["MENTHLTH"].replace({88: 0})
            df["FMD_INDICATOR"] = pd.NA
            df.loc[df["MENTHLTH"].notna() & (df["MENTHLTH"] >= 14), "FMD_INDICATOR"] = 1
            df.loc[df["MENTHLTH"].notna() & (df["MENTHLTH"] < 14), "FMD_INDICATOR"] = 0
            df["FMD_INDICATOR_LABEL"] = pd.Categorical(
                df["FMD_INDICATOR"].astype("Int64").replace({0: "No FMD", 1: "Frequent Mental Distress"})
            )
        
        return df
    
    def _save_processed(self, df: pd.DataFrame):
        """Save processed DataFrame."""
        save_path = self.config.processed_file
        self.logger.info(f"Saving processed data to {save_path}")
        try:
            with open(save_path, "wb") as f:
                pickle.dump(df, f)
        except Exception as e:
            self.logger.error(f"Failed to save processed data: {e}")


# ============================================================================
# FEATURE ENCODING MODULE
# ============================================================================

class FeatureEncoder:
    """Handle feature encoding, scaling, and train/test splitting."""
    
    def __init__(self, config: DataConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.encoders = {}
    
    def fit_transform(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray, 
                                                         np.ndarray, np.ndarray, np.ndarray]:
        """Encode features and split into train/val/test sets."""
        self.logger.info("Encoding features and splitting data")
        
        # Remove rows with missing labels
        df = df[df[self.config.label_col].notna()].copy()
        self.logger.info(f"Dataset size after removing missing labels: {len(df)}")
        
        if len(df) == 0:
            raise ValueError("No valid samples remaining after filtering")
        
        # Encode labels
        y = self._encode_labels(df)
        
        # Encode features
        X = self._encode_features(df)
        
        # Split data
        X_train, X_val, X_test, y_train, y_val, y_test = self._split_data(X, y)
        
        # Save encoders
        self._save_encoders()
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transform new data using fitted encoders."""
        self.logger.info("Transforming new data")
        return self._encode_features(df, fit=False)
    
    def _encode_labels(self, df: pd.DataFrame) -> np.ndarray:
        """Encode target labels."""
        label_col = self.config.label_col
        
        # Binary classification mapping
        label_map = {"Yes": 1, "No": 0, 1: 1, 2: 0}
        
        if df[label_col].dtype.name == "category" or df[label_col].dtype == object:
            y = df[label_col].map(label_map)
        else:
            y = df[label_col].replace(label_map)
        
        y = y.fillna(-1).astype(int).values
        
        if np.any(y == -1):
            raise ValueError("Unable to encode all labels. Check label_map.")
        
        self.encoders['label_map'] = label_map
        self.logger.info(f"Encoded labels. Class distribution: {np.bincount(y)}")
        return y
    
    def _encode_features(self, df: pd.DataFrame, fit: bool = True) -> np.ndarray:
        """Encode categorical and numerical features."""
        # Categorical encoding
        cat_cols = [c for c in self.config.categorical_cols if c in df.columns]
        if cat_cols:
            cat_df = df[cat_cols].fillna("MISSING").astype(str)
            if fit:
                self.encoders['cat_encoder'] = OneHotEncoder(sparse=False, handle_unknown="ignore")
                X_cat = self.encoders['cat_encoder'].fit_transform(cat_df)
                self.logger.info(f"Fitted categorical encoder on {len(cat_cols)} columns -> {X_cat.shape[1]} features")
            else:
                X_cat = self.encoders['cat_encoder'].transform(cat_df)
        else:
            X_cat = np.empty((len(df), 0))
        
        # Numerical encoding
        num_cols = [c for c in self.config.numeric_cols if c in df.columns]
        if num_cols:
            num_df = df[num_cols].copy()
            if fit:
                self.encoders['num_imputer'] = SimpleImputer(strategy="median")
                X_num_imputed = self.encoders['num_imputer'].fit_transform(num_df)
                self.encoders['num_scaler'] = StandardScaler()
                X_num = self.encoders['num_scaler'].fit_transform(X_num_imputed)
                self.logger.info(f"Fitted numerical encoder on {len(num_cols)} columns")
            else:
                X_num_imputed = self.encoders['num_imputer'].transform(num_df)
                X_num = self.encoders['num_scaler'].transform(X_num_imputed)
        else:
            X_num = np.empty((len(df), 0))
        
        # Combine
        X = np.hstack([X_num, X_cat])
        self.logger.info(f"Total feature dimension: {X.shape[1]}")
        return X
    
    def _split_data(self, X: np.ndarray, y: np.ndarray) -> Tuple:
        """Split into train/val/test sets."""
        test_size = self.config.test_size
        val_size = self.config.val_size
        random_state = self.config.random_state
        stratify_y = y if self.config.stratify else None
        
        # First split: separate test set
        X_trainval, X_test, y_trainval, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify_y
        )
        
        # Second split: separate validation set from training
        stratify_trainval = y_trainval if self.config.stratify else None
        X_train, X_val, y_train, y_val = train_test_split(
            X_trainval, y_trainval, test_size=val_size, random_state=random_state, stratify=stratify_trainval
        )
        
        self.logger.info(f"Data split - Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def _save_encoders(self):
        """Save encoders for later use."""
        save_path = self.config.processed_file.replace(".pkl", "_encoders.pkl")
        self.logger.info(f"Saving encoders to {save_path}")
        try:
            with open(save_path, "wb") as f:
                pickle.dump(self.encoders, f)
        except Exception as e:
            self.logger.error(f"Failed to save encoders: {e}")
    
    def load_encoders(self, path: Optional[str] = None):
        """Load pre-fitted encoders."""
        if path is None:
            path = self.config.processed_file.replace(".pkl", "_encoders.pkl")
        self.logger.info(f"Loading encoders from {path}")
        try:
            with open(path, "rb") as f:
                self.encoders = pickle.load(f)
        except Exception as e:
            raise RuntimeError(f"Failed to load encoders: {e}")


# ============================================================================
# MODEL BUILDING MODULE
# ============================================================================

class ModelBuilder:
    """Factory for creating different model architectures."""
    
    def __init__(self, config: ModelConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
    
    def build(self, input_shape: Union[int, Tuple]) -> tf.keras.Model:
        """Build model based on model_type."""
        model_type = self.config.model_type.lower()
        self.logger.info(f"Building {model_type} model with input_shape={input_shape}")
        
        if model_type == "ffnn":
            return self._build_ffnn(input_shape)
        elif model_type == "cnn1d" or model_type == "cnn":
            return self._build_cnn1d(input_shape)
        elif model_type == "rnn" or model_type == "lstm" or model_type == "gru":
            return self._build_rnn(input_shape)
        elif model_type == "autoencoder":
            return self._build_autoencoder(input_shape)
        else:
            raise ValueError(f"Unsupported model_type: {model_type}")
    
    def _build_ffnn(self, input_dim: int) -> tf.keras.Model:
        """Build feedforward neural network."""
        inputs = layers.Input(shape=(input_dim,), name="input")
        x = inputs
        
        for i, units in enumerate(self.config.hidden_units):
            x = layers.Dense(units, activation="relu", name=f"dense_{i}")(x)
            if self.config.batch_norm:
                x = layers.BatchNormalization(name=f"bn_{i}")(x)
            if self.config.dropout > 0:
                x = layers.Dropout(self.config.dropout, name=f"dropout_{i}")(x)
        
        outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
        model = models.Model(inputs, outputs, name="FFNN")
        
        self._compile_model(model)
        return model
    
    def _build_cnn1d(self, input_shape: Tuple) -> tf.keras.Model:
        """Build 1D convolutional neural network."""
        inputs = layers.Input(shape=input_shape, name="input")
        x = inputs
        
        for i, filters in enumerate(self.config.conv_filters):
            x = layers.Conv1D(
                filters=filters,
                kernel_size=self.config.kernel_size,
                activation="relu",
                padding="same",
                name=f"conv1d_{i}"
            )(x)
            if self.config.batch_norm:
                x = layers.BatchNormalization(name=f"bn_{i}")(x)
            x = layers.MaxPooling1D(pool_size=self.config.pool_size, name=f"pool_{i}")(x)
        
        x = layers.Flatten(name="flatten")(x)
        
        for i, units in enumerate(self.config.hidden_units):
            x = layers.Dense(units, activation="relu", name=f"dense_{i}")(x)
            if self.config.dropout > 0:
                x = layers.Dropout(self.config.dropout, name=f"dropout_{i}")(x)
        
        outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
        model = models.Model(inputs, outputs, name="CNN1D")
        
        self._compile_model(model)
        return model
    
    def _build_rnn(self, input_shape: Tuple) -> tf.keras.Model:
        """Build recurrent neural network (LSTM/GRU)."""
        inputs = layers.Input(shape=input_shape, name="input")
        x = inputs
        
        rnn_layer = layers.LSTM if self.config.rnn_type.lower() == "lstm" else layers.GRU
        
        for i, units in enumerate(self.config.rnn_units):
            return_sequences = i < len(self.config.rnn_units) - 1
            
            if self.config.bidirectional:
                x = layers.Bidirectional(
                    rnn_layer(units, return_sequences=return_sequences, name=f"rnn_{i}"),
                    name=f"bi_rnn_{i}"
                )(x)
            else:
                x = rnn_layer(units, return_sequences=return_sequences, name=f"rnn_{i}")(x)
            
            if self.config.dropout > 0 and return_sequences:
                x = layers.Dropout(self.config.dropout, name=f"dropout_{i}")(x)
        
        if self.config.dropout > 0:
            x = layers.Dropout(self.config.dropout, name="final_dropout")(x)
        
        outputs = layers.Dense(1, activation="sigmoid", name="output")(x)
        model = models.Model(inputs, outputs, name=f"{self.config.rnn_type.upper()}")
        
        self._compile_model(model)
        return model
    
    def _build_autoencoder(self, input_dim: int) -> tf.keras.Model:
        """Build autoencoder for unsupervised feature learning."""
        # Encoder
        encoder_input = layers.Input(shape=(input_dim,), name="encoder_input")
        x = encoder_input
        
        encoder_units = self.config.hidden_units
        for i, units in enumerate(encoder_units):
            x = layers.Dense(units, activation="relu", name=f"encoder_{i}")(x)
            if self.config.batch_norm:
                x = layers.BatchNormalization(name=f"encoder_bn_{i}")(x)
        
        encoded = layers.Dense(self.config.encoding_dim, activation="relu", name="encoded")(x)
        
        # Decoder
        x = encoded
        decoder_units = self.config.decoder_units or list(reversed(encoder_units))
        
        for i, units in enumerate(decoder_units):
            x = layers.Dense(units, activation="relu", name=f"decoder_{i}")(x)
            if self.config.batch_norm:
                x = layers.BatchNormalization(name=f"decoder_bn_{i}")(x)
        
        decoded = layers.Dense(input_dim, activation="sigmoid", name="decoded")(x)
        
        # Full autoencoder
        autoencoder = models.Model(encoder_input, decoded, name="Autoencoder")
        autoencoder.compile(
            optimizer=self._get_optimizer(),
            loss="mse",
            metrics=["mae"]
        )
        
        # Encoder model for extracting features
        encoder = models.Model(encoder_input, encoded, name="Encoder")
        
        return autoencoder  # Can extend to return both if needed
    
    def _compile_model(self, model: tf.keras.Model):
        """Compile model with optimizer and loss."""
        optimizer = self._get_optimizer()
        loss = self._get_loss()
        metrics = ["accuracy", tf.keras.metrics.AUC(name="auc")]
        
        model.compile(optimizer=optimizer, loss=loss, metrics=metrics)
    
    def _get_optimizer(self) -> tf.keras.optimizers.Optimizer:
        """Get optimizer instance."""
        opt_name = self.config.optimizer.lower()
        lr = self.config.learning_rate
        
        if opt_name == "adam":
            return optimizers.Adam(learning_rate=lr)
        elif opt_name == "sgd":
            return optimizers.SGD(learning_rate=lr, momentum=0.9)
        elif opt_name == "rmsprop":
            return optimizers.RMSprop(learning_rate=lr)
        else:
            self.logger.warning(f"Unknown optimizer {opt_name}, defaulting to Adam")
            return optimizers.Adam(learning_rate=lr)
    
    def _get_loss(self) -> Union[str, tf.keras.losses.Loss]:
        """Get loss function."""
        loss_name = self.config.loss.lower()
        
        if loss_name == "binary_crossentropy":
            return "binary_crossentropy"
        elif loss_name == "focal_loss":
            # Simple focal loss implementation
            def focal_loss(y_true, y_pred, alpha=0.25, gamma=2.0):
                bce = tf.keras.losses.binary_crossentropy(y_true, y_pred)
                p_t = (y_true * y_pred) + ((1 - y_true) * (1 - y_pred))
                alpha_factor = y_true * alpha + (1 - y_true) * (1 - alpha)
                modulating_factor = tf.pow(1.0 - p_t, gamma)
                return tf.reduce_mean(alpha_factor * modulating_factor * bce)
            return focal_loss
        else:
            self.logger.warning(f"Unknown loss {loss_name}, defaulting to binary_crossentropy")
            return "binary_crossentropy"


# ============================================================================
# DATA TRANSFORMATION FOR MODEL-SPECIFIC INPUT
# ============================================================================

class DataTransformer:
    """Transform data for specific model architectures."""
    
    @staticmethod
    def to_sequences(X: np.ndarray, seq_length: Optional[int] = None) -> np.ndarray:
        """Convert flat features to sequences for RNN/CNN models."""
        n_samples, n_features = X.shape
        
        if seq_length is None:
            # Auto-determine seq_length
            approx = int(np.sqrt(n_features))
            seq_length = max(1, approx)
            for s in range(approx, 0, -1):
                if n_features % s == 0:
                    seq_length = s
                    break
        
        # Pad if necessary
        if n_features % seq_length != 0:
            pad_width = seq_length - (n_features % seq_length)
            X = np.pad(X, ((0, 0), (0, pad_width)), mode='constant', constant_values=0)
            n_features = X.shape[1]
        
        channels = n_features // seq_length
        X_seq = X.reshape((n_samples, seq_length, channels))
        
        return X_seq
    
    @staticmethod
    def create_tf_dataset(X: np.ndarray, y: np.ndarray, batch_size: int = 64, 
                          shuffle: bool = True, buffer_size: int = 10000) -> tf.data.Dataset:
        """Create optimized TensorFlow dataset."""
        ds = tf.data.Dataset.from_tensor_slices((
            X.astype("float32"),
            y.astype("int32")
        ))
        
        if shuffle:
            ds = ds.shuffle(buffer_size, reshuffle_each_iteration=True)
        
        ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
        return ds


# ============================================================================
# TRAINING MODULE
# ============================================================================

class ModelTrainer:
    """Unified training interface."""
    
    def __init__(self, config: ModelConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self.model = None
        self.history = None
    
    def train(self, model: tf.keras.Model, train_ds: tf.data.Dataset, 
              val_ds: tf.data.Dataset) -> tf.keras.callbacks.History:
        """Train model with callbacks."""
        self.model = model
        self.logger.info("Starting training")
        
        model.summary(print_fn=lambda x: self.logger.info(x))
        
        callbacks_list = self._get_callbacks()
        
        try:
            self.history = model.fit(
                train_ds,
                validation_data=val_ds,
                epochs=self.config.epochs,
                callbacks=callbacks_list,
                verbose=1
            )
            self.logger.info("Training completed")
        except KeyboardInterrupt:
            self.logger.warning("Training interrupted by user")
        except Exception as e:
            self.logger.error(f"Training failed: {e}")
            raise
        
        return self.history
    
    def _get_callbacks(self) -> List[tf.keras.callbacks.Callback]:
        """Create training callbacks."""
        callbacks_list = []
        
        # Model checkpoint
        checkpoint_path = self.config.model_save_path
        os.makedirs(os.path.dirname(checkpoint_path) or ".", exist_ok=True)
        callbacks_list.append(
            callbacks.ModelCheckpoint(
                checkpoint_path,
                monitor="val_auc",
                mode="max",
                save_best_only=True,
                verbose=1
            )
        )
        
        # Early stopping
        callbacks_list.append(
            callbacks.EarlyStopping(
                monitor="val_auc",
                mode="max",
                patience=self.config.early_stopping_patience,
                restore_best_weights=True,
                verbose=1
            )
        )
        
        # Learning rate reduction
        callbacks_list.append(
            callbacks.ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            )
        )
        
        # TensorBoard (optional)
        log_dir = os.path.join("logs", self.config.model_type)
        callbacks_list.append(
            callbacks.TensorBoard(
                log_dir=log_dir,
                histogram_freq=1,
                write_graph=True
            )
        )
        
        return callbacks_list
    
    def save_history(self):
        """Save training history."""
        if self.history is None:
            self.logger.warning("No training history to save")
            return
        
        history_path = self.config.history_save_path
        self.logger.info(f"Saving training history to {history_path}")
        try:
            joblib.dump(self.history.history, history_path)
        except Exception as e:
            self.logger.error(f"Failed to save history: {e}")


# ============================================================================
# EVALUATION MODULE
# ============================================================================

class ModelEvaluator:
    """Model evaluation and metrics computation."""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def evaluate(self, model: tf.keras.Model, test_ds: tf.data.Dataset, 
                 y_test: np.ndarray, output_dir: str = "outputs") -> Dict[str, float]:
        """Evaluate model and generate reports."""
        self.logger.info("Evaluating model")
        
        # Get predictions
        y_pred_proba = model.predict(test_ds).ravel()
        y_pred = (y_pred_proba >= 0.5).astype(int)
        
        # Compute metrics
        metrics = self._compute_metrics(y_test, y_pred, y_pred_proba)
        
        # Log metrics
        self.logger.info("Test Metrics:")
        for name, value in metrics.items():
            self.logger.info(f"  {name}: {value:.4f}")
        
        # Generate visualizations
        if HAS_PLOTTING:
            os.makedirs(output_dir, exist_ok=True)
            self._plot_roc_curve(y_test, y_pred_proba, metrics['auc'], output_dir)
            self._plot_confusion_matrix(y_test, y_pred, output_dir)
        
        return metrics
    
    def _compute_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, 
                        y_pred_proba: np.ndarray) -> Dict[str, float]:
        """Compute comprehensive evaluation metrics."""
        auc = roc_auc_score(y_true, y_pred_proba)
        acc = accuracy_score(y_true, y_pred)
        precision, recall, f1, _ = precision_recall_fscore_support(
            y_true, y_pred, average='binary', zero_division=0
        )
        
        return {
            'auc': auc,
            'accuracy': acc,
            'precision': precision,
            'recall': recall,
            'f1': f1
        }
    
    def _plot_roc_curve(self, y_true: np.ndarray, y_pred_proba: np.ndarray, 
                       auc: float, output_dir: str):
        """Plot and save ROC curve."""
        fpr, tpr, _ = roc_curve(y_true, y_pred_proba)
        
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, label=f'AUC = {auc:.3f}', linewidth=2)
        plt.plot([0, 1], [0, 1], 'k--', alpha=0.5, label='Random Classifier')
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title('ROC Curve', fontsize=14)
        plt.legend(loc='lower right')
        plt.grid(alpha=0.3)
        plt.tight_layout()
        
        save_path = os.path.join(output_dir, 'roc_curve.png')
        plt.savefig(save_path, dpi=300)
        plt.close()
        self.logger.info(f"ROC curve saved to {save_path}")
    
    def _plot_confusion_matrix(self, y_true: np.ndarray, y_pred: np.ndarray, output_dir: str):
        """Plot and save confusion matrix."""
        from sklearn.metrics import confusion_matrix
        
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(6, 5))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=False)
        plt.xlabel('Predicted Label', fontsize=12)
        plt.ylabel('True Label', fontsize=12)
        plt.title('Confusion Matrix', fontsize=14)
        plt.tight_layout()
        
        save_path = os.path.join(output_dir, 'confusion_matrix.png')
        plt.savefig(save_path, dpi=300)
        plt.close()
        self.logger.info(f"Confusion matrix saved to {save_path}")


# ============================================================================
# EXTERNAL DATA SOURCES MODULE
# ============================================================================

class ExternalDataFetcher:
    """Fetch data from external biomedical databases."""
    
    def __init__(self, config: ExternalDataConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
    
    def fetch_pubmed(self) -> Optional[pd.DataFrame]:
        """Query PubMed and return results as DataFrame."""
        if not HAS_BIOPYTHON:
            self.logger.error("Biopython not available for PubMed queries")
            return None
        
        if not self.config.pubmed_search_term:
            self.logger.warning("No PubMed search term provided")
            return None
        
        Entrez.email = self.config.pubmed_email
        term = self.config.pubmed_search_term
        retmax = self.config.pubmed_max_results
        
        self.logger.info(f"Searching PubMed for: {term}")
        
        try:
            # Search
            handle = Entrez.esearch(db="pubmed", term=term, retmax=retmax)
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
                    "Date": rec.get("PubDate", ""),
                    "Journal": rec.get("Source"),
                    "FirstAuthor": rec.get("AuthorList", [None])[0]
                })
            
            return pd.DataFrame(rows)
        
        except Exception as e:
            self.logger.error(f"PubMed query failed: {e}")
            return None
    
    def fetch_clinical_trials(self) -> Optional[pd.DataFrame]:
        """Query ClinicalTrials.gov and return results."""
        if not self.config.clinicaltrials_search_term:
            self.logger.warning("No ClinicalTrials search term provided")
            return None
        
        term = self.config.clinicaltrials_search_term
        max_studies = self.config.clinicaltrials_max_studies
        
        self.logger.info(f"Searching ClinicalTrials.gov for: {term}")
        
        try:
            url = "https://clinicaltrials.gov/api/v2/studies"
            params = {
                "query.term": term,
                "pageSize": max_studies,
                "format": "json"
            }
            
            r = requests.get(url, params=params, timeout=30)
            r.raise_for_status()
            data = r.json()
            studies = data.get("studies", [])
            
            self.logger.info(f"Found {len(studies)} studies")
            
            if not studies:
                return pd.DataFrame()
            
            rows = []
            for s in studies:
                prot = s.get("protocolSection", {})
                ident = prot.get("identificationModule", {})
                status = prot.get("statusModule", {})
                sponsor = prot.get("sponsorCollaboratorsModule", {})
                
                rows.append({
                    "NCTID": ident.get("nctId"),
                    "Title": ident.get("briefTitle"),
                    "Status": status.get("overallStatus"),
                    "Sponsor": sponsor.get("leadSponsor", {}).get("name")
                })
            
            return pd.DataFrame(rows)
        
        except Exception as e:
            self.logger.error(f"ClinicalTrials query failed: {e}")
            return None
    
    def analyze_pathways(self) -> Optional[pd.DataFrame]:
        """Perform pathway enrichment analysis."""
        if not HAS_PATHWAY_TOOLS:
            self.logger.error("Pathway analysis tools not available")
            return None
        
        if not self.config.gene_symbols:
            self.logger.warning("No gene symbols provided for pathway analysis")
            return None
        
        self.logger.info(f"Analyzing pathways for {len(self.config.gene_symbols)} genes")
        
        try:
            mg = MyGeneInfo()
            mapping = mg.querymany(
                self.config.gene_symbols,
                scopes="symbol",
                fields="entrezgene",
                species="human",
                as_dataframe=True
            )
            
            if mapping is None or mapping.empty:
                self.logger.warning("No gene mappings found")
                return None
            
            entrez_ids = mapping["entrezgene"].dropna().astype(int).astype(str).tolist()
            
            if not entrez_ids:
                self.logger.warning("No valid Entrez IDs")
                return None
            
            # Enrichment
            enr = gp.enrichr(
                gene_list=entrez_ids,
                gene_sets=["Reactome_2016", "Reactome_2022"],
                organism="Human",
                outdir=None,
                no_plot=True
            )
            
            if enr.results is not None and not enr.results.empty:
                self.logger.info(f"Found {len(enr.results)} enriched pathways")
                return enr.results
            else:
                self.logger.warning("No significant pathways found")
                return pd.DataFrame()
        
        except Exception as e:
            self.logger.error(f"Pathway analysis failed: {e}")
            return None


# ============================================================================
# VISUALIZATION MODULE
# ============================================================================

class Visualizer:
    """Generate analysis visualizations."""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def plot_prevalence(self, df: pd.DataFrame, group_col: str, target_col: str,
                       output_path: str = "prevalence.png"):
        """Plot prevalence by group."""
        if not HAS_PLOTTING:
            self.logger.warning("Plotting libraries not available")
            return
        
        valid = df[df[target_col].notna() & df[group_col].notna()].copy()
        
        summary = valid.groupby(group_col).agg(
            N_Cases=(target_col, lambda s: (s == "Yes").sum()),
            Total=(target_col, "size")
        ).reset_index()
        
        summary["Prevalence"] = summary["N_Cases"] / summary["Total"]
        
        plt.figure(figsize=(10, 6))
        ax = sns.barplot(x=group_col, y="Prevalence", data=summary, palette="viridis")
        ax.set_title(f"Prevalence by {group_col}", fontsize=14)
        ax.set_xlabel(group_col, fontsize=12)
        ax.set_ylabel("Prevalence Rate", fontsize=12)
        
        for p in ax.patches:
            height = p.get_height()
            ax.annotate(
                f"{height:.1%}",
                (p.get_x() + p.get_width() / 2., height),
                ha='center', va='bottom', fontsize=9,
                xytext=(0, 4), textcoords='offset points'
            )
        
        plt.xticks(rotation=45, ha="right")
        plt.tight_layout()
        plt.savefig(output_path, dpi=300)
        plt.close()
        self.logger.info(f"Prevalence plot saved to {output_path}")


# ============================================================================
# MAIN PIPELINE ORCHESTRATOR
# ============================================================================

class MLPipeline:
    """Main pipeline orchestrator."""
    
    def __init__(self, config: PipelineConfig):
        self.config = config
        self.logger = setup_logging(config.log_level, 
                                     os.path.join(config.output_dir, "pipeline.log"))
        
        # Setup output directory
        os.makedirs(config.output_dir, exist_ok=True)
        
        # Configure GPU
        configure_gpu(config.use_gpu, config.gpu_memory_limit)
        
        # Set random seeds
        self._set_seeds(config.seed)
        
        # Initialize components
        self.data_loader = DataLoader(config.data, self.logger)
        self.data_processor = DataProcessor(config.data, self.logger)
        self.feature_encoder = FeatureEncoder(config.data, self.logger)
        self.model_builder = ModelBuilder(config.model, self.logger)
        self.trainer = ModelTrainer(config.model, self.logger)
        self.evaluator = ModelEvaluator(self.logger)
        self.external_fetcher = ExternalDataFetcher(config.external, self.logger)
        self.visualizer = Visualizer(self.logger)
    
    def _set_seeds(self, seed: int):
        """Set random seeds for reproducibility."""
        np.random.seed(seed)
        tf.random.set_seed(seed)
        import random
        random.seed(seed)
        os.environ['PYTHONHASHSEED'] = str(seed)
    
    def run(self):
        """Execute pipeline based on mode."""
        mode = self.config.mode.lower()
        self.logger.info(f"Starting pipeline in {mode} mode")
        
        try:
            if mode == "train":
                self._run_training()
            elif mode == "evaluate":
                self._run_evaluation()
            elif mode == "predict":
                self._run_prediction()
            elif mode == "analyze":
                self._run_analysis()
            elif mode == "fetch_external":
                self._run_external_data_fetch()
            else:
                raise ValueError(f"Unknown mode: {mode}")
            
            self.logger.info("Pipeline completed successfully")
        
        except Exception as e:
            self.logger.error(f"Pipeline failed: {e}", exc_info=True)
            raise
    
    def _run_training(self):
        """Execute full training pipeline."""
        self.logger.info("=" * 80)
        self.logger.info("TRAINING PIPELINE")
        self.logger.info("=" * 80)
        
        # Load and process data
        raw_df = self.data_loader.load()
        processed_df = self.data_processor.process(raw_df)
        
        # Encode features and split
        X_train, X_val, X_test, y_train, y_val, y_test = self.feature_encoder.fit_transform(processed_df)
        
        # Transform data for model type
        model_type = self.config.model.model_type.lower()
        
        if model_type in ["cnn1d", "cnn", "rnn", "lstm", "gru"]:
            seq_len = self.config.model.seq_length
            X_train = DataTransformer.to_sequences(X_train, seq_len)
            X_val = DataTransformer.to_sequences(X_val, X_train.shape[1])
            X_test = DataTransformer.to_sequences(X_test, X_train.shape[1])
            input_shape = X_train.shape[1:]
        else:
            input_shape = X_train.shape[1]
        
        # Create datasets
        train_ds = DataTransformer.create_tf_dataset(
            X_train, y_train, self.config.model.batch_size, shuffle=True
        )
        val_ds = DataTransformer.create_tf_dataset(
            X_val, y_val, self.config.model.batch_size, shuffle=False
        )
        test_ds = DataTransformer.create_tf_dataset(
            X_test, y_test, self.config.model.batch_size, shuffle=False
        )
        
        # Build model
        model = self.model_builder.build(input_shape)
        
        # Train
        self.trainer.train(model, train_ds, val_ds)
        self.trainer.save_history()
        
        # Evaluate
        metrics = self.evaluator.evaluate(model, test_ds, y_test, self.config.output_dir)
        
        # Save metrics
        metrics_path = os.path.join(self.config.output_dir, "test_metrics.json")
        with open(metrics_path, "w") as f:
            json.dump(metrics, f, indent=2)
        self.logger.info(f"Test metrics saved to {metrics_path}")
    
    def _run_evaluation(self):
        """Evaluate existing model."""
        self.logger.info("=" * 80)
        self.logger.info("EVALUATION PIPELINE")
        self.logger.info("=" * 80)
        
        # Load model
        model_path = self.config.model.model_save_path
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        self.logger.info(f"Loading model from {model_path}")
        model = tf.keras.models.load_model(model_path)
        
        # Load and prepare test data
        processed_df = self.data_loader.load()
        self.feature_encoder.load_encoders()
        X_test = self.feature_encoder.transform(processed_df)
        y_test = self.feature_encoder._encode_labels(processed_df)
        
        # Transform if needed
        input_shape = model.input_shape
        if len(input_shape) == 3:
            X_test = DataTransformer.to_sequences(X_test, input_shape[1])
        
        test_ds = DataTransformer.create_tf_dataset(
            X_test, y_test, self.config.model.batch_size, shuffle=False
        )
        
        # Evaluate
        metrics = self.evaluator.evaluate(model, test_ds, y_test, self.config.output_dir)
        
        # Save
        metrics_path = os.path.join(self.config.output_dir, "evaluation_metrics.json")
        with open(metrics_path, "w") as f:
            json.dump(metrics, f, indent=2)
    
    def _run_prediction(self):
        """Run predictions on new data."""
        self.logger.info("=" * 80)
        self.logger.info("PREDICTION PIPELINE")
        self.logger.info("=" * 80)
        
        # Load model
        model_path = self.config.model.model_save_path
        model = tf.keras.models.load_model(model_path)
        
        # Load and prepare data
        df = self.data_loader.load()
        self.feature_encoder.load_encoders()
        X = self.feature_encoder.transform(df)
        
        # Transform if needed
        if len(model.input_shape) == 3:
            X = DataTransformer.to_sequences(X, model.input_shape[1])
        
        # Predict
        predictions = model.predict(X).ravel()
        
        # Save
        df["prediction_proba"] = predictions
        df["prediction_class"] = (predictions >= 0.5).astype(int)
        
        output_path = os.path.join(self.config.output_dir, "predictions.csv")
        df.to_csv(output_path, index=False)
        self.logger.info(f"Predictions saved to {output_path}")
    
    def _run_analysis(self):
        """Run descriptive analysis."""
        self.logger.info("=" * 80)
        self.logger.info("ANALYSIS PIPELINE")
        self.logger.info("=" * 80)
        
        # Load and process data
        raw_df = self.data_loader.load()
        processed_df = self.data_processor.process(raw_df)
        
        # Generate prevalence plot
        self.visualizer.plot_prevalence(
            processed_df,
            "AGE_GROUP",
            self.config.data.label_col,
            os.path.join(self.config.output_dir, "prevalence_by_age.png")
        )
        
        # Compute summary statistics
        summary = processed_df.describe(include='all')
        summary_path = os.path.join(self.config.output_dir, "data_summary.csv")
        summary.to_csv(summary_path)
        self.logger.info(f"Summary statistics saved to {summary_path}")
    
    def _run_external_data_fetch(self):
        """Fetch data from external sources."""
        self.logger.info("=" * 80)
        self.logger.info("EXTERNAL DATA FETCH PIPELINE")
        self.logger.info("=" * 80)
        
        # PubMed
        if self.config.external.pubmed_search_term:
            pubmed_df = self.external_fetcher.fetch_pubmed()
            if pubmed_df is not None and not pubmed_df.empty:
                output_path = os.path.join(self.config.output_dir, "pubmed_results.csv")
                pubmed_df.to_csv(output_path, index=False)
                self.logger.info(f"PubMed results saved to {output_path}")
        
        # ClinicalTrials
        if self.config.external.clinicaltrials_search_term:
            trials_df = self.external_fetcher.fetch_clinical_trials()
            if trials_df is not None and not trials_df.empty:
                output_path = os.path.join(self.config.output_dir, "clinical_trials_results.csv")
                trials_df.to_csv(output_path, index=False)
                self.logger.info(f"ClinicalTrials results saved to {output_path}")
        
        # Pathway analysis
        if self.config.external.gene_symbols:
            pathways_df = self.external_fetcher.analyze_pathways()
            if pathways_df is not None and not pathways_df.empty:
                output_path = os.path.join(self.config.output_dir, "pathway_analysis.csv")
                pathways_df.to_csv(output_path, index=False)
                self.logger.info(f"Pathway analysis saved to {output_path}")


# ============================================================================
# CLI INTERFACE
# ============================================================================

def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Unified ML Pipeline for Healthcare Data Analysis",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Train FFNN model
  python ml_pipeline.py --config config.json --mode train
  
  # Train CNN model with custom parameters
  python ml_pipeline.py --mode train --model_type cnn1d --epochs 100 --batch_size 32
  
  # Evaluate existing model
  python ml_pipeline.py --mode evaluate --model_path model_best.h5
  
  # Fetch external data
  python ml_pipeline.py --mode fetch_external --pubmed_term "depression biomarkers"
  
  # Run analysis only
  python ml_pipeline.py --mode analyze --data_source processed_data.pkl
        """
    )
    
    # Configuration file
    parser.add_argument("--config", type=str, help="Path to JSON configuration file")
    
    # Pipeline control
    parser.add_argument("--mode", type=str, default="train",
                       choices=["train", "evaluate", "predict", "analyze", "fetch_external"],
                       help="Pipeline execution mode")
    parser.add_argument("--output_dir", type=str, default="outputs", help="Output directory")
    parser.add_argument("--log_level", type=str, default="INFO",
                       choices=["DEBUG", "INFO", "WARNING", "ERROR"],
                       help="Logging level")
    
    # Data configuration
    parser.add_argument("--data_source", type=str, default="brfss",
                       help="Data source type (brfss, csv, parquet, pickle)")
    parser.add_argument("--data_path", type=str, help="Path to data file")
    parser.add_argument("--data_url", type=str, help="URL for data download")
    
    # Model configuration
    parser.add_argument("--model_type", type=str, default="ffnn",
                       choices=["ffnn", "cnn1d", "cnn", "rnn", "lstm", "gru", "autoencoder"],
                       help="Model architecture")
    parser.add_argument("--hidden_units", nargs="+", type=int, default=[128, 64],
                       help="Hidden layer units")
    parser.add_argument("--dropout", type=float, default=0.3, help="Dropout rate")
    parser.add_argument("--learning_rate", type=float, default=1e-3, help="Learning rate")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs")
    parser.add_argument("--model_path", type=str, help="Path to save/load model")
    
    # External data
    parser.add_argument("--pubmed_term", type=str, help="PubMed search term")
    parser.add_argument("--clinicaltrials_term", type=str, help="ClinicalTrials search term")
    
    # GPU configuration
    parser.add_argument("--use_gpu", action="store_true", default=True, help="Use GPU if available")
    parser.add_argument("--no_gpu", dest="use_gpu", action="store_false", help="Force CPU usage")
    parser.add_argument("--gpu_memory", type=int, default=15000, help="GPU memory limit (MB)")
    
    return parser.parse_args()


def main():
    """Main entry point."""
    args = parse_args()
    
    # Load or create configuration
    if args.config:
        config = PipelineConfig.from_json(args.config)
    else:
        # Build config from command-line arguments
        config = PipelineConfig(
            mode=args.mode,
            output_dir=args.output_dir,
            log_level=args.log_level,
            use_gpu=args.use_gpu,
            gpu_memory_limit=args.gpu_memory,
            data=DataConfig(
                source_type=args.data_source,
                raw_file=args.data_path,
                data_url=args.data_url
            ),
            model=ModelConfig(
                model_type=args.model_type,
                hidden_units=args.hidden_units,
                dropout=args.dropout,
                learning_rate=args.learning_rate,
                batch_size=args.batch_size,
                epochs=args.epochs,
                model_save_path=args.model_path or f"{args.model_type}_best.h5"
            ),
            external=ExternalDataConfig(
                pubmed_search_term=args.pubmed_term,
                clinicaltrials_search_term=args.clinicaltrials_term
            )
        )
    
    # Save configuration for reproducibility
    config_save_path = os.path.join(config.output_dir, "config_used.json")
    os.makedirs(config.output_dir, exist_ok=True)
    config.to_json(config_save_path)
    
    # Run pipeline
    pipeline = MLPipeline(config)
    pipeline.run()


if __name__ == "__main__":
    main()
