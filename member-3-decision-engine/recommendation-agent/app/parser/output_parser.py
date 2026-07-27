
import json
class OutputParser:
    @staticmethod
    def parse_gemini_json(text_output: str) -> dict:
        # Simple parser to extract JSON blocks from Gemini responses if required
        try:
            clean_text = text_output.strip().replace("```json", "").replace("```", "")
            return json.loads(clean_text)
        except Exception:
            return {"raw_response": text_output}
