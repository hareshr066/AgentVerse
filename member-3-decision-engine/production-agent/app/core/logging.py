"""
Production Planning Agent - Logging Configuration

Provides a pre-configured logger instance shared across all modules.
Format mirrors the pattern used by Member 1 and Member 2 agents.
"""

import logging
import sys

# Create module-level logger
logger = logging.getLogger("production_agent")

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
