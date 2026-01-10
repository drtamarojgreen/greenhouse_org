# scripts/acoustic/main.py

import subprocess
import sys
import os

def run_script(script_path):
    """Executes a script using the appropriate interpreter (Python or R)."""
    print(f"--- Running {os.path.basename(script_path)} ---")

    if script_path.endswith(".py"):
        interpreter = sys.executable
    elif script_path.endswith(".R"):
        interpreter = "Rscript"
    else:
        print(f"Unsupported script type: {script_path}")
        return

    try:
        result = subprocess.run([interpreter, script_path], check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("Stderr:", result.stderr)
    except FileNotFoundError:
        print(f"Error: The interpreter '{interpreter}' was not found.")
        print("Please ensure R is installed and 'Rscript' is in your system's PATH.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"Error executing {script_path}:")
        print(e.stdout)
        print(e.stderr)
        sys.exit(1)

    print(f"--- Finished {os.path.basename(script_path)} ---\n")

def main():
    """Main function to run the entire pipeline."""
    # Define the base directory for the scripts
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Define the scripts to be run in order
    scripts = [
        # Data Acquisition
        "src/data_acquisition/01_fetch_pubmed_data.py",
        "src/data_acquisition/02_fetch_clinical_trials_data.py",
        "src/data_acquisition/03_generate_inhouse_data.py",
        # Preprocessing
        "src/preprocessing/01_preprocess_text.py",
        "src/preprocessing/02_preprocess_inhouse_data.R",
        # Modeling
        "src/modeling/01_train_inhouse_model.py",
        # Analysis
        "src/analysis/01_search_public_research.py",
        "src/analysis/02_comparative_analysis.R"
    ]

    print("===== Starting Acoustic Machine Learning Pipeline =====")

    # Run each script
    for script in scripts:
        run_script(os.path.join(base_dir, script))

    print("===== Pipeline Finished Successfully =====")

if __name__ == "__main__":
    main()
