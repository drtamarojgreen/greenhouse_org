import json
import os
import pandas as pd
from typing import Dict, Any, Callable

def export_json(data: Any, path: str):
    with open(path, "w") as f:
        json.dump(data, f, indent=4, default=str)

def export_csv(data: Any, path: str):
    if isinstance(data, pd.DataFrame):
        data.to_csv(path, index=False)
    elif isinstance(data, list):
        pd.DataFrame(data).to_csv(path, index=False)
    else:
        pd.DataFrame({"data": [data]}).to_csv(path, index=False)

EXPORT_REGISTRY: Dict[str, Callable] = {
    "json": export_json,
    "csv": export_csv
}
