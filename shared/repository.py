from sqlalchemy.orm import Session
from shared.models import EventPrediction, DemandPrediction, PipelineRun

class PredictionRepository:
    @staticmethod
    def create_event_prediction(db: Session, event_data: dict) -> EventPrediction:
        try:
            db_event = EventPrediction(
                city=event_data.get("city"),
                event_name=event_data.get("event_name") or event_data.get("event"),
                category=event_data.get("category"),
                impact_score=float(event_data.get("impact_score")) if event_data.get("impact_score") is not None else None,
                weather_condition=event_data.get("weather_condition") or event_data.get("weather", {}).get("condition"),
                temperature=float(event_data.get("temperature")) if event_data.get("temperature") is not None else event_data.get("weather", {}).get("temperature"),
                news_summary=event_data.get("news_summary") or event_data.get("summary")
            )
            db.add(db_event)
            db.commit()
            db.refresh(db_event)
            return db_event
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def create_demand_prediction(db: Session, demand_data: dict) -> DemandPrediction:
        try:
            db_demand = DemandPrediction(
                product_id=demand_data.get("product_id"),
                city=demand_data.get("city"),
                predicted_demand=float(demand_data.get("predicted_demand")),
                confidence=float(demand_data.get("confidence")),
                recommended_order=float(demand_data.get("recommended_order")),
                inventory=float(demand_data.get("inventory")),
                sales_average=float(demand_data.get("sales_average")),
                event_prediction_id=demand_data.get("event_prediction_id")
            )
            db.add(db_demand)
            db.commit()
            db.refresh(db_demand)
            return db_demand
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def create_pipeline_run(db: Session, pipeline_data: dict) -> PipelineRun:
        try:
            db_run = PipelineRun(
                product_id=pipeline_data.get("product_id"),
                city=pipeline_data.get("city"),
                status=pipeline_data.get("status"),
                execution_time_ms=int(pipeline_data.get("execution_time_ms")),
                event_prediction_id=pipeline_data.get("event_prediction_id"),
                demand_prediction_id=pipeline_data.get("demand_prediction_id"),
                decision_status=pipeline_data.get("decision_status")
            )
            db.add(db_run)
            db.commit()
            db.refresh(db_run)
            return db_run
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def fetch_event_predictions(db: Session, limit: int = 50) -> list[EventPrediction]:
        return db.query(EventPrediction).order_by(EventPrediction.timestamp.desc()).limit(limit).all()

    @staticmethod
    def fetch_demand_predictions(db: Session, limit: int = 50) -> list[DemandPrediction]:
        return db.query(DemandPrediction).order_by(DemandPrediction.timestamp.desc()).limit(limit).all()

    @staticmethod
    def fetch_pipeline_runs(db: Session, limit: int = 50) -> list[PipelineRun]:
        return db.query(PipelineRun).order_by(PipelineRun.timestamp.desc()).limit(limit).all()
