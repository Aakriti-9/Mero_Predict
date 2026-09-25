from pathlib import Path
import joblib

from app.ml.preprocessing import get_latest_features


# Project root directory
BASE_DIR = Path(__file__).resolve().parents[2]

# Saved ML files
MODEL_PATH = BASE_DIR / "ml_models" / "final_xgboost_model.pkl"
FEATURE_PATH = BASE_DIR / "ml_models" / "feature_columns.pkl"


# Load trained XGBoost model
model = joblib.load(MODEL_PATH)

# Load feature names expected by the model
feature_columns = joblib.load(FEATURE_PATH)


def predict_stock_movement(df):
    """
    Predict the next-day movement of a stock.

    0 = DOWN
    1 = UP
    """

    # Generate the latest 16 features
    features = get_latest_features(df)

    # Make sure features are in the same order
    # used during model training
    features = features[feature_columns]

    # Make prediction
    prediction = model.predict(features)[0]

    # Get prediction probability
    probability = model.predict_proba(features)[0]

    # Convert prediction to readable result
    if prediction == 1:
        movement = "UP"
        confidence = probability[1]
    else:
        movement = "DOWN"
        confidence = probability[0]

    return {
        "prediction": movement,
        "confidence": float(confidence)
    }