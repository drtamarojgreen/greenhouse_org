from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DataCollectionConfig(BaseModel):
    loader: str
    loader_params: Dict[str, Any]

class TransformerConfig(BaseModel):
    transformer: str
    params: Dict[str, Any] = Field(default_factory=dict)

class PreprocessingConfig(BaseModel):
    pipeline: List[TransformerConfig] = Field(default_factory=list)

class ModelConfig(BaseModel):
    model_class: str = Field(alias="class")
    params: Dict[str, Any] = Field(default_factory=dict)

class ValidationConfig(BaseModel):
    strategy: str
    params: Dict[str, Any] = Field(default_factory=dict)

class AnalysisConfig(BaseModel):
    model: ModelConfig
    validation: ValidationConfig
    metrics: List[str] = Field(default_factory=lambda: ["accuracy"])

class ResultsConfig(BaseModel):
    plots: List[str] = Field(default_factory=list)
    export: Dict[str, Any] = Field(default_factory=dict)

class PipelineConfig(BaseModel):
    experiment_name: str
    seed: int = 42
    output_dir: str
    data_collection: DataCollectionConfig
    preprocessing: PreprocessingConfig
    analysis: AnalysisConfig
    results: ResultsConfig
