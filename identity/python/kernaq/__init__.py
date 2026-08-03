"""
kernaq — Official Python SDK for the Kernaq Identity API.

Process-and-forget model: submit → result in 3-8s → nothing stored.

Usage::

    from kernaq import Kernaq

    client = Kernaq()  # reads KERNAQ_API_KEY from env

    # Full KYC pipeline
    result = client.verify.run(
        document=open("id.jpg", "rb"),
        selfie=open("selfie.jpg", "rb"),
        video=open("liveness.mp4", "rb"),
        document_type="national_id",
        country="KEN",
    )
    print(result.verdict)      # "pass" | "fail" | "review"
    print(result.score)        # 0-100
    print(result.face_match)   # True
    print(result.document_fields.name)

    # Sandbox (no billing)
    result = client.verify.sandbox(document=..., selfie=..., video=...)

    # Standalone OCR
    fields = client.documents.extract(document=open("id.jpg", "rb"))

    # Face match
    match = client.face.match(face_a=open("a.jpg","rb"), face_b=open("b.jpg","rb"))

    # Usage stats
    stats = client.usage.get(days=30)
"""

from .client import (
    Kernaq,
    VerifyResource,
    DocumentsResource,
    FaceResource,
    LivenessResource,
    UsageResource,
)

from .types import (
    VerifyResult,
    DocumentFields,
    ExtractDocumentResult,
    ValidateDocumentResult,
    FaceDetectResult,
    FaceMatchResult,
    LivenessResult,
    UsageSummary,
    DailyUsage,
    BoundingBox,
)

from .exceptions import KernaqError, AuthenticationError, RateLimitError, InsufficientCreditsError

__all__ = [
    "Kernaq",
    "VerifyResource",
    "DocumentsResource",
    "FaceResource",
    "LivenessResource",
    "UsageResource",
    "VerifyResult",
    "DocumentFields",
    "ExtractDocumentResult",
    "ValidateDocumentResult",
    "FaceDetectResult",
    "FaceMatchResult",
    "LivenessResult",
    "UsageSummary",
    "DailyUsage",
    "BoundingBox",
    "KernaqError",
    "AuthenticationError",
    "RateLimitError",
    "InsufficientCreditsError",
]

__version__ = "2.0.0"
