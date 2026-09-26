from flask import Blueprint, render_template, jsonify
from flask_login import login_required
from sqlalchemy import text

from app.extensions import db


companies = Blueprint(
    "companies",
    __name__
)


# =========================================================
# COMPANIES PAGE
# =========================================================

@companies.route("/companies")
@login_required
def companies_page():

    return render_template(
        "companies.html"
    )


# =========================================================
# COMPANY DETAIL PAGE
# =========================================================

@companies.route("/companies/<symbol>")
@login_required
def company_detail_page(symbol):

    return render_template(
        "company_detail.html",
        symbol=symbol.upper()
    )


# =========================================================
# COMPANIES API
# =========================================================

@companies.route("/api/companies")
@login_required
def companies_api():

    try:

        # -------------------------------------------------
        # Get latest trading date
        # -------------------------------------------------

        latest_date_result = db.session.execute(
            text("""
                SELECT MAX(trade_date) AS latest_date
                FROM stock_prices
            """)
        ).mappings().first()

        latest_date = latest_date_result["latest_date"]


        # -------------------------------------------------
        # No market data
        # -------------------------------------------------

        if latest_date is None:

            return jsonify({
                "success": True,
                "companies": [],
                "total_companies": 0
            })


        # -------------------------------------------------
        # Get latest stock data
        # -------------------------------------------------

        result = db.session.execute(
            text("""
                SELECT
                    sp.symbol,
                    sp.close,
                    sp.prev_close,
                    cs.sector

                FROM stock_prices sp

                LEFT JOIN company_sectors cs
                    ON sp.symbol = cs.symbol

                WHERE sp.trade_date = :latest_date

                ORDER BY sp.symbol
            """),
            {
                "latest_date": latest_date
            }
        ).mappings().all()


        companies_data = []


        # -------------------------------------------------
        # Prepare response
        # -------------------------------------------------

        for row in result:

            close = float(
                row["close"] or 0
            )

            prev_close = float(
                row["prev_close"] or 0
            )

            change = close - prev_close


            if prev_close != 0:

                change_percent = (
                    change / prev_close
                ) * 100

            else:

                change_percent = 0


            companies_data.append({

                "symbol":
                    row["symbol"],

                "sector":
                    row["sector"]
                    or "Others",

                "price":
                    round(
                        close,
                        2
                    ),

                "change":
                    round(
                        change,
                        2
                    ),

                "change_percent":
                    round(
                        change_percent,
                        2
                    )
            })


        # -------------------------------------------------
        # Return JSON
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "companies":
                companies_data,

            "total_companies":
                len(companies_data),

            "latest_date":
                latest_date.strftime(
                    "%d %B %Y"
                )
        })


    except Exception as e:

        print(
            "Companies API error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load companies."

        }), 500


# =========================================================
# COMPANY DETAIL API
# =========================================================

@companies.route("/api/companies/<symbol>")
@login_required
def company_detail_api(symbol):

    try:

        symbol = symbol.upper().strip()


        # -------------------------------------------------
        # Get company information
        # -------------------------------------------------

        company_result = db.session.execute(
            text("""
                SELECT
                    cs.symbol,
                    cs.sector
                FROM company_sectors cs
                WHERE cs.symbol = :symbol
            """),
            {
                "symbol": symbol
            }
        ).mappings().first()


        # -------------------------------------------------
        # Company not found
        # -------------------------------------------------

        if company_result is None:

            return jsonify({
                "success": False,
                "message": "Company not found."
            }), 404


        # -------------------------------------------------
        # Get latest stock information
        # -------------------------------------------------

        latest_result = db.session.execute(
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
                WHERE symbol = :symbol
                ORDER BY trade_date DESC
                LIMIT 1
            """),
            {
                "symbol": symbol
            }
        ).mappings().first()


        if latest_result is None:

            return jsonify({
                "success": False,
                "message": "No market data available."
            }), 404


        close = float(
            latest_result["close"] or 0
        )

        prev_close = float(
            latest_result["prev_close"] or 0
        )

        change = close - prev_close

        if prev_close != 0:

            change_percent = (
                change / prev_close
            ) * 100

        else:

            change_percent = 0


        # -------------------------------------------------
        # Get historical prices
        # -------------------------------------------------

        history_result = db.session.execute(
            text("""
                SELECT
                    trade_date,
                    open,
                    high,
                    low,
                    close,
                    vwap,
                    volume,
                    turnover,
                    transactions
                FROM stock_prices
                WHERE symbol = :symbol
                ORDER BY trade_date ASC
            """),
            {
                "symbol": symbol
            }
        ).mappings().all()


        history = []


        for row in history_result:

            history.append({

                "date":
                    row["trade_date"].strftime(
                        "%Y-%m-%d"
                    ),

                "open":
                    float(row["open"] or 0),

                "high":
                    float(row["high"] or 0),

                "low":
                    float(row["low"] or 0),

                "close":
                    float(row["close"] or 0),

                "vwap":
                    float(row["vwap"] or 0),

                "volume":
                    int(row["volume"] or 0),

                "turnover":
                    float(row["turnover"] or 0),

                "transactions":
                    int(row["transactions"] or 0)
            })


        # -------------------------------------------------
        # Return company details
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "company": {

                "symbol":
                    company_result["symbol"],

                "sector":
                    company_result["sector"]
                    or "Others",

                "latest_date":
                    latest_result[
                        "trade_date"
                    ].strftime(
                        "%d %B %Y"
                    ),

                "price":
                    round(close, 2),

                "change":
                    round(change, 2),

                "change_percent":
                    round(
                        change_percent,
                        2
                    ),

                "open":
                    round(
                        float(
                            latest_result["open"] or 0
                        ),
                        2
                    ),

                "high":
                    round(
                        float(
                            latest_result["high"] or 0
                        ),
                        2
                    ),

                "low":
                    round(
                        float(
                            latest_result["low"] or 0
                        ),
                        2
                    ),

                "vwap":
                    round(
                        float(
                            latest_result["vwap"] or 0
                        ),
                        2
                    ),

                "volume":
                    int(
                        latest_result["volume"] or 0
                    ),

                "turnover":
                    round(
                        float(
                            latest_result["turnover"] or 0
                        ),
                        2
                    ),

                "transactions":
                    int(
                        latest_result["transactions"] or 0
                    )
            },

            "history":
                history
        })


    except Exception as e:

        print(
            "Company detail API error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load company details."

        }), 500