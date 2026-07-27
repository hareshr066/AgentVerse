import os
import google.generativeai as genai

class GeminiClient:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    async def get_recommendation(self, prompt: str) -> str:
        if not self.model:
            return "Mock AI Recommendation: Ensure inventory levels match production forecast to optimize manufacturing efficiency."
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Gemini Error: {str(e)}"
