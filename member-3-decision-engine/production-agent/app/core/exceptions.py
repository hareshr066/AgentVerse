"""
Production Planning Agent - Custom Exceptions

Centralised exception hierarchy for all domain-level errors raised
inside the Production Planning Agent. Using typed exceptions lets
the API layer distinguish between bad input (4xx) and unexpected
failures (5xx) without coupling business logic to FastAPI directly.
"""


class ProductionAgentError(Exception):
    """Base exception for the Production Planning Agent."""


class ProductionValidationError(ProductionAgentError):
    """
    Raised when incoming request data passes Pydantic schema validation
    but violates a business rule (e.g. production_quantity would be zero
    or negative).
    """


class ProductionCalculationError(ProductionAgentError):
    """
    Raised when a numeric computation fails (e.g. division by zero,
    overflow, or an unexpected result that would produce an invalid plan).
    """


class SchedulerError(ProductionAgentError):
    """
    Raised when the machine scheduler cannot distribute work across
    available machines (e.g. no machines defined, capacity mismatch).
    """
