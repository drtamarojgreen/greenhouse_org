import yaml
from pathlib import Path

def load_config(config_path=None):
    """Loads the production configuration from a YAML file."""
    if config_path is None:
        config_path = Path(__file__).parent / "config.yaml"

    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def get_production_settings(config):
    return config.get("production", {})

def get_header_config(config):
    return config.get("header", {})

def get_credits_config(config):
    return config.get("credits", {})
