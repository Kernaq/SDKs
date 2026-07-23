"""
kernaq-identity — Official Python SDK for the Kernaq Identity API.

Quick start::

    from kernaq import Kernaq

    client = Kernaq()                   # reads KERNAQ_API_KEY from env
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

    # When failed, check the reason without inspecting sub-entities:
    if result.status == "failed":
        print(result.failure_reason)    # e.g. "face_mismatch"
"""

from .client import Kernaq
from .exceptions import KernaqError
from .types import (
    VerificationResult,
    VerificationSummary,
    ListVerificationsResult,
    VerificationStatus,
    FailureReason,
    ExtractedFields,
    FaceDetectResult,
    FaceMatchResult,
    LivenessResult,
    LivenessDetails,
    ExtractDocumentResult,
    ValidateDocumentResult,
    Webhook,
    WebhookCreatedResponse,
    WebhookDelivery,
    CaptureSessionResult,
    ProjectSettings,
)

__all__ = [
    "Kernaq",
    "KernaqError",
    "VerificationResult",
    "VerificationSummary",
    "ListVerificationsResult",
    "VerificationStatus",
    "FailureReason",
    "ExtractedFields",
    "FaceDetectResult",
    "FaceMatchResult",
    "LivenessResult",
    "LivenessDetails",
    "ExtractDocumentResult",
    "ValidateDocumentResult",
    "Webhook",
    "WebhookCreatedResponse",
    "WebhookDelivery",
    "CaptureSessionResult",
    "ProjectSettings",
]

__version__ = "1.0.0"
