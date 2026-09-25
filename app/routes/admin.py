import re
import pandas as pd

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


    # =====================================================
    # UPLOAD SUMMARY
    # =====================================================

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


    # =====================================================
    # CREATE PREDICTION NOTIFICATION
    #
    # Only create notification when at least one
    # CSV file was successfully uploaded.
    #
    # Notification is created for users who have
    # enabled prediction_updates.
    # =====================================================

    if uploaded_files > 0:

        try:

            db.session.execute(
                text("""
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

                    FROM users u

                    LEFT JOIN notification_preferences np
                        ON np.user_id = u.id

                    WHERE u.role = 'user'

                    AND (
                        np.prediction_updates = TRUE
                        OR np.prediction_updates IS NULL
                    )
                """)
            )


            db.session.commit()


            print(
                "PREDICTION NOTIFICATION CREATED"
            )


        except Exception as e:

            db.session.rollback()

            print(
                "NOTIFICATION CREATION ERROR:",
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
        # TRAINING SAMPLES
        #
        # Current XGBoost training split:
        # 126,721 rows
        # =================================================

        training_samples = 126721


        # =================================================
        # XGBOOST TEST ACCURACY
        # =================================================

        model_accuracy = 53.35


        # =================================================
        # RECENT DATA
        #
        # Shows latest trading dates available in DB.
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
                "date": row.trade_date.strftime("%Y-%m-%d"),
                "records": int(row.records),
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

            "training_samples":
                training_samples,

            "model_accuracy":
                model_accuracy,

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