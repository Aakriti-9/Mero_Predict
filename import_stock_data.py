import os
import glob
import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv


# Load .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")


# Connect to MySQL
engine = create_engine(DATABASE_URL)


# CSV folder
DATA_DIR = r"C:\Users\omdae\Nepse_Dataset"


# Find all CSV files
all_files = glob.glob(
    os.path.join(DATA_DIR, "*.csv")
)

print("Total CSV files:", len(all_files))


# Columns needed by MySQL
COLUMN_MAPPING = {
    "Symbol": "symbol",
    "Date": "trade_date",
    "Open": "open",
    "High": "high",
    "Low": "low",
    "Close": "close",
    "VWAP": "vwap",
    "Vol": "volume",
    "Prev. Close": "prev_close",
    "Turnover": "turnover",
    "Trans.": "transactions"
}


total_rows = 0


for i, file in enumerate(all_files, start=1):

    filename = os.path.basename(file)

    try:
        date = pd.to_datetime(
            os.path.splitext(filename)[0],
            format="%Y_%m_%d"
        )
    except ValueError:
        print("Skipping:", filename)
        continue


    # Read CSV
    df = pd.read_csv(file)


    # Add date from filename
    df["Date"] = date


    # Check required columns
    missing = [
        col for col in COLUMN_MAPPING
        if col not in df.columns
    ]

    if missing:
        print(
            f"Skipping {filename} - missing columns: {missing}"
        )
        continue


    # Select required columns
    df = df[
        list(COLUMN_MAPPING.keys())
    ].copy()


    # Rename columns
    df.rename(
        columns=COLUMN_MAPPING,
        inplace=True
    )


    # Convert numeric columns
    numeric_columns = [
        "open",
        "high",
        "low",
        "close",
        "vwap",
        "volume",
        "prev_close",
        "turnover",
        "transactions"
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


    # Insert into MySQL
    df.to_sql(
        "stock_prices",
        con=engine,
        if_exists="append",
        index=False,
        chunksize=1000
    )


    total_rows += len(df)

    print(
        f"[{i}/{len(all_files)}] "
        f"{filename}: {len(df)} rows inserted"
    )


print()
print("Import completed.")
print("Total rows inserted:", total_rows)