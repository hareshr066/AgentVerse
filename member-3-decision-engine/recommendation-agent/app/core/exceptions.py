"""
Recommendation Agent - Custom Exceptions

Typed exception hierarchy for the Recommendation Agent, keeping
business logic fully decoupled from the FastAPI layer.
"""


class RecommendationAgentError(Exception):
    """Base exception for the Recommendation Agent."""


class RecommendationValidationError(RecommendationAgentError):
    """
    Raised when request data passes Pydantic validation but violates
    a business rule (e.g. impossible combination of inventory and demand values).
    """


class RecommendationGenerationError(RecommendationAgentError):
    """
    Raised when the recommendation engine (rule-based or AI) fails to
    produce a valid output.
    """


class GeminiIntegrationError(RecommendationAgentError):
    """
    Raised when Gemini AI is configured but returns an unusable response.
    The service falls back to rule-based output rather than propagating
    this error to the caller.
    """
