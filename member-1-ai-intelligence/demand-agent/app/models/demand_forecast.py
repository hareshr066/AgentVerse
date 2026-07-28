from sqlalchemy import Column, Integer, String, Float, DateTime
from app.core.database import Base
import datetime

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    forecasted_quantity = Column(Integer, default=100)
    confidence_score = Column(Float, default=0.85)
    forecast_date = Column(DateTime, default=datetime.datetime.utcnow)
