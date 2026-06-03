"""
MeSH Discovery Suite V5 - Temporal Engine
Orchestrates longitudinal publication count collection.
"""
import asyncio
import yaml
import logging
import json
from datetime import datetime
from typing import List, Dict, Any
from .client import PubMedClientV5

logger = logging.getLogger(__name__)

class TemporalEngineV5:
    """
    Core engine for longitudinal mental health research analysis.
    """
    def __init__(self, config_path: str = "scripts/research/mesh/v5/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)
        
        self.timeline_cfg = self.config["timeline"]
        self.client = PubMedClientV5()
        self.results = {
            "project": "Mental Health Research Longitudinal Study",
            "version": "5.0",
            "generated_at": datetime.now().isoformat(),
            "intervals": [],
            "datasets": []
        }

    def generate_intervals(self) -> List[tuple]:
        """
        Generates interval tuples based on config.
        """
        start = self.timeline_cfg["start_year"]
        end = self.timeline_cfg["end_year"]
        step = self.timeline_cfg["interval_years"]
        
        intervals = []
        for year in range(start, end + 1, step):
            interval_end = min(year + step - 1, end)
            intervals.append((year, interval_end))
        return intervals

    async def process_condition(self, term: str, intervals: List[tuple]) -> Dict[str, Any]:
        """
        Collects counts for a single condition across all intervals.
        """
        counts = []
        for start, end in intervals:
            logger.info(f"Fetching counts for '{term}' during {start}-{end}...")
            count = await self.client.get_publication_count_in_range(term, start, end)
            counts.append(count)
            # Small delay to be polite to NCBI
            await asyncio.sleep(0.1)
            
        return {
            "label": term,
            "counts": counts,
            "color": self.config["timeline"]["visualization"]["colors"].get(term, "#CCCCCC")
        }

    async def run(self, dynamic_conditions: List[str] = None):
        """
        Executes the full longitudinal analysis.
        """
        intervals = self.generate_intervals()
        self.results["intervals"] = [f"{s}-{e}" for s, e in intervals]
        
        # Enhancement: Automatic Condition Discovery
        # If dynamic_conditions are provided (e.g. from v4 or v8), use them
        conditions = dynamic_conditions if dynamic_conditions else self.timeline_cfg.get("conditions", [])

        # If still no conditions, try to load from v8 output if it exists
        if not conditions:
            v8_output = "scripts/research/mesh/v8/discovery.json"
            if os.path.exists(v8_output):
                try:
                    with open(v8_output, 'r') as f:
                        data = json.load(f)
                        conditions = [item['term'] for item in data[:10]]
                        logger.info(f"Dynamically discovered {len(conditions)} conditions from {v8_output}")
                except Exception as e:
                    logger.warning(f"Failed to load dynamic conditions from {v8_output}: {e}")

        # Limit concurrency to respect NCBI rate limits
        sem = asyncio.Semaphore(5)
        
        async def sem_process(condition):
            async with sem:
                return await self.process_condition(condition, intervals)
        
        tasks = []
        for condition in conditions:
            tasks.append(sem_process(condition))
            
        self.results["datasets"] = await asyncio.gather(*tasks)
        
        # Save output
        output_path = "scripts/research/mesh/v5/timeline_v5.json"
        with open(output_path, "w") as f:
            json.dump(self.results, f, indent=2)
            
        logger.info(f"Longitudinal analysis complete. Results saved to {output_path}")
        return self.results
