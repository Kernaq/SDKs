class KernaqError(Exception):
    """Raised when the Kernaq API returns a non-2xx response."""

    def __init__(self, code: str, message: str, status_code: int) -> None:
        super().__init__(message)
        self.code        = code
        self.message     = message
        self.status_code = status_code

    def __repr__(self) -> str:
        return f"KernaqError(code={self.code!r}, status_code={self.status_code})"
