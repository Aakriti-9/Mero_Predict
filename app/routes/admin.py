import re
import json
import pandas as pd
import joblib
import numpy as np

from pathlib import Path
from datetime import datetime

from flask import (
    Blueprint,
    render_template,
    request,
    flash,
    redirect,
    url_for,
    jsonify
)

from flask_login import login_required

from sqlalchemy import text

from sklearn.metrics import ( 
    accuracy_score, 
    precision_score,
    recall_score,
    f1_score, 
    roc_auc_score 

) 

from xgboost import XGBClassifier

from app.extensions import db


admin = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin"
)


# =========================================================
# ADMIN PANEL
# =========================================================

@admin.route("/")
@login_required
def panel():

    return render_template(
        "admin_panel.html"
    )


# =========================================================
# CSV UPLOAD
# =========================================================

@admin.route("/upload", methods=["GET", "POST"])
@login_required
def upload():

    if request.method == "GET":

        return render_template(
            "admin_panel.html"
        )


    files = request.files.getlist("files")


    if not files or all(
        file.filename == ""
        for file in files
    ):

        flash(
            "Please select at least one CSV file.",
            "error"
        )

        return redirect(
            url_for("admin.upload")
        )


    total_rows = 0
    uploaded_files = 0


    # =====================================================
    # PROCESS EACH CSV FILE
    # =====================================================

    for file in files:

        filename = file.filename


        # =================================================
        # CHECK CSV FILE
        # =================================================

        if not filename.lower().endswith(".csv"):

            print(
                f"UPLOAD SKIPPED: {filename} - Not a CSV"
            )

            flash(
                f"{filename} is not a CSV file.",
                "error"
            )

            continue


        try:

            print()
            print(
                f"PROCESSING FILE: {filename}"
            )


            # =================================================
            # READ CSV
            # =================================================

            df = pd.read_csv(file)

            print(
                f"CSV rows read: {len(df)}"
            )


            # =================================================
            # REQUIRED STOCK COLUMNS
            # =================================================

            required_columns = [
                "Symbol",
                "Open",
                "High",
                "Low",
                "Close",
                "VWAP",
                "Vol",
                "Prev. Close",
                "Turnover",
                "Trans."
            ]


            missing_columns = [
                col
                for col in required_columns
                if col not in df.columns
            ]


            if missing_columns:

                print(
                    f"UPLOAD FAILED: {filename}"
                )

                print(
                    f"Missing columns: {missing_columns}"
                )

                flash(
                    f"{filename} is missing columns: "
                    f"{missing_columns}",
                    "error"
                )

                continue


            # =================================================
            # EXTRACT DATE FROM FILENAME
            #
            # Example:
            # 2026_09_24.csv
            # 2026_09_24 (1).csv
            # =================================================

            date_match = re.search(
                r"\d{4}_\d{2}_\d{2}",
                filename
            )


            if not date_match:

                print(
                    f"UPLOAD FAILED: {filename}"
                )

                print(
                    "Could not find date in filename."
                )

                flash(
                    f"{filename}: Could not determine "
                    f"trade date from filename.",
                    "error"
                )

                continue


            trade_date = pd.to_datetime(
                date_match.group(),
                format="%Y_%m_%d"
            )


            print(
                f"Trade date detected: "
                f"{trade_date.date()}"
            )


            # =================================================
            # CHECK DUPLICATE DATE
            # =================================================

            existing_date = db.session.execute(
                text("""
                    SELECT COUNT(*)
                    FROM stock_prices
                    WHERE trade_date = :trade_date
                """),
                {
                    "trade_date": trade_date.date()
                }
            ).scalar()


            if existing_date and existing_date > 0:

                print(
                    f"UPLOAD SKIPPED: {filename}"
                )

                print(
                    f"Data for {trade_date.date()} "
                    f"already exists."
                )

                flash(
                    f"{filename}: Data for "
                    f"{trade_date.date()} already exists. "
                    f"Upload skipped.",
                    "error"
                )

                continue


            # =================================================
            # SELECT REQUIRED COLUMNS
            # =================================================

            df = df[
                required_columns
            ].copy()


            # =================================================
            # RENAME COLUMNS FOR MYSQL
            # =================================================

            df.rename(
                columns={
                    "Symbol": "symbol",
                    "Open": "open",
                    "High": "high",
                    "Low": "low",
                    "Close": "close",
                    "VWAP": "vwap",
                    "Vol": "volume",
                    "Prev. Close": "prev_close",
                    "Turnover": "turnover",
                    "Trans.": "transactions"
                },
                inplace=True
            )


            # =================================================
            # ADD TRADE DATE
            # =================================================

            df["trade_date"] = trade_date


            # =================================================
            # CONVERT NUMERIC COLUMNS
            # =================================================

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
                    .str.replace(
                        ",",
                        "",
                        regex=False
                    )
                )

                df[col] = pd.to_numeric(
                    df[col],
                    errors="coerce"
                )


            # =================================================
            # CLEAN SYMBOL
            # =================================================

            df["symbol"] = (
                df["symbol"]
                .astype(str)
                .str.strip()
            )


            # =================================================
            # REMOVE INVALID ROWS
            # =================================================

            df.dropna(
                subset=[
                    "symbol",
                    "trade_date",
                    "close"
                ],
                inplace=True
            )


            valid_rows = len(df)


            print(
                f"Valid rows: {valid_rows}"
            )


            if valid_rows == 0:

                print(
                    f"UPLOAD FAILED: {filename} "
                    f"- No valid rows"
                )

                flash(
                    f"{filename} contains no valid "
                    f"NEPSE records.",
                    "error"
                )

                continue


            # =================================================
            # INSERT INTO MYSQL
            # =================================================

            df.to_sql(
                "stock_prices",
                con=db.engine,
                if_exists="append",
                index=False,
                chunksize=1000
            )


            total_rows += valid_rows
            uploaded_files += 1


            print(
                f"UPLOAD SUCCESS: {filename} "
                f"-> {valid_rows} rows inserted"
            )


            flash(
                f"{filename} uploaded successfully "
                f"({valid_rows} records).",
                "success"
            )


        except Exception as e:

            print()

            print(
                f"UPLOAD ERROR: {filename}"
            )

            print(
                str(e)
            )

            flash(
                f"Failed to upload {filename}: "
                f"{str(e)}",
                "error"
            )


    # =========================================================
    # UPLOAD SUMMARY
    # =========================================================

    print()
    print(
        "======================================"
    )
    print(
        "UPLOAD SUMMARY"
    )
    print(
        f"Files uploaded: {uploaded_files}"
    )
    print(
        f"Total rows inserted: {total_rows}"
    )
    print(
        "======================================"
    )


    # =========================================================
    # CREATE PREDICTION NOTIFICATION
    # =========================================================

    if uploaded_files > 0:

        try:

            notification_sql = text("""
                INSERT INTO notifications (
                    user_id,
                    title,
                    message,
                    notification_type,
                    is_read
                )

                SELECT
                    u.id,
                    'Prediction Updated',
                    'Today''s stock predictions have been updated.',
                    'prediction',
                    FALSE

                FROM users AS u

                LEFT JOIN notification_preferences AS np
                    ON np.user_id = u.id

                WHERE u.role = 'user'

                AND (
                    np.prediction_updates = TRUE
                    OR np.prediction_updates IS NULL
                )
            """)


            result = db.session.execute(
                notification_sql
            )


            db.session.commit()


            print()
            print(
                "======================================"
            )
            print(
                "PREDICTION NOTIFICATION CREATED"
            )
            print(
                f"Notification rows inserted: "
                f"{result.rowcount}"
            )
            print(
                "======================================"
            )


        except Exception as e:

            db.session.rollback()

            print()
            print(
                "NOTIFICATION CREATION ERROR:"
            )

            print(
                str(e)
            )


        flash(
            f"Upload completed: "
            f"{uploaded_files} file(s), "
            f"{total_rows} records.",
            "success"
        )


    return redirect(
        url_for("admin.upload")
    )


# =========================================================
# ADMIN STATISTICS API
# =========================================================

@admin.route("/api/stats")
@login_required
def stats():

    try:

        # =================================================
        # TOTAL COMPANIES
        # =================================================

        total_companies = db.session.execute(
            text("""
                SELECT COUNT(DISTINCT symbol)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # TOTAL RECORDS
        # =================================================

        total_records = db.session.execute(
            text("""
                SELECT COUNT(*)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # LATEST TRADE DATE
        # =================================================

        latest_date = db.session.execute(
            text("""
                SELECT MAX(trade_date)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # RECENT DATA
        # =================================================

        recent_data = db.session.execute(
            text("""
                SELECT
                    trade_date,
                    COUNT(*) AS records
                FROM stock_prices
                GROUP BY trade_date
                ORDER BY trade_date DESC
                LIMIT 5
            """)
        ).fetchall()


        recent_uploads = []


        for row in recent_data:

            recent_uploads.append({

                "date": (
                    row.trade_date.strftime("%Y-%m-%d")
                    if row.trade_date
                    else None
                ),

                "records": int(
                    row.records or 0
                ),

                "status": "Success"

            })


        # =================================================
        # RETURN JSON
        # =================================================

        return jsonify({

            "success": True,

            "total_companies": int(
                total_companies or 0
            ),

            "total_records": int(
                total_records or 0
            ),

            # Model evaluation metrics are loaded
            # separately from /api/model.
            "model_accuracy": None,

            # Training sample count is loaded
            # separately from /api/model.
            "training_samples": 0,

            "latest_date": (
                latest_date.strftime("%Y-%m-%d")
                if latest_date
                else None
            ),

            "recent_uploads":
                recent_uploads

        })


    except Exception as e:

        print(
            "ADMIN STATS ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


# =========================================================
# MANAGE COMPANIES API
# =========================================================

@admin.route("/api/companies")
@login_required
def companies():

    try:

        rows = db.session.execute(
            text("""
                SELECT
                    sp.symbol,
                    cs.sector,
                    MIN(sp.trade_date) AS first_date,
                    MAX(sp.trade_date) AS latest_date,
                    COUNT(*) AS records

                FROM stock_prices AS sp

                LEFT JOIN company_sectors AS cs
                    ON sp.symbol = cs.symbol

                GROUP BY
                    sp.symbol,
                    cs.sector

                ORDER BY
                    sp.symbol
            """)
        ).fetchall()


        companies_data = []


        for row in rows:

            companies_data.append({

                "symbol":
                    row.symbol,

                "name":
                    row.symbol,

                "sector":
                    row.sector
                    if row.sector
                    else "N/A",

                "listed_shares":
                    None,

                "eps":
                    None,

                "status":
                    "Active",

                "records":
                    int(row.records or 0),

                "first_date": (
                    row.first_date.strftime("%Y-%m-%d")
                    if row.first_date
                    else None
                ),

                "latest_date": (
                    row.latest_date.strftime("%Y-%m-%d")
                    if row.latest_date
                    else None
                )

            })


        return jsonify({

            "success": True,

            "companies":
                companies_data

        })


    except Exception as e:

        print(
            "COMPANY API ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


# =========================================================
# MODEL PERFORMANCE API
# =========================================================

@admin.route("/api/model")
@login_required
def model_performance():

    try:

        # =================================================
        # MODEL PATH
        # =================================================

        base_dir = Path(
            __file__
        ).resolve().parents[2]


        model_path = (
            base_dir
            / "ml_models"
            / "final_xgboost_model.pkl"
        )


        # =================================================
        # CHECK MODEL FILE
        # =================================================

        if not model_path.exists():

            return jsonify({

                "success": True,

                "accuracy": None,
                "precision": None,
                "recall": None,
                "f1": None,
                "roc_auc": None,

                "message":
                    "Saved XGBoost model file was not found."

            })


        # =================================================
        # LOAD MODEL
        # =================================================

        model = joblib.load(
            model_path
        )


        # =================================================
        # MODEL INFORMATION
        #
        # Evaluation metrics are NOT calculated here because
        # the saved model alone does not contain the original
        # validation/test labels.
        # =================================================

        model_name = type(
            model
        ).__name__


        print(
            f"MODEL LOADED: {model_name}"
        )


        return jsonify({

            "success": True,

            "accuracy": None,

            "precision": None,

            "recall": None,

            "f1": None,

            "roc_auc": None,

            "model_name":
                model_name,

            "message":
                "Evaluation metrics are not stored with the saved model."

        })


    except Exception as e:

        print(
            "MODEL API ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500

# =========================================================
# DATA STATISTICS API
# =========================================================

@admin.route("/api/data-statistics")
@login_required
def data_statistics():

    try:

        # =================================================
        # TOTAL RECORDS
        # =================================================

        total_records = db.session.execute(
            text("""
                SELECT COUNT(*)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # TOTAL COMPANIES
        # =================================================

        total_companies = db.session.execute(
            text("""
                SELECT COUNT(DISTINCT symbol)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # FIRST TRADING DATE
        # =================================================

        first_date = db.session.execute(
            text("""
                SELECT MIN(trade_date)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # LATEST TRADING DATE
        # =================================================

        latest_date = db.session.execute(
            text("""
                SELECT MAX(trade_date)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # TOTAL TRADING DAYS
        # =================================================

        total_trading_days = db.session.execute(
            text("""
                SELECT COUNT(DISTINCT trade_date)
                FROM stock_prices
            """)
        ).scalar()


        # =================================================
        # SECTOR INFORMATION
        # =================================================

        sector_rows = db.session.execute(
            text("""
                SELECT
                    cs.sector,
                    COUNT(DISTINCT sp.symbol) AS companies,
                    COUNT(sp.id) AS records

                FROM stock_prices AS sp

                INNER JOIN company_sectors AS cs
                    ON sp.symbol = cs.symbol

                GROUP BY
                    cs.sector

                ORDER BY
                    companies DESC
            """)
        ).fetchall()


        sectors = []


        for row in sector_rows:

            sectors.append({

                "sector":
                    row.sector,

                "companies":
                    int(row.companies or 0),

                "records":
                    int(row.records or 0)

            })


        # =================================================
        # FEATURE IMPORTANCE
        # =================================================

        feature_importance = []


        try:

            base_dir = Path(
                __file__
            ).resolve().parents[2]


            model_path = (
                base_dir
                / "ml_models"
                / "final_xgboost_model.pkl"
            )


            feature_path = (
                base_dir
                / "ml_models"
                / "feature_columns.pkl"
            )


            if (
                model_path.exists()
                and feature_path.exists()
            ):

                model = joblib.load(
                    model_path
                )


                feature_columns = joblib.load(
                    feature_path
                )


                if hasattr(
                    model,
                    "feature_importances_"
                ):

                    importances = (
                        model.feature_importances_
                    )


                    for name, importance in zip(
                        feature_columns,
                        importances
                    ):

                        feature_importance.append({

                            "name":
                                name,

                            "importance":
                                float(importance)

                        })


                    feature_importance.sort(
                        key=lambda item:
                            item["importance"],
                        reverse=True
                    )


        except Exception as model_error:

            print(
                "FEATURE IMPORTANCE ERROR:",
                str(model_error)
            )


        # =================================================
        # RETURN JSON
        # =================================================

        return jsonify({

            "success": True,

            "total_trading_days":
                int(
                    total_trading_days or 0
                ),

            "total_price_records":
                int(
                    total_records or 0
                ),

            "total_companies":
                int(
                    total_companies or 0
                ),

            "first_trading_date": (
                first_date.strftime("%Y-%m-%d")
                if first_date
                else None
            ),

            "latest_trading_date": (
                latest_date.strftime("%Y-%m-%d")
                if latest_date
                else None
            ),

            "total_sectors":
                len(sectors),

            "sectors":
                sectors,

            "feature_importance":
                feature_importance

        })


    except Exception as e:

        print(
            "DATA STATISTICS API ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500



@admin.route("/api/train-model", methods=["POST"])
@login_required
def train_model():

    try:

        print("MODEL TRAINING: Loading data from database...")

        # =========================================================
        # 1. LOAD STOCK DATA
        # =========================================================

        df = pd.read_sql(
            text("""
                SELECT
                    symbol,
                    trade_date,
                    open,
                    high,
                    low,
                    close,
                    vwap,
                    volume,
                    prev_close,
                    turnover,
                    transactions
                FROM stock_prices
                ORDER BY trade_date, symbol
            """),
            db.engine
        )

        if df.empty:
            return jsonify({
                "success": False,
                "message": "No stock data is available for training."
            }), 400

        print(
            f"MODEL TRAINING: Loaded {len(df):,} records."
        )

        # =========================================================
        # 2. CONVERT DATABASE COLUMN NAMES
        #    TO THE SAME FORMAT USED DURING ORIGINAL TRAINING
        # =========================================================

        df = df.rename(columns={
            "symbol": "Symbol",
            "trade_date": "Date",
            "open": "Open",
            "high": "High",
            "low": "Low",
            "close": "Close",
            "vwap": "VWAP",
            "volume": "Vol",
            "prev_close": "Prev. Close",
            "turnover": "Turnover",
            "transactions": "Trans."
        })

        # =========================================================
        # 3. CREATE REQUIRED COLUMNS
        # =========================================================

        df["Diff"] = (
            df["Close"] - df["Prev. Close"]
        )

        df["Range"] = (
            df["High"] - df["Low"]
        )

        df["Diff %"] = (
            df["Diff"] / df["Prev. Close"]
        )

        df["Range %"] = (
            df["Range"] / df["Prev. Close"]
        )

        df["VWAP %"] = (
            (df["VWAP"] - df["Prev. Close"])
            / df["Prev. Close"]
        )

        # =========================================================
        # 4. SORT DATA
        # =========================================================

        df["Date"] = pd.to_datetime(
            df["Date"]
        )

        df = df.sort_values(
            ["Date", "Symbol"]
        ).reset_index(drop=True)

        # =========================================================
        # 5. CREATE TARGET
        #
        # Target = 1 if the NEXT trading day's Close
        # is higher than today's Close.
        #
        # Target = 0 otherwise.
        # =========================================================

        next_close = (
            df.groupby("Symbol")["Close"]
            .shift(-1)
        )

        df["Target"] = np.where(
            next_close > df["Close"],
            1,
            0
        )

        # Remove the final row of each company
        # because it has no next-day price.
        df = df[
            df.groupby("Symbol")["Close"]
            .transform("count") > 1
        ].copy()

        # =========================================================
        # 6. FEATURE ENGINEERING
        # =========================================================

        from app.ml.preprocessing import engineer_features

        print(
            "MODEL TRAINING: Engineering features..."
        )

        df = engineer_features(df)

        # =========================================================
        # 7. REMOVE ROWS WITH MISSING FEATURES
        # =========================================================

        final_features = [
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

        df = df.dropna(
            subset=final_features + ["Target"]
        ).copy()

        if df.empty:
            return jsonify({
                "success": False,
                "message":
                    "Not enough valid data after feature engineering."
            }), 400

        print(
            f"MODEL TRAINING: {len(df):,} usable samples."
        )

        # =========================================================
        # 8. CHRONOLOGICAL 60 / 20 / 20 SPLIT
        # =========================================================

        unique_dates = sorted(
            df["Date"].unique()
        )

        if len(unique_dates) < 10:
            return jsonify({
                "success": False,
                "message":
                    "Not enough trading days for model training."
            }), 400

        train_end = int(
            0.6 * len(unique_dates)
        )

        val_end = int(
            0.8 * len(unique_dates)
        )

        train_dates = unique_dates[
            :train_end
        ]

        val_dates = unique_dates[
            train_end:val_end
        ]

        test_dates = unique_dates[
            val_end:
        ]

        train_data = df[
            df["Date"].isin(train_dates)
        ].copy()

        val_data = df[
            df["Date"].isin(val_dates)
        ].copy()

        test_data = df[
            df["Date"].isin(test_dates)
        ].copy()

        if (
            train_data.empty
            or val_data.empty
            or test_data.empty
        ):
            return jsonify({
                "success": False,
                "message":
                    "Unable to create train, validation and test datasets."
            }), 400

        print(
            "MODEL TRAINING: "
            f"Train={len(train_data):,}, "
            f"Validation={len(val_data):,}, "
            f"Test={len(test_data):,}"
        )

        # =========================================================
        # 9. CREATE X / Y DATA
        # =========================================================

        X_train = train_data[
            final_features
        ]

        y_train = train_data[
            "Target"
        ]

        X_val = val_data[
            final_features
        ]

        y_val = val_data[
            "Target"
        ]

        X_test = test_data[
            final_features
        ]

        y_test = test_data[
            "Target"
        ]

        # =========================================================
        # 10. TRAIN XGBOOST
        #     SAME CONFIGURATION AS ORIGINAL MODEL
        # =========================================================

        negative_count = (
            y_train == 0
        ).sum()

        positive_count = (
            y_train == 1
        ).sum()

        if positive_count == 0:
            return jsonify({
                "success": False,
                "message":
                    "Training data contains no positive target samples."
            }), 400

        scale_pos_weight = (
            negative_count / positive_count
        )

        print(
            "MODEL TRAINING: Training XGBoost..."
        )

        model = XGBClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.05,
            min_child_weight=5,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            n_jobs=-1,
            eval_metric="logloss"
        )

        model.fit(
            X_train,
            y_train
        )

        # =========================================================
        # 11. VALIDATION PREDICTIONS
        # =========================================================

        y_val_pred = model.predict(
            X_val
        )

        y_val_prob = model.predict_proba(
            X_val
        )[:, 1]

        # =========================================================
        # 12. TEST PREDICTIONS
        # =========================================================

        y_test_pred = model.predict(
            X_test
        )

        y_test_prob = model.predict_proba(
            X_test
        )[:, 1]

        # =========================================================
        # 13. CALCULATE TEST METRICS
        # =========================================================

        accuracy = accuracy_score(
            y_test,
            y_test_pred
        )

        precision = precision_score(
            y_test,
            y_test_pred,
            zero_division=0
        )

        recall = recall_score(
            y_test,
            y_test_pred,
            zero_division=0
        )

        f1 = f1_score(
            y_test,
            y_test_pred,
            zero_division=0
        )

        try:
            roc_auc = roc_auc_score(
                y_test,
                y_test_prob
            )
        except ValueError:
            roc_auc = None

        # =========================================================
        # 14. SAVE MODEL
        # =========================================================

        base_dir = Path(
            __file__
        ).resolve().parents[2]

        model_dir = (
            base_dir / "ml_models"
        )

        model_dir.mkdir(
            parents=True,
            exist_ok=True
        )

        model_path = (
            model_dir /
            "final_xgboost_model.pkl"
        )

        feature_path = (
            model_dir /
            "feature_columns.pkl"
        )

        joblib.dump(
            model,
            model_path
        )

        joblib.dump(
            final_features,
            feature_path
        )

        print(
            "MODEL TRAINING: Model saved successfully."
        )

        # =========================================================
        # 15. RETURN RESULTS TO ADMIN PANEL
        # =========================================================

        return jsonify({
            "success": True,

            "accuracy": float(
                accuracy
            ),

            "precision": float(
                precision
            ),

            "recall": float(
                recall
            ),

            "f1": float(
                f1
            ),

            "roc_auc": (
                float(roc_auc)
                if roc_auc is not None
                else None
            ),

            "model_name":
                "XGBoost Classifier",

            "training_samples":
                int(len(train_data)),

            "validation_samples":
                int(len(val_data)),

            "test_samples":
                int(len(test_data)),

            "train_start":
                train_data["Date"]
                .min()
                .strftime("%Y-%m-%d"),

            "train_end":
                train_data["Date"]
                .max()
                .strftime("%Y-%m-%d"),

            "validation_start":
                val_data["Date"]
                .min()
                .strftime("%Y-%m-%d"),

            "validation_end":
                val_data["Date"]
                .max()
                .strftime("%Y-%m-%d"),

            "test_start":
                test_data["Date"]
                .min()
                .strftime("%Y-%m-%d"),

            "test_end":
                test_data["Date"]
                .max()
                .strftime("%Y-%m-%d"),

            "features":
                final_features,

            "message":
                "Model trained and saved successfully."
        })

    except Exception as e:

        print(
            "MODEL TRAINING API ERROR:",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

