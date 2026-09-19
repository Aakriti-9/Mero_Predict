from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user

from app.extensions import db
from app.models.user import User


auth = Blueprint(
    "auth",
    __name__
)


@auth.route("/register", methods=["GET", "POST"])
def register():

    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    if request.method == "POST":

        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")
        terms = request.form.get("terms")

        # -------------------------
        # Validation
        # -------------------------

        if not name or not email or not password:
            flash("Please fill in all required fields.", "danger")
            return render_template("register.html")

        if password != confirm_password:
            flash("Passwords do not match.", "danger")
            return render_template("register.html")

        if len(password) < 6:
            flash("Password must be at least 6 characters long.", "danger")
            return render_template("register.html")

        if not terms:
            flash("You must agree to the Terms & Conditions.", "danger")
            return render_template("register.html")

        # -------------------------
        # Check existing email
        # -------------------------

        existing_user = User.query.filter_by(email=email).first()

        if existing_user:
            flash("An account with this email already exists.", "danger")
            return render_template("register.html")

        # -------------------------
        # Create user
        # -------------------------

        user = User(
            name=name,
            email=email,
            role="user"
        )

        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        flash(
            "Account created successfully. Please log in.",
            "success"
        )

        return redirect(url_for("auth.login"))

    return render_template("register.html")


@auth.route("/login", methods=["GET", "POST"])
def login():

    if current_user.is_authenticated:
        return redirect(url_for("main.dashboard"))

    if request.method == "POST":

        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        remember = request.form.get("remember") == "on"

        # -------------------------
        # Validation
        # -------------------------

        if not email or not password:
            flash(
                "Please enter your email and password.",
                "danger"
            )
            return render_template("login.html")

        # -------------------------
        # Find user
        # -------------------------

        user = User.query.filter_by(email=email).first()

        # -------------------------
        # Check password
        # -------------------------

        if user is None or not user.check_password(password):
            flash(
                "Invalid email or password.",
                "danger"
            )
            return render_template("login.html")

        # -------------------------
        # Login
        # -------------------------

        login_user(
            user,
            remember=remember
        )

        return redirect(url_for("main.dashboard"))

    return render_template("login.html")


@auth.route("/logout")
def logout():

    logout_user()

    flash(
        "You have been logged out.",
        "success"
    )

    return redirect(url_for("auth.login"))