import pytest
import pandas as pd
import numpy as np
import os
import json
from scripts.research.mesh.v12.config.schema import PipelineConfig
from scripts.research.mesh.v12.stages.requirements import RequirementsStage
from scripts.research.mesh.v12.stages.data_collection import DataCollectionStage
from scripts.research.mesh.v12.stages.preprocessing import PreprocessingStage
from scripts.research.mesh.v12.stages.analysis import AnalysisStage
from scripts.research.mesh.v12.stages.results import ResultsStage
from scripts.research.mesh.v12.models import MODEL_REGISTRY
from scripts.research.mesh.v12.transformers import TRANSFORMER_REGISTRY

@pytest.fixture
def full_config():
    return {
        "experiment_name": "full_test",
        "output_dir": "scripts/research/mesh/v12/output/unit_test_run",
        "seed": 42,
        "data_collection": {
            "loader": "SyntheticLoader",
            "loader_params": {"num_samples": 100}
        },
        "preprocessing": {
            "pipeline": [{"transformer": "StandardScaler"}]
        },
        "analysis": {
            "model": {"class": "LogisticRegression", "params": {}},
            "validation": {"strategy": "SimpleSplit", "params": {"test_size": 0.2}},
            "metrics": ["accuracy", "f1", "roc_auc"]
        },
        "results": {
            "plots": ["confusion_matrix"],
            "export": {"format": "csv"}
        }
    }

def test_requirements_stage(full_config):
    config = PipelineConfig(**full_config)
    stage = RequirementsStage(config)
    context = stage.run({})
    assert "logger" in context
    assert context["seed"] == 42
    assert os.path.exists(config.output_dir)

def test_data_collection_stage(full_config):
    config = PipelineConfig(**full_config)
    stage = DataCollectionStage(config)
    context = {"logger": pytest.importorskip("logging").getLogger("test")}
    context = stage.run(context)
    assert "raw_data" in context
    assert len(context["raw_data"]) == 100
    assert context["raw_data"]["target"].dtype == int

def test_preprocessing_stage(full_config):
    config = PipelineConfig(**full_config)
    stage = PreprocessingStage(config)
    raw_data = pd.DataFrame({
        "feature1": [1.0, 2.0, 3.0],
        "feature2": [4.0, 5.0, 6.0],
        "target": [0, 1, 0]
    })
    context = {"logger": pytest.importorskip("logging").getLogger("test"), "raw_data": raw_data}
    context = stage.run(context)
    assert "processed_data" in context
    assert context["processed_data"].shape == (3, 3)
    assert "fitted_transformers" in context
    # Check scaling (mean should be ~0)
    assert np.abs(context["processed_data"]["feature1"].mean()) < 1e-7

def test_analysis_stage(full_config):
    config = PipelineConfig(**full_config)
    stage = AnalysisStage(config)
    processed_data = pd.DataFrame({
        "feature1": np.random.randn(100),
        "target": np.random.randint(0, 2, 100)
    })
    context = {"logger": pytest.importorskip("logging").getLogger("test"), "processed_data": processed_data}
    context = stage.run(context)
    assert "trained_model" in context
    assert "metrics" in context
    assert "accuracy" in context["metrics"]
    assert "roc_auc" in context["metrics"]

def test_analysis_stage_with_tuning(full_config):
    # Modify config to include hyperparameter tuning
    full_config["analysis"]["hyperparameter_tuning"] = {
        "method": "GridSearchCV",
        "param_grid": {"C": [0.1, 1.0]}
    }
    config = PipelineConfig(**full_config)
    stage = AnalysisStage(config)
    processed_data = pd.DataFrame({
        "feature1": np.random.randn(100),
        "target": np.random.randint(0, 2, 100)
    })
    context = {"logger": pytest.importorskip("logging").getLogger("test"), "processed_data": processed_data}
    context = stage.run(context)
    assert "trained_model" in context
    assert context["trained_model"].model.C in [0.1, 1.0]

def test_results_stage(full_config):
    config = PipelineConfig(**full_config)
    stage = ResultsStage(config)
    os.makedirs(config.output_dir, exist_ok=True)
    context = {
        "logger": pytest.importorskip("logging").getLogger("test"),
        "metrics": {"accuracy": 0.8},
        "y_test": [0, 1],
        "predictions": [0, 1]
    }
    stage.run(context)
    assert os.path.exists(os.path.join(config.output_dir, "metrics.json"))
    assert os.path.exists(os.path.join(config.output_dir, "confusion_matrix.png"))
    assert os.path.exists(os.path.join(config.output_dir, "predictions.csv"))

def test_model_registry():
    assert "RandomForest" in MODEL_REGISTRY
    assert "LogisticRegression" in MODEL_REGISTRY
    assert "IdentityModel" in MODEL_REGISTRY

def test_transformer_registry():
    assert "StandardScaler" in TRANSFORMER_REGISTRY
    assert "ZScoreScaler" in TRANSFORMER_REGISTRY
