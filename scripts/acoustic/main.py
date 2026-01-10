# scripts/acoustic/main.py

import subprocess
import sys
import os

def run_script(script_path):
    """Executes a Python script."""
    print(f"--- Running {os.path.basename(script_path)} ---")

    interpreter = sys.executable
    try:
        result = subprocess.run([interpreter, script_path], check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Stderr:", result.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error executing {script_path}:")
        print(e.stdout)
        print(e.stderr)
        sys.exit(1)

    print(f"--- Finished {os.path.basename(script_path)} ---\n")

def main():
    """Main function to run the entire pipeline."""
    base_dir = os.path.dirname(os.path.abspath(__file__))

    scripts = [
        # Data Acquisition
        "src/data_acquisition/01_fetch_pubmed_data.py",
        "src/data_acquisition/02_fetch_clinical_trials_data.py",
        "src/data_acquisition/03_generate_inhouse_data.py",
        # Preprocessing
        "src/preprocessing/01_preprocess_text.py",
        "src/preprocessing/02_preprocess_inhouse_data.py",
        # Modeling
        "src/modeling/01_train_inhouse_model.py",
        # Analysis
        "src/analysis/01_search_public_research.py",
        "src/analysis/02_comparative_analysis.py"
    ]

    print("===== Starting Acoustic Machine Learning Pipeline =====")

    for script in scripts:
        run_script(os.path.join(base_dir, script))

    print("===== Pipeline Finished Successfully =====")

if __name__ == "__main__":
    main()
