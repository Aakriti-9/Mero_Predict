from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user

from app.extensions import db
from app.ml.predictor import predict_stock_movement

from sqlalchemy import text
import pandas as pd


watchlist = Blueprint(
    "watchlist",
    __name__
)


# =========================================================
# WATCHLIST PAGE
# =========================================================

@watchlist.route("/watchlist")
@login_required
def index():

    return render_template(
        "watchlist.html"
    )


# =========================================================
# GET WATCHLIST + PREDICTIONS
# =========================================================

@watchlist.route("/api/watchlist")
@login_required
def get_watchlist():

    print(
        "LOGGED-IN USER ID:",
        current_user.id
    )


    # -----------------------------------------------------
    # GET WATCHLIST STOCKS
    # -----------------------------------------------------

    query = text("""
        SELECT
            sp.symbol,
            sp.close,
            sp.prev_close,
            sp.volume,
            sp.trade_date
        FROM stock_prices sp

        INNER JOIN watchlist w
            ON w.symbol = sp.symbol

        INNER JOIN (
            SELECT
                symbol,
                MAX(trade_date) AS latest_date
            FROM stock_prices
            GROUP BY symbol
        ) latest

            ON sp.symbol = latest.symbol
            AND sp.trade_date = latest.latest_date

        WHERE w.user_id = :user_id

        ORDER BY w.created_at DESC
    """)


    result = db.session.execute(
        query,
        {
            "user_id": current_user.id
        }
    )


    stocks = []


    # =====================================================
    # PROCESS EACH WATCHLIST STOCK
    # =====================================================

    for row in result:

        close = float(
            row.close or 0
        )

        prev_close = float(
            row.prev_close or 0
        )


        # -------------------------------------------------
        # DAILY CHANGE
        # -------------------------------------------------

        if prev_close != 0:

            change = (
                (close - prev_close)
                / prev_close
            ) * 100

        else:

            change = 0


        # -------------------------------------------------
        # DEFAULT PREDICTION
        # -------------------------------------------------

        prediction = None
        confidence = None


        # -------------------------------------------------
        # GET HISTORICAL DATA FOR THIS STOCK
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
            {
                "symbol": row.symbol
            }
        )


        history_rows = history_result.fetchall()


        # -------------------------------------------------
        # CREATE DATAFRAME
        # -------------------------------------------------

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
            # CREATE REQUIRED RAW COLUMNS
            # -------------------------------------------------

            history_df["Diff"] = (
                history_df["Close"]
                - history_df["Prev. Close"]
            )


            history_df["Range"] = (
                history_df["High"]
                - history_df["Low"]
            )


            history_df["Diff %"] = (
                history_df["Diff"]
                / history_df["Prev. Close"]
            ) * 100


            history_df["Range %"] = (
                history_df["Range"]
                / history_df["Close"]
            ) * 100


            history_df["VWAP %"] = (
                (
                    history_df["Close"]
                    - history_df["VWAP"]
                )
                / history_df["VWAP"]
            ) * 100


            # -------------------------------------------------
            # RUN XGBOOST PREDICTION
            # -------------------------------------------------

            try:

                result_prediction = (
                    predict_stock_movement(
                        history_df
                    )
                )


                prediction = (
                    result_prediction["prediction"]
                )


                confidence = (
                    result_prediction["confidence"]
                )


            except Exception as error:

                print(
                    f"Prediction error for "
                    f"{row.symbol}: {error}"
                )


        # -------------------------------------------------
        # ADD STOCK RESULT
        # -------------------------------------------------

        stocks.append({

            "symbol": row.symbol,

            "price": round(
                close,
                2
            ),

            "change": round(
                change,
                2
            ),

            "volume": int(
                row.volume or 0
            ),

            "trade_date": (
                row.trade_date.strftime(
                    "%Y-%m-%d"
                )
                if row.trade_date
                else None
            ),

            "prediction": prediction,

            "confidence": (
                round(
                    confidence * 100,
                    2
                )
                if confidence is not None
                else None
            )

        })


    # =====================================================
    # RETURN JSON
    # =====================================================

    return jsonify({

        "success": True,

        "stocks": stocks

    })


# =========================================================
# ADD TO WATCHLIST
# =========================================================

@watchlist.route(
    "/api/watchlist/add",
    methods=["POST"]
)
@login_required
def add_to_watchlist():

    data = request.get_json(
        silent=True
    ) or {}


    symbol = str(
        data.get("symbol", "")
    ).strip().upper()


    if not symbol:

        return jsonify({

            "success": False,

            "message":
                "Stock symbol is required."

        }), 400


    # -----------------------------------------------------
    # CHECK STOCK EXISTS
    # -----------------------------------------------------

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

            "message":
                "Stock not found."

        }), 404


    # -----------------------------------------------------
    # CHECK DUPLICATE
    # -----------------------------------------------------

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

            "message":
                "Stock already exists in watchlist."

        }), 409


    # -----------------------------------------------------
    # INSERT
    # -----------------------------------------------------

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

        "message":
            f"{symbol} added to watchlist."

    })


# =========================================================
# REMOVE FROM WATCHLIST
# =========================================================

@watchlist.route(
    "/api/watchlist/remove",
    methods=["POST"]
)
@login_required
def remove_from_watchlist():

    data = request.get_json(
        silent=True
    ) or {}


    symbol = str(
        data.get("symbol", "")
    ).strip().upper()


    if not symbol:

        return jsonify({

            "success": False,

            "message":
                "Stock symbol is required."

        }), 400


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

        "message":
            f"{symbol} removed from watchlist."

    })

