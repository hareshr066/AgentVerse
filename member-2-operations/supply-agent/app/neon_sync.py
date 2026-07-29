import urllib.request
import json
import logging
from sqlalchemy import text
from app.config import settings

logger = logging.getLogger("neon-sync")

NEON_HTTP_URL = "https://ep-withered-shape-axrygj8o.c-4.us-east-2.aws.neon.tech/sql"

def fetch_neon_table(table_name: str) -> list[dict]:
    """Fetch rows from Neon PostgreSQL database over HTTPS (Port 443)."""
    db_string = settings.DATABASE_URL
    headers = {
        "Neon-Connection-String": db_string,
        "Content-Type": "application/json"
    }
    data = json.dumps({"query": f"SELECT * FROM {table_name};"}).encode("utf-8")
    req = urllib.request.Request(NEON_HTTP_URL, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            res = json.loads(resp.read().decode())
            rows = res.get("rows", [])
            logger.info("Successfully fetched %d rows from Neon PostgreSQL table '%s' over HTTPS.", len(rows), table_name)
            return rows
    except Exception as e:
        logger.warning("Failed to fetch Neon PostgreSQL table '%s' over HTTPS: %s", table_name, str(e))
        return []

def sync_neon_to_engine(engine, agent_type: str):
    """Sync Neon PostgreSQL data into the active SQLAlchemy engine."""
    with engine.begin() as conn:
        if agent_type == "supply":
            rows = fetch_neon_table("suppliers")
            if not rows:
                return
            conn.execute(text("DELETE FROM suppliers;"))
            for r in rows:
                conn.execute(
                    text("""
                    INSERT INTO suppliers (supplier_name, material_name, available_quantity, lead_time_days, price_per_unit, delivery_delay_days, quality_score, on_time_delivery_percentage, risk_score, risk_level, recommended)
                    VALUES (:supplier_name, :material_name, :available_quantity, :lead_time_days, :price_per_unit, :delivery_delay_days, :quality_score, :on_time_delivery_percentage, :risk_score, :risk_level, :recommended)
                    """),
                    {
                        "supplier_name": r.get("supplier_name"),
                        "material_name": r.get("material_name"),
                        "available_quantity": r.get("available_quantity", 0),
                        "lead_time_days": r.get("lead_time_days", 0),
                        "price_per_unit": r.get("price_per_unit", 0.0),
                        "delivery_delay_days": r.get("delivery_delay_days", 0),
                        "quality_score": r.get("quality_score", 0.0),
                        "on_time_delivery_percentage": r.get("on_time_delivery_percentage", 0.0),
                        "risk_score": r.get("risk_score", 0.0),
                        "risk_level": r.get("risk_level", "Medium Risk"),
                        "recommended": bool(r.get("recommended", False))
                    }
                )
