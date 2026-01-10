# scripts/acoustic/src/data_acquisition/03_generate_inhouse_data.py

import pandas as pd
import os
from music21 import corpus, converter

def get_note_features(score):
    """
    Analyzes a music21 score to extract note-based features.
    """
    notes = score.flat.notes
    if not notes:
        return None, None

    # Extract frequencies (in Hz) for all notes
    frequencies = [note.pitch.frequency for note in notes if note.pitch]
    if not frequencies:
        return None, None

    return min(frequencies), max(frequencies)

def analyze_music_corpus(num_pieces=20):
    """
    Analyzes pieces from the music21 corpus to create an in-house dataset.
    This function processes a selection of Bach chorales to extract musical features.
    """
    print(f"Analyzing {num_pieces} pieces from the music21 corpus...")

    # Using Bach chorales as they are well-structured and readily available
    bach_chorales = corpus.getComposer('bach')
    music_data = []

    for i, piece_path in enumerate(bach_chorales[:num_pieces]):
        try:
            score = corpus.parse(piece_path)

            # --- Feature Extraction ---
            key = score.analyze('key')
            time_signature = score.getTimeSignatures()[0] if score.getTimeSignatures() else None
            min_freq, max_freq = get_note_features(score)

            if min_freq is None or time_signature is None:
                continue

            # --- Popularity Score Simulation ---
            # This formula simulates a "popularity score" based on musical theory.
            # Assumptions:
            # - A baseline score of 5.0.
            # - Major keys are generally more "popular" or accessible.
            # - Common time (4/4) is the most standard and popular time signature.
            # - A wider frequency range might be more engaging.
            # - These are simplifications for the purpose of this pipeline.

            popularity_score = 5.0
            popularity_score += 1.0 if key.mode == 'major' else -1.0
            popularity_score += 1.5 if time_signature.ratioString == '4/4' else 0
            popularity_score += (max_freq - min_freq) / 500 # Normalize the range effect

            music_data.append({
                'piece_title': score.metadata.title if score.metadata else os.path.basename(piece_path),
                'key': f"{key.tonic.name} {key.mode}",
                'time_signature': time_signature.ratioString,
                'min_frequency': min_freq,
                'max_frequency': max_freq,
                'popularity_score': min(10, max(0, popularity_score)) # Clip to 0-10
            })
        except Exception as e:
            print(f"Could not process piece {i+1}/{num_pieces}: {e}")

    # --- Create and Save DataFrame ---
    if not music_data:
        print("Could not extract any music data. Aborting.")
        return

    df = pd.DataFrame(music_data)
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "inhouse_music_data.csv")
    df.to_csv(output_path, index=False)

    print(f"In-house music data extracted and saved to {output_path}")

if __name__ == "__main__":
    analyze_music_corpus()
