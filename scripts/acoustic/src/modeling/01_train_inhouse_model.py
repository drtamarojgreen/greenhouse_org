# scripts/acoustic/src/modeling/01_train_inhouse_model.py

import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def train_inhouse_model():
    """
    Trains a RandomForestRegressor model on the in-house dataset and evaluates it.
    """
    print("Training in-house Random Forest model...")

    # Load preprocessed data
    try:
        data = pd.read_csv("scripts/acoustic/data/inhouse_data_processed.csv")
    except FileNotFoundError:
        print("Preprocessed data not found. Please run the preprocessing scripts first.")
        return

    # Prepare data for training
    # All columns except 'reaction_score' are features
    X = data.drop('reaction_score', axis=1)
    y = data['reaction_score']

    # Ensure all feature columns are present
    expected_features = ['tempo', 'mode', 'energy', 'valence', 'loudness']
    if not all(feature in X.columns for feature in expected_features):
        print(f"Error: Missing one or more expected features in the dataset. Found: {list(X.columns)}")
        return

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # --- Train a Random Forest model ---
    # Using more robust parameters than defaults for better performance.
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1, oob_score=True)
    model.fit(X_train, y_train)

    # --- Evaluate the model ---
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    oob = model.oob_score_

    print("\n--- Model Evaluation ---")
    print(f"Mean Absolute Error (MAE): {mae:.4f}")
    print(f"Mean Squared Error (MSE): {mse:.4f}")
    print(f"R-squared (R²) Score: {r2:.4f}")
    print(f"Out-of-Bag (OOB) Score: {oob:.4f}")
    print("------------------------\n")

    # --- Feature Importances ---
    importances = model.feature_importances_
    feature_importance_df = pd.DataFrame({
        'feature': X.columns,
        'importance': importances
    }).sort_values(by='importance', ascending=False)

    print("--- Feature Importances ---")
    print(feature_importance_df)
    print("-------------------------\n")

    # Save the trained model
    output_dir = "scripts/acoustic/src/modeling"
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "inhouse_model.pkl")
    joblib.dump(model, model_path)

    print(f"In-house model trained and saved to {model_path}")

if __name__ == "__main__":
    train_inhouse_model()
