from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user
from app.extensions import db
from app.ml.predictor import predict_stock_movement
from sqlalchemy import text
import pandas as pd


watchlist = Blueprint("watchlist", __name__)


# =========================================================
# WATCHLIST PAGE
# =========================================================

@watchlist.route("/watchlist")
@login_required
def index():
    return render_template("watchlist.html")


# =========================================================
# GET PERSONAL WATCHLIST
# =========================================================

@watchlist.route("/api/watchlist")
@login_required
def get_watchlist():

    print("LOGGED-IN USER ID:", current_user.id)

    query = text("""
        SELECT
            w.symbol,
            sp.close,
            sp.prev_close,
            sp.volume,
            sp.trade_date
        FROM watchlist w
        LEFT JOIN stock_prices sp
            ON sp.symbol = w.symbol
            AND sp.trade_date = (
                SELECT MAX(sp2.trade_date)
                FROM stock_prices sp2
                WHERE sp2.symbol = w.symbol
            )
        WHERE w.user_id = :user_id
        ORDER BY w.created_at DESC
    """)

    result = db.session.execute(
        query,
        {"user_id": current_user.id}
    )

    stocks = []

    for row in result:

        # -------------------------------------------------
        # Latest price information
        # -------------------------------------------------

        close = float(row.close or 0)
        prev_close = float(row.prev_close or 0)

        if prev_close != 0:
            change = (
                (close - prev_close) / prev_close
            ) * 100
        else:
            change = 0

        prediction = None
        confidence = None

        # -------------------------------------------------
        # Get historical data for prediction
        # -------------------------------------------------

        history_query = text("""
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
            WHERE symbol = :symbol
            ORDER BY trade_date ASC
        """)

        history_result = db.session.execute(
            history_query,
            {"symbol": row.symbol}
        )

        history_rows = history_result.fetchall()

        if history_rows:

            history_df = pd.DataFrame(
                history_rows,
                columns=[
                    "Symbol",
                    "Date",
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
            )

            # -------------------------------------------------
            # FIX:
            # Convert MySQL Decimal values into float values
            # before doing Pandas calculations.
            # -------------------------------------------------

            numeric_columns = [
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

            for column in numeric_columns:

                history_df[column] = pd.to_numeric(
                    history_df[column],
                    errors="coerce"
                ).astype(float)

            # -------------------------------------------------
            # Convert date
            # -------------------------------------------------

            history_df["Date"] = pd.to_datetime(
                history_df["Date"],
                errors="coerce"
            )

            # -------------------------------------------------
            # Remove invalid rows
            # -------------------------------------------------

            history_df = history_df.dropna(
                subset=[
                    "Open",
                    "High",
                    "Low",
                    "Close",
                    "VWAP",
                    "Prev. Close"
                ]
            ).copy()

            # -------------------------------------------------
            # Derived features
            # -------------------------------------------------

            history_df["Diff"] = (
                history_df["Close"]
                - history_df["Prev. Close"]
            ).astype(float)

            history_df["Range"] = (
                history_df["High"]
                - history_df["Low"]
            ).astype(float)

            # Avoid division by zero
            history_df["Diff %"] = 0.0

            valid_prev_close = (
                history_df["Prev. Close"] != 0
            )

            history_df.loc[
                valid_prev_close,
                "Diff %"
            ] = (
                history_df.loc[
                    valid_prev_close,
                    "Diff"
                ]
                / history_df.loc[
                    valid_prev_close,
                    "Prev. Close"
                ]
            ) * 100

            # -------------------------------------------------
            # Range %
            # -------------------------------------------------

            history_df["Range %"] = 0.0

            valid_close = (
                history_df["Close"] != 0
            )

            history_df.loc[
                valid_close,
                "Range %"
            ] = (
                history_df.loc[
                    valid_close,
                    "Range"
                ]
                / history_df.loc[
                    valid_close,
                    "Close"
                ]
            ) * 100

            # -------------------------------------------------
            # VWAP %
            # -------------------------------------------------

            history_df["VWAP %"] = 0.0

            valid_vwap = (
                history_df["VWAP"] != 0
            )

            history_df.loc[
                valid_vwap,
                "VWAP %"
            ] = (
                (
                    history_df.loc[
                        valid_vwap,
                        "Close"
                    ]
                    -
                    history_df.loc[
                        valid_vwap,
                        "VWAP"
                    ]
                )
                /
                history_df.loc[
                    valid_vwap,
                    "VWAP"
                ]
            ) * 100

            # -------------------------------------------------
            # Make sure calculated columns are float
            # -------------------------------------------------

            calculated_columns = [
                "Diff",
                "Range",
                "Diff %",
                "Range %",
                "VWAP %"
            ]

            for column in calculated_columns:
                history_df[column] = pd.to_numeric(
                    history_df[column],
                    errors="coerce"
                ).astype(float)

            # -------------------------------------------------
            # Prediction
            # -------------------------------------------------

            try:

                if len(history_df) >= 10:

                    result_prediction = predict_stock_movement(
                        history_df
                    )

                    prediction = result_prediction.get(
                        "prediction"
                    )

                    confidence = result_prediction.get(
                        "confidence"
                    )

            except Exception as error:

                print(
                    f"Prediction error for {row.symbol}: {error}"
                )

        # -------------------------------------------------
        # Add stock to response
        # -------------------------------------------------

        stocks.append({
            "symbol": row.symbol,
            "price": round(close, 2),
            "change": round(change, 2),
            "volume": int(row.volume or 0),
            "trade_date": (
                row.trade_date.strftime("%Y-%m-%d")
                if row.trade_date
                else None
            ),
            "prediction": prediction,
            "confidence": (
                round(confidence * 100, 2)
                if confidence is not None
                else None
            )
        })

    return jsonify({
        "success": True,
        "stocks": stocks
    })


# =========================================================
# GET AVAILABLE STOCKS
# =========================================================
# Returns stocks that the current user has NOT added
# to their personal watchlist.
#
# The frontend can display only a few at a time, but
# after adding one, another available stock will appear.
# =========================================================

@watchlist.route("/api/watchlist/available")
@login_required
def get_available_stocks():

    query = text("""
        SELECT
            sp.symbol,
            sp.close,
            sp.prev_close
        FROM stock_prices sp
        INNER JOIN (
            SELECT
                symbol,
                MAX(trade_date) AS latest_date
            FROM stock_prices
            GROUP BY symbol
        ) latest
            ON sp.symbol = latest.symbol
            AND sp.trade_date = latest.latest_date
        WHERE sp.symbol NOT IN (
            SELECT symbol
            FROM watchlist
            WHERE user_id = :user_id
        )
        ORDER BY sp.symbol ASC
    """)

    result = db.session.execute(
        query,
        {"user_id": current_user.id}
    )

    stocks = []

    for row in result:

        close = float(row.close or 0)
        prev_close = float(row.prev_close or 0)

        if prev_close != 0:
            change = (
                (close - prev_close)
                / prev_close
            ) * 100
        else:
            change = 0

        stocks.append({
            "symbol": row.symbol,
            "change": round(change, 2)
        })

    return jsonify({
        "success": True,
        "stocks": stocks
    })


# =========================================================
# ADD STOCK TO WATCHLIST
# =========================================================

@watchlist.route("/api/watchlist/add", methods=["POST"])
@login_required
def add_to_watchlist():

    data = request.get_json(silent=True) or {}

    symbol = str(
        data.get("symbol", "")
    ).strip().upper()

    if not symbol:

        return jsonify({
            "success": False,
            "message": "Stock symbol is required."
        }), 400

    # -------------------------------------------------
    # Check whether stock exists
    # -------------------------------------------------

    exists = db.session.execute(
        text("""
            SELECT 1
            FROM stock_prices
            WHERE symbol = :symbol
            LIMIT 1
        """),
        {
            "symbol": symbol
        }
    ).first()

    if not exists:

        return jsonify({
            "success": False,
            "message": "Stock not found."
        }), 404

    # -------------------------------------------------
    # Check duplicate
    # -------------------------------------------------

    duplicate = db.session.execute(
        text("""
            SELECT id
            FROM watchlist
            WHERE user_id = :user_id
              AND symbol = :symbol
        """),
        {
            "user_id": current_user.id,
            "symbol": symbol
        }
    ).first()

    if duplicate:

        return jsonify({
            "success": False,
            "message": "Stock already exists in watchlist."
        }), 409

    # -------------------------------------------------
    # Add stock
    # -------------------------------------------------

    db.session.execute(
        text("""
            INSERT INTO watchlist
                (user_id, symbol)
            VALUES
                (:user_id, :symbol)
        """),
        {
            "user_id": current_user.id,
            "symbol": symbol
        }
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"{symbol} added to watchlist."
    })


# =========================================================
# REMOVE STOCK FROM WATCHLIST
# =========================================================

@watchlist.route("/api/watchlist/remove", methods=["POST"])
@login_required
def remove_from_watchlist():

    data = request.get_json(silent=True) or {}

    symbol = str(
        data.get("symbol", "")
    ).strip().upper()

    if not symbol:

        return jsonify({
            "success": False,
            "message": "Stock symbol is required."
        }), 400

    # -------------------------------------------------
    # Remove stock
    # -------------------------------------------------

    db.session.execute(
        text("""
            DELETE FROM watchlist
            WHERE user_id = :user_id
              AND symbol = :symbol
        """),
        {
            "user_id": current_user.id,
            "symbol": symbol
        }
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"{symbol} removed from watchlist."
    })