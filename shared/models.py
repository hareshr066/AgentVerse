import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from shared.database import Base

class InventoryItem(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(255), nullable=False)
    current_stock = Column(Integer, default=0)
    average_daily_usage = Column(Float, default=0.0)
    lead_time = Column(Integer, default=0)
    safety_stock = Column(Float, default=0.0)
    reorder_point = Column(Float, default=0.0)
    eoq = Column(Float, default=0.0)
    status = Column(String(50), default="IN_STOCK")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class SupplierItem(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    supplier_name = Column(String(255), nullable=False)
    material_name = Column(String(255), nullable=False)
    available_quantity = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=0)
    price_per_unit = Column(Float, default=0.0)
    delivery_delay_days = Column(Integer, default=0)
    quality_score = Column(Float, default=0.0)
    on_time_delivery_percentage = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="LOW")
    recommended = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class EventPrediction(Base):
    __tablename__ = "event_predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    city = Column(String, nullable=True)
    event_name = Column(String, nullable=True)
    category = Column(String, nullable=True)
    impact_score = Column(Float, nullable=True)
    weather_condition = Column(String, nullable=True)
    temperature = Column(Float, nullable=True)
    news_summary = Column(Text, nullable=True)

class DemandPrediction(Base):
    __tablename__ = "demand_predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    product_id = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True)
    predicted_demand = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    recommended_order = Column(Float, nullable=False)
    inventory = Column(Float, nullable=False)
    sales_average = Column(Float, nullable=False)
    event_prediction_id = Column(Integer, ForeignKey("event_predictions.id"), nullable=True)

    event_prediction = relationship("EventPrediction")

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    product_id = Column(String, nullable=False, index=True)
    city = Column(String, nullable=True)
    status = Column(String, nullable=False)
    execution_time_ms = Column(Integer, nullable=False)
    event_prediction_id = Column(Integer, ForeignKey("event_predictions.id"), nullable=True)
    demand_prediction_id = Column(Integer, ForeignKey("demand_predictions.id"), nullable=True)
    decision_status = Column(String, nullable=True)

    event_prediction = relationship("EventPrediction")
    demand_prediction = relationship("DemandPrediction")
