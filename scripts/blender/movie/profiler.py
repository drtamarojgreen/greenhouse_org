import time
import os
import json
from contextlib import contextmanager

class Profiler:
    """Simple performance profiler for Blender movie generation."""
    _data = {}
    _current_file = None

    @classmethod
    @contextmanager
    def profile(cls, stage_name):
        start_time = time.time()
        try:
            yield
        finally:
            end_time = time.time()
            duration = end_time - start_time
            if stage_name not in cls._data:
                cls._data[stage_name] = []
            cls._data[stage_name].append(duration)
            print(f"PROFILER: {stage_name} took {duration:.4f}s")

    @classmethod
    def save_report(cls, filepath="profiler_report.json"):
        report = {
            "summary": {
                stage: {
                    "total": sum(times),
                    "count": len(times),
                    "avg": sum(times) / len(times) if times else 0,
                    "min": min(times) if times else 0,
                    "max": max(times) if times else 0
                } for stage, times in cls._data.items()
            },
            "raw": cls._data
        }
        with open(filepath, 'w') as f:
            json.dump(report, f, indent=4)
        print(f"PROFILER: Report saved to {filepath}")

def get_profiler():
    return Profiler
