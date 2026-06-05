from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DataCollectionConfig(BaseModel):
    loader: str
    loader_params: Dict[str, Any] = Field(default_factory=dict)

class TransformerConfig(BaseModel):
    transformer: str
    params: Dict[str, Any] = Field(default_factory=dict)

class PreprocessingConfig(BaseModel):
    pipeline: List[TransformerConfig] = Field(default_factory=list)

class ModelConfig(BaseModel):
    model_class: str = Field(alias="class")
    params: Dict[str, Any] = Field(default_factory=dict)

class ValidationConfig(BaseModel):
    strategy: Optional[str] = None
    params: Dict[str, Any] = Field(default_factory=dict)

class AnalysisConfig(BaseModel):
    model: ModelConfig
    validation: Optional[ValidationConfig] = None
    metrics: List[str] = Field(default_factory=list)

class ResultsConfig(BaseModel):
    plots: List[str] = Field(default_factory=list)
    export: Dict[str, Any] = Field(default_factory=dict)

class PipelineConfig(BaseModel):
    experiment_name: str
    seed: int = 42
    output_dir: str
    data_collection: DataCollectionConfig
    preprocessing: Optional[PreprocessingConfig] = Field(default_factory=lambda: PreprocessingConfig(pipeline=[]))
    analysis: AnalysisConfig
    results: Optional[ResultsConfig] = Field(default_factory=ResultsConfig)
