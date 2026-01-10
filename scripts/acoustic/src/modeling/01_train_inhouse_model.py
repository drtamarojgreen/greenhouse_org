# scripts/acoustic/src/modeling/01_train_inhouse_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import joblib
import os

def train_inhouse_model():
    """
    Placeholder function to train the in-house machine learning model.
    """
    print("Training in-house model...")

    # Load preprocessed data
    try:
        data = pd.read_csv("scripts/acoustic/data/inhouse_data_processed.csv")
    except FileNotFoundError:
        print("Preprocessed data not found. Please run the preprocessing scripts first.")
        return

    # Prepare data for training
    X = data[['frequency', 'amplitude']]
    y = data['reaction_score']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train a simple model
    model = LinearRegression()
    model.fit(X_train, y_train)

    # Evaluate the model (placeholder)
    score = model.score(X_test, y_test)
    print(f"Model R^2 score: {score}")

    # Save the trained model
    output_dir = "scripts/acoustic/src/modeling"
    os.makedirs(output_dir, exist_ok=True)
    joblib.dump(model, os.path.join(output_dir, "inhouse_model.pkl"))

    print("In-house model trained and saved to scripts/acoustic/src/modeling/inhouse_model.pkl")

if __name__ == "__main__":
    train_inhouse_model()
