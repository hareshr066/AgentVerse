"""
Recommendation Agent - Logging Configuration

Shared logger instance used across all modules in the Recommendation Agent.
"""

import logging
import sys

logger = logging.getLogger("recommendation_agent")

if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    )
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
