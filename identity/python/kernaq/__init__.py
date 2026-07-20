"""
kernaq-identity — Official Python SDK for the Kernaq Identity API.

Quick start::

    from kernaq import Kernaq

    client = Kernaq()                   # reads KERNAQ_API_KEY + KERNAQ_API_URL from env
    # or
    client = Kernaq(api_key="k_test_…")

    result = client.verifications.submit_and_wait(
        document=open("id.jpg", "rb"),
        selfie=open("selfie.jpg", "rb"),
        video=open("liveness.mp4", "rb"),
        document_type="passport",
        country="KEN",
        reference="user_acct_123",
    )

    print(result.status)                # "verified"
    print(result.face.matched)          # True
    print(result.risk.level)            # "low"
"""

from .client import Kernaq
from .exceptions import KernaqError
from .types import (
    VerificationResult,
    VerificationStatus,
    ExtractedFields,
    FaceDetectResult,
    FaceMatchResult,
    LivenessResult,
    ExtractDocumentResult,
    ValidateDocumentResult,
)

__all__ = [
    "Kernaq",
    "KernaqError",
    "VerificationResult",
    "VerificationStatus",
    "ExtractedFields",
    "FaceDetectResult",
    "FaceMatchResult",
    "LivenessResult",
    "ExtractDocumentResult",
    "ValidateDocumentResult",
]

__version__ = "1.0.0"
