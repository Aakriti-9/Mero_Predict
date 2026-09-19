from flask import Blueprint, render_template
from flask_login import login_required


market = Blueprint(
    "market",
    __name__
)


@market.route("/market-overview")
@login_required
def market_overview():
    return render_template("market_overview.html")