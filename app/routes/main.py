from flask import Blueprint, render_template
from flask_login import login_required, current_user


main = Blueprint(
    "main",
    __name__
)


@main.route("/")       
def home():
    return render_template("index.html")


@main.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html")


@main.route("/profile")
@login_required
def profile():
    return render_template("profile.html")


@main.route("/admin_panel")
@login_required
def admin_panel():
    # Only the dedicated admin account can access this page
    if current_user.role != "admin":
        return "Access denied", 403

    return render_template("admin_panel.html")