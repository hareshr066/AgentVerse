import asyncio
from typing import Dict, Any
# pyrefly: ignore [missing-import]
from pytrends.request import TrendReq

def _get_trends_sync(product: str) -> Dict[str, Any]:
    if not product or not product.strip():
        return {"error": "Invalid product keyword"}

    try:
        pytrends = TrendReq(hl="en-US", tz=330, timeout=(10, 25))
        kw_list = [product.strip()]
        
        pytrends.build_payload(kw_list, cat=0, timeframe="today 1-m", geo="IN", gprop="")
        df = pytrends.interest_over_time()

        if df is None or df.empty or product.strip() not in df.columns:
            return {"error": "No trend data found for the given keyword"}

        series = df[product.strip()]
        if series.empty:
            return {"error": "No trend data available"}

        avg_interest = float(series.mean())
        latest_interest = float(series.iloc[-1])

        avg_rounded = round(avg_interest, 2)
        latest_rounded = round(latest_interest, 2)

        if latest_rounded > avg_rounded * 1.05:
            trend_direction = "Rising"
        elif latest_rounded < avg_rounded * 0.95:
            trend_direction = "Falling"
        else:
            trend_direction = "Stable"

        return {
            "average_interest": avg_rounded,
            "latest_interest": latest_rounded,
            "trend_direction": trend_direction
        }
    except Exception as e:
        return {"error": f"Trends service error: {str(e)}"}

async def fetch_trends(product: str) -> Dict[str, Any]:
    try:
        return await asyncio.to_thread(_get_trends_sync, product)
    except Exception as e:
        return {"error": f"Failed to fetch trends: {str(e)}"}
