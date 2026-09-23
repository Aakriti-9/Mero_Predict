from datetime import datetime

from app.extensions import db


class StockPrice(db.Model):
    __tablename__ = "stock_prices"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    symbol = db.Column(
        db.String(20),
        nullable=False,
        index=True
    )

    trade_date = db.Column(
        db.Date,
        nullable=False,
        index=True
    )

    open = db.Column(
        db.Numeric(15, 2),
        nullable=False
    )

    high = db.Column(
        db.Numeric(15, 2),
        nullable=False
    )

    low = db.Column(
        db.Numeric(15, 2),
        nullable=False
    )

    close = db.Column(
        db.Numeric(15, 2),
        nullable=False
    )

    vwap = db.Column(
        db.Numeric(15, 2),
        nullable=False
    )

    volume = db.Column(
        db.BigInteger,
        nullable=False
    )

    prev_close = db.Column(
        db.Numeric(15, 2),
        nullable=False
    )

    turnover = db.Column(
        db.Numeric(18, 2),
        nullable=False
    )

    transactions = db.Column(
        db.Integer,
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint(
            "symbol",
            "trade_date",
            name="uq_stock_symbol_trade_date"
        ),
    )

    def __repr__(self):
        return f"<StockPrice {self.symbol} {self.trade_date}>"