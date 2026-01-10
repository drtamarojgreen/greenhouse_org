# scripts/acoustic/src/data_acquisition/03_generate_inhouse_data.py

import os
import pandas as pd
import numpy as np

def generate_inhouse_data(num_samples=500):
    """
    Generates a sophisticated synthetic in-house dataset.

    This function creates a dataset of musical features and simulates a "reaction score"
    based on a defined formula. This is intended to simulate data that might be
    collected from an experiment measuring human response to music.

    Args:
        num_samples (int): The number of data points to generate.
    """
    print(f"Generating {num_samples} samples of in-house data...")

    # Seed for reproducibility
    np.random.seed(42)

    # --- Feature Generation ---
    # Generate musical features within plausible ranges.
    # tempo: Beats per minute (e.g., a range from slow to fast)
    tempo = np.random.uniform(60, 180, num_samples)
    # mode: 0 for minor, 1 for major
    mode = np.random.randint(0, 2, num_samples)
    # energy: A measure of intensity (0 to 1)
    energy = np.random.rand(num_samples)
    # valence: A measure of musical positiveness (0 to 1)
    valence = np.random.rand(num_samples)
    # loudness: In decibels (dB), typical range for music
    loudness = np.random.uniform(-30, 0, num_samples)

    # --- Reaction Score Calculation ---
    # This formula is a simulation of how these features might combine to affect
    # a listener's reaction. It is based on the following assumptions:
    # - A baseline reaction score of 5.0.
    # - Higher valence (positiveness) and energy increase the score.
    # - Music in a major key has a more positive effect than minor.
    # - Tempo has an optimal point around 120 bpm.
    # - Loudness has an optimal point around -10 dB.
    # - Some random noise is included to simulate natural variance.

    base_score = 5.0
    valence_effect = (valence - 0.5) * 4
    energy_effect = (energy - 0.5) * 3
    mode_effect = np.where(mode == 1, 1.0, -1.0)
    tempo_effect = 1.5 * (1 - (np.abs(tempo - 120) / 60))
    loudness_effect = 1.0 * (1 - (np.abs(loudness - (-10)) / 20))
    noise = np.random.normal(0, 0.5, num_samples)

    # Combine effects to get the final score
    reaction_score = (base_score + valence_effect + energy_effect + mode_effect +
                      tempo_effect + loudness_effect + noise)

    # Clip the score to be within a 0-10 range
    reaction_score = np.clip(reaction_score, 0, 10)

    # --- Create and Save DataFrame ---
    df = pd.DataFrame({
        'tempo': tempo,
        'mode': mode,
        'energy': energy,
        'valence': valence,
        'loudness': loudness,
        'reaction_score': reaction_score
    })

    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "inhouse_data.csv")
    df.to_csv(output_path, index=False)

    print(f"In-house data generated and saved to {output_path}")

if __name__ == "__main__":
    generate_inhouse_data()
