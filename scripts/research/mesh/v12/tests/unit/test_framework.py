import pytest
import pandas as pd
import numpy as np
from scripts.research.mesh.v12.config.schema import PipelineConfig
from scripts.research.mesh.v12.stages.requirements import RequirementsStage
from scripts.research.mesh.v12.stages.data_collection import DataCollectionStage
from scripts.research.mesh.v12.models import MODEL_REGISTRY
from scripts.research.mesh.v12.transformers import TRANSFORMER_REGISTRY

@pytest.fixture
def base_config():
    return {
        "experiment_name": "test_exp",
        "output_dir": "test_output",
        "seed": 42,
        "data_collection": {
            "loader": "SyntheticLoader",
            "loader_params": {"num_samples": 50}
        },
        "preprocessing": {
            "pipeline": [{"transformer": "StandardScaler"}]
        },
        "analysis": {
            "model": {"class": "LogisticRegression", "params": {}},
            "validation": {"strategy": "SimpleSplit", "params": {"test_size": 0.2}},
            "metrics": ["accuracy"]
        },
        "results": {
            "plots": ["confusion_matrix"],
            "export": {"format": "csv"}
        }
    }

def test_config_validation(base_config):
    config = PipelineConfig(**base_config)
    assert config.experiment_name == "test_exp"
    assert config.data_collection.loader == "SyntheticLoader"

def test_requirements_stage(base_config):
    config = PipelineConfig(**base_config)
    stage = RequirementsStage(config)
    context = stage.run({})
    assert "logger" in context
    assert context["seed"] == 42

def test_data_collection_stage(base_config):
    config = PipelineConfig(**base_config)
    stage = DataCollectionStage(config)
    context = {"logger": pytest.importorskip("logging").getLogger("test")}
    context = stage.run(context)
    assert "raw_data" in context
    assert len(context["raw_data"]) == 50

def test_registries():
    assert "LogisticRegression" in MODEL_REGISTRY
    assert "RandomForest" in MODEL_REGISTRY
    assert "StandardScaler" in TRANSFORMER_REGISTRY
