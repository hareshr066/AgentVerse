import httpx
from typing import Dict, Any
from app.core.config import settings

OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"

async def fetch_weather(city: str) -> Dict[str, Any]:
    api_key = settings.WEATHER_API_KEY
    if not api_key or api_key == "your_weather_api_key_here":
        return {"error": "Weather API key not configured"}

    params = {
        "q": city,
        "appid": api_key,
        "units": "metric"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(OPENWEATHER_URL, params=params)

            if response.status_code == 404:
                return {"error": f"City '{city}' not found"}
            elif response.status_code != 200:
                return {"error": f"Weather API returned status code {response.status_code}"}

            data = response.json()
            main_data = data.get("main", {})
            wind_data = data.get("wind", {})
            weather_list = data.get("weather", [])
            weather_first = weather_list[0] if weather_list else {}

            return {
                "temperature": main_data.get("temp"),
                "feels_like": main_data.get("feels_like"),
                "humidity": main_data.get("humidity"),
                "pressure": main_data.get("pressure"),
                "wind_speed": wind_data.get("speed"),
                "condition": weather_first.get("main", "Unknown"),
                "description": weather_first.get("description", "Unknown")
            }
    except httpx.TimeoutException:
        return {"error": "Weather service request timed out"}
    except Exception as e:
        return {"error": f"Weather service error: {str(e)}"}
