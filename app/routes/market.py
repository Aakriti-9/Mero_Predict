from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from sqlalchemy import text
import pandas as pd

from app.extensions import db
from app.ml.predictor import predict_stock_movement


market = Blueprint(
    "market",
    __name__
)


# =========================================================
# MARKET OVERVIEW PAGE
# =========================================================

@market.route("/market-overview")
@login_required
def market_overview():
    return render_template("market_overview.html")


# =========================================================
# MARKET OVERVIEW API
# =========================================================

@market.route("/api/market-overview")
@login_required
def market_overview_api():

    try:

        # -------------------------------------------------
        # Latest trading date
        # -------------------------------------------------

        latest_date_query = text("""
            SELECT MAX(trade_date)
            FROM stock_prices
        """)

        latest_date = db.session.execute(
            latest_date_query
        ).scalar()

        if latest_date is None:
            return jsonify({
                "error": "No stock data available."
            }), 404


        # -------------------------------------------------
        # Latest day's stock data
        # -------------------------------------------------

        latest_data_query = text("""
            SELECT
                symbol,
                close,
                prev_close,
                turnover
            FROM stock_prices
            WHERE trade_date = :latest_date
        """)

        result = db.session.execute(
            latest_data_query,
            {
                "latest_date": latest_date
            }
        )

        latest_rows = result.mappings().all()


        # -------------------------------------------------
        # Market breadth
        # -------------------------------------------------

        gainers = 0
        losers = 0
        unchanged = 0

        total_turnover = 0


        for row in latest_rows:

            close = row["close"]
            prev_close = row["prev_close"]
            turnover = row["turnover"]

            if close is None or prev_close is None:
                continue

            if close > prev_close:
                gainers += 1

            elif close < prev_close:
                losers += 1

            else:
                unchanged += 1

            if turnover is not None:
                total_turnover += float(turnover)


        # -------------------------------------------------
        # Last 20 trading days turnover
        # -------------------------------------------------

        turnover_query = text("""
            SELECT
                trade_date,
                SUM(turnover) AS total_turnover
            FROM stock_prices
            GROUP BY trade_date
            ORDER BY trade_date DESC
            LIMIT 20
        """)

        result = db.session.execute(
            turnover_query
        )

        turnover_rows = result.mappings().all()

        # Oldest → newest
        turnover_rows.reverse()


        turnover_labels = [
            row["trade_date"].strftime("%m-%d")
            for row in turnover_rows
        ]

        turnover_data = [
            round(
                float(row["total_turnover"] or 0)
                / 1_000_000_000,
                2
            )
            for row in turnover_rows
        ]


        # -------------------------------------------------
        # Sector performance
        # -------------------------------------------------

        sector_query = text("""
            SELECT
                cs.sector,
                COUNT(*) AS total_stocks,
                AVG(
                    (
                        (sp.close - sp.prev_close)
                        / NULLIF(sp.prev_close, 0)
                    ) * 100
                ) AS sector_performance
            FROM stock_prices sp
            JOIN company_sectors cs
                ON sp.symbol = cs.symbol
            WHERE sp.trade_date = :latest_date
            GROUP BY cs.sector
            ORDER BY sector_performance DESC
        """)

        result = db.session.execute(
            sector_query,
            {
                "latest_date": latest_date
            }
        )

        sector_rows = result.mappings().all()


        sector_performance = [
            {
                "sector": row["sector"],
                "total_stocks": row["total_stocks"],
                "performance": round(
                    float(row["sector_performance"] or 0),
                    2
                )
            }
            for row in sector_rows
        ]


        # -------------------------------------------------
        # Response
        # -------------------------------------------------

        return jsonify({

            "latest_date":
                latest_date.strftime("%d %B %Y"),

            "gainers":
                gainers,

            "losers":
                losers,

            "unchanged":
                unchanged,

            "total_stocks":
                gainers + losers + unchanged,

            "total_turnover":
                round(
                    total_turnover / 1_000_000_000,
                    2
                ),

            "turnover_labels":
                turnover_labels,

            "turnover_data":
                turnover_data,

            # Not available in current database
            "nepse_index":
                None,

            "market_cap":
                None,

            "sector_performance":
                sector_performance

        })


    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# DASHBOARD PAGE
# =========================================================

@market.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


# =========================================================
# DASHBOARD API
# =========================================================

@market.route("/api/dashboard")
@login_required
def dashboard_api():

    try:

        # -------------------------------------------------
        # Latest trading date
        # -------------------------------------------------

        latest_date_query = text("""
            SELECT MAX(trade_date)
            FROM stock_prices
        """)

        latest_date = db.session.execute(
            latest_date_query
        ).scalar()


        if latest_date is None:

            return jsonify({
                "error": "No stock data available."
            }), 404


        # -------------------------------------------------
        # Latest trading day's stock data
        # -------------------------------------------------

        latest_data_query = text("""
            SELECT
                symbol,
                close,
                prev_close,
                volume,
                turnover
            FROM stock_prices
            WHERE trade_date = :latest_date
        """)

        result = db.session.execute(
            latest_data_query,
            {
                "latest_date": latest_date
            }
        )

        latest_rows = result.mappings().all()


        # -------------------------------------------------
        # Market breadth
        # -------------------------------------------------

        gainers = []
        losers = []
        unchanged = 0

        total_turnover = 0
        total_volume = 0


        for row in latest_rows:

            symbol = row["symbol"]
            close = row["close"]
            prev_close = row["prev_close"]
            volume = row["volume"]
            turnover = row["turnover"]


            if (
                close is None
                or prev_close is None
                or prev_close == 0
            ):
                continue


            change = (
                (float(close) - float(prev_close))
                / float(prev_close)
            ) * 100


            stock_data = {
                "symbol": symbol,
                "price": round(float(close), 2),
                "change": round(change, 2),
                "volume": int(volume or 0)
            }


            if close > prev_close:

                gainers.append(stock_data)


            elif close < prev_close:

                losers.append(stock_data)


            else:

                unchanged += 1


            if turnover is not None:
                total_turnover += float(turnover)


            if volume is not None:
                total_volume += float(volume)


        # -------------------------------------------------
        # Sort market movers
        # -------------------------------------------------

        gainers.sort(
            key=lambda x: x["change"],
            reverse=True
        )

        losers.sort(
            key=lambda x: x["change"]
        )


        # -------------------------------------------------
        # Top 6 gainers
        # -------------------------------------------------

        top_gainers = gainers[:6]


        # -------------------------------------------------
        # Top 6 losers
        # -------------------------------------------------

        top_losers = losers[:6]


        # -------------------------------------------------
        # Last 20 trading days turnover
        # -------------------------------------------------

        turnover_query = text("""
            SELECT
                trade_date,
                SUM(turnover) AS total_turnover
            FROM stock_prices
            GROUP BY trade_date
            ORDER BY trade_date DESC
            LIMIT 20
        """)

        result = db.session.execute(
            turnover_query
        )

        turnover_rows = result.mappings().all()

        # Oldest → newest
        turnover_rows.reverse()


        turnover_labels = [
            row["trade_date"].strftime("%m-%d")
            for row in turnover_rows
        ]


        turnover_data = [
            round(
                float(row["total_turnover"] or 0)
                / 1_000_000_000,
                2
            )
            for row in turnover_rows
        ]


        # -------------------------------------------------
        # Response
        # -------------------------------------------------

        return jsonify({

            # Date
            "latest_date":
                latest_date.strftime("%d %B %Y"),

            # Market breadth
            "gainers":
                len(gainers),

            "losers":
                len(losers),

            "unchanged":
                unchanged,

            "total_stocks":
                len(gainers)
                + len(losers)
                + unchanged,

            # Market values
            "total_turnover":
                round(
                    total_turnover / 1_000_000_000,
                    2
                ),

            "total_volume":
                int(total_volume),

            # Movers
            "top_gainers":
                top_gainers,

            "top_losers":
                top_losers,

            # Chart
            "turnover_labels":
                turnover_labels,

            "turnover_data":
                turnover_data,

            # Not available in current database
            "nepse_index":
                None,

            "market_cap":
                None

        })


    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# =========================================================
# TEST DATABASE
# =========================================================

@market.route("/test-db")
@login_required
def test_db():

    try:

        result = db.session.execute(
            text("SHOW TABLES")
        )

        tables = [
            row[0]
            for row in result
        ]

        return f"Tables in database: {tables}"

    except Exception as e:

        return f"Database error: {e}"


# =========================================================
# TEST STOCK
# =========================================================

@market.route("/test-stock")
@login_required
def test_stock():

    try:

        query = text("""
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
            LIMIT 10
        """)

        result = db.session.execute(query)

        rows = result.mappings().all()

        return str(rows)

    except Exception as e:

        return f"Stock data error: {e}"


# =========================================================
# TEST PREDICTION
# =========================================================

@market.route("/test-prediction")
@login_required
def test_prediction():

    try:

        query = text("""
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
            WHERE symbol = 'NABIL'
            ORDER BY trade_date
        """)

        result = db.session.execute(query)

        rows = result.mappings().all()


        if not rows:

            return "No data found for NABIL."


        df = pd.DataFrame(rows)


        df.rename(
            columns={
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
            },
            inplace=True
        )


        df["Diff"] = (
            df["Close"]
            - df["Prev. Close"]
        )


        df["Range"] = (
            df["High"]
            - df["Low"]
        )


        df["Diff %"] = (
            df["Diff"]
            / df["Prev. Close"]
        ) * 100


        df["Range %"] = (
            df["Range"]
            / df["Prev. Close"]
        ) * 100


        df["VWAP %"] = (
            (
                df["VWAP"]
                - df["Prev. Close"]
            )
            / df["Prev. Close"]
        ) * 100


        prediction_result = predict_stock_movement(df)


        return (
            f"NABIL Prediction: "
            f"{prediction_result['prediction']}<br>"
            f"Confidence: "
            f"{prediction_result['confidence']:.2%}"
        )


    except Exception as e:

        return f"Prediction error: {e}"

