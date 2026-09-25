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

from sqlalchemy import text

from app.extensions import db


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
        #
        # Database stores turnover in rupees.
        # Convert to billions for frontend.
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
        #
        # Used for the landing page graph.
        # Database → Flask → JavaScript → Chart.js
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
                "symbol": row["symbol"],

                "price": float(
                    row["close"] or 0
                ),

                "change": round(
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
                "symbol": row["symbol"],

                "price": float(
                    row["close"] or 0
                ),

                "change": round(
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
            url_for(
                "main.profile"
            )
        )


    # -----------------------------------------------------
    # Get notification preferences
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
    # Create default preferences if user
    # does not have a preference row yet
    # -----------------------------------------------------

    if not notification_preferences:

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

        db.session.commit()


        # Set default values for template

        notification_preferences = {
            "prediction_updates": True,
            "top_movers": True,
            "model_retrained": False
        }


    # -----------------------------------------------------
    # Open profile page
    # -----------------------------------------------------

    return render_template(
        "profile.html",
        notification_preferences=notification_preferences
    )


# =========================================================
# PROFILE NOTIFICATION PREFERENCES
# =========================================================

@main.route(
    "/profile/notifications",
    methods=["POST"]
)
@login_required
def update_notification_preferences():

    try:

        data = request.get_json()


        # -------------------------------------------------
        # Get requested setting
        # -------------------------------------------------

        setting = data.get(
            "setting"
        )

        enabled = data.get(
            "enabled"
        )


        # -------------------------------------------------
        # Allowed notification settings
        # -------------------------------------------------

        allowed_settings = {
            "prediction_updates",
            "top_movers",
            "model_retrained"
        }


        # -------------------------------------------------
        # Validate setting
        # -------------------------------------------------

        if setting not in allowed_settings:

            return jsonify({
                "success": False,
                "message":
                    "Invalid notification setting."
            }), 400


        # -------------------------------------------------
        # Validate enabled value
        # -------------------------------------------------

        if not isinstance(
            enabled,
            bool
        ):

            return jsonify({
                "success": False,
                "message":
                    "Invalid notification value."
            }), 400


        # -------------------------------------------------
        # Check existing preferences
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
        # Create default preferences if necessary
        # -------------------------------------------------

        if not existing:

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

        db.session.execute(
            text(f"""
                UPDATE notification_preferences

                SET {setting} = :enabled

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


        return jsonify({
            "success": True,
            "message":
                "Notification preference updated."
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
                "Unable to save notification setting."
        }), 500


# =========================================================
# NOTIFICATIONS API
# =========================================================

@main.route(
    "/api/notifications",
    methods=["GET"]
)
@login_required
def get_notifications():

    try:

        # -------------------------------------------------
        # Get latest 20 notifications
        # for the logged-in user
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
        # Count unread notifications
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
        # Convert notifications into JSON
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
        # Return response
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
        # Mark all unread notifications belonging
        # to the logged-in user as read
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


        # -------------------------------------------------
        # Save changes
        # -------------------------------------------------

        db.session.commit()


        # -------------------------------------------------
        # Return success response
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "message":
                "All notifications marked as read."

        })


    except Exception as e:

        # -------------------------------------------------
        # Undo database changes if an error occurs
        # -------------------------------------------------

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