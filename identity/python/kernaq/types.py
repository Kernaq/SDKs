"""
Response types for the Kernaq Identity API — process-and-forget model v2.
All types are immutable frozen dataclasses built from raw API JSON.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, List, Optional


# ── Verify result — the main response type ────────────────────────────────────

@dataclass(frozen=True)
class DocumentFields:
    """OCR-extracted text fields from the ID document. Returned to caller, never stored."""
    name:            Optional[str] = None
    date_of_birth:   Optional[str] = None
    document_number: Optional[str] = None
    expiry_date:     Optional[str] = None
    country:         Optional[str] = None
    document_type:   Optional[str] = None
    nationality:     Optional[str] = None
    gender:          Optional[str] = None
    is_valid:        bool = False

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "DocumentFields":
        return cls(
            name            = d.get("name"),
            date_of_birth   = d.get("date_of_birth"),
            document_number = d.get("document_number"),
            expiry_date     = d.get("expiry_date"),
            country         = d.get("country"),
            document_type   = d.get("document_type"),
            nationality     = d.get("nationality"),
            gender          = d.get("gender"),
            is_valid        = d.get("is_valid", False),
        )


@dataclass(frozen=True)
class VerifyResult:
    """
    Full result returned synchronously by POST /v1/verify and /v1/verify/sandbox.
    Built in-memory on the server, returned in the response body, never stored.
    """
    request_id:      str
    verdict:         str              # "pass" | "fail" | "review"
    score:           int              # 0–100
    face_match:      bool
    face_confidence: float
    liveness_pass:   bool
    document_fields: DocumentFields
    fraud_flags:     List[str]
    failure_reason:  Optional[str]    # set when verdict == "fail"
    duration_ms:     int

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "VerifyResult":
        return cls(
            request_id      = d.get("request_id", ""),
            verdict         = d.get("verdict", ""),
            score           = d.get("score", 0),
            face_match      = d.get("face_match", False),
            face_confidence = d.get("face_confidence", 0.0),
            liveness_pass   = d.get("liveness_pass", False),
            document_fields = DocumentFields.from_dict(d.get("document_fields") or {}),
            fraud_flags     = d.get("fraud_flags") or [],
            failure_reason  = d.get("failure_reason"),
            duration_ms     = d.get("duration_ms", 0),
        )


# ── Standalone endpoints ──────────────────────────────────────────────────────

@dataclass(frozen=True)
class ExtractDocumentResult:
    document_type:   str
    country:         str
    document_number: Optional[str] = None
    first_name:      Optional[str] = None
    last_name:       Optional[str] = None
    date_of_birth:   Optional[str] = None
    expiry_date:     Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ExtractDocumentResult":
        return cls(
            document_type   = d.get("document_type", ""),
            country         = d.get("country", ""),
            document_number = d.get("document_number"),
            first_name      = d.get("first_name"),
            last_name       = d.get("last_name"),
            date_of_birth   = d.get("date_of_birth"),
            expiry_date     = d.get("expiry_date"),
        )


@dataclass(frozen=True)
class ValidateDocumentResult:
    valid:           bool
    reason:          str
    document_number: Optional[str] = None
    expiry_date:     Optional[str] = None

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "ValidateDocumentResult":
        return cls(
            valid           = d.get("valid", False),
            reason          = d.get("reason", ""),
            document_number = d.get("document_number"),
            expiry_date     = d.get("expiry_date"),
        )


@dataclass(frozen=True)
class BoundingBox:
    left:   float
    top:    float
    width:  float
    height: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "BoundingBox":
        return cls(left=d["left"], top=d["top"], width=d["width"], height=d["height"])


@dataclass(frozen=True)
class FaceDetectResult:
    detected:       bool
    confidence:     float
    bounding_box:   Optional[BoundingBox] = None
    age_range_low:  Optional[int]         = None
    age_range_high: Optional[int]         = None
    gender:         Optional[str]         = None
    smile:          bool                  = False
    sunglasses:     bool                  = False
    eyes_open:      bool                  = False

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "FaceDetectResult":
        bb = d.get("bounding_box")
        return cls(
            detected       = d.get("detected", False),
            confidence     = d.get("confidence", 0.0),
            bounding_box   = BoundingBox.from_dict(bb) if bb else None,
            age_range_low  = d.get("age_range_low"),
            age_range_high = d.get("age_range_high"),
            gender         = d.get("gender"),
            smile          = d.get("smile", False),
            sunglasses     = d.get("sunglasses", False),
            eyes_open      = d.get("eyes_open", False),
        )


@dataclass(frozen=True)
class FaceMatchResult:
    matched:    bool
    confidence: float

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "FaceMatchResult":
        return cls(matched=d.get("matched", False), confidence=d.get("confidence", 0.0))


@dataclass(frozen=True)
class LivenessResult:
    passed:     bool
    confidence: float = 0.0

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "LivenessResult":
        return cls(passed=d.get("passed", False), confidence=d.get("confidence", 0.0))


# ── Usage (non-PII) ───────────────────────────────────────────────────────────

@dataclass(frozen=True)
class DailyUsage:
    date:    str
    total:   int
    success: int
    failed:  int

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "DailyUsage":
        return cls(
            date    = d.get("date", ""),
            total   = d.get("total", 0),
            success = d.get("success", 0),
            failed  = d.get("failed", 0),
        )


@dataclass(frozen=True)
class UsageSummary:
    total_calls:    int
    success_calls:  int
    failed_calls:   int
    avg_duration_ms: float
    by_day:         List[DailyUsage] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "UsageSummary":
        return cls(
            total_calls     = d.get("total_calls", 0),
            success_calls   = d.get("success_calls", 0),
            failed_calls    = d.get("failed_calls", 0),
            avg_duration_ms = d.get("avg_duration_ms", 0.0),
            by_day          = [DailyUsage.from_dict(x) for x in (d.get("by_day") or [])],
        )
