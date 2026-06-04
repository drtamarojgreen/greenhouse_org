import argparse
import yaml
import logging
import os
from typing import Dict, Any, List
from .config.schema import PipelineConfig
from .stages.requirements import RequirementsStage
from .stages.data_collection import DataCollectionStage
from .stages.preprocessing import PreprocessingStage
from .stages.analysis import AnalysisStage
from .stages.results import ResultsStage

logger = logging.getLogger(__name__)

class Pipeline:
    """Main orchestrator for the v12 data analysis pipeline."""

    def __init__(self, config_path: str):
        with open(config_path, "r") as f:
            raw_config = yaml.safe_load(f)
        
        self.config = PipelineConfig(**raw_config)
        self.stages = [
            RequirementsStage(self.config),
            DataCollectionStage(self.config),
            PreprocessingStage(self.config),
            AnalysisStage(self.config),
            ResultsStage(self.config)
        ]

    def run(self):
        context: Dict[str, Any] = {}
        logger.info(f"Starting experiment: {self.config.experiment_name}")

        for stage in self.stages:
            stage_name = stage.__class__.__name__
            logger.info(f"Running stage: {stage_name}")
            context = stage.run(context)
            logger.info(f"Completed stage: {stage_name}")

        logger.info(f"Experiment {self.config.experiment_name} completed successfully.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="v12 Data Analysis Pipeline")
    parser.add_argument("--config", type=str, required=True, help="Path to the config file")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    pipeline = Pipeline(args.config)
    pipeline.run()
