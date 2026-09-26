from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    jsonify
)

from flask_login import login_required, current_user

from sqlalchemy import text, bindparam

import pandas as pd

from app.extensions import db
from app.ml.predictor import predict_stock_movement


main = Blueprint(
    "main",
    __name__
)


# =========================================================
# HOME / LANDING PAGE
# =========================================================

@main.route("/")
def home():

    return render_template(
        "index.html"
    )


# =========================================================
# PUBLIC LANDING PAGE MARKET API
# =========================================================

@main.route("/api/landing-market")
def landing_market():

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

        if latest_date is None:

            return jsonify({
                "error": "No market data available."
            }), 404


        # -------------------------------------------------
        # Market breadth
        # -------------------------------------------------

        breadth_result = db.session.execute(
            text("""
                SELECT

                    SUM(
                        CASE
                            WHEN close > prev_close
                            THEN 1
                            ELSE 0
                        END
                    ) AS gainers,

                    SUM(
                        CASE
                            WHEN close < prev_close
                            THEN 1
                            ELSE 0
                        END
                    ) AS losers,

                    SUM(
                        CASE
                            WHEN close = prev_close
                            THEN 1
                            ELSE 0
                        END
                    ) AS unchanged,

                    COUNT(*) AS total_stocks

                FROM stock_prices

                WHERE trade_date = :latest_date
            """),
            {
                "latest_date": latest_date
            }
        ).mappings().first()


        gainers = int(
            breadth_result["gainers"] or 0
        )

        losers = int(
            breadth_result["losers"] or 0
        )

        unchanged = int(
            breadth_result["unchanged"] or 0
        )

        total_stocks = int(
            breadth_result["total_stocks"] or 0
        )


        # -------------------------------------------------
        # Total turnover
        # -------------------------------------------------

        turnover_result = db.session.execute(
            text("""
                SELECT
                    COALESCE(
                        SUM(turnover),
                        0
                    ) AS total_turnover

                FROM stock_prices

                WHERE trade_date = :latest_date
            """),
            {
                "latest_date": latest_date
            }
        ).mappings().first()


        total_turnover = (
            float(
                turnover_result["total_turnover"] or 0
            ) / 1000000000
        )


        # -------------------------------------------------
        # Last 20 trading days turnover
        # -------------------------------------------------

        turnover_history_result = db.session.execute(
            text("""
                SELECT
                    trade_date,
                    COALESCE(
                        SUM(turnover),
                        0
                    ) AS total_turnover

                FROM stock_prices

                GROUP BY trade_date

                ORDER BY trade_date DESC

                LIMIT 20
            """)
        ).mappings().all()


        # Reverse so chart displays
        # oldest → newest

        turnover_history_result = list(
            reversed(
                turnover_history_result
            )
        )


        turnover_labels = [

            row["trade_date"].strftime(
                "%d %b"
            )

            for row in turnover_history_result

        ]


        turnover_data = [

            round(
                float(
                    row["total_turnover"] or 0
                ) / 1000000000,
                2
            )

            for row in turnover_history_result

        ]


        # -------------------------------------------------
        # Top gainers
        # -------------------------------------------------

        top_gainers_result = db.session.execute(
            text("""
                SELECT
                    symbol,
                    close,

                    (
                        (
                            close - prev_close
                        )
                        / NULLIF(prev_close, 0)
                    ) * 100 AS change_percent

                FROM stock_prices

                WHERE trade_date = :latest_date

                AND prev_close IS NOT NULL

                AND prev_close != 0

                ORDER BY change_percent DESC

                LIMIT 3
            """),
            {
                "latest_date": latest_date
            }
        ).mappings().all()


        top_gainers = [

            {
                "symbol":
                    row["symbol"],

                "price":
                    float(
                        row["close"] or 0
                    ),

                "change":
                    round(
                        float(
                            row["change_percent"] or 0
                        ),
                        2
                    )
            }

            for row in top_gainers_result

        ]


        # -------------------------------------------------
        # Top losers
        # -------------------------------------------------

        top_losers_result = db.session.execute(
            text("""
                SELECT
                    symbol,
                    close,

                    (
                        (
                            close - prev_close
                        )
                        / NULLIF(prev_close, 0)
                    ) * 100 AS change_percent

                FROM stock_prices

                WHERE trade_date = :latest_date

                AND prev_close IS NOT NULL

                AND prev_close != 0

                ORDER BY change_percent ASC

                LIMIT 3
            """),
            {
                "latest_date": latest_date
            }
        ).mappings().all()


        top_losers = [

            {
                "symbol":
                    row["symbol"],

                "price":
                    float(
                        row["close"] or 0
                    ),

                "change":
                    round(
                        float(
                            row["change_percent"] or 0
                        ),
                        2
                    )
            }

            for row in top_losers_result

        ]


        # -------------------------------------------------
        # Return JSON
        # -------------------------------------------------

        return jsonify({

            "latest_date":
                latest_date.strftime(
                    "%d %B %Y"
                ),

            "gainers":
                gainers,

            "losers":
                losers,

            "unchanged":
                unchanged,

            "total_stocks":
                total_stocks,

            "total_turnover":
                round(
                    total_turnover,
                    2
                ),

            "turnover_labels":
                turnover_labels,

            "turnover_data":
                turnover_data,

            "top_gainers":
                top_gainers,

            "top_losers":
                top_losers,

            # NEPSE index is not stored
            # in stock_prices.

            "nepse_index":
                None

        })


    except Exception as e:

        print(
            "Landing market API error:",
            e
        )

        return jsonify({

            "error":
                "Unable to load market data."

        }), 500


# =========================================================
# DASHBOARD
# =========================================================

@main.route("/dashboard")
@login_required
def dashboard():

    return render_template(
        "dashboard.html"
    )


# =========================================================
# PROFILE
# =========================================================

@main.route(
    "/profile",
    methods=["GET", "POST"]
)
@login_required
def profile():

    # -----------------------------------------------------
    # Update profile information
    # -----------------------------------------------------

    if request.method == "POST":

        current_user.name = request.form.get(
            "fullname",
            ""
        ).strip()

        current_user.phone = request.form.get(
            "phone",
            ""
        ).strip()

        db.session.commit()

        flash(
            "Profile updated successfully!",
            "success"
        )

        return redirect(
            url_for("main.profile")
        )


    # -----------------------------------------------------
    # Load notification preferences
    # -----------------------------------------------------

    notification_preferences = db.session.execute(
        text("""
            SELECT
                prediction_updates,
                top_movers,
                model_retrained

            FROM notification_preferences

            WHERE user_id = :user_id
        """),
        {
            "user_id": current_user.id
        }
    ).mappings().first()


    # -----------------------------------------------------
    # Use default preferences if none exist
    # -----------------------------------------------------

    if notification_preferences is None:

        notification_preferences = {

            "prediction_updates": True,

            "top_movers": True,

            "model_retrained": False

        }

    # -----------------------------------------------------
    # Get user's watchlist count
    # -----------------------------------------------------

    watchlist_count = db.session.execute(
        text("""
            SELECT COUNT(*)
            FROM watchlist
            WHERE user_id = :user_id
        """),
        {
            "user_id": current_user.id
        }
    ).scalar()

    watchlist_count = int(
        watchlist_count or 0
    )


    # -----------------------------------------------------
    # Render profile page
    # -----------------------------------------------------

    return render_template(
        "profile.html",
        notification_preferences=notification_preferences,
        watchlist_count=watchlist_count
    )


# =========================================================
# UPDATE NOTIFICATION PREFERENCE
# =========================================================

@main.route(
    "/profile/notifications",
    methods=["POST"]
)
@login_required
def update_notification_preference():

    try:

        # -------------------------------------------------
        # Get JSON data from profile.js
        # -------------------------------------------------

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "No data received."
            }), 400


        setting = data.get("setting")
        enabled = data.get("enabled")


        # -------------------------------------------------
        # Validate setting name
        # -------------------------------------------------

        allowed_settings = [
            "prediction_updates",
            "top_movers",
            "model_retrained"
        ]


        if setting not in allowed_settings:

            return jsonify({
                "success": False,
                "message": "Invalid notification setting."
            }), 400


        # -------------------------------------------------
        # Validate enabled value
        # -------------------------------------------------

        if not isinstance(enabled, bool):

            return jsonify({
                "success": False,
                "message": "Invalid notification state."
            }), 400


        # -------------------------------------------------
        # Check if user already has preferences
        # -------------------------------------------------

        existing = db.session.execute(
            text("""
                SELECT id
                FROM notification_preferences
                WHERE user_id = :user_id
            """),
            {
                "user_id": current_user.id
            }
        ).mappings().first()


        # -------------------------------------------------
        # Create default preference row if missing
        # -------------------------------------------------

        if existing is None:

            db.session.execute(
                text("""
                    INSERT INTO notification_preferences (
                        user_id,
                        prediction_updates,
                        top_movers,
                        model_retrained
                    )
                    VALUES (
                        :user_id,
                        TRUE,
                        TRUE,
                        FALSE
                    )
                """),
                {
                    "user_id": current_user.id
                }
            )


        # -------------------------------------------------
        # Update selected preference
        # -------------------------------------------------

        if setting == "prediction_updates":

            db.session.execute(
                text("""
                    UPDATE notification_preferences
                    SET prediction_updates = :enabled
                    WHERE user_id = :user_id
                """),
                {
                    "enabled": enabled,
                    "user_id": current_user.id
                }
            )


        elif setting == "top_movers":

            db.session.execute(
                text("""
                    UPDATE notification_preferences
                    SET top_movers = :enabled
                    WHERE user_id = :user_id
                """),
                {
                    "enabled": enabled,
                    "user_id": current_user.id
                }
            )


        elif setting == "model_retrained":

            db.session.execute(
                text("""
                    UPDATE notification_preferences
                    SET model_retrained = :enabled
                    WHERE user_id = :user_id
                """),
                {
                    "enabled": enabled,
                    "user_id": current_user.id
                }
            )


        # -------------------------------------------------
        # Save changes
        # -------------------------------------------------

        db.session.commit()


        # -------------------------------------------------
        # Return success
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "setting":
                setting,

            "enabled":
                enabled

        })


    except Exception as e:

        db.session.rollback()

        print(
            "Notification preference error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to update notification preference."

        }), 500


# =========================================================
# NOTIFICATIONS
# =========================================================

@main.route(
    "/api/notifications",
    methods=["GET"]
)
@login_required
def get_notifications():

    try:

        # -------------------------------------------------
        # Get user's notifications
        # -------------------------------------------------

        notifications = db.session.execute(
            text("""
                SELECT
                    id,
                    title,
                    message,
                    notification_type,
                    is_read,
                    created_at

                FROM notifications

                WHERE user_id = :user_id

                ORDER BY created_at DESC

                LIMIT 20
            """),
            {
                "user_id": current_user.id
            }
        ).mappings().all()


        # -------------------------------------------------
        # Get unread notification count
        # -------------------------------------------------

        unread_count = db.session.execute(
            text("""
                SELECT COUNT(*)

                FROM notifications

                WHERE user_id = :user_id

                AND is_read = FALSE
            """),
            {
                "user_id": current_user.id
            }
        ).scalar()


        # -------------------------------------------------
        # Convert notifications to JSON
        # -------------------------------------------------

        notification_list = [

            {
                "id":
                    notification["id"],

                "title":
                    notification["title"],

                "message":
                    notification["message"],

                "type":
                    notification["notification_type"],

                "is_read":
                    bool(
                        notification["is_read"]
                    ),

                "created_at":
                    notification["created_at"].isoformat()
                    if notification["created_at"]
                    else None
            }

            for notification in notifications

        ]


        # -------------------------------------------------
        # Return JSON
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "notifications":
                notification_list,

            "unread_count":
                int(
                    unread_count or 0
                )

        })


    except Exception as e:

        print(
            "Notification fetch error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load notifications."

        }), 500


# =========================================================
# MARK ALL NOTIFICATIONS AS READ
# =========================================================

@main.route(
    "/api/notifications/read-all",
    methods=["POST"]
)
@login_required
def mark_all_notifications_read():

    try:

        # -------------------------------------------------
        # Mark all unread notifications as read
        # -------------------------------------------------

        db.session.execute(
            text("""
                UPDATE notifications

                SET is_read = TRUE

                WHERE user_id = :user_id

                AND is_read = FALSE
            """),
            {
                "user_id": current_user.id
            }
        )


        db.session.commit()


        return jsonify({

            "success": True,

            "message":
                "All notifications marked as read."

        })


    except Exception as e:

        db.session.rollback()

        print(
            "Mark notifications read error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to mark notifications as read."

        }), 500


# =========================================================
# ADMIN PANEL
# =========================================================

@main.route("/admin_panel")
@login_required
def admin_panel():

    # Only admin can access this page

    if current_user.role != "admin":

        return "Access denied", 403


    return render_template(
        "admin_panel.html"
    )


# =========================================================
# WATCHLIST
# =========================================================

@main.route("/watchlist")
@login_required
def watchlist():

    return render_template(
        "watchlist.html"
    )

# =========================================================
# COMPANY DETAILS
# =========================================================

@main.route("/companies/<symbol>")
@login_required
def company_details(symbol):

    symbol = symbol.upper().strip()

    # Get company sector from database
    query = text("""
        SELECT symbol, sector
        FROM company_sectors
        WHERE symbol = :symbol
        LIMIT 1
    """)

    result = db.session.execute(
        query,
        {"symbol": symbol}
    ).mappings().first()

    # If company does not exist
    if not result:
        flash("Company not found.", "error")
        return redirect(url_for("admin.companies"))

    company = {
        "symbol": result["symbol"],
        "sector": result["sector"],
        "name": result["symbol"],
        "logo_initials": result["symbol"][:2].upper()
    }

    return render_template(
        "company_details.html",
        company=company
    )

# =========================================================
# COMPANY DETAILS API
# =========================================================

@main.route("/api/companies/<symbol>")
@login_required
def company_details_api(symbol):

    try:

        symbol = symbol.upper().strip()

        # -------------------------------------------------
        # Get company information
        # -------------------------------------------------

        company_result = db.session.execute(
            text("""
                SELECT
                    symbol,
                    sector
                FROM company_sectors
                WHERE symbol = :symbol
                LIMIT 1
            """),
            {
                "symbol": symbol
            }
        ).mappings().first()

        if not company_result:

            return jsonify({
                "success": False,
                "message": "Company not found."
            }), 404


        # -------------------------------------------------
        # Get historical stock data
        # -------------------------------------------------

        stock_result = db.session.execute(
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

                LIMIT 252
            """),
            {
                "symbol": symbol
            }
        ).mappings().all()


        if not stock_result:

            return jsonify({
                "success": False,
                "message": "No stock data available."
            }), 404


        # -------------------------------------------------
        # Convert to DataFrame for ML prediction
        # -------------------------------------------------

        df = pd.DataFrame(stock_result)


        # Rename database columns to ML column names

        df = df.rename(
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
            }
        )


        # -------------------------------------------------
        # Convert date
        # -------------------------------------------------

        df["Date"] = pd.to_datetime(
            df["Date"],
            errors="coerce"
        )


        # -------------------------------------------------
        # Convert numeric columns
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

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )


        # -------------------------------------------------
        # Sort oldest → newest
        # -------------------------------------------------

        df = df.sort_values(
            "Date"
        ).reset_index(
            drop=True
        )


        # -------------------------------------------------
        # Calculate derived features
        # -------------------------------------------------

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
            / df["Prev. Close"].replace(
                0,
                pd.NA
            )
        ) * 100


        df["Range %"] = (
            df["Range"]
            / df["Low"].replace(
                0,
                pd.NA
            )
        ) * 100


        df["VWAP %"] = (
            (
                df["VWAP"]
                - df["Close"]
            )
            / df["Close"].replace(
                0,
                pd.NA
            )
        ) * 100


        # -------------------------------------------------
        # Latest row
        # -------------------------------------------------

        latest = df.iloc[-1]


        close = float(
            latest["Close"]
        )

        prev_close = float(
            latest["Prev. Close"]
        )

        change = (
            close
            - prev_close
        )


        if prev_close != 0:

            change_percent = (
                change
                / prev_close
            ) * 100

        else:

            change_percent = 0


        # -------------------------------------------------
        # AI prediction
        # -------------------------------------------------

        prediction = None

        if len(df) >= 10:

            try:

                prediction = predict_stock_movement(
                    df
                )

            except Exception as prediction_error:

                print(
                    f"Prediction error for {symbol}:",
                    prediction_error
                )


        # -------------------------------------------------
        # Price history
        # -------------------------------------------------

        history = []

        for _, row in df.iterrows():

            if pd.isna(row["Date"]):

                continue


            history.append({

                "date":
                    row["Date"].strftime(
                        "%Y-%m-%d"
                    ),

                "open":
                    round(
                        float(row["Open"]),
                        2
                    ),

                "high":
                    round(
                        float(row["High"]),
                        2
                    ),

                "low":
                    round(
                        float(row["Low"]),
                        2
                    ),

                "close":
                    round(
                        float(row["Close"]),
                        2
                    ),

                "volume":
                    float(
                        row["Vol"] or 0
                    )

            })


        # -------------------------------------------------
        # Return response
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "company": {

                "symbol":
                    company_result["symbol"],

                "sector":
                    company_result["sector"]

            },

            "latest": {

                "date":
                    latest["Date"].strftime(
                        "%Y-%m-%d"
                    ),

                "open":
                    round(
                        float(latest["Open"]),
                        2
                    ),

                "high":
                    round(
                        float(latest["High"]),
                        2
                    ),

                "low":
                    round(
                        float(latest["Low"]),
                        2
                    ),

                "close":
                    round(
                        close,
                        2
                    ),

                "volume":
                    float(
                        latest["Vol"] or 0
                    ),

                "prev_close":
                    round(
                        prev_close,
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

            },

            "prediction": (

                {

                    "direction":
                        prediction["prediction"],

                    "confidence":
                        round(
                            prediction["confidence"] * 100,
                            2
                        )

                }

                if prediction

                else None

            ),

            "history":
                history

        })


    except Exception as e:

        print(
            f"Company details API error for {symbol}:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Unable to load company details."

        }), 500


# =========================================================
# COMPARE STOCKS
# =========================================================

@main.route("/compare-stocks")
@login_required
def compare_stocks():

    return render_template(
        "compare_stocks.html"
    )


# =========================================================
# COMPARE STOCKS API
# =========================================================

@main.route(
    "/api/compare-stocks",
    methods=["POST"]
)
@login_required
def compare_stocks_api():

    try:

        # -------------------------------------------------
        # Get request data
        # -------------------------------------------------

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "message": "No data received."
            }), 400


        symbols = data.get(
            "symbols",
            []
        )

        period = data.get(
            "period",
            60
        )


        # -------------------------------------------------
        # Validate symbols
        # -------------------------------------------------

        if not isinstance(
            symbols,
            list
        ):

            return jsonify({
                "success": False,
                "message": "Symbols must be a list."
            }), 400


        if len(symbols) < 2 or len(symbols) > 4:

            return jsonify({
                "success": False,
                "message": "Select between 2 and 4 stocks."
            }), 400


        # -------------------------------------------------
        # Remove duplicate symbols
        # -------------------------------------------------

        symbols = list(
            dict.fromkeys(
                symbols
            )
        )


        if len(symbols) < 2:

            return jsonify({
                "success": False,
                "message": "Please select different stocks."
            }), 400


        # -------------------------------------------------
        # Validate period
        # -------------------------------------------------

        try:

            period = int(
                period
            )

        except (
            TypeError,
            ValueError
        ):

            return jsonify({
                "success": False,
                "message": "Invalid period."
            }), 400


        if period not in [
            30,
            60,
            90
        ]:

            return jsonify({
                "success": False,
                "message":
                    "Period must be 30, 60, or 90 days."
            }), 400


        # =================================================
        # GET COMPANY + SECTOR INFORMATION
        # =================================================

        company_query = text("""
            SELECT
                symbol,
                sector

            FROM company_sectors

            WHERE symbol IN :symbols
        """).bindparams(
            bindparam(
                "symbols",
                expanding=True
            )
        )


        company_result = db.session.execute(
            company_query,
            {
                "symbols": symbols
            }
        ).mappings().all()


        sector_map = {

            row["symbol"]:
                row["sector"]

            for row in company_result

        }


        # =================================================
        # GET HISTORICAL STOCK DATA
        # =================================================

        history_query = text("""
            SELECT
                symbol,
                trade_date,
                close,
                prev_close,
                volume,
                turnover

            FROM stock_prices

            WHERE symbol IN :symbols

            ORDER BY
                symbol ASC,
                trade_date DESC
        """).bindparams(
            bindparam(
                "symbols",
                expanding=True
            )
        )


        history_result = db.session.execute(
            history_query,
            {
                "symbols": symbols
            }
        ).mappings().all()


        # -------------------------------------------------
        # Group historical data by symbol
        # -------------------------------------------------

        stock_history = {

            symbol: []

            for symbol in symbols

        }


        for row in history_result:

            symbol = row["symbol"]


            if symbol not in stock_history:

                stock_history[symbol] = []


            # Keep only selected period

            if len(
                stock_history[symbol]
            ) < period:

                stock_history[symbol].append(
                    row
                )


        # =================================================
        # BUILD FINAL STOCK DATA
        # =================================================

        stocks = []


        for symbol in symbols:

            rows = stock_history.get(
                symbol,
                []
            )


            if not rows:

                continue


            # -------------------------------------------------
            # Latest trading record
            # -------------------------------------------------

            latest = rows[0]


            close = float(
                latest["close"] or 0
            )


            prev_close = float(
                latest["prev_close"] or 0
            )


            volume = float(
                latest["volume"] or 0
            )


            turnover = float(
                latest["turnover"] or 0
            )


            # -------------------------------------------------
            # Calculate daily change
            # -------------------------------------------------

            change = (
                close
                - prev_close
            )


            if prev_close != 0:

                change_percent = (
                    change
                    / prev_close
                ) * 100

            else:

                change_percent = 0


            # -------------------------------------------------
            # Reverse history
            # oldest → newest
            # -------------------------------------------------

            rows = list(
                reversed(
                    rows
                )
            )


            # -------------------------------------------------
            # Baseline price
            # -------------------------------------------------

            first_close = float(
                rows[0]["close"] or 0
            )


            history = []


            for row in rows:

                row_close = float(
                    row["close"] or 0
                )


                # ---------------------------------------------
                # Normalized performance
                # ---------------------------------------------

                if first_close != 0:

                    performance = (
                        (
                            row_close
                            / first_close
                        ) - 1
                    ) * 100

                else:

                    performance = 0


                history.append({

                    "date":
                        row["trade_date"].isoformat(),

                    "close":
                        row_close,

                    "performance":
                        round(
                            performance,
                            2
                        )

                })


            # -------------------------------------------------
            # Add stock
            # -------------------------------------------------

            stocks.append({

                "symbol":
                    symbol,

                "sector":
                    sector_map.get(
                        symbol,
                        "Others"
                    ),

                "trade_date":
                    latest["trade_date"].isoformat(),

                "close":
                    round(
                        close,
                        2
                    ),

                "prev_close":
                    round(
                        prev_close,
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
                    ),

                "volume":
                    volume,

                "turnover":
                    turnover,

                "history":
                    history

            })


        # =================================================
        # CHECK DATA
        # =================================================

        if len(stocks) < 2:

            return jsonify({

                "success": False,

                "message":
                    "Historical data not available for enough selected stocks."

            }), 404


        # =================================================
        # RETURN RESPONSE
        # =================================================

        return jsonify({

            "success":
                True,

            "period":
                period,

            "stocks":
                stocks

        })


    except Exception as e:

        db.session.rollback()

        print(
            "Compare stocks API error:",
            e
        )


        return jsonify({

            "success":
                False,

            "message":
                "Unable to compare stocks."

        }), 500


# =========================================================
# PREDICTIONS
# =========================================================

@main.route("/predictions")
@login_required
def predictions():

    return render_template(
        "predictions.html"
    )


@main.route("/api/prediction-views", methods=["POST"])
@login_required
def record_prediction_view():

    try:

        data = request.get_json() or {}

        symbol = (
            data.get("symbol", "")
            .strip()
            .upper()
        )

        if not symbol:

            return jsonify({
                "success": False,
                "message": "Company symbol is required."
            }), 400

        db.session.execute(
            text("""
                INSERT INTO prediction_views
                (
                    user_id,
                    symbol
                )
                VALUES
                (
                    :user_id,
                    :symbol
                )
            """),
            {
                "user_id": current_user.id,
                "symbol": symbol
            }
        )

        db.session.commit()

        return jsonify({
            "success": True
        })

    except Exception as e:

        db.session.rollback()

        print(
            "Prediction view tracking error:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Unable to record prediction view."
        }), 500

