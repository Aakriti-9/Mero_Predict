import pandas as pd
import numpy as np


# Exact 16 features used to train XGBoost
FINAL_FEATURES = [
    "Open",
    "High",
    "Low",
    "Close",
    "VWAP",
    "Vol",
    "Turnover",
    "Trans.",
    "Price_Change",
    "Range %",
    "VWAP %",
    "Return_3D",
    "Return_5D",
    "Volatility_5D",
    "Volume_Change",
    "MA5_Distance"
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Apply the same feature engineering used during model training.
    """

    df = df.copy()

    # Clean numeric market columns
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

    # Convert Date to datetime
    df["Date"] = pd.to_datetime(df["Date"])

    # Sort by company and date
    df = df.sort_values(
        ["Symbol", "Date"]
    ).reset_index(drop=True)

    # Price Change
    df["Price_Change"] = (
        df["Close"] - df["Prev. Close"]
    )

    # Daily Return
    df["Daily_Return"] = (
        (df["Close"] - df["Prev. Close"])
        / df["Prev. Close"]
    )

    # 5-day Moving Average
    df["MA_5"] = (
        df.groupby("Symbol")["Close"]
        .transform(
            lambda x: x.rolling(5).mean()
        )
    )

    # 10-day Moving Average
    df["MA_10"] = (
        df.groupby("Symbol")["Close"]
        .transform(
            lambda x: x.rolling(10).mean()
        )
    )

    # 20-day Moving Average
    df["MA_20"] = (
        df.groupby("Symbol")["Close"]
        .transform(
            lambda x: x.rolling(20).mean()
        )
    )

    # 3-day Return
    df["Return_3D"] = (
        df.groupby("Symbol")["Close"]
        .pct_change(periods=3)
    )

    # 5-day Return
    df["Return_5D"] = (
        df.groupby("Symbol")["Close"]
        .pct_change(periods=5)
    )

    # 5-day Volatility
    df["Volatility_5D"] = (
        df.groupby("Symbol")["Daily_Return"]
        .transform(
            lambda x: x.rolling(5).std()
        )
    )

    # Volume Change
    df["Volume_Change"] = (
        df.groupby("Symbol")["Vol"]
        .pct_change()
    )

    # Distance from 5-day Moving Average
    df["MA5_Distance"] = (
        (df["Close"] - df["MA_5"])
        / df["MA_5"]
    )

    return df


def get_latest_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Takes recent historical data for one stock,
    creates the required features,
    and returns the latest row ready for XGBoost.
    """

    # Create features
    df = engineer_features(df)

    # Remove rows where required features
    # cannot yet be calculated
    df = df.dropna(
        subset=FINAL_FEATURES
    )

    if df.empty:
        raise ValueError(
            "Not enough historical data to compute all required features."
        )

    # Return only the latest row
    return df.iloc[[-1]][FINAL_FEATURES]