class InventoryCalculationError(Exception):
    """Exception raised for errors during inventory calculations."""
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message
