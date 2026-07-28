import os
from google import genai

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if self.api_key and self.api_key not in ["your-gemini-api-key-here", "your_gemini_api_key_here"]:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                self.client = None
        else:
            self.client = None

    async def get_recommendation(self, prompt: str) -> str:
        if not self.client:
            return "Mock AI Recommendation: Ensure inventory levels match production forecast to optimize manufacturing efficiency."
        try:
            response = self.client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
            )
            return response.text if response.text else "No content generated."
        except Exception as e:
            return f"Gemini Error: {str(e)}"
