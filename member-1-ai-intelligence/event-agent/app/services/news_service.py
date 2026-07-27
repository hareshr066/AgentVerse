import httpx
from typing import List, Dict, Any, Optional
from app.core.config import settings

NEWS_API_URL = "https://newsapi.org/v2/everything"

async def fetch_news(product: str, city: str, country: Optional[str] = None) -> List[Dict[str, Any]]:
    api_key = settings.NEWS_API_KEY
    if not api_key or api_key == "your_news_api_key_here":
        return []

    events_keywords = "flood OR cyclone OR strike OR festival OR election OR protest OR transport OR supply chain OR inflation"
    
    if country and country.strip():
        location_expr = f"{city} OR {country}"
    else:
        location_expr = city

    primary_query = f"({location_expr}) AND ({events_keywords})"
    fallback_1 = city
    fallback_2 = country if (country and country.strip()) else product

    queries = [primary_query, fallback_1, fallback_2]
    queries = [q for i, q in enumerate(queries) if q and q.strip() and q not in queries[:i]]

    formatted_news: List[Dict[str, Any]] = []
    seen_titles = set()

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            for query in queries:
                if len(formatted_news) >= 5:
                    break

                params = {
                    "q": query,
                    "sortBy": "relevancy",
                    "language": "en",
                    "pageSize": 20,
                    "apiKey": api_key
                }

                response = await client.get(NEWS_API_URL, params=params)
                if response.status_code != 200:
                    continue

                data = response.json()
                articles = data.get("articles", [])

                for article in articles:
                    title = article.get("title")
                    if not title or not isinstance(title, str) or not title.strip():
                        continue

                    if "[Removed]" in title or (article.get("description") and "[Removed]" in str(article.get("description"))):
                        continue

                    title_norm = title.strip().lower()
                    if title_norm in seen_titles:
                        continue

                    source_raw = article.get("source")
                    if isinstance(source_raw, dict):
                        source_name = source_raw.get("name")
                    else:
                        source_name = str(source_raw) if source_raw else None

                    if not source_name or not str(source_name).strip() or str(source_name).lower() in ["none", "null"]:
                        continue

                    seen_titles.add(title_norm)
                    formatted_news.append({
                        "title": title.strip(),
                        "source": str(source_name).strip(),
                        "description": article.get("description") or "",
                        "publishedAt": article.get("publishedAt") or "",
                        "url": article.get("url") or ""
                    })

                    if len(formatted_news) >= 5:
                        break

        return formatted_news[:5]
    except Exception:
        return formatted_news
