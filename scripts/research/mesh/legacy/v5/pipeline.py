"""
MeSH Discovery Suite V5 - Main Pipeline
Executes the full longitudinal studies for mental health.
"""
import asyncio
import logging
import sys
import os

# Ensure the parent directory is in the path for relative imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from scripts.research.mesh.v5.core.temporal_engine import TemporalEngineV5
from scripts.research.mesh.v5.viz.timeline_viz import TimelineVizV5

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scripts/research/mesh/v5/pipeline.log")
    ]
)
logger = logging.getLogger("MeshV5Pipeline")

async def main():
    logger.info("Starting MeSH Discovery Suite V5 Pipeline")
    
    # 1. Initialize Engine
    engine = TemporalEngineV5()
    
    # 2. Run Temporal Analysis
    logger.info("Step 1: Running longitudinal data collection...")
    try:
        await engine.run()
    except Exception as e:
        logger.error(f"Engine failure: {e}")
        return

    # 3. Generate Visualization
    logger.info("Step 2: Generating graphical timeline...")
    try:
        viz = TimelineVizV5()
        viz.generate()
    except Exception as e:
        logger.error(f"Visualization failure: {e}")
        return

    logger.info("V5 Pipeline execution complete.")

if __name__ == "__main__":
    asyncio.run(main())
