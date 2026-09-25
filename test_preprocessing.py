import pandas as pd
from pathlib import Path

from app.ml.preprocessing import (
    engineer_features,
    get_latest_features
)

from app.ml.predictor import predict_stock_movement


# --------------------------------------------------
# Location of raw NEPSE date-wise CSV files
# --------------------------------------------------

DATA_DIR = Path(
    r"C:\Users\omdae\Nepse_Dataset"
)


# --------------------------------------------------
# Store NABIL rows from all date-wise files
# --------------------------------------------------

all_data = []


# --------------------------------------------------
# Read all date-wise CSV files
# --------------------------------------------------

for file in sorted(
    DATA_DIR.glob("202*_*.csv")
):

    df = pd.read_csv(file)

    # Add Date from filename
    df["Date"] = pd.to_datetime(
        file.stem,
        format="%Y_%m_%d"
    )

    # Keep only NABIL
    nabil = df[
        df["Symbol"] == "NABIL"
    ]

    if not nabil.empty:
        all_data.append(nabil)


# --------------------------------------------------
# Combine all NABIL records
# --------------------------------------------------

df = pd.concat(
    all_data,
    ignore_index=True
)


# --------------------------------------------------
# Convert numeric columns correctly
# --------------------------------------------------

numeric_columns = [
    "Open",
    "High",
    "Low",
    "Close",
    "VWAP",
    "Vol",
    "Prev. Close",
    "Turnover",
    "Trans.",
    "Diff",
    "Range",
    "Diff %",
    "Range %",
    "VWAP %"
]

for col in numeric_columns:

    df[col] = (
        df[col]
        .astype(str)
        .str.replace(",", "", regex=False)
    )

    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )


print("NABIL shape:", df.shape)


# --------------------------------------------------
# Check missing values
# --------------------------------------------------

print("\nMissing NABIL values:")

print(
    df[
        [
            "Close",
            "Vol",
            "Prev. Close"
        ]
    ].isna().sum()
)


# --------------------------------------------------
# Apply backend preprocessing
# --------------------------------------------------

df_features = engineer_features(df)


print("\nLatest engineered values:")

print(
    df_features[
        [
            "Date",
            "Symbol",
            "Price_Change",
            "Return_3D",
            "Return_5D",
            "Volatility_5D",
            "Volume_Change",
            "MA5_Distance"
        ]
    ].tail(1)
)


# --------------------------------------------------
# Show latest raw NABIL rows
# --------------------------------------------------

print("\nLatest raw NABIL rows:")

print(
    df[
        [
            "Date",
            "Symbol",
            "Close",
            "Vol",
            "Prev. Close"
        ]
    ].tail(3)
)


# --------------------------------------------------
# Get final 16 features
# --------------------------------------------------

try:

    latest_features = get_latest_features(df)

    print("\nFinal 16 features:")

    print(latest_features)

except ValueError as e:

    print("\nFeature generation stopped:")

    print(e)


# --------------------------------------------------
# Test XGBoost prediction
# --------------------------------------------------

try:

    result = predict_stock_movement(df)

    print("\nXGBoost Prediction:")

    print("Movement:", result["prediction"])

    print("Confidence:", result["confidence"])

except Exception as e:

    print("\nPrediction error:")

    print(e)

