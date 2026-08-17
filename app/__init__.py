from flask import Flask, render_template

def create_app():
    app = Flask(__name__)

    @app.route("/")
    def home():
        return render_template("index.html")

    @app.route("/login")
    def login():
        return render_template("login.html")

    @app.route("/register")
    def register():
        return render_template("register.html")

    @app.route("/dashboard")
    def dashboard():
        return render_template("dashboard.html")

    @app.route('/market-overview')
    def market_overview():
        return render_template("market_overview.html")


    # @app.route('/companies')
    # def companies():
    #  return render_template("companies.html")


    # @app.route('/compare-stocks')
    # def compare_stocks():
    #     return render_template("compare_stocks.html")


    # @app.route('/predictions')
    # def predictions():
    #     return render_template("predictions.html")


    # @app.route('/watchlist')
    # def watchlist():
    #     return render_template("watchlist.html")


    # @app.route('/profile')
    # def profile():
    #     return render_template("profile.html")

    return app