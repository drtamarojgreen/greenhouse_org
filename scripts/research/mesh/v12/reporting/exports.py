import pandas as pd
import os
import json
from . import register_export

@register_export("csv")
def export_csv(context: dict, output_dir: str):
    results_df = pd.DataFrame({
        "actual": context["y_test"],
        "predicted": context["predictions"]
    })
    csv_file = os.path.join(output_dir, "predictions.csv")
    results_df.to_csv(csv_file, index=False)
    return csv_file

@register_export("json")
def export_json(context: dict, output_dir: str):
    results = {
        "actual": context["y_test"].tolist() if hasattr(context["y_test"], "tolist") else context["y_test"],
        "predicted": context["predictions"].tolist() if hasattr(context["predictions"], "tolist") else context["predictions"]
    }
    json_file = os.path.join(output_dir, "predictions.json")
    with open(json_file, "w") as f:
        json.dump(results, f, indent=4)
    return json_file
