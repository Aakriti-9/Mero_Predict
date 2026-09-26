
from flask import Flask

from config import Config
from app.extensions import db, login_manager


def create_app():

    app = Flask(
    __name__,
    template_folder="../templates",
    static_folder="../static")

    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)

    # Import models
    from app.models.user import User
    from app.models.stock_price import StockPrice

    # User loader for Flask-Login
    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

    # Register blueprints
    from app.routes.main import main
    from app.routes.auth import auth
    from app.routes.market import market
    from app.routes.admin import admin
    from app.routes.watchlist import watchlist
    from app.routes.companies import companies

    
    app.register_blueprint(main)
    app.register_blueprint(auth)
    app.register_blueprint(market)
    app.register_blueprint(admin)
    app.register_blueprint(watchlist)
    app.register_blueprint(companies)
    
    import os

    print("Flask root path:", app.root_path)
    print("Template folder:", app.template_folder)
    print(
    "index.html exists:",
    os.path.exists
    (
        os.path.join(app.root_path, app.template_folder, "index.html")
    )
    )

    return app